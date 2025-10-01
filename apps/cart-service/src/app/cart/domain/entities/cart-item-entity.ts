import { CartItemId } from "../value-objects";

export interface ItemDetail {
  name: string;
  description?: string;
  image?: string;
  category: string;
  brand?: string;
  variants?: Record<string, unknown>;
  attributes?: Record<string, unknown>;
}

export class CartItem {
  constructor(
    public readonly id: CartItemId,
    public readonly cartId: string,
    public readonly skuId: string,
    public readonly productId: string,
    public readonly skuCode: string,
    public readonly quantity: number,
    public readonly price: number,
    public readonly image?: string,
    public readonly itemDetail?: ItemDetail,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    if (quantity <= 0) throw new Error("Quantity must be greater than zero");
    if (price < 0) throw new Error("Price must be non-negative");
  }

  // Factory methods
  static create(
    cartId: string,
    skuId: string,
    productId: string,
    skuCode: string,
    quantity: number,
    price: number,
    itemDetail?: ItemDetail,
    id?: string,
  ): CartItem {
    return new CartItem(
      new CartItemId(id),
      cartId,
      skuId,
      productId,
      skuCode,
      quantity,
      price,
      undefined,
      itemDetail,
      new Date(),
      new Date(),
    );
  }

  static fromExisting(params: {
    id: string;
    cartId: string;
    skuId: string;
    productId: string;
    skuCode: string;
    quantity: number;
    price: number;
    image?: string;
    itemDetail?: ItemDetail;
    createdAt?: Date;
    updatedAt?: Date;
  }): CartItem {
    return new CartItem(
      new CartItemId(params.id),
      params.cartId,
      params.skuId,
      params.productId,
      params.skuCode,
      params.quantity,
      params.price,
      params.image,
      params.itemDetail,
      params.createdAt ?? new Date(),
      params.updatedAt ?? new Date(),
    );
  }

  // Domain logic
  get totalPrice(): number {
    return this.quantity * this.price;
  }

  get itemName(): string {
    return this.itemDetail.name ?? "Unknown Item";
  }

  get itemImage(): string {
    return this.image || this.itemDetail.image || "default-image.png";
  }

  get itemCategory(): string {
    return this.itemDetail.category || "Uncategorized";
  }

  get itemBrand(): string {
    return this.itemDetail.brand || "Unknown Brand";
  }

  get itemVariants(): Record<string, unknown> | undefined {
    return this.itemDetail?.variants;
  }

  get itemAttributes(): Record<string, unknown> | undefined {
    return this.itemDetail?.attributes;
  }

  updateQuantity(newQuantity: number): CartItem {
    if (newQuantity <= 0) throw new Error("Quantity must be greater than zero");

    return new CartItem(
      this.id,
      this.cartId,
      this.skuId,
      this.productId,
      this.skuCode,
      newQuantity,
      this.price,
      this.image,
      this.itemDetail,
      this.createdAt,
      new Date(),
    );
  }

  equals(other: CartItem): boolean {
    if (!(other instanceof CartItem)) return false;
    return this.id.getValue() === other.id.getValue();
  }

  belongsToCart(cartId: string): boolean {
    return this.cartId === cartId;
  }

  isSameSku(skuId: string): boolean {
    return this.skuId === skuId;
  }

  isSameVariant(other: CartItem): boolean {
    if (this.skuId !== other.skuId) return false;

    const thisVariants = this.itemDetail?.variants;
    const otherVariants = other.itemDetail?.variants;

    if (!thisVariants && !otherVariants) return true;
    if (!thisVariants || !otherVariants) return false;

    const thisKeys = Object.keys(thisVariants);
    const otherKeys = Object.keys(otherVariants);

    if (thisKeys.length !== otherKeys.length) return false;

    return thisKeys.every(
      (key) => otherKeys.includes(key) && thisVariants[key] === otherVariants[key],
    );
  }

  hasVariant(): boolean {
    return !!(this.itemDetail?.variants && Object.keys(this.itemDetail.variants).length > 0);
  }

  getVariantDescription(): string {
    const variants = this.itemDetail?.variants;

    if (!variants || Object.keys(variants).length === 0) {
      return "No variants";
    }

    const descriptions = Object.entries(variants).map(([key, value]) => {
      if (value === null) return `${key}: null`;
      if (value === undefined) return `${key}: undefined`;
      if (typeof value === "string") return `${key}: ${value}`;
      if (typeof value === "number" || typeof value === "boolean") return `${key}: ${value}`;
      return `${key}: ${JSON.stringify(value)}`;
    });

    return descriptions.join(", ");
  }

  hasVariantKey(key: string): boolean {
    return !!this.itemDetail?.variants?.[key];
  }
}
