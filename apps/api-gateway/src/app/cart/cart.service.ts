import { Cart, Metadata } from "@nestcm/proto";
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { from, lastValueFrom, timeout } from "rxjs";

@Injectable()
export class CartService implements OnModuleInit {
    private cartService: Cart.CartServiceClient;

    constructor(
        @Inject(Cart.CART_PACKAGE_NAME) private readonly client: ClientGrpc
    ) { }
    onModuleInit() {
        this.cartService = this.client.getService<Cart.CartServiceClient>(Cart.CART_SERVICE_NAME);
    }
    async addToCart(request: Cart.AddToCartRequest): Promise<Cart.AddToCartResponse> {
        return lastValueFrom(from(this.cartService.addToCart(request, new Metadata()).pipe(timeout(5000))));
    }
    async getCart(request: Cart.GetCartRequest): Promise<Cart.GetCartResponse> {
        return lastValueFrom(from(this.cartService.getCart(request, new Metadata()
        ).pipe(timeout(5000))));
    }
    async delete(request: Cart.DeleteCartRequest): Promise<Cart.DeleteCartResponse> {
        return lastValueFrom(from(this.cartService.deleteCart(request, new Metadata()
        ).pipe(timeout(5000))));
    }
}