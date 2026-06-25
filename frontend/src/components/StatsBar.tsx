import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '../constants/colors';
import { formatDiff } from '../utils/quantity';
import type { RecordSummary } from '../types';

interface Props {
  summary: RecordSummary;
  unitPrice: number;
  colors: string[];
}

export function StatsBar({ summary, unitPrice }: Props) {
  const [expanded, setExpanded] = useState(false);
  const diffInfo = formatDiff(summary.diff);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.outText}>累计发出: {summary.total_out} 件</Text>
        <Text style={styles.inText}>累计收回: {summary.total_in} 件</Text>
      </View>
      <View style={styles.row}>
        <Text style={[styles.diffText, { color: diffInfo.color }]}>
          收发差额: {diffInfo.text}
        </Text>
        <Text style={styles.payable}>应付: ¥{summary.payable.toFixed(2)}</Text>
      </View>
      <TouchableOpacity onPress={() => setExpanded(!expanded)}>
        <Text style={styles.expand}>
          {expanded ? '▾ 收起颜色详情' : '▸ 展开颜色详情'}
        </Text>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, styles.headerCell]}>颜色</Text>
            <Text style={[styles.cell, styles.headerCell]}>发出</Text>
            <Text style={[styles.cell, styles.headerCell]}>收回</Text>
            <Text style={[styles.cell, styles.headerCell]}>差额</Text>
          </View>
          {summary.color_details.map((c) => (
            <View key={c.color} style={styles.tableRow}>
              <Text style={styles.cell}>{c.color}</Text>
              <Text style={[styles.cell, styles.outText]}>{c.out}</Text>
              <Text style={[styles.cell, styles.inText]}>{c.in}</Text>
              <Text style={styles.cell}>{c.diff}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  outText: { color: Colors.primary, fontWeight: '600' },
  inText: { color: Colors.success, fontWeight: '600' },
  diffText: { fontWeight: '600' },
  payable: { color: Colors.danger, fontWeight: '600' },
  expand: { color: Colors.primary, marginTop: 4, marginBottom: 8 },
  table: { marginTop: 8 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 4 },
  tableRow: { flexDirection: 'row', paddingVertical: 6 },
  cell: { flex: 1, fontSize: 13, color: Colors.text },
  headerCell: { fontWeight: '600', color: Colors.textSecondary },
});
