export interface User {
  id: number;
  nome: string;
  email: string;
  nivel: UserRole;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'usuario',
  OPERATOR = 'usuario',
  VIEWER = 'viewer',
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginDto {
  identifier: string;
  password: string;
}

export interface RegisterDto {
  nome: string;
  email: string;
  senha: string;
  nivel: UserRole;
}

export interface ChangePasswordDto {
  senhaAtual: string;
  novaSenha: string;
  confirmarNovaSenha: string;
}

export interface ChangeEmailDto {
  senha: string;
  novoEmail: string;
  confirmarNovoEmail: string;
}

export interface RequestPasswordResetDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  novaSenha: string;
  confirmarNovaSenha: string;
}

export interface ManufacturerFormData {
  name: string;
  cnpj?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  active: boolean;
}

export interface ProductFormData {
  name: string;
  sku: string;
  description?: string;
  categoryId: number;
  manufacturerId: number;
  costPrice: number;
  unitPrice: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  barcode?: string;
  active: boolean;
}

export interface PasswordPolicyResponse {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAgeDays: number;
  historyCount: number;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  categoryId: number;
  category?: Category;
  manufacturerId: number;
  manufacturer?: Manufacturer;
  unitPrice: number;
  costPrice: number;
  minStock: number;
  maxStock?: number;
  currentStock: number;
  unit: string;
  barcode?: string;
  ncm?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Manufacturer {
  id: number;
  name: string;
  cnpj?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  active: boolean;
  productCount?: number;
  totalStock?: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: number;
  productId: number;
  product?: Product;
  type: MovementType;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  referenceType?: string;
  referenceId?: number;
  batchId?: number;
  batch?: Batch;
  depositId?: number;
  deposit?: Deposit;
  notes?: string;
  userId: number;
  user?: User;
  createdAt: string;
}

export enum MovementType {
  ENTRY = 'entry',
  EXIT = 'exit',
  TRANSFER = 'transfer',
  ADJUSTMENT = 'adjustment',
  RETURN = 'return',
  LOSS = 'loss',
}

export interface Batch {
  id: number;
  productId: number;
  product?: Product;
  batchNumber: string;
  manufactureDate?: string;
  expiryDate?: string;
  quantity: number;
  unitCost: number;
  supplierId?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deposit {
  id: number;
  name: string;
  code: string;
  address?: string;
  responsibleId?: number;
  responsible?: User;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  vendasHoje: number;
  vendasSemana: number;
  vendasMes: number;
  diaMaisVendas: { date: string; total: number } | null;
  produtosHoje: TopProduct[];
  produtosSemana: TopProduct[];
  produtosMes: TopProduct[];
  estoqueBaixo: LowStockByManufacturer[];
}

export interface TopProduct {
  id: number;
  name: string;
  total: number;
  revenue: number;
}

export interface LowStockByManufacturer {
  manufacturer: Manufacturer;
  products: LowStockProduct[];
}

export interface LowStockProduct {
  id: number;
  name: string;
  stock: number;
  minStock: number;
  image?: string;
}

export interface ReportQuery {
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month';
  productId?: number;
  manufacturerId?: number;
  categoryId?: number;
  depositId?: number;
}

export interface SalesReport {
  period: string;
  totalSales: number;
  totalQuantity: number;
  totalRevenue: number;
  averageTicket: number;
  byProduct: ProductSales[];
  byCategory: CategorySales[];
  byManufacturer: ManufacturerSales[];
}

export interface ProductSales {
  productId: number;
  productName: string;
  quantity: number;
  revenue: number;
}

export interface CategorySales {
  categoryId: number;
  categoryName: string;
  quantity: number;
  revenue: number;
}

export interface ManufacturerSales {
  manufacturerId: number;
  manufacturerName: string;
  quantity: number;
  revenue: number;
}

export interface StockReport {
  productId: number;
  productName: string;
  sku: string;
  category: string;
  manufacturer: string;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  unitCost: number;
  totalValue: number;
  status: StockStatus;
}

export enum StockStatus {
  NORMAL = 'normal',
  LOW = 'low',
  CRITICAL = 'critical',
  OUT_OF_STOCK = 'out_of_stock',
  OVERSTOCK = 'overstock',
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface NavItem {
  href: string;
  icon: string;
  label: string;
  exact?: boolean;
  roles?: UserRole[];
  children?: NavItem[];
}