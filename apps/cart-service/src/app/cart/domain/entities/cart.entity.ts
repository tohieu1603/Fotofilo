import { CartId } from '../value-objects/cart-id.vo';
import { CartItem } from './cart-item-entity';

export class Cart {
  constructor(
    public readonly id: CartId,
    public readonly userId: string,
    private readonly _items: CartItem[] = [],
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  static create(userId: string, id?: string): Cart {
    return new Cart(
      new CartId(id),
      userId,
      [],
      new Date(),
      new Date()
    );
  }

  static fromExisting(params: {
    id: string;
    userId: string;
    items?: CartItem[];
    createdAt?: Date;
    updatedAt?: Date;
  }): Cart {
    return new Cart(
      new CartId(params.id),
      params.userId,
      params.items ?? [],
      params.createdAt ?? new Date(),
      params.updatedAt ?? new Date(),
    );
  }

  get items(): readonly CartItem[] {
    return this._items;
  }

  get itemsCount(): number {
    return this._items.length;
  }

  get totalQuantity(): number {
    return this._items.reduce((total, item) => total + item.quantity, 0);
  }

  get totalAmount(): number {
    return this._items.reduce((total, item) => total + item.totalPrice, 0);
  }

  addItem(cartItem: CartItem): Cart {
    const existingItemIndex = this._items.findIndex(
      item => item.skuId === cartItem.skuId
    );

    let newItems: CartItem[];
    
    if (existingItemIndex >= 0) {

      newItems = [...this._items];
      newItems[existingItemIndex] = this._items[existingItemIndex].updateQuantity(
        this._items[existingItemIndex].quantity + cartItem.quantity
      );
    } else {
      newItems = [...this._items, cartItem];
    }

    return new Cart(
      this.id,
      this.userId,
      newItems,
      this.createdAt,
      new Date()
    );
  }

  updateItemQuantity(skuId: string, quantity: number): Cart {
    if (quantity <= 0) {
      return this.removeItem(skuId);
    }

    const newItems = this._items.map(item =>
      item.skuId === skuId ? item.updateQuantity(quantity) : item
    );

    return new Cart(
      this.id,
      this.userId,
      newItems,
      this.createdAt,
      new Date()
    );
  }

  removeItem(skuId: string): Cart {
    const newItems = this._items.filter(item => item.skuId !== skuId);

    return new Cart(
      this.id,
      this.userId,
      newItems,
      this.createdAt,
      new Date()
    );
  }

  clearItems(): Cart {
    return new Cart(
      this.id,
      this.userId,
      [],
      this.createdAt,
      new Date()
    );
  }

  hasItem(skuId: string): boolean {
    return this._items.some(item => item.skuId === skuId);
  }

  getItem(skuId: string): CartItem | undefined {
    return this._items.find(item => item.skuId === skuId);
  }

  isEmpty(): boolean {
    return this._items.length === 0;
  }

  isOwnedBy(userId: string): boolean {
    return this.userId === userId;
  }
}