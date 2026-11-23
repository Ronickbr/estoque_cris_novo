import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import manufacturersService, { ManufacturerQuery, CreateManufacturerDto, UpdateManufacturerDto } from '@services/manufacturers';
import { Manufacturer, PaginatedResponse } from '@types';

export function useManufacturers(query: ManufacturerQuery = {}) {
  return useQuery({
    queryKey: ['manufacturers', query],
    queryFn: () => manufacturersService.getAll(query),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useManufacturer(id: number) {
  return useQuery({
    queryKey: ['manufacturers', id],
    queryFn: () => manufacturersService.getById(id),
    enabled: !!id,
  });
}

export function useManufacturerProducts(manufacturerId: number) {
  return useQuery({
    queryKey: ['manufacturers', manufacturerId, 'products'],
    queryFn: () => manufacturersService.getProducts(manufacturerId),
    enabled: !!manufacturerId,
  });
}

export function useCreateManufacturer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateManufacturerDto) => manufacturersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
    },
  });
}

export function useUpdateManufacturer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateManufacturerDto }) =>
      manufacturersService.update(id, data),
    onSuccess: (updatedManufacturer) => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
      queryClient.setQueryData(['manufacturers', updatedManufacturer.id], updatedManufacturer);
    },
  });
}

export function useDeleteManufacturer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => manufacturersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
    },
  });
}