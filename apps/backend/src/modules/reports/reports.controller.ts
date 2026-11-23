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
