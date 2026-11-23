import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';

import { Product } from '../products/entities/product.entity';
import { Manufacturer } from '../manufacturers/entities/manufacturer.entity';
import {
  InventoryMovement,
  MovementType,
} from '../inventory-movements/entities/inventory-movement.entity';
import { User } from '../users/entities/user.entity';
import { ReportQueryDto, ReportType, ExportQueryDto } from './dto/report-query.dto';
import { ProductsService } from '../products/products.service';
import { InventoryMovementsService } from '../inventory-movements/inventory-movements.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Manufacturer)
    private manufacturerRepository: Repository<Manufacturer>,
    @InjectRepository(InventoryMovement)
    private movementRepository: Repository<InventoryMovement>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(forwardRef(() => ProductsService))
    private productsService: ProductsService,
    @Inject(forwardRef(() => InventoryMovementsService))
    private inventoryMovementsService: InventoryMovementsService
  ) {}

  async getDashboardStats(): Promise<any> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const salesSums = await this.movementRepository
      .createQueryBuilder('m')
      .select([
        `COALESCE(SUM(CASE WHEN m.type = 'saida' AND m.createdAt >= :today THEN m.quantity ELSE 0 END), 0) as vendas_hoje`,
        `COALESCE(SUM(CASE WHEN m.type = 'saida' AND m.createdAt >= :weekAgo THEN m.quantity ELSE 0 END), 0) as vendas_semana`,
        `COALESCE(SUM(CASE WHEN m.type = 'saida' AND m.createdAt >= :monthAgo THEN m.quantity ELSE 0 END), 0) as vendas_mes`,
      ])
      .setParameters({ today, weekAgo, monthAgo })
      .getRawOne();

    const vendasHoje = parseInt(salesSums?.vendas_hoje || '0', 10);
    const vendasSemana = parseInt(salesSums?.vendas_semana || '0', 10);
    const vendasMes = parseInt(salesSums?.vendas_mes || '0', 10);

    const bestDay = await this.movementRepository
      .createQueryBuilder('m')
      .select([
        `TO_CHAR(m.createdAt, 'YYYY-MM-DD') as date`,
        `SUM(m.quantity) as total`,
      ])
      .where("m.type = 'saida' AND m.createdAt >= :monthAgo", { monthAgo })
      .groupBy(`TO_CHAR(m.createdAt, 'YYYY-MM-DD')`)
      .orderBy('total', 'DESC')
      .limit(1)
      .getRawOne();

    const diaMaisVendas = bestDay
      ? { date: bestDay.date, total: parseInt(bestDay.total || '0', 10) }
      : null;

    const getTopProducts = async (since: Date) => {
      const rows = await this.movementRepository
        .createQueryBuilder('m')
        .innerJoin('m.product', 'p')
        .select([
          'p.id as id',
          'p.name as name',
          'SUM(m.quantity) as total',
        ])
        .where("m.type = 'saida' AND m.createdAt >= :since", { since })
        .groupBy('p.id, p.name')
        .orderBy('total', 'DESC')
        .limit(5)
        .getRawMany();

      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        total: parseInt(r.total || '0', 10),
        revenue: 0,
      }));
    };

    const [produtosHoje, produtosSemana, produtosMes] = await Promise.all([
      getTopProducts(today),
      getTopProducts(weekAgo),
      getTopProducts(monthAgo),
    ]);

    const lowStockProducts = await this.productRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.manufacturer', 'm')
      .where('p.stock <= COALESCE(p.minStock, 5)')
      .orderBy('m.name', 'ASC')
      .addOrderBy('p.stock', 'ASC')
      .getMany();

    const manufacturerMap = new Map<string, any>();
    for (const p of lowStockProducts) {
      const mId = p.manufacturer?.id || p.manufacturerId || 'sem-fabricante';
      if (!manufacturerMap.has(mId)) {
        manufacturerMap.set(mId, {
          manufacturer: p.manufacturer || { id: mId, name: 'Sem Fabricante' },
          products: [],
        });
      }
      manufacturerMap.get(mId).products.push({
        id: p.id,
        name: p.name,
        stock: p.stock,
        minStock: p.minStock,
        manufacturerName: p.manufacturer?.name || '',
      });
    }

    const estoqueBaixo = Array.from(manufacturerMap.values());

    return {
      vendasHoje,
      vendasSemana,
      vendasMes,
      diaMaisVendas,
      produtosHoje,
      produtosSemana,
      produtosMes,
      estoqueBaixo,
    };
  }

  async generateReport(query: ReportQueryDto): Promise<any> {
    switch (query.type) {
      case ReportType.STOCK_BY_MANUFACTURER:
        return this.getStockByManufacturer();
      case ReportType.LOW_STOCK:
        return this.getLowStockProducts(query.page, query.perPage);
      case ReportType.MOVEMENTS:
        return this.getMovements(query);
      case ReportType.PRODUCT_MOVEMENTS:
        if (!query.productId) {
          throw new NotFoundException('ProductId é obrigatório para product_movements');
        }
        return this.getProductMovements(query.productId, query.page, query.perPage);
      case ReportType.SALES_STATS:
        return this.getSalesStats(query.days || 30);
      default:
        throw new NotFoundException('Tipo de relatório não suportado');
    }
  }

  async exportReport(query: ExportQueryDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Relatório');

    let data: any[] = [];
    let headers: string[] = [];

    switch (query.type) {
      case ReportType.STOCK_BY_MANUFACTURER:
        data = await this.getStockByManufacturer();
        headers = [
          'Fabricante',
          'Total Produtos',
          'Total Estoque',
          'Estoque Baixo',
          'Estoque Zerado',
        ];
        break;
      case ReportType.LOW_STOCK:
        data = await this.getLowStockProducts(1, 10000);
        headers = ['Produto', 'Estoque Atual', 'Estoque Mínimo', 'Fabricante', 'Status'];
        break;
      case ReportType.MOVEMENTS:
        const movementsResult = await this.getMovements({
          type: ReportType.MOVEMENTS,
          page: 1,
          perPage: 10000,
          startDate: query.startDate,
          endDate: query.endDate,
          movementType: query.movementType,
        });
        data = movementsResult.data;
        headers = ['Data', 'Produto', 'Tipo', 'Quantidade', 'Usuário', 'Observações'];
        break;
      case ReportType.PRODUCT_MOVEMENTS:
        if (!query.productId) {
          throw new NotFoundException('ProductId é obrigatório');
        }
        const productMovements = await this.getProductMovements(query.productId, 1, 10000);
        data = productMovements.data;
        headers = ['Data', 'Produto', 'Tipo', 'Quantidade', 'Usuário', 'Observações'];
        break;
      case ReportType.SALES_STATS:
        const stats = await this.getSalesStats(30);
        data = [stats];
        headers = ['Total Entradas', 'Qtd Entrada', 'Total Saídas', 'Qtd Saída', 'Saldo Líquido'];
        break;
    }

    // Add headers
    worksheet.addRow(headers);

    // Style headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data
    for (const item of data) {
      let row: any[] = [];

      switch (query.type) {
        case ReportType.STOCK_BY_MANUFACTURER:
          row = [
            item.manufacturer_name,
            item.total_products,
            item.total_stock,
            item.low_stock_count,
            item.out_of_stock_count,
          ];
          break;
        case ReportType.LOW_STOCK:
          row = [item.name, item.stock, item.min_stock, item.manufacturer_name, item.stock_status];
          break;
        case ReportType.MOVEMENTS:
        case ReportType.PRODUCT_MOVEMENTS:
          row = [
            item.createdAt,
            item.productName,
            item.type === MovementType.ENTRY ? 'Entrada' : 'Saída',
            item.quantity,
            item.createdByName,
            item.notes || '',
          ];
          break;
        case ReportType.SALES_STATS:
          row = [
            item.totalEntries,
            item.totalQuantityEntered,
            item.totalExits,
            item.totalQuantityExited,
            item.netQuantity,
          ];
          break;
      }

      worksheet.addRow(row);
    }

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      column.width = Math.max(
        15,
        ...(column.values ? (column.values as any[]).map((v) => String(v).length) : [15])
      );
    });

    return workbook.xlsx.writeBuffer() as Promise<unknown> as Promise<Buffer>;
  }

  private async getStockByManufacturer(): Promise<any[]> {
    return this.productRepository
      .createQueryBuilder('p')
      .leftJoin('p.manufacturer', 'm')
      .select([
        'm.id as manufacturer_id',
        'm.name as manufacturer_name',
        'COUNT(p.id) as total_products',
        'COALESCE(SUM(p.stock), 0) as total_stock',
        'SUM(CASE WHEN p.stock <= p.minStock THEN 1 ELSE 0 END) as low_stock_count',
        'SUM(CASE WHEN p.stock = 0 THEN 1 ELSE 0 END) as out_of_stock_count',
      ])
      .groupBy('m.id, m.name')
      .orderBy('m.name')
      .getRawMany();
  }

  private async getLowStockProducts(page = 1, perPage = 20): Promise<any[]> {
    const products = await this.productRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.manufacturer', 'm')
      .where('p.stock <= COALESCE(p.minStock, 5)')
      .orderBy('m.name', 'ASC')
      .addOrderBy('p.stock', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      stock: product.stock,
      min_stock: product.minStock,
      manufacturer_name: product.manufacturer?.name || '',
      manufacturer_id: product.manufacturerId,
      stock_status: product.stockStatus,
    }));
  }

  private async getMovements(query: ReportQueryDto): Promise<any> {
    const { page = 1, perPage = 20, startDate, endDate, movementType } = query;

    const qb = this.movementRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.product', 'p')
      .leftJoinAndSelect('m.user', 'u');

    if (startDate) {
      qb.andWhere('m.createdAt >= :startDate', { startDate: new Date(startDate) });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('m.createdAt <= :endDate', { endDate: end });
    }

    if (movementType) {
      qb.andWhere('m.type = :movementType', { movementType });
    }

    qb.orderBy('m.createdAt', 'DESC')
      .skip((page - 1) * perPage)
      .take(perPage);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((movement) => ({
        id: movement.id,
        productId: movement.productId,
        productName: movement.product?.name || '',
        type: movement.type,
        quantity: movement.quantity,
        notes: movement.notes,
        createdAt: movement.createdAt,
        createdBy: movement.createdBy,
        createdByName: movement.user?.nome || '',
      })),
      total,
      page,
      perPage,
      lastPage: Math.ceil(total / perPage),
    };
  }

  private async getProductMovements(productId: string, page = 1, perPage = 20): Promise<any> {
    return this.inventoryMovementsService.getProductMovements(productId, page, perPage);
  }

  private async getSalesStats(days: number): Promise<any> {
    return this.inventoryMovementsService.getSalesStats(days);
  }

  async getInventoryReport(): Promise<any> {
    const products = await this.productRepository.find({
      relations: ['manufacturer'],
      order: { name: 'ASC' },
    });

    let totalStockUnits = 0;
    let totalValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const items = products.map((p) => {
      const stock = Number(p.stock) || 0;
      const minStock = Number(p.minStock) || 5;
      const estimatedUnitPrice = 50;
      const itemValuation = stock * estimatedUnitPrice;

      totalStockUnits += stock;
      totalValuation += itemValuation;

      let status: 'ok' | 'baixo' | 'zerado' = 'ok';
      if (stock === 0) {
        status = 'zerado';
        outOfStockCount++;
      } else if (stock <= minStock) {
        status = 'baixo';
        lowStockCount++;
      }

      return {
        id: p.id,
        name: p.name,
        manufacturerId: p.manufacturer?.id || p.manufacturerId || '',
        manufacturerName: p.manufacturer?.name || 'Sem Fabricante',
        stock,
        minStock,
        estimatedUnitPrice,
        totalValuation: itemValuation,
        status,
        lastUpdated: p.updatedAt,
      };
    });

    const totalProducts = products.length;
    const accuracyPercentage =
      totalProducts > 0
        ? Math.round(((totalProducts - outOfStockCount) / totalProducts) * 100)
        : 100;

    return {
      summary: {
        totalProducts,
        totalStockUnits,
        totalValuation,
        lowStockCount,
        outOfStockCount,
        accuracyPercentage,
      },
      items,
    };
  }

  async exportInventoryReport(format: string = 'csv'): Promise<Buffer> {
    const data = await this.getInventoryReport();
    const headers = 'ID,Produto,Fabricante,Estoque Atual,Estoque Minimo,Valor Unitario (R$),Valor Total (R$),Status\n';
    const rows = data.items
      .map(
        (i: any) =>
          `"${i.id}","${(i.name || '').replace(/"/g, '""')}","${(i.manufacturerName || '').replace(/"/g, '""')}",${i.stock},${i.minStock},${i.estimatedUnitPrice.toFixed(2)},${i.totalValuation.toFixed(2)},"${i.status}"`
      )
      .join('\n');
    return Buffer.from(headers + rows, 'utf-8');
  }
}
