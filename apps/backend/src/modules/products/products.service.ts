import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';

import { Product } from './entities/product.entity';
import { Manufacturer } from '../manufacturers/entities/manufacturer.entity';
import {
  InventoryMovement,
  MovementType,
} from '../inventory-movements/entities/inventory-movement.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ProductQueryDto, StockFilter } from './dto/product-query.dto';
import {
  ProductResponseDto,
  PaginatedProductsResponseDto,
  LowStockProductResponseDto,
} from './dto/product-response.dto';
import { ManufacturersService } from '../manufacturers/manufacturers.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(InventoryMovement)
    private movementRepository: Repository<InventoryMovement>,
    @Inject(forwardRef(() => ManufacturersService))
    private manufacturersService: ManufacturersService
  ) {}

  async findAll(query: ProductQueryDto): Promise<PaginatedProductsResponseDto> {
    const { page = 1, perPage = 20, name, manufacturerId, stock } = query;

    const qb = this.productRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.manufacturer', 'm');

    if (name) {
      qb.andWhere('p.name ILIKE :name', { name: `%${name}%` });
    }

    if (manufacturerId) {
      qb.andWhere('p.manufacturerId = :manufacturerId', { manufacturerId });
    }

    if (stock) {
      switch (stock) {
        case StockFilter.LOW:
          qb.andWhere('p.stock <= p.minStock');
          break;
        case StockFilter.MEDIUM:
          qb.andWhere('p.stock > p.minStock AND p.stock <= (p.minStock * 2)');
          break;
        case StockFilter.HIGH:
          qb.andWhere('p.stock > (p.minStock * 2)');
          break;
      }
    }

    qb.orderBy('p.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((product) => this.toResponseDto(product)),
      total,
      page,
      perPage,
      lastPage: Math.ceil(total / perPage),
    };
  }

  async findById(id: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['manufacturer'],
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    return this.toResponseDto(product);
  }

  async findAllForSelect(): Promise<{ id: string; name: string; stock: number }[]> {
    return this.productRepository.find({
      select: ['id', 'name', 'stock'],
      order: { name: 'ASC' },
    });
  }

  async getLowStockProducts(): Promise<LowStockProductResponseDto[]> {
    const products = await this.productRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.manufacturer', 'm')
      .where('p.stock <= COALESCE(p.minStock, 5)')
      .orderBy('m.name', 'ASC')
      .addOrderBy('p.stock', 'ASC')
      .getMany();

    return products.map((product) => this.toLowStockResponseDto(product));
  }

  async getStockByManufacturer(): Promise<any[]> {
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

  async create(createProductDto: CreateProductDto, userId: number): Promise<ProductResponseDto> {
    // Validate manufacturer exists
    await this.manufacturersService.findById(createProductDto.manufacturerId);

    const product = this.productRepository.create({
      ...createProductDto,
    });

    const savedProduct = await this.productRepository.save(product);

    // Record initial stock movement if stock > 0
    if (createProductDto.stock > 0) {
      await this.recordMovement(
        savedProduct.id,
        MovementType.ENTRY,
        createProductDto.stock,
        'Estoque inicial',
        userId
      );
    }

    return this.findById(savedProduct.id);
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    userId: number
  ): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['manufacturer'],
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Validate manufacturer if changing
    if (
      updateProductDto.manufacturerId &&
      updateProductDto.manufacturerId !== product.manufacturerId
    ) {
      await this.manufacturersService.findById(updateProductDto.manufacturerId);
    }

    const oldStock = product.stock;
    Object.assign(product, updateProductDto);
    await this.productRepository.save(product);

    // Record stock movement if stock changed
    if (updateProductDto.stock !== undefined && updateProductDto.stock !== oldStock) {
      const diff = updateProductDto.stock - oldStock;
      const type = diff > 0 ? MovementType.ENTRY : MovementType.EXIT;
      await this.recordMovement(id, type, Math.abs(diff), 'Atualização de estoque', userId);
    }

    return this.findById(id);
  }

  async adjustStock(adjustStockDto: AdjustStockDto, userId: number): Promise<ProductResponseDto> {
    const { productId, stock, notes } = adjustStockDto;

    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    const oldStock = product.stock;
    const diff = stock - oldStock;

    if (diff === 0) {
      return this.findById(productId);
    }

    const type = diff > 0 ? MovementType.ENTRY : MovementType.EXIT;

    // Use transaction to ensure consistency
    await this.productRepository.manager.transaction(async (manager) => {
      // Lock the product row
      const lockedProduct = await manager
        .createQueryBuilder(Product, 'p')
        .setLock('pessimistic_write')
        .where('p.id = :productId', { productId })
        .getOne();

      if (!lockedProduct) {
        throw new NotFoundException('Produto não encontrado');
      }

      // Update stock
      await manager.update(Product, productId, { stock, updatedAt: new Date() });

      // Record movement
      const movement = manager.create(InventoryMovement, {
        productId,
        type,
        quantity: Math.abs(diff),
        notes: notes || 'Ajuste manual',
        createdBy: userId,
      });
      await manager.save(movement);
    });

    return this.findById(productId);
  }

  async delete(id: string): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['movements'],
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    if (product.movements && product.movements.length > 0) {
      throw new ConflictException('Não é possível excluir produto com movimentações registradas');
    }

    // Delete image file if exists
    if (product.imageUrl) {
      // TODO: Delete file from storage
    }

    await this.productRepository.remove(product);
  }

  async getProductMovements(
    productId: string,
    page = 1,
    perPage = 20
  ): Promise<{ data: any[]; total: number; page: number; perPage: number; lastPage: number }> {
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    const [data, total] = await this.movementRepository.findAndCount({
      where: { productId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
      relations: ['user'],
    });

    return {
      data: data.map((movement) => ({
        id: movement.id,
        type: movement.type,
        quantity: movement.quantity,
        notes: movement.notes,
        createdAt: movement.createdAt,
        createdBy: movement.createdBy,
        userName: movement.user?.nome,
      })),
      total,
      page,
      perPage,
      lastPage: Math.ceil(total / perPage),
    };
  }

  private async recordMovement(
    productId: string,
    type: MovementType,
    quantity: number,
    notes: string,
    userId: number
  ): Promise<void> {
    const movement = this.movementRepository.create({
      productId,
      type,
      quantity,
      notes,
      createdBy: userId,
    });

    await this.movementRepository.save(movement);
  }

  private toResponseDto(product: Product): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      manufacturerId: product.manufacturerId,
      manufacturerName: product.manufacturer?.name || '',
      manufacturerLogo: product.manufacturer?.logoUrl || null,
      stock: product.stock,
      minStock: product.minStock,
      imageUrl: product.imageUrl,
      stockStatus: product.stockStatus,
      isLowStock: product.isLowStock,
      isOutOfStock: product.isOutOfStock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private toLowStockResponseDto(product: Product): LowStockProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      stock: product.stock,
      minStock: product.minStock,
      manufacturerName: product.manufacturer?.name || '',
      manufacturerId: product.manufacturerId,
      stockStatus: product.stockStatus,
    };
  }
}
