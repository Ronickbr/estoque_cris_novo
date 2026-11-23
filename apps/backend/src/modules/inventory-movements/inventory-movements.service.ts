import {
  Injectable,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';

import { InventoryMovement, MovementType } from './entities/inventory-movement.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { CreateMovementDto, CreateBatchMovementDto } from './dto/create-movement.dto';
import { MovementQueryDto } from './dto/movement-query.dto';
import {
  MovementResponseDto,
  PaginatedMovementsResponseDto,
  SalesStatsResponseDto,
} from './dto/movement-response.dto';
import { ProductsService } from '../products/products.service';

@Injectable()
export class InventoryMovementsService {
  constructor(
    @InjectRepository(InventoryMovement)
    private movementRepository: Repository<InventoryMovement>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @Inject(forwardRef(() => ProductsService))
    private productsService: ProductsService
  ) {}

  async findAll(query: MovementQueryDto): Promise<PaginatedMovementsResponseDto> {
    const { page = 1, perPage = 20, productId, type, createdBy, startDate, endDate } = query;

    const qb = this.movementRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.product', 'p')
      .leftJoinAndSelect('m.user', 'u');

    if (productId) {
      qb.andWhere('m.productId = :productId', { productId });
    }

    if (type) {
      qb.andWhere('m.type = :type', { type });
    }

    if (createdBy) {
      qb.andWhere('m.createdBy = :createdBy', { createdBy });
    }

    if (startDate) {
      qb.andWhere('m.createdAt >= :startDate', { startDate: new Date(startDate) });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('m.createdAt <= :endDate', { endDate: end });
    }

    qb.orderBy('m.createdAt', 'DESC')
      .skip((page - 1) * perPage)
      .take(perPage);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((movement) => this.toResponseDto(movement)),
      total,
      page,
      perPage,
      lastPage: Math.ceil(total / perPage),
    };
  }

  async findById(id: string): Promise<MovementResponseDto> {
    const movement = await this.movementRepository.findOne({
      where: { id },
      relations: ['product', 'user'],
    });

    if (!movement) {
      throw new NotFoundException('Movimentação não encontrada');
    }

    return this.toResponseDto(movement);
  }

  async create(createMovementDto: CreateMovementDto, userId: number): Promise<MovementResponseDto> {
    const { productId, type, quantity, notes } = createMovementDto;

    return this.movementRepository.manager.transaction(async (manager) => {
      // Lock product row for update
      const product = await manager
        .createQueryBuilder(Product, 'p')
        .setLock('pessimistic_write')
        .where('p.id = :productId', { productId })
        .getOne();

      if (!product) {
        throw new NotFoundException('Produto não encontrado');
      }

      // Validate stock for exit
      if (type === MovementType.EXIT && product.stock < quantity) {
        throw new BadRequestException(
          `Estoque insuficiente. Disponível: ${product.stock}, Solicitado: ${quantity}`
        );
      }

      // Update product stock
      const newStock =
        type === MovementType.ENTRY ? product.stock + quantity : product.stock - quantity;

      await manager.update(Product, productId, { stock: newStock, updatedAt: new Date() });

      // Create movement
      const movement = manager.create(InventoryMovement, {
        productId,
        type,
        quantity,
        notes: notes || null,
        createdBy: userId,
      });

      const savedMovement = await manager.save(movement);

      // Reload with relations
      const result = await manager.findOne(InventoryMovement, {
        where: { id: savedMovement.id },
        relations: ['product', 'user'],
      });

      return this.toResponseDto(result!);
    });
  }

  async createBatch(
    createBatchDto: CreateBatchMovementDto,
    userId: number
  ): Promise<MovementResponseDto[]> {
    const movements = createBatchDto.movements;

    // Validate all products first
    const productIds = [...new Set(movements.map((m) => m.productId))];
    const products = await this.productRepository.findByIds(productIds);

    if (products.length !== productIds.length) {
      throw new NotFoundException('Um ou mais produtos não encontrados');
    }

    // Check stock for all exits
    for (const movement of movements) {
      if (movement.type === MovementType.EXIT) {
        const product = products.find((p) => p.id === movement.productId);
        if (!product || product.stock < movement.quantity) {
          throw new BadRequestException(
            `Estoque insuficiente para produto ${movement.productId}. Disponível: ${product?.stock || 0}, Solicitado: ${movement.quantity}`
          );
        }
      }
    }

    // Process in transaction
    return this.movementRepository.manager.transaction(async (manager) => {
      const results: MovementResponseDto[] = [];

      for (const movementDto of movements) {
        const product = await manager
          .createQueryBuilder(Product, 'p')
          .setLock('pessimistic_write')
          .where('p.id = :productId', { productId: movementDto.productId })
          .getOne();

        if (!product) {
          throw new NotFoundException(`Produto ${movementDto.productId} não encontrado`);
        }

        const newStock =
          movementDto.type === MovementType.ENTRY
            ? product.stock + movementDto.quantity
            : product.stock - movementDto.quantity;

        await manager.update(Product, movementDto.productId, {
          stock: newStock,
          updatedAt: new Date(),
        });

        const movement = manager.create(InventoryMovement, {
          productId: movementDto.productId,
          type: movementDto.type,
          quantity: movementDto.quantity,
          notes: movementDto.notes || null,
          createdBy: userId,
        });

        const savedMovement = await manager.save(movement);
        const result = await manager.findOne(InventoryMovement, {
          where: { id: savedMovement.id },
          relations: ['product', 'user'],
        });

        results.push(this.toResponseDto(result!));
      }

      return results;
    });
  }

  async getSalesStats(days = 30): Promise<SalesStatsResponseDto> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.movementRepository
      .createQueryBuilder('m')
      .select([
        'SUM(CASE WHEN m.type = :entry THEN 1 ELSE 0 END) as totalEntries',
        'SUM(CASE WHEN m.type = :entry THEN m.quantity ELSE 0 END) as totalQuantityEntered',
        'SUM(CASE WHEN m.type = :exit THEN 1 ELSE 0 END) as totalExits',
        'SUM(CASE WHEN m.type = :exit THEN m.quantity ELSE 0 END) as totalQuantityExited',
      ])
      .setParameters({
        entry: MovementType.ENTRY,
        exit: MovementType.EXIT,
      })
      .where('m.createdAt >= :startDate', { startDate })
      .getRawOne();

    const totalEntries = parseInt(stats.totalEntries || '0', 10);
    const totalQuantityEntered = parseInt(stats.totalQuantityEntered || '0', 10);
    const totalExits = parseInt(stats.totalExits || '0', 10);
    const totalQuantityExited = parseInt(stats.totalQuantityExited || '0', 10);

    return {
      totalEntries,
      totalQuantityEntered,
      totalExits,
      totalQuantityExited,
      netQuantity: totalQuantityEntered - totalQuantityExited,
    };
  }

  async getProductMovements(
    productId: string,
    page = 1,
    perPage = 20
  ): Promise<PaginatedMovementsResponseDto> {
    return this.findAll({ productId, page, perPage });
  }

  private toResponseDto(movement: InventoryMovement): MovementResponseDto {
    return {
      id: movement.id,
      productId: movement.productId,
      productName: movement.product?.name || '',
      type: movement.type,
      quantity: movement.quantity,
      notes: movement.notes,
      createdBy: movement.createdBy,
      createdByName: movement.user?.nome || '',
      createdAt: movement.createdAt,
    };
  }
}
