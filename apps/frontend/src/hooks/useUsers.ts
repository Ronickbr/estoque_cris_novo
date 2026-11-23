import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import usersService, { UserQuery, CreateUserDto, UpdateUserDto } from '@services/users';
import { User, UserRole, PaginatedResponse } from '@types';

export function useUsers(query: UserQuery = {}) {
  return useQuery({
    queryKey: ['users', query],
    queryFn: () => usersService.getAll(query),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUser(id: number) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersService.getById(id),
    enabled: !!id,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => usersService.getRoles(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserDto) => usersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserDto }) =>
      usersService.update(id, data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.setQueryData(['users', updatedUser.id], updatedUser);
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => usersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}