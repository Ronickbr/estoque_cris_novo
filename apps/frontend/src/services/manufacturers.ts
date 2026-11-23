import api from './api';
import { Manufacturer, PaginatedResponse } from '@types';

export interface ManufacturerQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  active?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateManufacturerDto {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  active: boolean;
}

export interface UpdateManufacturerDto extends Partial<CreateManufacturerDto> {}

const manufacturersService = {
  async getAll(query: ManufacturerQuery = {}): Promise<PaginatedResponse<Manufacturer>> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get(`/manufacturers?${params.toString()}`);
  },

  async getById(id: number): Promise<Manufacturer> {
    return api.get(`/manufacturers/${id}`);
  },

  async create(data: CreateManufacturerDto): Promise<Manufacturer> {
    return api.post('/manufacturers', data);
  },

  async update(id: number, data: UpdateManufacturerDto): Promise<Manufacturer> {
    return api.put(`/manufacturers/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return api.delete(`/manufacturers/${id}`);
  },

  async getProducts(manufacturerId: number): Promise<{ id: number; name: string; stock: number; minStock: number }[]> {
    return api.get(`/manufacturers/${manufacturerId}/products`);
  },
};

export default manufacturersService;