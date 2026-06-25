import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

import type { ApiResponse } from '../types';

const API_BASE =
  Constants.expoConfig?.extra?.apiBaseUrl ?? 'http://localhost:8000/api/v1';

const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

class ApiClient {
  private accessToken: string | null = null;

  async init() {
    this.accessToken = await AsyncStorage.getItem(TOKEN_KEY);
  }

  async setTokens(access: string, refresh: string) {
    this.accessToken = access;
    await AsyncStorage.setItem(TOKEN_KEY, access);
    await AsyncStorage.setItem(REFRESH_KEY, refresh);
  }

  async clearTokens() {
    this.accessToken = null;
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY]);
  }

  get isAuthenticated() {
    return !!this.accessToken;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const json = (await response.json()) as ApiResponse<T>;

    if (!response.ok) {
      const message =
        typeof json === 'object' && json.message
          ? json.message
          : '网络异常，请重试';
      throw new Error(message);
    }

    if (json.code !== 0) {
      throw new Error(json.message || '操作失败');
    }

    return json;
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }
}


export const api = new ApiClient();
