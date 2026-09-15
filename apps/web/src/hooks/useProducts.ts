import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/products.api';

export const useProducts = (params?: { search?: string; page?: number }) =>
  useQuery({
    queryKey: ['products', params],
    queryFn: () => productsApi.list()
  });

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] })
  });
};

