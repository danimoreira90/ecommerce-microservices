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
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductUseCase } from '../../application/use-cases/create-product/create-product.use-case';
import { GetProductUseCase } from '../../application/use-cases/get-product/get-product.use-case';
import { ListProductsUseCase } from '../../application/use-cases/list-products/list-products.use-case';
import { UpdateProductUseCase } from '../../application/use-cases/update-product/update-product.use-case';
import { DeleteProductUseCase } from '../../application/use-cases/delete-product/delete-product.use-case';
import { AdjustInventoryUseCase } from '../../application/use-cases/adjust-inventory/adjust-inventory.use-case';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CorrelationId } from '../decorators/correlation-id.decorator';
import { CreateProductRequestDto } from '../dto/create-product.request.dto';
import { UpdateProductRequestDto } from '../dto/update-product.request.dto';
import { AdjustInventoryRequestDto } from '../dto/adjust-inventory.request.dto';

@Controller('api/v1/products')
export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly getProductUseCase: GetProductUseCase,
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
    private readonly adjustInventoryUseCase: AdjustInventoryUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateProductRequestDto,
    @CorrelationId() correlationId: string,
  ) {
    const result = await this.createProductUseCase.execute({
      ...dto,
      correlationId,
    });
    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }
    const product = result.value;
    return {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      stock: product.stock,
    };
  }

  @Get()
  async list(
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('active') active?: string,
    @CorrelationId() correlationId?: string,
  ) {
    const result = await this.listProductsUseCase.execute({
      category,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
      active: active === undefined ? undefined : active === 'true',
      correlationId,
    });
    const { products, total } = result.value;
    return {
      products: products.map((p) => this.toProductResponse(p)),
      total,
    };
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
    @CorrelationId() correlationId: string,
  ) {
    const result = await this.getProductUseCase.execute({ id, correlationId });
    if (result.isFailure) {
      throw new NotFoundException(result.error);
    }
    const product = result.value;
    return this.toProductResponse(product);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductRequestDto,
    @CorrelationId() correlationId: string,
  ) {
    const result = await this.updateProductUseCase.execute({
      id,
      ...dto,
      correlationId,
    });
    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }
    return { message: 'Product updated successfully' };
  }

  @Put(':id/inventory')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async adjustInventory(
    @Param('id') id: string,
    @Body() dto: AdjustInventoryRequestDto,
    @CorrelationId() correlationId: string,
  ) {
    const result = await this.adjustInventoryUseCase.execute({
      productId: id,
      delta: dto.delta,
      correlationId,
    });
    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }
    return { message: 'Inventory adjusted successfully' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id') id: string,
    @CorrelationId() correlationId: string,
  ) {
    const result = await this.deleteProductUseCase.execute({ id, correlationId });
    if (result.isFailure) {
      throw new NotFoundException(result.error);
    }
  }

  private toProductResponse(product: {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    sku: string;
    category: string;
    imageUrls: string[];
    active: boolean;
  }) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      sku: product.sku,
      category: product.category,
      imageUrls: product.imageUrls,
      active: product.active,
    };
  }
}
