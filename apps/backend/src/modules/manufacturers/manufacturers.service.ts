import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Manufacturer } from './entities/manufacturer.entity';
import { CreateManufacturerDto } from './dto/create-manufacturer.dto';
import { UpdateManufacturerDto } from './dto/update-manufacturer.dto';
import {
  ManufacturerResponseDto,
  PaginatedManufacturersResponseDto,
  ManufacturerSelectDto,
} from './dto/manufacturer-response.dto';

@Injectable()
export class ManufacturersService {
  constructor(
    @InjectRepository(Manufacturer)
    private manufacturerRepository: Repository<Manufacturer>
  ) {}

  async findAll(page = 1, perPage = 20): Promise<PaginatedManufacturersResponseDto> {
    const [data, total] = await this.manufacturerRepository.findAndCount({
      order: { name: 'ASC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return {
      data: data.map((manufacturer) => this.toResponseDto(manufacturer)),
      total,
      page,
      perPage,
      lastPage: Math.ceil(total / perPage),
    };
  }

  async findAllForSelect(): Promise<ManufacturerSelectDto[]> {
    const manufacturers = await this.manufacturerRepository.find({
      select: ['id', 'name'],
      order: { name: 'ASC' },
    });

    return manufacturers.map((m) => ({ id: m.id, name: m.name }));
  }

  async findById(id: string): Promise<ManufacturerResponseDto> {
    const manufacturer = await this.manufacturerRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    if (!manufacturer) {
      throw new NotFoundException('Fabricante não encontrado');
    }

    return this.toResponseDto(manufacturer, true);
  }

  async create(createManufacturerDto: CreateManufacturerDto): Promise<ManufacturerResponseDto> {
    // Check if name already exists
    const existing = await this.manufacturerRepository.findOne({
      where: { name: createManufacturerDto.name },
    });

    if (existing) {
      throw new ConflictException('Fabricante com este nome já existe');
    }

    const manufacturer = this.manufacturerRepository.create(createManufacturerDto);
    const saved = await this.manufacturerRepository.save(manufacturer);

    return this.toResponseDto(saved);
  }

  async update(
    id: string,
    updateManufacturerDto: UpdateManufacturerDto
  ): Promise<ManufacturerResponseDto> {
    const manufacturer = await this.manufacturerRepository.findOne({ where: { id } });
    if (!manufacturer) {
      throw new NotFoundException('Fabricante não encontrado');
    }

    // Check if name already exists for another manufacturer
    if (updateManufacturerDto.name && updateManufacturerDto.name !== manufacturer.name) {
      const existing = await this.manufacturerRepository.findOne({
        where: { name: updateManufacturerDto.name },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Fabricante com este nome já existe');
      }
    }

    Object.assign(manufacturer, updateManufacturerDto);
    await this.manufacturerRepository.save(manufacturer);

    return this.toResponseDto(manufacturer);
  }

  async delete(id: string): Promise<void> {
    const manufacturer = await this.manufacturerRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    if (!manufacturer) {
      throw new NotFoundException('Fabricante não encontrado');
    }

    if (manufacturer.products && manufacturer.products.length > 0) {
      throw new BadRequestException('Não é possível excluir fabricante com produtos cadastrados');
    }

    await this.manufacturerRepository.remove(manufacturer);
  }

  private toResponseDto(manufacturer: Manufacturer, includeStats = false): ManufacturerResponseDto {
    const dto: ManufacturerResponseDto = {
      id: manufacturer.id,
      name: manufacturer.name,
      logoUrl: manufacturer.logoUrl,
      createdAt: manufacturer.createdAt,
      updatedAt: manufacturer.updatedAt,
    };

    if (includeStats && manufacturer.products) {
      dto.productCount = manufacturer.products.length;
      dto.totalStock = manufacturer.products.reduce((sum, p) => sum + p.stock, 0);
    }

    return dto;
  }
}
