import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { factoryApi } from '../../api/endpoints';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Colors } from '../../constants/colors';
import type { FactoryItem, RootStackParamList } from '../../types';
import { formatDiff } from '../../utils/quantity';

export function FactoryListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [factories, setFactories] = useState<FactoryItem[]>([]);
  const [todaySummary, setTodaySummary] = useState({ total_out: 0, total_in: 0, diff: 0 });
  const [deletedCount, setDeletedCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await factoryApi.list(keyword || undefined);
      setFactories(res.data.list);
      setTodaySummary(res.data.today_summary);
      setDeletedCount(res.data.deleted_count);
    } catch (e) {
      Alert.alert('加载失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const diffInfo = formatDiff(todaySummary.diff);
  const hasData = todaySummary.total_out > 0 || todaySummary.total_in > 0;

  const handleDelete = (item: FactoryItem) => {
    Alert.alert('警告', `删除「${item.name}」将同时删除其下所有款式和收发记录，确定？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '确定删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await factoryApi.remove(item.id);
            load();
          } catch (e) {
            Alert.alert('删除失败', e instanceof Error ? e.message : '请重试');
          }
        },
      },
    ]);
  };

  const showMenu = (item: FactoryItem) => {
    Alert.alert(item.name, '选择操作', [
      {
        text: '编辑',
        onPress: () =>
          navigation.navigate('FactoryEdit', {
            factoryId: item.id,
            factoryName: item.name,
          }),
      },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => handleDelete(item),
      },
      { text: '取消', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="搜索工厂"
        placeholderTextColor={Colors.placeholder}
        value={keyword}
        onChangeText={setKeyword}
        onSubmitEditing={load}
      />

      <View style={styles.dashboard}>
        <View style={[styles.dashItem, styles.dashOut]}>
          <Text style={styles.dashLabel}>今日发出</Text>
          <Text style={[styles.dashValue, { color: Colors.primary }]}>
            {todaySummary.total_out}
          </Text>
        </View>
        <View style={[styles.dashItem, styles.dashIn]}>
          <Text style={styles.dashLabel}>今日收回</Text>
          <Text style={[styles.dashValue, { color: Colors.success }]}>
            {todaySummary.total_in}
          </Text>
        </View>
        <View style={styles.dashItem}>
          <Text style={styles.dashLabel}>差额</Text>
          <Text style={[styles.dashValue, { color: hasData ? diffInfo.color : Colors.placeholder }]}>
            {hasData ? diffInfo.text : '—'}
          </Text>
        </View>
      </View>

      <FlatList
        data={factories}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={factories.length === 0 ? styles.flex : undefined}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              text="还没有上游工厂"
              actionText="＋ 添加上游工厂"
              onAction={() => navigation.navigate('FactoryEdit', {})}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('StyleList', {
                factoryId: item.id,
                factoryName: item.name,
              })
            }
            onLongPress={() => showMenu(item)}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.style_count} 款</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => showMenu(item)} hitSlop={12}>
              <Text style={styles.more}>⋮</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      {deletedCount > 0 && (
        <TouchableOpacity
          style={styles.recycleLink}
          onPress={() => navigation.navigate('RecycleBin', { type: 'factory' })}
        >
          <Text style={styles.recycleText}>回收站（{deletedCount} 个已删除工厂） ›</Text>
        </TouchableOpacity>
      )}

      <View style={styles.footer}>
        <PrimaryButton
          title="＋ 添加上游工厂"
          onPress={() => navigation.navigate('FactoryEdit', {})}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  search: {
    margin: 12,
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 15,
  },
  dashboard: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: Colors.white,
    borderRadius: 10,
    overflow: 'hidden',
  },
  dashItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  dashOut: { backgroundColor: Colors.primaryLight },
  dashIn: { backgroundColor: Colors.successLight },
  dashLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  dashValue: { fontSize: 22, fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 16,
    borderRadius: 10,
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: Colors.text },
  badge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: { color: Colors.primary, fontSize: 12 },
  more: { fontSize: 20, color: Colors.textSecondary, paddingHorizontal: 8 },
  recycleLink: { padding: 12 },
  recycleText: { color: Colors.textSecondary, fontSize: 14 },
  footer: { padding: 12, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
});
