import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import authService from '@services/auth';
import type { ChangePasswordDto, ChangeEmailDto, RequestPasswordResetDto, ResetPasswordDto } from '@services/auth';
import { User, UserRole, AuthResponse, LoginDto, RegisterDto } from '@types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = authService.getStoredUser();
    if (storedUser && authService.isAuthenticated()) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginDto): Promise<AuthResponse> => {
    const response = await authService.login(credentials);
    setUser(response.user);
    return response;
  }, []);

  const register = useCallback(async (userData: RegisterDto): Promise<AuthResponse> => {
    const response = await authService.register(userData);
    setUser(response.user);
    return response;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await authService.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
      return userData;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
    forgotPassword: (email: string) => authService.requestPasswordReset({ email }),
    resetPassword: (data: ResetPasswordDto) => authService.resetPassword(data),
    hasRole: (roles: UserRole[]) => user ? roles.includes(user.nivel) : false,
    isAdmin: () => user?.nivel === UserRole.ADMIN,
    isOperator: () => user?.nivel === UserRole.ADMIN || user?.nivel === UserRole.OPERATOR,
  };
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordDto) => authService.changePassword(data),
  });
}

export function useChangeEmail() {
  return useMutation({
    mutationFn: (data: ChangeEmailDto) => authService.changeEmail(data),
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (data: RequestPasswordResetDto) => authService.requestPasswordReset(data),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (data: ResetPasswordDto) => authService.resetPassword(data),
  });
}

export function usePasswordPolicy() {
  return useQuery({
    queryKey: ['auth', 'password-policy'],
    queryFn: () => authService.getPasswordPolicy(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { nome: string; email: string }) => authService.updateProfile(data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['auth', 'user'], updatedUser);
    },
  });
}