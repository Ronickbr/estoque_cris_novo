import api from './api';
import { Product, Category, Manufacturer, PaginatedResponse, ProductSales } from '@types';

export interface ProductQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: number;
  manufacturerId?: number;
  status?: 'active' | 'inactive' | 'low_stock' | 'out_of_stock';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateProductDto {
  sku: string;
  name: string;
  description?: string;
  categoryId: number;
  manufacturerId: number;
  unitPrice: number;
  costPrice: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  barcode?: string;
  ncm?: string;
  active: boolean;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface AdjustStockDto {
  quantity: number;
  type: 'entry' | 'exit' | 'adjustment';
  notes?: string;
  batchId?: number;
  depositId?: number;
}

const productsService = {
  async getAll(query: ProductQuery = {}): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get(`/products?${params.toString()}`);
  },

  async getById(id: number): Promise<Product> {
    return api.get(`/products/${id}`);
  },

  async create(data: CreateProductDto): Promise<Product> {
    return api.post('/products', data);
  },

  async update(id: number, data: UpdateProductDto): Promise<Product> {
    return api.put(`/products/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return api.delete(`/products/${id}`);
  },

  async adjustStock(id: number, data: AdjustStockDto): Promise<Product> {
    return api.post(`/products/${id}/adjust-stock`, data);
  },

  async getLowStock(): Promise<Product[]> {
    return api.get('/products/low-stock');
  },

  async getCategories(): Promise<Category[]> {
    return api.get('/categories');
  },

  async createCategory(data: { name: string; description?: string }): Promise<Category> {
    return api.post('/categories', data);
  },

  async updateCategory(id: number, data: { name: string; description?: string }): Promise<Category> {
    return api.put(`/categories/${id}`, data);
  },

  async deleteCategory(id: number): Promise<void> {
    return api.delete(`/categories/${id}`);
  },

  async getManufacturers(): Promise<Manufacturer[]> {
    return api.get('/manufacturers');
  },

  async getTopSelling(period: 'today' | 'week' | 'month', limit = 10): Promise<ProductSales[]> {
    return api.get(`/reports/top-selling?period=${period}&limit=${limit}`);
  },
};

export default productsService;