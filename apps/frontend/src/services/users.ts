import api from './api';
import { User, UserRole, PaginatedResponse } from '@types';

export interface UserQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  nivel?: UserRole;
  active?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateUserDto {
  nome: string;
  email: string;
  senha: string;
  nivel: UserRole;
}

export interface UpdateUserDto {
  nome?: string;
  email?: string;
  nivel?: UserRole;
  active?: boolean;
}

const usersService = {
  async getAll(query: UserQuery = {}): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get(`/users?${params.toString()}`);
  },

  async getById(id: number): Promise<User> {
    return api.get(`/users/${id}`);
  },

  async create(data: CreateUserDto): Promise<User> {
    return api.post('/users', data);
  },

  async update(id: number, data: UpdateUserDto): Promise<User> {
    return api.put(`/users/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return api.delete(`/users/${id}`);
  },

  async getRoles(): Promise<{ value: UserRole; label: string }[]> {
    return [
      { value: UserRole.ADMIN, label: 'Administrador' },
      { value: UserRole.OPERATOR, label: 'Operador' },
      { value: UserRole.VIEWER, label: 'Visualizador' },
    ];
  },
};

export default usersService;