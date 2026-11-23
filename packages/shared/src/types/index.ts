export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  unit: string;
  minStock: number;
  maxStock: number;
  costPrice: number;
  salePrice: number;
  categoryId: string;
  supplierId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  unitCost: number;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
  userId: string;
  createdAt: string;
}

export type MovementType = 'entry' | 'exit' | 'transfer' | 'adjustment' | 'return';

export interface StockBatch {
  id: string;
  productId: string;
  batchNumber: string;
  quantity: number;
  unitCost: number;
  manufactureDate?: string;
  expiryDate?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface NeonAuthConfig {
  baseUrl: string;
  jwksUrl: string;
  audience: string;
  issuer: string;
}