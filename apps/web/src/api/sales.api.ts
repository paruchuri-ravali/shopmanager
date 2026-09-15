import { apiClient } from './client';

export type SaleListParams = {
  page?: number;
  limit?: number;
  search?: string;
  from?: string;
  to?: string;
  paymentStatus?: 'paid' | 'credit';
  paymentMethod?: 'cash' | 'upi';
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
};

export const salesApi = {
  async list(params: SaleListParams = {}) {
    const { data } = await apiClient.get('/api/sales', { params });
    return { data: data.data, total: data.total as number };
  },
  async create(input: unknown) {
    const { data } = await apiClient.post('/api/sales', input);
    return data.data;
  },
  async recordPayment(id: string, amount: number, method: 'cash' | 'upi') {
    const { data } = await apiClient.post(`/api/sales/${id}/payments`, { amount, method });
    return data.data;
  }
};
