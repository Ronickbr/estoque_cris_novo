import api from './api';
import type { User, AuthResponse, LoginDto, RegisterDto, ChangePasswordDto, ChangeEmailDto, RequestPasswordResetDto, ResetPasswordDto, PasswordPolicyResponse } from '@types';
import { UserRole } from '@types';

export type { ChangePasswordDto, ChangeEmailDto, RequestPasswordResetDto, ResetPasswordDto } from '@types';

export interface NeonAuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  roles: string[];
  metadata: Record<string, unknown>;
}

export interface NeonAuthSession {
  user: NeonAuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

class AuthService {
  private neonAuthClientId = import.meta.env.VITE_NEON_AUTH_CLIENT_ID;
  private neonAuthUrl = import.meta.env.VITE_NEON_AUTH_URL || 'https://auth.neon.tech';

  async login(credentials: LoginDto): Promise<AuthResponse> {
    const response = await api.post<any>('/auth/login', credentials);
    const authData: AuthResponse = response?.data || response;
    this.setAuthData(authData);
    return authData;
  }

  async register(userData: RegisterDto): Promise<AuthResponse> {
    const response = await api.post<any>('/auth/register', userData);
    const authData: AuthResponse = response?.data || response;
    this.setAuthData(authData);
    return authData;
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      this.clearAuthData();
    }
  }

  async refreshToken(): Promise<{ accessToken: string }> {
    const response = await api.post<{ accessToken: string }>('/auth/refresh');
    localStorage.setItem('access_token', response.accessToken);
    return response;
  }

  async getMe(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response;
  }

  async changePassword(data: ChangePasswordDto): Promise<{ message: string }> {
    return api.post('/auth/change-password', data);
  }

  async changeEmail(data: ChangeEmailDto): Promise<{ message: string }> {
    return api.post('/auth/change-email', data);
  }

  async updateProfile(data: { nome: string; email: string }): Promise<User> {
    return api.post('/auth/profile', data);
  }

  async requestPasswordReset(data: RequestPasswordResetDto): Promise<{ message: string }> {
    return api.post('/auth/forgot-password', data);
  }

  async resetPassword(data: ResetPasswordDto): Promise<{ message: string }> {
    return api.post('/auth/reset-password', data);
  }

  async getPasswordPolicy(): Promise<PasswordPolicyResponse> {
    return api.get('/auth/password-policy');
  }

  private setAuthData(authResponse: any) {
    const data = authResponse?.data || authResponse;
    const token = data?.accessToken || authResponse?.accessToken;
    const user = data?.user || authResponse?.user;

    if (token) {
      localStorage.setItem('access_token', token);
      api.setAuthToken(token);
    }
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  private clearAuthData() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    api.clearAuthToken();
  }

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return api.isAuthenticated() && !!this.getStoredUser();
  }

  getUserRole(): UserRole | null {
    const user = this.getStoredUser();
    return user?.nivel || null;
  }

  hasRole(roles: UserRole[]): boolean {
    const userRole = this.getUserRole();
    return userRole ? roles.includes(userRole) : false;
  }

  isAdmin(): boolean {
    return this.getUserRole() === UserRole.ADMIN;
  }

  isOperator(): boolean {
    const role = this.getUserRole();
    return role === UserRole.ADMIN || role === UserRole.OPERATOR;
  }

  async loginWithNeonAuth(email: string, password: string): Promise<NeonAuthSession> {
    const response = await fetch(`${this.neonAuthUrl}/api/v1/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.neonAuthClientId}`,
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Falha no login com Neon Auth');
    }

    const session = await response.json();
    localStorage.setItem('neon_auth_session', JSON.stringify(session));
    return session;
  }

  async signupWithNeonAuth(email: string, password: string, name: string): Promise<NeonAuthSession> {
    const response = await fetch(`${this.neonAuthUrl}/api/v1/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.neonAuthClientId}`,
      },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Falha no cadastro com Neon Auth');
    }

    const session = await response.json();
    localStorage.setItem('neon_auth_session', JSON.stringify(session));
    return session;
  }

  async signOutNeonAuth(): Promise<void> {
    const sessionStr = localStorage.getItem('neon_auth_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr) as NeonAuthSession;
      await fetch(`${this.neonAuthUrl}/api/v1/auth/signout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
    }
    localStorage.removeItem('neon_auth_session');
  }

  getNeonAuthSession(): NeonAuthSession | null {
    const sessionStr = localStorage.getItem('neon_auth_session');
    if (!sessionStr) return null;
    try {
      return JSON.parse(sessionStr);
    } catch {
      return null;
    }
  }

  async refreshNeonAuthToken(): Promise<NeonAuthSession | null> {
    const session = this.getNeonAuthSession();
    if (!session) return null;

    const response = await fetch(`${this.neonAuthUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.refreshToken}`,
      },
    });

    if (!response.ok) {
      this.signOutNeonAuth();
      return null;
    }

    const newSession = await response.json();
    localStorage.setItem('neon_auth_session', JSON.stringify(newSession));
    return newSession;
  }
}

export const authService = new AuthService();
export default authService;