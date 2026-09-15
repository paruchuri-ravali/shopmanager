import { apiClient } from './client';

export const dashboardApi = {
  async summary() {
    const { data } = await apiClient.get('/api/dashboard/summary');
    return data.data;
  }
};
