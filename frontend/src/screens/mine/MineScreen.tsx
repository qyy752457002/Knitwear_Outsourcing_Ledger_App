import React, { useCallback, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { memberApi, userApi } from '../../api/endpoints';
import { Colors } from '../../constants/colors';
import type { RootStackParamList, User } from '../../types';

interface MemberRow {
  user_id: string;
  nickname: string;
  role: string;
}

export function MineScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [user, setUser] = useState<User | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [currentRole, setCurrentRole] = useState('member');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await userApi.me();
      setUser(me.data);
      const memberRes = await memberApi.myMembers();
      const data = memberRes.data as {
        members: MemberRow[];
        current_user_role: string;
      };
      setMembers(data.members ?? []);
      setCurrentRole(data.current_user_role ?? 'member');
    } catch (e) {
      Alert.alert('加载失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleInvite = async () => {
    Alert.alert('提示', '请先在工厂详情中使用邀请功能（需 Owner 权限）');
  };

  const handleRemove = (member: MemberRow) => {
    Alert.alert('移除成员', '确定移除该成员吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => {
          Alert.alert('提示', '请指定 factoryId 后调用移除接口');
        },
      },
    ]);
  };

  const initial = user?.nickname?.charAt(0) ?? '?';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.nickname}>{user?.nickname ?? '加载中...'}</Text>
      </View>

      <Text style={styles.sectionTitle}>成员管理</Text>
      <View style={styles.card}>
        {members.map((m) => (
          <View key={m.user_id} style={styles.memberRow}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>{m.nickname.charAt(0)}</Text>
            </View>
            <Text style={styles.memberName}>{m.nickname}</Text>
            <View style={[styles.roleBadge, m.role === 'owner' ? styles.ownerBadge : styles.memberBadge]}>
              <Text style={m.role === 'owner' ? styles.ownerText : styles.memberText}>
                {m.role === 'owner' ? '老板' : '员工'}
              </Text>
            </View>
            {currentRole === 'owner' && m.role !== 'owner' && (
              <TouchableOpacity onPress={() => handleRemove(m)}>
                <Text style={styles.remove}>移除</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {currentRole === 'owner' && (
          <TouchableOpacity onPress={handleInvite}>
            <Text style={styles.invite}>＋ 邀请员工</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionTitle}>回收站</Text>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('RecycleBin', { type: 'factory' })}
        >
          <Text>工厂回收站</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('RecycleBin', { type: 'style' })}
        >
          <Text>款式回收站</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  profile: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: Colors.white, marginBottom: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: Colors.white, fontSize: 20, fontWeight: '700' },
  nickname: { fontSize: 18, fontWeight: '600', color: Colors.text },
  sectionTitle: { paddingHorizontal: 16, marginBottom: 8, color: Colors.textSecondary },
  card: { backgroundColor: Colors.white, marginHorizontal: 12, borderRadius: 10, padding: 12, marginBottom: 16 },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 8 },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: { color: Colors.primary, fontWeight: '600' },
  memberName: { flex: 1, color: Colors.text },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  ownerBadge: { backgroundColor: Colors.primaryLight },
  memberBadge: { backgroundColor: Colors.background },
  ownerText: { color: Colors.primary, fontSize: 12 },
  memberText: { color: Colors.textSecondary, fontSize: 12 },
  remove: { color: Colors.danger },
  invite: { color: Colors.primary, paddingVertical: 12, fontWeight: '600' },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14 },
  arrow: { color: Colors.textSecondary, fontSize: 18 },
});
