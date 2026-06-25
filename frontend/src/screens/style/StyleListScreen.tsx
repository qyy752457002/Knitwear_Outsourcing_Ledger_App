import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { styleApi } from '../../api/endpoints';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Colors } from '../../constants/colors';
import type { RootStackParamList, StyleItem } from '../../types';

export function StyleListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'StyleList'>>();
  const { factoryId, factoryName } = route.params;
  const [styleList, setStyleList] = useState<StyleItem[]>([]);
  const [deletedCount, setDeletedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await styleApi.list(factoryId);
      setStyleList(res.data.list);
      setDeletedCount(res.data.deleted_count);
    } catch (e) {
      Alert.alert('加载失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setLoading(false);
    }
  }, [factoryId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const showMenu = (item: StyleItem) => {
    Alert.alert(item.style_code, '选择操作', [
      {
        text: '编辑',
        onPress: () => navigation.navigate('StyleEdit', { factoryId, styleId: item.id }),
      },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          Alert.alert('警告', `删除款式「${item.style_code}」将同时删除其所有收发记录，确定？`, [
            { text: '取消', style: 'cancel' },
            {
              text: '确定删除',
              style: 'destructive',
              onPress: async () => {
                await styleApi.remove(factoryId, item.id);
                load();
              },
            },
          ]);
        },
      },
      { text: '取消', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.factoryTitle}>{factoryName}</Text>
      <FlatList
        data={styleList}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={styleList.length === 0 ? styles.flex : undefined}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              text="还没有款式，点击下方添加"
              actionText="＋ 新建款式"
              onAction={() => navigation.navigate('StyleEdit', { factoryId })}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('Record', {
                factoryId,
                styleId: item.id,
                styleCode: item.style_code,
              })
            }
            onLongPress={() => showMenu(item)}
          >
            <View style={styles.cardMain}>
              <View style={styles.row}>
                <Text style={styles.code}>{item.style_code}</Text>
                <Text style={styles.price}>¥{item.unit_price}/件</Text>
              </View>
              <View style={styles.colors}>
                {item.colors.map((c) => (
                  <View key={c} style={styles.colorTag}>
                    <Text style={styles.colorText}>{c}</Text>
                  </View>
                ))}
                <Text style={styles.colorCount}>共{item.color_count}色</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => showMenu(item)}>
              <Text style={styles.more}>⋮</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
      {deletedCount > 0 && (
        <TouchableOpacity
          onPress={() => navigation.navigate('RecycleBin', { type: 'style', factoryId })}
        >
          <Text style={styles.recycle}>款式回收站 ({deletedCount})</Text>
        </TouchableOpacity>
      )}
      <View style={styles.footer}>
        <PrimaryButton
          title="＋ 新建款式"
          onPress={() => navigation.navigate('StyleEdit', { factoryId })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  factoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    padding: 16,
    paddingBottom: 8,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  cardMain: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  code: { fontSize: 16, fontWeight: '600', color: Colors.text },
  price: { color: Colors.danger, fontWeight: '600' },
  colors: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  colorTag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  colorText: { color: Colors.primary, fontSize: 12 },
  colorCount: { color: Colors.textSecondary, fontSize: 12 },
  more: { fontSize: 20, color: Colors.textSecondary, padding: 8 },
  recycle: { padding: 12, color: Colors.textSecondary },
  footer: { padding: 12, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
});
