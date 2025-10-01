import { Body, Controller, Delete, Get, Param, Post, UseGuards, HttpException, HttpStatus, Request, UseFilters } from "@nestjs/common";
import { CartService } from "./cart.service";
import { Cart } from "@nestcm/proto";
import { status as GrpcStatus } from "@grpc/grpc-js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { GrpcClientExceptionFilter } from "../common/filters/grpc-exception.filter";
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags
} from "@nestjs/swagger";

// Import clean DTOs and mapper
import {
    AddToCartDto,
    GetCartRequestDto, 
    AddToCartResponseDto,
    GetCartResponseDto
} from './dtos';
import { CartMapperService } from './mappers';

@ApiTags('Carts')
@ApiBearerAuth()
@UseFilters(GrpcClientExceptionFilter)
@Controller('carts')
export class CartController {
    constructor(
        private readonly cartService: CartService,
        private readonly mapper: CartMapperService
    ) { }

    /**
     * Get all carts (for admin/testing) - Clean!
     */
    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get all carts' })
    @ApiResponse({ status: 200, description: 'Return all carts' })
    async getAllCarts(): Promise<{ message: string, carts: any[] }> {
        // For now, return empty - implement later if needed
        return {
            message: 'Cart API is working! Use GET /api/carts/:userId to get specific cart',
            carts: []
        };
    }

    /**
     * Add item to cart - Clean!
     */
    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Add item to cart' })
    @ApiBody({ type: AddToCartDto }) 
    @ApiResponse({ status: 201, description: 'Item added to cart successfully', type: AddToCartResponseDto })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    async addToCart(@Body() dto: AddToCartDto, @Request() req: any): Promise<AddToCartResponseDto> {
        // Extract userId from JWT payload
        const userId = req.user?.sub || req.user?.userId || req.user?.id;

        if (!userId) {
            throw new HttpException('User ID not found in token', HttpStatus.UNAUTHORIZED);
        }

        // Override DTO userId with JWT userId
        const requestDto = { ...dto, userId };
        const protoReq = this.mapper.fromDtoToProto(requestDto);
        console.log('AddToCartRequest:', protoReq);

        try {
            const response = await this.cartService.addToCart(protoReq);

            if (!response.cart) {
                throw new HttpException(response.message ?? 'Failed to add item to cart', HttpStatus.INTERNAL_SERVER_ERROR);
            }

            return {
                cart: this.mapper.fromProtoToDto(response),
                message: response.message ?? 'Item added to cart',
            };
        } catch (error) {
            throw this.mapGrpcErrorToHttp(error);
        }
    }

    /**
     * Get my cart - Clean!
     */
    @Get('my-cart')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get my cart' })
    @ApiResponse({ status: 200, description: 'Return cart of the authenticated user', type: GetCartResponseDto })
    @ApiResponse({ status: 404, description: 'Cart not found' })
    async getMyCart(@Request() req: any): Promise<GetCartResponseDto> {
        // Extract userId from JWT payload
        const userId = req.user?.sub || req.user?.userId || req.user?.id;

        if (!userId) {
            throw new HttpException('User ID not found in token', HttpStatus.UNAUTHORIZED);
        }

        const cartReq: Cart.GetCartRequest = {
            userId
        };

        const response = await this.cartService.getCart(cartReq);
        return {
            cart: this.mapper.fromProtoToDto(response)
        };
    }

    /**
     * Delete cart - Clean!
     */
    @Delete(':cartId')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Delete cart by cart ID' })
    @ApiParam({ name: 'cartId', type: String, description: 'Cart ID' })
    @ApiResponse({ status: 200, description: 'Cart deleted successfully' })
    @ApiResponse({ status: 404, description: 'Cart not found' })
    async deleteCart(@Param('cartId') cartId: string): Promise<{ message: string }> {
        const req: Cart.DeleteCartRequest = {
            cartId,
        };

        await this.cartService.delete(req);
        return this.mapper.createEmptyResponse('Cart deleted successfully');
    }

    private mapGrpcErrorToHttp(error: any): HttpException {
        const code = typeof error?.code === 'number' ? error.code : undefined;
        const message = this.resolveErrorMessage(error);
        const invalidSkus = this.extractInvalidSkus(error);
        const payload = invalidSkus?.length ? { message, invalidSkus } : { message };

        switch (code) {
            case GrpcStatus.NOT_FOUND:
                return new HttpException(payload, HttpStatus.NOT_FOUND);
            case GrpcStatus.FAILED_PRECONDITION:
                return new HttpException(payload, HttpStatus.CONFLICT);
            case GrpcStatus.INVALID_ARGUMENT:
                return new HttpException(payload, HttpStatus.BAD_REQUEST);
            default:
                return new HttpException(payload, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private resolveErrorMessage(error: any): string {
        if (typeof error?.message === 'string' && error.message.trim().length > 0) {
            return error.message;
        }

        if (typeof error?.details === 'string' && error.details.trim().length > 0) {
            return error.details;
        }

        return 'Failed to add item to cart';
    }

    private extractInvalidSkus(error: any): string[] | undefined {
        const details = typeof error?.details === 'string' ? error.details : undefined;

        if (!details) {
            return undefined;
        }

        try {
            const parsed = JSON.parse(details);
            const invalidSkus = parsed?.invalidSkus;
            return Array.isArray(invalidSkus) ? invalidSkus : undefined;
        } catch {
            return undefined;
        }
    }
}

