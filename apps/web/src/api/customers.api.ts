import { apiClient } from './client';

export type CustomerListParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
};

export const customersApi = {
  async list(params: CustomerListParams = {}) {
    const { data } = await apiClient.get('/api/customers', { params });
    return { data: data.data, total: data.total as number };
  },
  async create(input: unknown) {
    const { data } = await apiClient.post('/api/customers', input);
    return data.data;
  }
};
