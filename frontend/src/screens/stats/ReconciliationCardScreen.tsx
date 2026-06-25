import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { statsApi } from '../../api/endpoints';
import { EmptyState } from '../../components/EmptyState';
import { Colors } from '../../constants/colors';
import type { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ReconciliationCard'>;

export function ReconciliationCardScreen({ route }: Props) {
  const { factoryId, dateFrom, dateTo } = route.params;
  const [card, setCard] = useState<{
    factory_name: string;
    date_from?: string;
    date_to?: string;
    summary: { total_in: number; payable: number };
    style_stats: Array<{ style_code: string; total_in: number; payable: number }>;
  } | null>(null);

  useEffect(() => {
    statsApi
      .reconciliationCard(factoryId, {
        date_from: dateFrom,
        date_to: dateTo,
      })
      .then((res) => setCard(res.data as typeof card));
  }, [factoryId, dateFrom, dateTo]);

  if (!card) {
    return <EmptyState text="数据加载失败，请返回重新生成" />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>对  账  单</Text>
        <Text style={styles.factory}>{card.factory_name}</Text>
        {card.date_from && card.date_to && (
          <Text style={styles.dateRange}>
            {card.date_from} ~ {card.date_to}
          </Text>
        )}
        <View style={styles.divider} />
        <View style={styles.tableHeader}>
          <Text style={[styles.colStyle, styles.header]}>款式</Text>
          <Text style={[styles.colQty, styles.header]}>收回</Text>
          <Text style={[styles.colPay, styles.header]}>应付</Text>
        </View>
        {card.style_stats.map((s) => (
          <View key={s.style_code} style={styles.tableRow}>
            <Text style={styles.colStyle}>{s.style_code}</Text>
            <Text style={styles.colQty}>{s.total_in}</Text>
            <Text style={styles.colPay}>¥{s.payable.toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text>收回合计</Text>
          <Text>{card.summary.total_in} 件</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.payableLabel}>应付合计</Text>
          <Text style={styles.payableValue}>¥{card.summary.payable.toFixed(2)}</Text>
        </View>
        <Text style={styles.sign}>{card.factory_name} 确认签章：</Text>
      </View>
      <Text style={styles.tip}>或直接截图上方卡片发送</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 28,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 6,
    marginBottom: 16,
  },
  factory: { fontSize: 16, textAlign: 'center', color: Colors.text },
  dateRange: { textAlign: 'center', color: Colors.textSecondary, marginTop: 4 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 16 },
  tableHeader: { flexDirection: 'row', marginBottom: 8 },
  tableRow: { flexDirection: 'row', paddingVertical: 6 },
  header: { fontWeight: '600', color: Colors.textSecondary },
  colStyle: { flex: 3, color: Colors.text },
  colQty: { flex: 1, textAlign: 'right', color: Colors.text },
  colPay: { flex: 1, textAlign: 'right', color: Colors.text },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  payableLabel: { fontWeight: '600' },
  payableValue: { color: Colors.danger, fontWeight: '700', fontSize: 16 },
  sign: { marginTop: 24, color: Colors.textSecondary },
  tip: { textAlign: 'center', color: Colors.textSecondary, marginTop: 16 },
});
