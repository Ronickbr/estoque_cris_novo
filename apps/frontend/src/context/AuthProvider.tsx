import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth as useAuthHook } from '@hooks/useAuth';
import { User, UserRole } from '@types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { identifier: string; password: string }) => Promise<void>;
  register: (userData: { nome: string; email: string; senha: string; nivel: UserRole }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated, login, register, logout, refreshUser } = useAuthHook();

  const handleLogin = async (credentials: { identifier: string; password: string }) => {
    await login(credentials);
  };

  const handleRegister = async (userData: { nome: string; email: string; senha: string; nivel: UserRole }) => {
    await register(userData);
  };

  const handleLogout = async () => {
    await logout();
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}