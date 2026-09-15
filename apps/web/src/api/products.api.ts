import { apiClient } from './client';

export type ProductListParams = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
};

export const productsApi = {
  async list(params: ProductListParams = {}) {
    const { data } = await apiClient.get('/api/products', { params });
    return { data: data.data, total: data.total as number };
  },
  async listCategories() {
    const { data } = await apiClient.get('/api/products/categories');
    return data.data as string[];
  },
  async getById(id: string) {
    const { data } = await apiClient.get(`/api/products/${id}`);
    return data.data;
  },
  async create(input: unknown) {
    const { data } = await apiClient.post('/api/products', input);
    return data.data;
  },
  async update(id: string, input: unknown) {
    const { data } = await apiClient.put(`/api/products/${id}`, input);
    return data.data;
  },
  async restock(id: string, quantity: number) {
    const { data } = await apiClient.post(`/api/products/${id}/restock`, { quantity });
    return data.data;
  },
  async delete(id: string) {
    const { data } = await apiClient.delete(`/api/products/${id}`);
    return data.data;
  }
};
