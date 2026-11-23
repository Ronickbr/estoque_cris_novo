import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastManager } from '@components/ui/Toast';

interface BackupItem {
  id: string;
  type: string;
  description: string;
  size: number;
  createdAt: string;
  status: 'completed' | 'pending' | 'failed';
}

export function useBackups() {
  const { danger } = useToastManager();
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['backups'],
    queryFn: async () => {
      // Mock data for demo
      await new Promise(resolve => setTimeout(resolve, 500));
      return [
        {
          id: '1',
          type: 'full',
          description: 'Backup completo do sistema',
          size: 1024 * 1024 * 15,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          status: 'completed',
        },
        {
          id: '2',
          type: 'products',
          description: 'Apenas produtos e categorias',
          size: 1024 * 1024 * 3,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          status: 'completed',
        },
      ] as BackupItem[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const createBackup = useMutation({
    mutationFn: async ({ type, description }: { type: string; description: string }) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { id: Date.now().toString(), type, description, size: 1024 * 1024 * 10, createdAt: new Date().toISOString(), status: 'completed' };
    },
    onSuccess: () => {
      refetch();
    },
    onError: (error: Error) => {
      danger('Erro', error.message);
    },
  });

  const restoreBackup = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      return { success: true };
    },
    onSuccess: () => {
      refetch();
    },
    onError: (error: Error) => {
      danger('Erro', error.message);
    },
  });

  const deleteBackup = useMutation({
    mutationFn: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      refetch();
    },
    onError: (error: Error) => {
      danger('Erro', error.message);
    },
  });

  return {
    backups: data || [],
    isLoading,
    error,
    createBackup,
    restoreBackup,
    deleteBackup,
    refetch,
  };
}