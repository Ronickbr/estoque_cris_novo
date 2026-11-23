import api from './api';
import { InventoryMovement, MovementType, PaginatedResponse, Batch, Deposit } from '@types';

export interface MovementQuery {
  page?: number;
  pageSize?: number;
  productId?: number;
  type?: MovementType;
  startDate?: string;
  endDate?: string;
  depositId?: number;
  userId?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateMovementDto {
  productId: string | number;
  type: MovementType;
  quantity: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: number;
  batchId?: number;
  depositId?: number;
  notes?: string;
}

export interface CreateBatchDto {
  productId: number;
  batchNumber: string;
  manufactureDate?: string;
  expiryDate?: string;
  quantity: number;
  unitCost: number;
  supplierId?: number;
  notes?: string;
}

export interface CreateDepositDto {
  name: string;
  code: string;
  address?: string;
  responsibleId?: number;
  active: boolean;
}

const inventoryService = {
  async getAll(query: MovementQuery = {}): Promise<PaginatedResponse<InventoryMovement>> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'pageSize') {
          params.append('perPage', String(value));
        } else {
          params.append(key, String(value));
        }
      }
    });
    return api.get(`/inventory-movements?${params.toString()}`);
  },

  async getById(id: number): Promise<InventoryMovement> {
    return api.get(`/inventory-movements/${id}`);
  },

  async create(data: CreateMovementDto): Promise<InventoryMovement> {
    return api.post('/inventory-movements', data);
  },

  async getBatches(productId?: number): Promise<Batch[]> {
    const params = productId ? `?productId=${productId}` : '';
    return api.get(`/batches${params}`);
  },

  async createBatch(data: CreateBatchDto): Promise<Batch> {
    return api.post('/batches', data);
  },

  async getDeposits(): Promise<Deposit[]> {
    return api.get('/deposits');
  },

  async createDeposit(data: CreateDepositDto): Promise<Deposit> {
    return api.post('/deposits', data);
  },

  async updateDeposit(id: number, data: Partial<CreateDepositDto>): Promise<Deposit> {
    return api.put(`/deposits/${id}`, data);
  },

  async deleteDeposit(id: number): Promise<void> {
    return api.delete(`/deposits/${id}`);
  },
};

export default inventoryService;