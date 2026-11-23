import { useQuery, useMutation } from '@tanstack/react-query';
import reportsService from '@services/reports';
import type { ReportQuery } from '@services/reports';
import { DashboardStats, SalesReport, StockReport } from '@types';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['reports', 'dashboard'],
    queryFn: () => reportsService.getDashboardStats(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSalesReport(query: ReportQuery) {
  return useQuery({
    queryKey: ['reports', 'sales', query],
    queryFn: () => reportsService.getSalesReport(query),
    enabled: !!query.startDate && !!query.endDate,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useStockReport() {
  return useQuery({
    queryKey: ['reports', 'stock'],
    queryFn: () => reportsService.getStockReport(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useInventoryValuation() {
  return useQuery({
    queryKey: ['reports', 'inventory-valuation'],
    queryFn: () => reportsService.getInventoryValuation(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useMovementSummary(query: ReportQuery) {
  return useQuery({
    queryKey: ['reports', 'movement-summary', query],
    queryFn: () => reportsService.getMovementSummary(query),
    enabled: !!query.startDate && !!query.endDate,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useExportSalesReport() {
  return useMutation({
    mutationFn: ({ query, format }: { query: ReportQuery; format: 'csv' | 'xlsx' }) =>
      reportsService.exportSalesReport(query, format),
  });
}

export function useExportStockReport() {
  return useMutation({
    mutationFn: (format: 'csv' | 'xlsx') => reportsService.exportStockReport(format),
  });
}