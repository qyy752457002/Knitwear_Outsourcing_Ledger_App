import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { styleApi } from '../../api/endpoints';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Colors } from '../../constants/colors';
import type { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'StyleEdit'>;

export function StyleEditScreen({ route, navigation }: Props) {
  const { factoryId, styleId } = route.params;
  const isEdit = !!styleId;
  const [styleCode, setStyleCode] = useState('');
  const [unitPrice, setUnitPrice] = useState('0');
  const [colors, setColors] = useState<string[]>([]);
  const [newColor, setNewColor] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit && styleId) {
      styleApi.get(factoryId, styleId).then((res) => {
        const data = res.data as {
          style_code: string;
          unit_price: number;
          colors: string[];
        };
        setStyleCode(data.style_code);
        setUnitPrice(String(data.unit_price));
        setColors(data.colors);
      });
    }
  }, [factoryId, styleId, isEdit]);

  const addColor = () => {
    const c = newColor.trim();
    if (!c) return;
    if (colors.includes(c)) {
      Alert.alert('提示', '此颜色已存在');
      return;
    }
    setColors([...colors, c]);
    setNewColor('');
  };

  const removeColor = (c: string) => {
    setColors(colors.filter((x) => x !== c));
  };

  const handleSave = async () => {
    if (!styleCode.trim()) {
      Alert.alert('提示', '请输入款式编号');
      return;
    }
    if (colors.length === 0) {
      Alert.alert('提示', '至少添加一种颜色');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        style_code: styleCode.trim(),
        unit_price: parseFloat(unitPrice) || 0,
        colors,
      };
      if (isEdit && styleId) {
        await styleApi.update(factoryId, styleId, payload);
      } else {
        await styleApi.create(factoryId, payload);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('保存失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!styleId) return;
    Alert.alert('警告', '删除款式将同时删除其所有收发记录，确定？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定删除',
        style: 'destructive',
        onPress: async () => {
          await styleApi.remove(factoryId, styleId);
          navigation.pop(2);
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.label}>款式编号</Text>
        <TextInput
          style={styles.input}
          placeholder="如：10086"
          placeholderTextColor={Colors.placeholder}
          value={styleCode}
          onChangeText={setStyleCode}
        />
        <Text style={styles.label}>加工单价（元/件）</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={unitPrice}
          onChangeText={setUnitPrice}
        />
        <Text style={styles.label}>颜色管理</Text>
        <View style={styles.colorList}>
          {colors.length === 0 ? (
            <Text style={styles.hint}>暂无颜色，点击下方添加</Text>
          ) : (
            colors.map((c) => (
              <View key={c} style={styles.colorTag}>
                <Text style={styles.colorText}>{c}</Text>
                <TouchableOpacity onPress={() => removeColor(c)}>
                  <Text style={styles.remove}>×</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
        <View style={styles.addRow}>
          <TextInput
            style={[styles.input, styles.flex]}
            placeholder="输入颜色名"
            value={newColor}
            onChangeText={setNewColor}
          />
          <TouchableOpacity onPress={addColor}>
            <Text style={styles.addBtn}>＋ 添加</Text>
          </TouchableOpacity>
        </View>
      </View>
      <PrimaryButton title="保存" onPress={handleSave} loading={loading} style={styles.btn} />
      {isEdit && (
        <PrimaryButton title="删除此款式" variant="outline" onPress={handleDelete} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  card: { backgroundColor: Colors.white, borderRadius: 10, padding: 16, marginBottom: 16 },
  label: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8, marginTop: 8 },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Colors.text,
  },
  colorList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  colorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    gap: 6,
  },
  colorText: { color: Colors.primary },
  remove: { color: Colors.danger, fontSize: 18 },
  hint: { color: Colors.textSecondary, fontSize: 13 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  flex: { flex: 1 },
  addBtn: { color: Colors.primary, fontWeight: '600' },
  btn: { marginBottom: 12 },
});
