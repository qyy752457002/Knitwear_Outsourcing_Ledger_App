import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { statsApi } from '../../api/endpoints';
import { EmptyState } from '../../components/EmptyState';
import { Colors } from '../../constants/colors';
import type { FactoryStatsData, RootStackParamList } from '../../types';
import { formatDiff } from '../../utils/quantity';

type Props = NativeStackScreenProps<RootStackParamList, 'MonthlySummary'>;

export function MonthlySummaryScreen({ route }: Props) {
  const { factoryId, styleId, styleCode, dateFrom, dateTo } = route.params;
  const [stats, setStats] = useState<FactoryStatsData | null>(null);

  useEffect(() => {
    statsApi
      .factoryStats(factoryId, { dateFrom, dateTo, styleId })
      .then((res) => setStats(res.data));
  }, [factoryId, styleId, dateFrom, dateTo]);

  const styleStat = stats?.style_stats[0];

  if (!styleStat) {
    return <EmptyState text="暂无该款式数据" />;
  }

  const diffInfo = formatDiff(styleStat.diff);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{styleCode} 汇总</Text>
      {dateFrom && dateTo && (
        <Text style={styles.subtitle}>
          {dateFrom} ~ {dateTo}
        </Text>
      )}

      <View style={styles.summaryCard}>
        <View style={styles.row}>
          <View style={styles.item}>
            <Text style={styles.label}>累计发出</Text>
            <Text style={[styles.value, { color: Colors.primary }]}>{styleStat.total_out}</Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.label}>累计收回</Text>
            <Text style={[styles.value, { color: Colors.success }]}>{styleStat.total_in}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.item}>
            <Text style={styles.label}>差额</Text>
            <Text style={[styles.value, { color: diffInfo.color }]}>{styleStat.diff}</Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.label}>应付加工</Text>
            <Text style={[styles.value, { color: Colors.danger }]}>
              ¥{styleStat.payable.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.section}>颜色明细</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.cell, styles.header]}>颜色</Text>
          <Text style={[styles.cell, styles.header]}>发出</Text>
          <Text style={[styles.cell, styles.header]}>收回</Text>
          <Text style={[styles.cell, styles.header]}>差额</Text>
        </View>
        {styleStat.color_stats.map((c) => (
          <View key={c.color} style={styles.tableRow}>
            <Text style={styles.cell}>{c.color}</Text>
            <Text style={[styles.cell, { color: Colors.primary }]}>{c.out}</Text>
            <Text style={[styles.cell, { color: Colors.success }]}>{c.in}</Text>
            <Text style={styles.cell}>{c.diff_label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  subtitle: { color: Colors.textSecondary, marginBottom: 16 },
  summaryCard: { backgroundColor: Colors.white, borderRadius: 10, padding: 16, marginBottom: 16 },
  row: { flexDirection: 'row', marginBottom: 12 },
  item: { flex: 1 },
  label: { fontSize: 12, color: Colors.textSecondary },
  value: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  section: { fontWeight: '600', marginBottom: 8, color: Colors.text },
  table: { backgroundColor: Colors.white, borderRadius: 10, padding: 12 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 8 },
  tableRow: { flexDirection: 'row', paddingVertical: 10 },
  cell: { flex: 1, fontSize: 14, color: Colors.text },
  header: { fontWeight: '600', color: Colors.textSecondary },
});
