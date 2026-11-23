import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Geral', active: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 2, name: 'Smartphones & Telefonia', active: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 3, name: 'Acessórios & Cabos', active: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 4, name: 'Capas & Películas', active: true, createdAt: new Date(), updatedAt: new Date() },
];

@ApiTags('categories')
@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoriesController {
  @Get()
  @ApiOperation({ summary: 'Listar categorias' })
  getCategories() {
    return DEFAULT_CATEGORIES;
  }

  @Post()
  @ApiOperation({ summary: 'Criar categoria' })
  createCategory(@Body() body: { name: string; description?: string }) {
    const newCat = {
      id: DEFAULT_CATEGORIES.length + 1,
      name: body.name,
      description: body.description,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    DEFAULT_CATEGORIES.push(newCat);
    return newCat;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar categoria' })
  updateCategory(@Param('id') id: string, @Body() body: any) {
    const cat = DEFAULT_CATEGORIES.find((c) => c.id === Number(id));
    if (cat) {
      Object.assign(cat, body, { updatedAt: new Date() });
      return cat;
    }
    return { id: Number(id), ...body, updatedAt: new Date() };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir categoria' })
  deleteCategory(@Param('id') id: string) {
    return { success: true };
  }
}
