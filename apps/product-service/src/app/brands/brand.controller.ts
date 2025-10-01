import { Brand } from "@nestcm/proto";
import { Controller, Get, Post, Put, Delete, Body, Param } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { CreateBrandCommand } from "./application/commands/create-brand.command";
import { BrandMapper } from "./infrastructure/mappers/brand.mapper";
import { UpdateBrandCommand } from "./application/commands/update-brand.command";
import { DeleteBrandCommand } from "./application/commands/delete-brand.command";
import { GetBrandQuery } from "./application/queries/get-brand.query";
import { GetBrandsQuery } from "./application/queries/get-brands.query";


@Controller()
@Brand.BrandServiceControllerMethods()
export class BrandController implements Brand.BrandServiceController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus
    ) { }

    // gRPC method
    async createBrand(request: Brand.CreateBrandRequest): Promise<Brand.BrandResponse> {
        const command = new CreateBrandCommand(request.name, request.active)

        const brand = await this.commandBus.execute(command)

        return BrandMapper.toResponse(brand)
    }

    // REST endpoint for creating brand
    @Post('brands')
    async createBrandRest(@Body() body: { name: string; active: boolean }): Promise<Brand.BrandResponse> {
        const command = new CreateBrandCommand(body.name, body.active)
        const brand = await this.commandBus.execute(command)
        return BrandMapper.toResponse(brand)
    }

    // gRPC method
    async updateBrand(request: Brand.UpdateBrandRequest): Promise<Brand.BrandResponse> {
        const command = new UpdateBrandCommand(request.id, request.name, request.active)

        const brand = await this.commandBus.execute(command)

        return BrandMapper.toResponse(brand)
    }

    // REST endpoint for updating brand
    @Put('brands/:id')
    async updateBrandRest(@Param('id') id: string, @Body() body: { name?: string; active?: boolean }): Promise<Brand.BrandResponse> {
        const command = new UpdateBrandCommand(id, body.name, body.active)
        const brand = await this.commandBus.execute(command)
        return BrandMapper.toResponse(brand)
    }

    // gRPC method
    async deleteBrand(request: Brand.DeleteBrandRequest): Promise<Brand.BrandResponse> {
        const command = new DeleteBrandCommand(request.id)

        await this.commandBus.execute(command)

        return { id: request.id, name: '', active: false }
    }

    // REST endpoint for deleting brand
    @Delete('brands/:id')
    async deleteBrandRest(@Param('id') id: string): Promise<Brand.BrandResponse> {
        const command = new DeleteBrandCommand(id)
        await this.commandBus.execute(command)
        return { id, name: '', active: false }
    }

    // gRPC method
    async getBrand(request: Brand.GetBrandRequest): Promise<Brand.BrandResponse> {
        const { id } = request;

        const brand = await this.queryBus.execute(new GetBrandQuery(id))
        return BrandMapper.toResponse(brand)
    }

    // REST endpoint for getting brand by id
    @Get('brands/:id')
    async getBrandRest(@Param('id') id: string): Promise<Brand.BrandResponse> {
        const brand = await this.queryBus.execute(new GetBrandQuery(id))
        return BrandMapper.toResponse(brand)
    }

    // gRPC method
    async listBrand(request: Brand.ListBrandRequest): Promise<Brand.BrandListResponse> {
        const command = new GetBrandsQuery()

        const result = await this.queryBus.execute(command)

        return {
            brand: result.data.map(BrandMapper.toResponse),
            total: result.pagination.totalItems
        }
    }

    // REST endpoint for listing brands
    @Get('brands')
    async listBrandRest(): Promise<Brand.BrandResponse[]> {
        const command = new GetBrandsQuery()
        const result = await this.queryBus.execute(command)
        return result.data.map(BrandMapper.toResponse)
    }   
}
