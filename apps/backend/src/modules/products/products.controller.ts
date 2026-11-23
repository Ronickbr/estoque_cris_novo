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

import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import {
  ProductResponseDto,
  PaginatedProductsResponseDto,
  LowStockProductResponseDto,
} from './dto/product-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '@/modules/users/entities/user.entity';

@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar produtos com filtros e paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista de produtos',
    type: PaginatedProductsResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'perPage', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'name', required: false, type: String, example: 'Galaxy' })
  @ApiQuery({ name: 'manufacturerId', required: false, type: String, example: 'uuid' })
  @ApiQuery({ name: 'stock', required: false, enum: ['low', 'medium', 'high'] })
  async findAll(@Query() query: ProductQueryDto): Promise<PaginatedProductsResponseDto> {
    return this.productsService.findAll(query);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Listar produtos com estoque baixo' })
  @ApiResponse({
    status: 200,
    description: 'Produtos com estoque baixo',
    type: [LowStockProductResponseDto],
  })
  async getLowStock(): Promise<LowStockProductResponseDto[]> {
    return this.productsService.getLowStockProducts();
  }

  @Get('stock-by-manufacturer')
  @ApiOperation({ summary: 'Relatório de estoque por fabricante' })
  @ApiResponse({ status: 200, description: 'Estoque por fabricante' })
  async getStockByManufacturer(): Promise<any[]> {
    return this.productsService.getStockByManufacturer();
  }

  @Get('select')
  @ApiOperation({ summary: 'Listar produtos para select (sem paginação)' })
  @ApiResponse({ status: 200, description: 'Lista de produtos' })
  async findAllForSelect(): Promise<{ id: string; name: string; stock: number }[]> {
    return this.productsService.findAllForSelect();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter produto por ID' })
  @ApiResponse({ status: 200, description: 'Produto encontrado', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @ApiParam({ name: 'id', type: String, example: 'uuid-v4-string' })
  async findById(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.productsService.findById(id);
  }

  @Get(':id/movements')
  @ApiOperation({ summary: 'Obter movimentações de um produto' })
  @ApiResponse({ status: 200, description: 'Movimentações do produto' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @ApiParam({ name: 'id', type: String, example: 'uuid-v4-string' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'perPage', required: false, type: Number, example: 20 })
  async getMovements(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('perPage') perPage = 20
  ) {
    return this.productsService.getProductMovements(id, Number(page), Number(perPage));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo produto' })
  @ApiResponse({ status: 201, description: 'Produto criado', type: ProductResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Fabricante não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: User
  ): Promise<ProductResponseDto> {
    return this.productsService.create(createProductDto, user.id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Atualizar produto' })
  @ApiResponse({ status: 200, description: 'Produto atualizado', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Produto ou fabricante não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiParam({ name: 'id', type: String, example: 'uuid-v4-string' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: User
  ): Promise<ProductResponseDto> {
    return this.productsService.update(id, updateProductDto, user.id);
  }

  @Post('adjust-stock')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ajuste rápido de estoque' })
  @ApiResponse({ status: 200, description: 'Estoque ajustado', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async adjustStock(
    @Body() adjustStockDto: AdjustStockDto,
    @CurrentUser() user: User
  ): Promise<ProductResponseDto> {
    return this.productsService.adjustStock(adjustStockDto, user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir produto (apenas admin)' })
  @ApiResponse({ status: 204, description: 'Produto excluído' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @ApiResponse({ status: 400, description: 'Não é possível excluir produto com movimentações' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiParam({ name: 'id', type: String, example: 'uuid-v4-string' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.productsService.delete(id);
  }
}
