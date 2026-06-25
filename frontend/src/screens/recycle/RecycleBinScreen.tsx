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
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { recycleBinApi } from '../../api/endpoints';
import { EmptyState } from '../../components/EmptyState';
import { Colors } from '../../constants/colors';
import type { RootStackParamList } from '../../types';

interface RecycleItem {
  id: string;
  name?: string;
  style_code?: string;
  factory_name?: string;
}

export function RecycleBinScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'RecycleBin'>>();
  const { type, factoryId } = route.params;
  const [items, setItems] = useState<RecycleItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res =
        type === 'factory'
          ? await recycleBinApi.factories()
          : await recycleBinApi.styles(factoryId);
      setItems((res.data as { list: RecycleItem[] }).list);
    } catch (e) {
      Alert.alert('加载失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setLoading(false);
    }
  }, [type, factoryId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleRestore = (item: RecycleItem) => {
    Alert.alert('恢复', '确定恢复吗？数据将完整复原。', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: async () => {
          if (type === 'factory') {
            await recycleBinApi.restoreFactory(item.id);
          } else {
            await recycleBinApi.restoreStyle(item.id);
          }
          load();
        },
      },
    ]);
  };

  const handlePermanentDelete = (item: RecycleItem) => {
    Alert.alert(
      '彻底删除',
      '此操作不可撤销，所有关联数据将被永久删除。确定？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '彻底删除',
          style: 'destructive',
          onPress: async () => {
            if (type === 'factory') {
              await recycleBinApi.permanentDeleteFactory(item.id);
            } else {
              await recycleBinApi.permanentDeleteStyle(item.id);
            }
            load();
          },
        },
      ],
    );
  };

  return (
    <FlatList
      style={styles.container}
      data={items}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      contentContainerStyle={items.length === 0 ? styles.flex : undefined}
      ListEmptyComponent={!loading ? <EmptyState text="回收站是空的" /> : null}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.info}>
            <Text style={styles.title}>{item.name ?? item.style_code}</Text>
            {item.factory_name && (
              <Text style={styles.sub}>{item.factory_name}</Text>
            )}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => handleRestore(item)}>
              <Text style={styles.restore}>恢复</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handlePermanentDelete(item)}>
              <Text style={styles.delete}>彻底删除</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 16,
    borderRadius: 10,
  },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: Colors.text },
  sub: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 16 },
  restore: { color: Colors.primary, fontWeight: '600' },
  delete: { color: Colors.danger, fontWeight: '600' },
});
