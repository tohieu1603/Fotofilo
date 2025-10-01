# Order Service - DDD Domain Layer

## Completed Implementation

### Value Objects
- ✅ **OrderId**: UUID-based identifier with validation
- ✅ **OrderDetailId**: UUID-based identifier for order line items  
- ✅ **OrderStatus**: Enum-based status with business rules
- ✅ **PaymentStatus**: Payment state management with transition rules
- ✅ **Money**: Currency-aware monetary values with operations
- ✅ **ShippingAddress**: Comprehensive address with validation
- ✅ **ProductDetail**: Product information value object

### Domain Entities
- ✅ **Order** (Aggregate Root): 
  - Complete business logic for order lifecycle
  - Immutable design with method chaining for state changes
  - Status transitions (pending → confirmed → shipped → delivered)
  - Payment status management
  - Order details management (add/remove/update)
  - Subtotal and total calculation
  - Shipping address updates
  - Business rule validations

- ✅ **OrderDetail**: 
  - Order line item with quantity and pricing
  - Product detail association
  - Price calculation methods
  - Immutable updates

### Key Features Implemented

#### Business Logic
- Order state transitions with validation
- Payment status management
- Automatic total calculation
- Item quantity management
- Business rule enforcement

#### DDD Patterns
- Value Objects for all primitive types
- Aggregate Root pattern (Order)
- Immutable entities with method chaining
- Rich domain models with behavior
- Encapsulation of business rules

#### Validation & Error Handling
- UUID validation for IDs
- Currency validation for Money
- Phone number validation for addresses
- Business rule validations (e.g., cannot ship unpaid orders)
- Input validation in all value objects

### Usage Examples

```typescript
// Create new order
const order = Order.create({
  userId: 'user-123',
  code: 'ORD-001',
  shippingAddress: new ShippingAddress({...}),
  receiverName: 'John Doe',
  receiverPhone: '0901234567',
  orderDetails: [orderDetail1, orderDetail2],
  shippingFee: new Money(30000, 'VND')
});

// Order lifecycle
const confirmed = order.confirm();
const paid = confirmed.markAsPaid();
const shipped = paid.ship();
const delivered = shipped.deliver();

// Order modifications (only when pending)
const updated = order
  .addOrderDetail(newDetail)
  .updateOrderDetailQuantity(detailId, 3)
  .updateShippingFee(new Money(50000, 'VND'));
```

### Next Steps
1. Implement repositories (infrastructure layer)
2. Add application services
3. Create DTOs and mappers
4. Add domain events
5. Implement persistence layer
6. Add unit tests

### File Structure
```
domain/
├── entities/
│   ├── order-entity.ts      # Order aggregate root
│   ├── order-detail.entity.ts  # Order line item
│   └── index.ts             # Barrel exports
└── value-objects/
    ├── order-id.vo.ts       # Order identifier
    ├── order-detail-id.vo.ts # Detail identifier  
    ├── order-status.vo.ts   # Order status enum
    ├── payment-status.vo.ts # Payment status enum
    ├── money.vo.ts          # Monetary values
    ├── shipping-address.vo.ts # Address information
    ├── product-detail.vo.ts # Product information
    └── index.ts             # Barrel exports
```

## Architecture Notes

This implementation follows Domain-Driven Design (DDD) principles:

1. **Value Objects**: Immutable objects that represent concepts without identity
2. **Entities**: Objects with identity that can change over time
3. **Aggregate Root**: Order entity that controls access to the aggregate
4. **Business Logic**: Encapsulated within the domain layer
5. **Immutability**: All changes return new instances rather than mutating state

The design ensures:
- Data consistency through aggregates
- Business rule enforcement at domain level  
- Rich, expressive domain model
- Type safety through TypeScript
- Clear separation of concerns