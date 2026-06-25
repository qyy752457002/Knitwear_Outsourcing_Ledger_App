import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { Colors } from '../constants/colors';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'danger' | 'outline';
  style?: ViewStyle;
  disabled?: boolean;
}

export function PrimaryButton({
  title,
  onPress,
  loading,
  variant = 'primary',
  style,
  disabled,
}: Props) {
  const btnStyle = [
    styles.btn,
    variant === 'primary' && styles.primary,
    variant === 'danger' && styles.danger,
    variant === 'outline' && styles.outline,
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.text,
    variant === 'outline' && styles.outlineText,
  ];

  return (
    <TouchableOpacity
      style={btnStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? Colors.primary : Colors.white} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  danger: {
    backgroundColor: Colors.danger,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  outlineText: {
    color: Colors.primary,
  },
});
