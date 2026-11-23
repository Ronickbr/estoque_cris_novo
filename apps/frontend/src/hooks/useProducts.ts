import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import productsService, { ProductQuery, CreateProductDto, UpdateProductDto, AdjustStockDto } from '@services/products';
import { Product, PaginatedResponse } from '@types';

export function useProducts(query: ProductQuery = {}) {
  return useQuery({
    queryKey: ['products', query],
    queryFn: () => productsService.getAll(query),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productsService.getById(id),
    enabled: !!id,
  });
}

export function useLowStockProducts() {
  return useQuery({
    queryKey: ['products', 'low-stock'],
    queryFn: () => productsService.getLowStock(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => productsService.getCategories(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useManufacturers() {
  return useQuery({
    queryKey: ['manufacturers', 'all'],
    queryFn: () => productsService.getManufacturers(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductDto) => productsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductDto }) =>
      productsService.update(id, data),
    onSuccess: (updatedProduct) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.setQueryData(['products', updatedProduct.id], updatedProduct);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AdjustStockDto }) =>
      productsService.adjustStock(id, data),
    onSuccess: (updatedProduct) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.setQueryData(['products', updatedProduct.id], updatedProduct);
      queryClient.invalidateQueries({ queryKey: ['products', 'low-stock'] });
    },
  });
}

export function useTopSelling(period: 'today' | 'week' | 'month', limit = 10) {
  return useQuery({
    queryKey: ['products', 'top-selling', period, limit],
    queryFn: () => productsService.getTopSelling(period, limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}