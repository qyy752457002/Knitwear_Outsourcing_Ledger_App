import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { Colors } from '../constants/colors';
import type { MainTabParamList } from '../types';
import { FactoryListScreen } from '../screens/home/FactoryListScreen';
import { StatsScreen } from '../screens/stats/StatsScreen';
import { MineScreen } from '../screens/mine/MineScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    首页: '🏠',
    统计: '📊',
    我的: '👤',
  };
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>
      {icons[label]}
    </Text>
  );
}

interface Props {
  onLogout: () => void;
}

export function TabNavigator({ onLogout }: Props) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          height: 56,
        },
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Home" options={{ title: '首页' }} component={FactoryListScreen} />
      <Tab.Screen name="Stats" options={{ title: '统计' }} component={StatsScreen} />
      <Tab.Screen name="Mine" options={{ title: '我的' }}>
        {() => <MineScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
