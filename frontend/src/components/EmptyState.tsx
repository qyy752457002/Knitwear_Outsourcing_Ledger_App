import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '../constants/colors';

interface Props {
  text: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({ text, actionText, onAction }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Text style={styles.iconPlus}>+</Text>
      </View>
      <Text style={styles.text}>{text}</Text>
      {actionText && onAction ? (
        <TouchableOpacity style={styles.actionBtn} onPress={onAction}>
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#C0C0C0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconPlus: {
    fontSize: 24,
    color: '#C0C0C0',
  },
  text: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  actionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
  },
  actionText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
