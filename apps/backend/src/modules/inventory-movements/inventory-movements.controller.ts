import {
  Controller,
  Get,
  Post,
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

import { InventoryMovementsService } from './inventory-movements.service';
import { CreateMovementDto, CreateBatchMovementDto } from './dto/create-movement.dto';
import { MovementQueryDto } from './dto/movement-query.dto';
import {
  MovementResponseDto,
  PaginatedMovementsResponseDto,
  SalesStatsResponseDto,
} from './dto/movement-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '@/modules/users/entities/user.entity';

@ApiTags('inventory-movements')
@Controller('inventory-movements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryMovementsController {
  constructor(private inventoryMovementsService: InventoryMovementsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar movimentações com filtros e paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista de movimentações',
    type: PaginatedMovementsResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'perPage', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'productId', required: false, type: String, example: 'uuid' })
  @ApiQuery({ name: 'type', required: false, enum: ['entrada', 'saida'] })
  @ApiQuery({ name: 'createdBy', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'startDate', required: false, type: String, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, example: '2024-01-31' })
  async findAll(@Query() query: MovementQueryDto): Promise<PaginatedMovementsResponseDto> {
    return this.inventoryMovementsService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas de vendas' })
  @ApiResponse({ status: 200, description: 'Estatísticas de vendas', type: SalesStatsResponseDto })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 30 })
  async getSalesStats(@Query('days') days = 30): Promise<SalesStatsResponseDto> {
    return this.inventoryMovementsService.getSalesStats(Number(days));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter movimentação por ID' })
  @ApiResponse({ status: 200, description: 'Movimentação encontrada', type: MovementResponseDto })
  @ApiResponse({ status: 404, description: 'Movimentação não encontrada' })
  @ApiParam({ name: 'id', type: String, example: 'uuid-v4-string' })
  async findById(@Param('id') id: string): Promise<MovementResponseDto> {
    return this.inventoryMovementsService.findById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar movimentação de estoque' })
  @ApiResponse({ status: 201, description: 'Movimentação registrada', type: MovementResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou estoque insuficiente' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async create(
    @Body() createMovementDto: CreateMovementDto,
    @CurrentUser() user: User
  ): Promise<MovementResponseDto> {
    return this.inventoryMovementsService.create(createMovementDto, user.id);
  }

  @Post('batch')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar múltiplas movimentações' })
  @ApiResponse({
    status: 201,
    description: 'Movimentações registradas',
    type: [MovementResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou estoque insuficiente' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async createBatch(
    @Body() createBatchDto: CreateBatchMovementDto,
    @CurrentUser() user: User
  ): Promise<MovementResponseDto[]> {
    return this.inventoryMovementsService.createBatch(createBatchDto, user.id);
  }
}
