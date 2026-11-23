import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { ManufacturersService } from './manufacturers.service';
import { CreateManufacturerDto } from './dto/create-manufacturer.dto';
import { UpdateManufacturerDto } from './dto/update-manufacturer.dto';
import {
  ManufacturerResponseDto,
  PaginatedManufacturersResponseDto,
  ManufacturerSelectDto,
} from './dto/manufacturer-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@/modules/users/entities/user.entity';

@ApiTags('manufacturers')
@Controller('manufacturers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ManufacturersController {
  constructor(private manufacturersService: ManufacturersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os fabricantes (paginado)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de fabricantes',
    type: PaginatedManufacturersResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'perPage', required: false, type: Number, example: 20 })
  async findAll(
    @Query('page') page = 1,
    @Query('perPage') perPage = 20
  ): Promise<PaginatedManufacturersResponseDto> {
    return this.manufacturersService.findAll(Number(page), Number(perPage));
  }

  @Get('select')
  @ApiOperation({ summary: 'Listar fabricantes para select (sem paginação)' })
  @ApiResponse({ status: 200, description: 'Lista de fabricantes', type: [ManufacturerSelectDto] })
  async findAllForSelect(): Promise<ManufacturerSelectDto[]> {
    return this.manufacturersService.findAllForSelect();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter fabricante por ID' })
  @ApiResponse({ status: 200, description: 'Fabricante encontrado', type: ManufacturerResponseDto })
  @ApiResponse({ status: 404, description: 'Fabricante não encontrado' })
  @ApiParam({ name: 'id', type: String, example: 'uuid-v4-string' })
  async findById(@Param('id') id: string): Promise<ManufacturerResponseDto> {
    return this.manufacturersService.findById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo fabricante (apenas admin)' })
  @ApiResponse({ status: 201, description: 'Fabricante criado', type: ManufacturerResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Fabricante já existe' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async create(
    @Body() createManufacturerDto: CreateManufacturerDto
  ): Promise<ManufacturerResponseDto> {
    return this.manufacturersService.create(createManufacturerDto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar fabricante (apenas admin)' })
  @ApiResponse({ status: 200, description: 'Fabricante atualizado', type: ManufacturerResponseDto })
  @ApiResponse({ status: 404, description: 'Fabricante não encontrado' })
  @ApiResponse({ status: 409, description: 'Fabricante já existe' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiParam({ name: 'id', type: String, example: 'uuid-v4-string' })
  async update(
    @Param('id') id: string,
    @Body() updateManufacturerDto: UpdateManufacturerDto
  ): Promise<ManufacturerResponseDto> {
    return this.manufacturersService.update(id, updateManufacturerDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir fabricante (apenas admin)' })
  @ApiResponse({ status: 204, description: 'Fabricante excluído' })
  @ApiResponse({ status: 404, description: 'Fabricante não encontrado' })
  @ApiResponse({ status: 400, description: 'Não é possível excluir fabricante com produtos' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiParam({ name: 'id', type: String, example: 'uuid-v4-string' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.manufacturersService.delete(id);
  }
}
