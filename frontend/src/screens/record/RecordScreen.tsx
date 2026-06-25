import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { recordApi } from '../../api/endpoints';
import { StatsBar } from '../../components/StatsBar';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Colors } from '../../constants/colors';
import type { RecordItem, RecordListData, RootStackParamList } from '../../types';
import { formatDateShort, parseQuantity, todayISO } from '../../utils/quantity';

export function RecordScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Record'>>();
  const { factoryId, styleId, styleCode } = route.params;

  const [data, setData] = useState<RecordListData | null>(null);
  const [tab, setTab] = useState<'out' | 'in'>('out');
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activeCell, setActiveCell] = useState<{ date: string; color: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await recordApi.list(factoryId, styleId);
      setData(res.data);
    } catch (e) {
      Alert.alert('加载失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setLoading(false);
    }
  }, [factoryId, styleId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filteredRecords =
    data?.records.filter((r) => r.type === tab) ?? [];

  const handleSaveCell = async () => {
    if (!activeCell) return;
    const qty = parseQuantity(inputValue);
    if (qty === null && inputValue.trim()) {
      Alert.alert('格式错误', '如: 36 / 3打 / 1打2');
      return;
    }
    try {
      await recordApi.updateCell(factoryId, styleId, {
        type: tab,
        date: activeCell.date,
        color: activeCell.color,
        qty: qty ?? 0,
      });
      setActiveCell(null);
      setInputValue('');
      load();
    } catch (e) {
      Alert.alert('保存失败', e instanceof Error ? e.message : '请重试');
    }
  };

  const renderRow = ({ item }: { item: RecordItem }) => (
    <View style={styles.row}>
      <Text style={styles.dateCell}>
        {formatDateShort(item.date)}
        {'\n'}
        <Text style={tab === 'out' ? styles.typeOut : styles.typeIn}>
          {tab === 'out' ? '发' : '收'}
        </Text>
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorsRow}>
        {data?.style.colors.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.qtyCell,
              activeCell?.date === item.date && activeCell.color === color && styles.qtyCellActive,
            ]}
            onPress={() => {
              setActiveCell({ date: item.date, color });
              setInputValue(String(item.items[color] ?? ''));
            }}
          >
            <Text style={styles.qtyText}>{item.items[color] ?? ''}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity
        onLongPress={() => {
          Alert.alert('删除此行', `删除 ${item.date} 的记录？`, [
            { text: '取消', style: 'cancel' },
            {
              text: '确定',
              style: 'destructive',
              onPress: async () => {
                await recordApi.remove(factoryId, styleId, item.id);
                load();
              },
            },
          ]);
        }}
      >
        <Text style={styles.remarkCell}>{item.remark ? '✓' : ''}</Text>
      </TouchableOpacity>
    </View>
  );

  if (!data) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.styleTitle}>款式 {styleCode}</Text>
        <Text style={styles.price}>¥{data.style.unit_price}/件</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'out' && styles.tabOutActive]}
          onPress={() => setTab('out')}
        >
          <Text style={[styles.tabText, tab === 'out' && styles.tabTextActive]}>发出</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'in' && styles.tabInActive]}
          onPress={() => setTab('in')}
        >
          <Text style={[styles.tabText, tab === 'in' && styles.tabTextActive]}>收回</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredRecords}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListHeaderComponent={
          <View style={styles.tableHeader}>
            <Text style={styles.dateCell}>日期</Text>
            <Text style={styles.headerColors}>颜色数量</Text>
            {tab === 'out' && <Text style={styles.remarkCell}>备注</Text>}
          </View>
        }
        renderItem={renderRow}
        ListEmptyComponent={
          <View style={styles.emptyRow}>
            {data.style.colors.map((color) => (
              <TouchableOpacity
                key={color}
                style={styles.emptyColorBtn}
                onPress={() => {
                  setActiveCell({ date: todayISO(), color });
                  setInputValue('');
                }}
              >
                <Text style={styles.emptyColorText}>{color}</Text>
              </TouchableOpacity>
            ))}
          </View>
        }
      />

      {activeCell && (
        <View style={styles.inputBar}>
          <Text style={styles.inputLabel}>
            {activeCell.color} · {tab === 'out' ? '发出' : '收回'}
          </Text>
          <TextInput
            style={styles.inputField}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="36 / 3打 / 1打2"
            autoFocus
            keyboardType="default"
          />
          <PrimaryButton title="确定" onPress={handleSaveCell} style={styles.confirmBtn} />
        </View>
      )}

      <StatsBar summary={data.summary} unitPrice={data.style.unit_price} colors={data.style.colors} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingText: { textAlign: 'center', marginTop: 40, color: Colors.textSecondary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 16,
    margin: 12,
    borderRadius: 10,
  },
  styleTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  price: { color: Colors.danger, fontWeight: '600' },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 12,
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 4,
    marginBottom: 8,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  tabOutActive: { backgroundColor: Colors.primary },
  tabInActive: { backgroundColor: Colors.success },
  tabText: { color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: Colors.white },
  tableHeader: { flexDirection: 'row', padding: 12, backgroundColor: Colors.white },
  headerColors: { flex: 1, color: Colors.textSecondary, fontWeight: '600' },
  row: { flexDirection: 'row', padding: 8, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dateCell: { width: 56, fontSize: 12, color: Colors.text },
  typeOut: { color: Colors.primary, fontWeight: '600' },
  typeIn: { color: Colors.success, fontWeight: '600' },
  colorsRow: { flex: 1 },
  qtyCell: {
    width: 64,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
    borderRadius: 4,
  },
  qtyCellActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  qtyText: { fontSize: 14, color: Colors.text },
  remarkCell: { width: 40, textAlign: 'center' },
  emptyRow: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 8 },
  emptyColorBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  emptyColorText: { color: Colors.primary },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  inputLabel: { fontSize: 12, color: Colors.textSecondary },
  inputField: {
    flex: 1,
    height: 36,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmBtn: { paddingHorizontal: 12, height: 36 },
});
