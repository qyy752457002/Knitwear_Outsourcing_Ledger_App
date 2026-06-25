import { api } from './client';
import type {
  AuthTokens,
  FactoryListData,
  FactoryStatsData,
  RecordListData,
  StyleListData,
  User,
} from '../types';

export const authApi = {
  phoneLogin: (phone: string, smsCode: string) =>
    api.post<AuthTokens>('/auth/phone/login', { phone, sms_code: smsCode }),

  wechatLogin: (code: string) =>
    api.post<AuthTokens>('/auth/wechat/login', { code }),

  refresh: (refreshToken: string) =>
    api.post<AuthTokens>('/auth/refresh', { refresh_token: refreshToken }),
};

export const userApi = {
  me: () => api.get<User & { factory_ids: string[] }>('/users/me'),
  updateMe: (nickname: string) => api.patch('/users/me', { nickname }),
};

export const factoryApi = {
  list: (keyword?: string) =>
    api.get<FactoryListData>(
      `/factories${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''}`,
    ),
  create: (name: string) => api.post('/factories', { name }),
  get: (id: string) => api.get(`/factories/${id}`),
  update: (id: string, name: string) => api.patch(`/factories/${id}`, { name }),
  remove: (id: string) => api.delete(`/factories/${id}`),
};

export const styleApi = {
  list: (factoryId: string) =>
    api.get<StyleListData>(`/factories/${factoryId}/styles`),
  create: (
    factoryId: string,
    data: { style_code: string; unit_price: number; colors: string[] },
  ) => api.post(`/factories/${factoryId}/styles`, data),
  get: (factoryId: string, styleId: string) =>
    api.get(`/factories/${factoryId}/styles/${styleId}`),
  update: (
    factoryId: string,
    styleId: string,
    data: Partial<{ style_code: string; unit_price: number; colors: string[] }>,
  ) => api.patch(`/factories/${factoryId}/styles/${styleId}`, data),
  remove: (factoryId: string, styleId: string) =>
    api.delete(`/factories/${factoryId}/styles/${styleId}`),
  addColor: (factoryId: string, styleId: string, color: string) =>
    api.post(`/factories/${factoryId}/styles/${styleId}/colors`, { color }),
};

export const recordApi = {
  list: (factoryId: string, styleId: string) =>
    api.get<RecordListData>(
      `/factories/${factoryId}/styles/${styleId}/records`,
    ),
  updateCell: (
    factoryId: string,
    styleId: string,
    data: {
      type: 'out' | 'in';
      date: string;
      color: string;
      qty: number;
      remark?: string;
    },
  ) =>
    api.put(
      `/factories/${factoryId}/styles/${styleId}/records/cell`,
      data,
    ),
  remove: (factoryId: string, styleId: string, recordId: string) =>
    api.delete(
      `/factories/${factoryId}/styles/${styleId}/records/${recordId}`,
    ),
};

export const statsApi = {
  factoryStats: (
    factoryId: string,
    params?: { dateFrom?: string; dateTo?: string; styleId?: string },
  ) => {
    const qs = new URLSearchParams();
    if (params?.dateFrom) qs.set('date_from', params.dateFrom);
    if (params?.dateTo) qs.set('date_to', params.dateTo);
    if (params?.styleId) qs.set('style_id', params.styleId);
    const query = qs.toString();
    return api.get<FactoryStatsData>(
      `/factories/${factoryId}/stats${query ? `?${query}` : ''}`,
    );
  },
  reconciliationCard: (
    factoryId: string,
    data?: { date_from?: string; date_to?: string },
  ) => api.post(`/factories/${factoryId}/reconciliation-card`, data ?? {}),
};

export const settlementApi = {
  get: (factoryId: string, dateFrom?: string, dateTo?: string) => {
    const qs = new URLSearchParams();
    if (dateFrom) qs.set('date_from', dateFrom);
    if (dateTo) qs.set('date_to', dateTo);
    const query = qs.toString();
    return api.get(`/factories/${factoryId}/settlements${query ? `?${query}` : ''}`);
  },
  upsert: (
    factoryId: string,
    data: { date_from?: string; date_to?: string; status: 'settled' | 'unsettled' },
  ) => api.put(`/factories/${factoryId}/settlements`, data),
};

export const memberApi = {
  list: (factoryId: string) => api.get(`/factories/${factoryId}/members`),
  remove: (factoryId: string, userId: string) =>
    api.delete(`/factories/${factoryId}/members/${userId}`),
  createInvitation: (factoryId: string) =>
    api.post(`/factories/${factoryId}/invitations`),
  acceptInvitation: (code: string) =>
    api.post('/invitations/accept', { code }),
  myMembers: (factoryId?: string) =>
    api.get(`/me/members${factoryId ? `?factory_id=${factoryId}` : ''}`),
};

export const recycleBinApi = {
  factories: () => api.get('/recycle-bin/factories'),
  styles: (factoryId?: string) =>
    api.get(
      `/recycle-bin/styles${factoryId ? `?factory_id=${factoryId}` : ''}`,
    ),
  restoreFactory: (id: string) => api.post(`/recycle-bin/factories/${id}/restore`),
  restoreStyle: (id: string) => api.post(`/recycle-bin/styles/${id}/restore`),
  permanentDeleteFactory: (id: string) =>
    api.delete(`/recycle-bin/factories/${id}/permanent`),
  permanentDeleteStyle: (id: string) =>
    api.delete(`/recycle-bin/styles/${id}/permanent`),
};

export const utilsApi = {
  parseQuantity: (input: string) =>
    api.post<{ pieces: number; parsed: boolean }>('/utils/parse-quantity', {
      input,
    }),
};
