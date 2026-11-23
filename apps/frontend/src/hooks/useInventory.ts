import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import inventoryService, { MovementQuery, CreateMovementDto, CreateBatchDto, CreateDepositDto } from '@services/inventory';
import { InventoryMovement, Batch, Deposit, PaginatedResponse, MovementType } from '@types';

export function useMovements(query: MovementQuery = {}) {
  return useQuery({
    queryKey: ['movements', query],
    queryFn: () => inventoryService.getAll(query),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useMovement(id: number) {
  return useQuery({
    queryKey: ['movements', id],
    queryFn: () => inventoryService.getById(id),
    enabled: !!id,
  });
}

export function useBatches(productId?: number) {
  return useQuery({
    queryKey: ['batches', productId],
    queryFn: () => inventoryService.getBatches(productId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useDeposits() {
  return useQuery({
    queryKey: ['deposits'],
    queryFn: () => inventoryService.getDeposits(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useCreateMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMovementDto) => inventoryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'low-stock'] });
    },
  });
}

export function useCreateBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBatchDto) => inventoryService.createBatch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useCreateDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDepositDto) => inventoryService.createDeposit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
    },
  });
}

export function useUpdateDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateDepositDto> }) =>
      inventoryService.updateDeposit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
    },
  });
}

export function useDeleteDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => inventoryService.deleteDeposit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
    },
  });
}

export function useMovementTypes() {
  return [
    { value: MovementType.ENTRY, label: 'Entrada' },
    { value: MovementType.EXIT, label: 'Saída' },
    { value: MovementType.TRANSFER, label: 'Transferência' },
    { value: MovementType.ADJUSTMENT, label: 'Ajuste' },
    { value: MovementType.RETURN, label: 'Devolução' },
    { value: MovementType.LOSS, label: 'Perda' },
  ];
}