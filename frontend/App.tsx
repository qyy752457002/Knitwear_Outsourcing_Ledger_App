import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { api } from './src/api/client';
import { RootNavigator } from './src/navigation/RootNavigator';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { Colors } from './src/constants/colors';

export default function App() {
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    api.init().then(() => {
      setIsAuthenticated(api.isAuthenticated);
      setReady(true);
    });
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const handleLogout = useCallback(async () => {
    await api.clearTokens();
    setIsAuthenticated(false);
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <StatusBar style="dark" />
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <RootNavigator isAuthenticated={isAuthenticated} onLogout={handleLogout} />
    </>
  );
}
