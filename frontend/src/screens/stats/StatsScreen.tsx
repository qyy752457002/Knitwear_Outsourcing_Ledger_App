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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { factoryApi, settlementApi, statsApi } from '../../api/endpoints';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Colors } from '../../constants/colors';
import type { FactoryItem, FactoryStatsData, RootStackParamList } from '../../types';
import { formatDiff } from '../../utils/quantity';

export function StatsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [factories, setFactories] = useState<FactoryItem[]>([]);
  const [selectedFactory, setSelectedFactory] = useState<FactoryItem | null>(null);
  const [stats, setStats] = useState<FactoryStatsData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadFactories = useCallback(async () => {
    const res = await factoryApi.list();
    setFactories(res.data.list);
    if (res.data.list.length > 0 && !selectedFactory) {
      setSelectedFactory(res.data.list[0]);
    }
  }, [selectedFactory]);

  const loadStats = useCallback(async () => {
    if (!selectedFactory) return;
    setLoading(true);
    try {
      const res = await statsApi.factoryStats(selectedFactory.id);
      setStats(res.data);
    } catch (e) {
      Alert.alert('加载失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setLoading(false);
    }
  }, [selectedFactory]);

  useFocusEffect(
    useCallback(() => {
      loadFactories();
    }, [loadFactories]),
  );

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  const toggleSettlement = async () => {
    if (!selectedFactory || !stats) return;
    const next = stats.settlement.status === 'settled' ? 'unsettled' : 'settled';
    try {
      await settlementApi.upsert(selectedFactory.id, { status: next });
      loadStats();
    } catch (e) {
      Alert.alert('操作失败', e instanceof Error ? e.message : '请重试');
    }
  };

  const pickFactory = () => {
    Alert.alert(
      '选择工厂',
      undefined,
      factories.map((f) => ({
        text: f.name,
        onPress: () => setSelectedFactory(f),
      })).concat([{ text: '取消', style: 'cancel' }]),
    );
  };

  if (factories.length === 0) {
    return (
      <EmptyState text="还没有上游工厂，请先在首页创建" />
    );
  }

  const diffInfo = stats ? formatDiff(stats.summary.diff) : { text: '—', color: Colors.placeholder };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.picker} onPress={pickFactory}>
        <Text style={styles.pickerLabel}>上游工厂</Text>
        <Text style={styles.pickerValue}>{selectedFactory?.name} ▼</Text>
      </TouchableOpacity>

      {stats && (
        <>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>发出总量</Text>
                <Text style={[styles.summaryValue, { color: Colors.primary }]}>
                  {stats.summary.total_out} 件
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>收回总量</Text>
                <Text style={[styles.summaryValue, { color: Colors.success }]}>
                  {stats.summary.total_in} 件
                </Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>差额</Text>
                <Text style={[styles.summaryValue, { color: diffInfo.color }]}>
                  {stats.summary.diff} 件
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>应付合计</Text>
                <Text style={[styles.summaryValue, { color: Colors.danger }]}>
                  ¥{stats.summary.payable.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.settlementRow} onPress={toggleSettlement}>
            <Text>结算状态:</Text>
            <View
              style={[
                styles.badge,
                stats.settlement.status === 'settled' ? styles.badgeSettled : styles.badgeUnsettled,
              ]}
            >
              <Text
                style={
                  stats.settlement.status === 'settled'
                    ? styles.badgeTextSettled
                    : styles.badgeTextUnsettled
                }
              >
                {stats.settlement.status === 'settled' ? '已结清' : '未结'}
              </Text>
            </View>
            <Text style={styles.hint}>点击切换</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>按款式查看</Text>
          <FlatList
            data={stats.style_stats}
            keyExtractor={(item) => item.style_id}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={loadStats} />}
            ListEmptyComponent={<EmptyState text="该工厂暂无收发记录" />}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.styleRow}
                onPress={() =>
                  navigation.navigate('MonthlySummary', {
                    factoryId: selectedFactory!.id,
                    styleId: item.style_id,
                    styleCode: item.style_code,
                  })
                }
              >
                <View>
                  <Text style={styles.styleCode}>{item.style_code}</Text>
                  <Text style={styles.styleMeta}>
                    发出{item.total_out} 收回{item.total_in} 差额{item.diff}
                  </Text>
                </View>
                <Text style={styles.stylePayable}>¥{item.payable.toFixed(2)}</Text>
              </TouchableOpacity>
            )}
          />

          {stats.style_stats.length > 0 && (
            <View style={styles.footer}>
              <PrimaryButton
                title="生成对账卡片"
                variant="outline"
                onPress={() =>
                  navigation.navigate('ReconciliationCard', {
                    factoryId: selectedFactory!.id,
                  })
                }
              />
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  picker: {
    backgroundColor: Colors.white,
    margin: 12,
    padding: 16,
    borderRadius: 10,
  },
  pickerLabel: { fontSize: 12, color: Colors.textSecondary },
  pickerValue: { fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 4 },
  summaryCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 12,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  summaryRow: { flexDirection: 'row', marginBottom: 12 },
  summaryItem: { flex: 1 },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary },
  summaryValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  settlementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 12,
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  badgeSettled: { backgroundColor: Colors.successLight },
  badgeUnsettled: { backgroundColor: Colors.warningLight },
  badgeTextSettled: { color: Colors.success, fontWeight: '600' },
  badgeTextUnsettled: { color: Colors.warning, fontWeight: '600' },
  hint: { marginLeft: 'auto', color: Colors.textSecondary, fontSize: 12 },
  sectionTitle: { paddingHorizontal: 16, marginBottom: 8, color: Colors.textSecondary },
  styleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 16,
    borderRadius: 10,
  },
  styleCode: { fontSize: 16, fontWeight: '600', color: Colors.text },
  styleMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  stylePayable: { color: Colors.danger, fontWeight: '600' },
  footer: { padding: 12 },
});
