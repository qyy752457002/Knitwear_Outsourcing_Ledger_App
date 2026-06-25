import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { authApi } from '../../api/endpoints';
import { api } from '../../api/client';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Colors } from '../../constants/colors';

interface Props {
  onLoginSuccess: () => void;
}

export function LoginScreen({ onLoginSuccess }: Props) {
  const [phone, setPhone] = useState('13800138000');
  const [code, setCode] = useState('123456');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim()) {
      Alert.alert('提示', '请输入手机号');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.phoneLogin(phone.trim(), code.trim());
      await api.setTokens(res.data.access_token, res.data.refresh_token);
      onLoginSuccess();
    } catch (e) {
      Alert.alert('登录失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>外协收发记账</Text>
        <Text style={styles.subtitle}>手机号登录（开发验证码 123456）</Text>
        <TextInput
          style={styles.input}
          placeholder="手机号"
          placeholderTextColor={Colors.placeholder}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput
          style={styles.input}
          placeholder="验证码"
          placeholderTextColor={Colors.placeholder}
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
        />
        <PrimaryButton title="登录" onPress={handleLogin} loading={loading} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 16,
    color: Colors.text,
  },
});
