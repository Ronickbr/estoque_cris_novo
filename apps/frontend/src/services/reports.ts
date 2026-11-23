import api from './api';
import type { DashboardStats, SalesReport, StockReport, ReportQuery } from '@types';

export type { ReportQuery } from '@types';

const reportsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    return api.get('/reports/dashboard');
  },

  async getSalesReport(query: ReportQuery): Promise<SalesReport> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get(`/reports/sales?${params.toString()}`);
  },

  async getStockReport(): Promise<StockReport[]> {
    return api.get('/reports/stock');
  },

  async exportSalesReport(query: ReportQuery, format: 'csv' | 'xlsx' = 'xlsx'): Promise<Blob> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    params.append('format', format);
    const response = await api.get(`/reports/sales/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response as unknown as Blob;
  },

  async exportStockReport(format: 'csv' | 'xlsx' = 'xlsx'): Promise<Blob> {
    const response = await api.get(`/reports/stock/export?format=${format}`, {
      responseType: 'blob',
    });
    return response as unknown as Blob;
  },

  async getInventoryValuation(): Promise<{
    totalValue: number;
    byCategory: { category: string; value: number; percentage: number }[];
    byManufacturer: { manufacturer: string; value: number; percentage: number }[];
    byDeposit: { deposit: string; value: number; percentage: number }[];
  }> {
    return api.get('/reports/inventory-valuation');
  },

  async getMovementSummary(query: ReportQuery): Promise<{
    totalEntries: number;
    totalExits: number;
    totalTransfers: number;
    totalAdjustments: number;
    byType: { type: string; count: number; quantity: number }[];
    byProduct: { productId: number; productName: string; entries: number; exits: number }[];
  }> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get(`/reports/movement-summary?${params.toString()}`);
  },

  async getInventoryReport(): Promise<{
    summary: {
      totalProducts: number;
      totalStockUnits: number;
      totalValuation: number;
      lowStockCount: number;
      outOfStockCount: number;
      accuracyPercentage: number;
    };
    items: Array<{
      id: string;
      name: string;
      manufacturerId: string;
      manufacturerName: string;
      stock: number;
      minStock: number;
      estimatedUnitPrice: number;
      totalValuation: number;
      status: 'ok' | 'baixo' | 'zerado';
      lastUpdated: string;
    }>;
  }> {
    return api.get('/reports/inventory');
  },

  async exportInventoryReport(format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const response = await api.get(`/reports/inventory/export?format=${format}`, {
      responseType: 'blob',
    });
    return response as unknown as Blob;
  },
};

export default reportsService;