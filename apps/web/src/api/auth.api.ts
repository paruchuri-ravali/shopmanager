import { apiClient } from './client';

export type AuthPayload = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; email: string; shopName: string };
};

export const authApi = {
  async login(email: string, password: string) {
    const { data } = await apiClient.post('/api/auth/login', { email, password });
    return data.data as AuthPayload;
  },
  async register(input: { name: string; email: string; password: string; shopName: string }) {
    const { data } = await apiClient.post('/api/auth/register', input);
    return data.data as AuthPayload;
  },
  async updateProfile(input: { name?: string; email?: string; shopName?: string }) {
    const { data } = await apiClient.put('/api/auth/me', input);
    return data.data.user as { id: string; name: string; email: string; shopName: string };
  }
};
