import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { factoryApi } from '../../api/endpoints';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Colors } from '../../constants/colors';
import type { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'FactoryEdit'>;

export function FactoryEditScreen({ route, navigation }: Props) {
  const { factoryId, factoryName } = route.params ?? {};
  const isEdit = !!factoryId;
  const [name, setName] = useState(factoryName ?? '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit && factoryId && !factoryName) {
      factoryApi.get(factoryId).then((res) => {
        setName((res.data as { name: string }).name);
      });
    }
  }, [factoryId, factoryName, isEdit]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('提示', '请输入工厂名称');
      return;
    }
    setLoading(true);
    try {
      if (isEdit && factoryId) {
        await factoryApi.update(factoryId, name.trim());
      } else {
        await factoryApi.create(name.trim());
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('保存失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!factoryId) return;
    Alert.alert('警告', '删除工厂将同时删除其下所有款式和收发记录，确定继续？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await factoryApi.remove(factoryId);
            navigation.pop(2);
          } catch (e) {
            Alert.alert('删除失败', e instanceof Error ? e.message : '请重试');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>工厂名称</Text>
        <TextInput
          style={styles.input}
          placeholder="如：缝盘厂"
          placeholderTextColor={Colors.placeholder}
          value={name}
          onChangeText={setName}
        />
      </View>
      <PrimaryButton title="保存" onPress={handleSave} loading={loading} style={styles.btn} />
      {isEdit && (
        <PrimaryButton
          title="删除此工厂"
          variant="outline"
          onPress={handleDelete}
          style={[styles.btn, styles.dangerOutline]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  card: { backgroundColor: Colors.white, borderRadius: 10, padding: 16, marginBottom: 16 },
  label: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Colors.text,
  },
  btn: { marginBottom: 12 },
  dangerOutline: { borderColor: Colors.danger },
});
