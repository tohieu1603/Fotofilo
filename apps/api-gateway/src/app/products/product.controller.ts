import {
  CreateProductRequest,
  CreateProductResponse,
  DeleteProductRequest,
  DeleteProductResponse,
  GetAllProductsRequest,
  GetAllProductsResponse,
  GetProductRequest,
  GetProductResponse,
  UpdateProductRequest,
  UpdateProductResponse,
} from "@nestcm/proto";
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseFilters } from "@nestjs/common";
import { ProductService } from "./product.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { GetProductsQueryDto } from "./dto/get-products.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { GrpcClientExceptionFilter } from "../common/filters/grpc-exception.filter";



@Controller('products')
@UseFilters(new GrpcClientExceptionFilter())
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  async createProduct(@Body() body: CreateProductDto): Promise<CreateProductResponse> {
    const req: CreateProductRequest = body;
    return this.productService.createProduct(req);
  }

  @Get()
  async getProducts(@Query() query: GetProductsQueryDto): Promise<GetAllProductsResponse> {
    const req: GetAllProductsRequest = {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      keyword: query.keyword ?? '',
      brandId: query.brandId ?? '',
      categoryId: query.categoryId ?? '',
      sort: query.sort ?? '',
    };
    return this.productService.getProducts(req);
  }

  @Get(":id")
  async getProduct(@Param("id") id: string): Promise<GetProductResponse> {
    const req: GetProductRequest = { id };
    return this.productService.getProduct(req);
  }

  @Patch(":id")
  async updateProduct(
    @Param("id") id: string,
    @Body() body: UpdateProductDto,
  ): Promise<UpdateProductResponse> {
    const req: UpdateProductRequest = { id, ...body } as UpdateProductRequest;
    return this.productService.updateProduct(req);
  }

  @Delete(":id")
  async deleteProduct(@Param("id") id: string): Promise<DeleteProductResponse> {
    const req: DeleteProductRequest = { id };
    return this.productService.deleteProduct(req);
  }
}
