import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../types';
import { TabNavigator } from './TabNavigator';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { FactoryEditScreen } from '../screens/home/FactoryEditScreen';
import { StyleListScreen } from '../screens/style/StyleListScreen';
import { StyleEditScreen } from '../screens/style/StyleEditScreen';
import { RecordScreen } from '../screens/record/RecordScreen';
import { MonthlySummaryScreen } from '../screens/stats/MonthlySummaryScreen';
import { ReconciliationCardScreen } from '../screens/stats/ReconciliationCardScreen';
import { RecycleBinScreen } from '../screens/recycle/RecycleBinScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface Props {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export function RootNavigator({ isAuthenticated, onLogout }: Props) {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen name="Main" options={{ headerShown: false }}>
              {() => <TabNavigator onLogout={onLogout} />}
            </Stack.Screen>
            <Stack.Screen
              name="FactoryEdit"
              component={FactoryEditScreen}
              options={{ title: '工厂编辑' }}
            />
            <Stack.Screen
              name="StyleList"
              component={StyleListScreen}
              options={{ title: '款式列表' }}
            />
            <Stack.Screen
              name="StyleEdit"
              component={StyleEditScreen}
              options={{ title: '款式编辑' }}
            />
            <Stack.Screen
              name="Record"
              component={RecordScreen}
              options={{ title: '收发记账' }}
            />
            <Stack.Screen
              name="MonthlySummary"
              component={MonthlySummaryScreen}
              options={{ title: '月度汇总' }}
            />
            <Stack.Screen
              name="ReconciliationCard"
              component={ReconciliationCardScreen}
              options={{ title: '对账卡片' }}
            />
            <Stack.Screen
              name="RecycleBin"
              component={RecycleBinScreen}
              options={{ title: '回收站' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
