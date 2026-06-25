import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { memberApi, userApi } from '../../api/endpoints';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Colors } from '../../constants/colors';
import type { RootStackParamList, User } from '../../types';

interface MemberRow {
  user_id: string;
  nickname: string;
  role: string;
}

interface Props {
  onLogout: () => void;
}

export function MineScreen({ onLogout }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [user, setUser] = useState<User | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [currentRole, setCurrentRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [saving, setSaving] = useState(false);

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

  const openEditProfile = () => {
    setEditNickname(user?.nickname ?? '');
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    const nickname = editNickname.trim();
    if (!nickname) {
      Alert.alert('提示', '昵称不能为空');
      return;
    }
    setSaving(true);
    try {
      const res = await userApi.updateMe(nickname);
      setUser((prev) => (prev ? { ...prev, nickname: res.data.nickname } : prev));
      setEditing(false);
    } catch (e) {
      Alert.alert('保存失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('退出登录', '确定要退出当前账号吗？', [
      { text: '取消', style: 'cancel' },
      { text: '退出', style: 'destructive', onPress: onLogout },
    ]);
  };

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
    <>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <TouchableOpacity style={styles.profile} onPress={openEditProfile} activeOpacity={0.8}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.nickname}>{user?.nickname ?? '加载中...'}</Text>
            {user?.phone ? <Text style={styles.phone}>{user.phone}</Text> : null}
            <Text style={styles.editHint}>点击编辑资料</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>成员管理</Text>
        <View style={styles.card}>
          {members.length === 0 ? (
            <Text style={styles.emptyText}>暂无成员数据</Text>
          ) : (
            members.map((m) => (
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
            ))
          )}
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

        <View style={styles.logoutWrap}>
          <PrimaryButton title="退出登录" variant="outline" onPress={handleLogout} />
        </View>
      </ScrollView>

      <Modal visible={editing} transparent animationType="fade" onRequestClose={() => setEditing(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>编辑资料</Text>
            <Text style={styles.modalLabel}>昵称</Text>
            <TextInput
              style={styles.modalInput}
              value={editNickname}
              onChangeText={setEditNickname}
              placeholder="请输入昵称"
              placeholderTextColor={Colors.placeholder}
              maxLength={64}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setEditing(false)}>
                <Text style={styles.modalCancel}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtn} onPress={handleSaveProfile} disabled={saving}>
                <Text style={styles.modalSave}>{saving ? '保存中...' : '保存'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.white,
    marginBottom: 12,
  },
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
  profileInfo: { flex: 1 },
  nickname: { fontSize: 18, fontWeight: '600', color: Colors.text },
  phone: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  editHint: { fontSize: 12, color: Colors.primary, marginTop: 6 },
  sectionTitle: { paddingHorizontal: 16, marginBottom: 8, color: Colors.textSecondary },
  card: { backgroundColor: Colors.white, marginHorizontal: 12, borderRadius: 10, padding: 12, marginBottom: 16 },
  emptyText: { color: Colors.textSecondary, paddingVertical: 8 },
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
  logoutWrap: { paddingHorizontal: 12, paddingBottom: 32 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  modalLabel: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  modalBtn: { paddingVertical: 8, paddingHorizontal: 4 },
  modalCancel: { color: Colors.textSecondary, fontSize: 16 },
  modalSave: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
});
