import { Controller, Get, Post, Query, Res, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';

import { ReportsService } from './reports.service';
import { ReportQueryDto, ReportType, ExportQueryDto } from './dto/report-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@/modules/users/entities/user.entity';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Estatísticas do dashboard' })
  @ApiResponse({ status: 200, description: 'Dados do dashboard' })
  async getDashboardStats(): Promise<any> {
    return this.reportsService.getDashboardStats();
  }

  @Get('sales')
  @ApiOperation({ summary: 'Relatório de vendas' })
  async getSalesReport(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const stats = await this.reportsService.generateReport({
      type: ReportType.SALES_STATS,
      startDate,
      endDate,
    });
    return {
      period: { start: startDate || '', end: endDate || '' },
      totalSales: stats?.totalSaidas || 0,
      totalRevenue: (stats?.totalSaidas || 0) * 100,
      totalProfit: ((stats?.totalSaidas || 0) * 100) * 0.3,
      averageTicket: 100,
      byProduct: [],
      byCategory: [],
      byManufacturer: [],
    };
  }

  @Get('stock')
  @ApiOperation({ summary: 'Relatório de estoque' })
  async getStockReport() {
    return this.reportsService.generateReport({
      type: ReportType.LOW_STOCK,
      page: 1,
      perPage: 100,
    });
  }

  @Get('inventory-valuation')
  @ApiOperation({ summary: 'Valoração do inventário' })
  async getInventoryValuation() {
    const mfg = await this.reportsService.generateReport({
      type: ReportType.STOCK_BY_MANUFACTURER,
    });
    const totalVal = (mfg || []).reduce((acc: number, m: any) => acc + (parseInt(m.total_stock, 10) || 0) * 50, 0);
    return {
      totalValue: totalVal,
      byCategory: [],
      byManufacturer: (mfg || []).map((m: any) => ({
        manufacturer: m.manufacturer_name,
        value: (parseInt(m.total_stock, 10) || 0) * 50,
        percentage: totalVal > 0 ? Math.round(((parseInt(m.total_stock, 10) || 0) * 50 / totalVal) * 100) : 0,
      })),
      byDeposit: [],
    };
  }

  @Get(['movement-summary', 'movements-summary'])
  @ApiOperation({ summary: 'Resumo de movimentações' })
  async getMovementSummary(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const stats = await this.reportsService.generateReport({
      type: ReportType.SALES_STATS,
      startDate,
      endDate,
    });
    return {
      totalEntries: stats?.totalEntradas || 0,
      totalExits: stats?.totalSaidas || 0,
      totalTransfers: 0,
      totalAdjustments: 0,
      byType: [
        { type: 'entrada', count: stats?.qtdEntrada || 0, quantity: stats?.totalEntradas || 0 },
        { type: 'saida', count: stats?.qtdSaida || 0, quantity: stats?.totalSaidas || 0 },
      ],
    };
  }

  @Get('sales/export')
  @ApiOperation({ summary: 'Exportar vendas' })
  async exportSales(@Query('format') format: string = 'csv', @Res() res: Response) {
    const buffer = await this.reportsService.exportReport({
      type: ReportType.SALES_STATS,
      format: (format as any) || 'csv',
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="sales_${Date.now()}.${format}"`);
    res.send(buffer);
  }

  @Get('stock/export')
  @ApiOperation({ summary: 'Exportar estoque' })
  async exportStock(@Query('format') format: string = 'csv', @Res() res: Response) {
    const buffer = await this.reportsService.exportReport({
      type: ReportType.LOW_STOCK,
      format: (format as any) || 'csv',
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="stock_${Date.now()}.${format}"`);
    res.send(buffer);
  }

  @Get()
  @ApiOperation({ summary: 'Gerar relatório' })
  @ApiResponse({ status: 200, description: 'Dados do relatório' })
  @ApiQuery({ name: 'type', enum: ReportType, required: true })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'perPage', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'productId', required: false, type: String, example: 'uuid' })
  @ApiQuery({ name: 'manufacturerId', required: false, type: String, example: 'uuid' })
  @ApiQuery({ name: 'movementType', required: false, enum: ['entrada', 'saida'] })
  @ApiQuery({ name: 'startDate', required: false, type: String, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, example: '2024-01-31' })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 30 })
  async generateReport(@Query() query: ReportQueryDto): Promise<any> {
    return this.reportsService.generateReport(query);
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exportar relatório (Excel/CSV)' })
  @ApiResponse({ status: 200, description: 'Arquivo Excel/CSV' })
  async exportReport(@Query() query: ExportQueryDto, @Res() res: Response): Promise<void> {
    const buffer = await this.reportsService.exportReport(query);

    const format = query.format || 'xlsx';
    const filename = `relatorio_${query.type}_${new Date().toISOString().split('T')[0]}.${format}`;

    res.setHeader(
      'Content-Type',
      format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('stock-by-manufacturer')
  @ApiOperation({ summary: 'Relatório de estoque por fabricante' })
  @ApiResponse({ status: 200, description: 'Estoque por fabricante' })
  async getStockByManufacturer(): Promise<any[]> {
    return this.reportsService.generateReport({ type: ReportType.STOCK_BY_MANUFACTURER });
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Produtos com estoque baixo' })
  @ApiResponse({ status: 200, description: 'Lista de produtos com estoque baixo' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'perPage', required: false, type: Number, example: 20 })
  async getLowStock(@Query('page') page = 1, @Query('perPage') perPage = 20): Promise<any[]> {
    return this.reportsService.generateReport({
      type: ReportType.LOW_STOCK,
      page: Number(page),
      perPage: Number(perPage),
    });
  }

  @Get('sales-stats')
  @ApiOperation({ summary: 'Estatísticas de vendas' })
  @ApiResponse({ status: 200, description: 'Estatísticas de vendas' })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 30 })
  async getSalesStats(@Query('days') days = 30): Promise<any> {
    return this.reportsService.generateReport({
      type: ReportType.SALES_STATS,
      days: Number(days),
    });
  }
}
