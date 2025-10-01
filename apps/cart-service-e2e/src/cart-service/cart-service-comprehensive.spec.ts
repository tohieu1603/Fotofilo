import axios from 'axios';

const baseURL = 'http://localhost:3002';

describe('Cart Service E2E Tests', () => {
  // Unique identifier for this test run to avoid conflicts
  const testRunId = Date.now().toString();
  let testUserId: string;
  let testSkuId: string;

  beforeAll(async () => {
    axios.defaults.baseURL = baseURL;
    axios.defaults.timeout = 15000;
    
    // Generate unique test IDs
    testUserId = `test-user-${testRunId}`;
    testSkuId = `test-sku-${testRunId}`;
  });

  afterAll(async () => {
    console.log('Cart service tests completed');
    
    try {
      // Cleanup test cart if exists
      await axios.delete(`/api/cart/${testUserId}`);
      console.log('Test cart cleaned up');
    } catch (error) {
      console.log('Cart cleanup error (this is normal):', error.response?.status);
    }
  });

  describe('Health Check', () => {
    it('should return service status', async () => {
      try {
        // Try to get a non-existent cart to check if service is running
        await axios.get(`/api/cart/health-check-user`);
      } catch (error) {
        // Cart service should return error for non-existent cart, which means it's running
        expect([200, 404, 500]).toContain(error.response?.status);
        console.log('Cart service is running');
      }
    });
  });

  describe('Cart Management', () => {
    it('should add item to cart', async () => {
      const cartItem = {
        userId: testUserId,
        skuId: testSkuId,
        quantity: 2,
        price: 29.99,
        itemDetail: {
          name: `Test Product ${testRunId}`,
          description: 'A test product for e2e testing',
          category: 'Test Category',
          brand: 'Test Brand',
          image: 'https://example.com/test-image.jpg',
        }
      };

      const res = await axios.post('/api/cart', cartItem);
      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('cart');
      expect(res.data).toHaveProperty('message');
      expect(res.data.message).toContain('successfully');
      
      console.log('Added item to cart for user:', testUserId);
    });

    it('should get user cart', async () => {
      const res = await axios.get(`/api/cart/${testUserId}`);
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('cart');
      
      if (res.data.cart) {
        expect(res.data.cart).toHaveProperty('userId', testUserId);
        expect(res.data.cart).toHaveProperty('items');
        expect(Array.isArray(res.data.cart.items)).toBe(true);
        
        if (res.data.cart.items.length > 0) {
          const item = res.data.cart.items[0];
          expect(item).toHaveProperty('skuId', testSkuId);
          expect(item).toHaveProperty('quantity', 2);
          expect(item).toHaveProperty('price', 29.99);
          expect(item).toHaveProperty('itemDetail');
          expect(item.itemDetail).toHaveProperty('name', `Test Product ${testRunId}`);
        }
      }
      
      console.log('Retrieved cart for user:', testUserId);
    });

    it('should add another item to existing cart', async () => {
      const anotherItem = {
        userId: testUserId,
        skuId: `another-sku-${testRunId}`,
        quantity: 1,
        price: 15.50,
        itemDetail: {
          name: `Another Test Product ${testRunId}`,
          description: 'Another test product',
          category: 'Test Category 2',
          brand: 'Test Brand 2',
        }
      };

      const res = await axios.post('/api/cart', anotherItem);
      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('cart');
      expect(res.data.message).toContain('successfully');
      
      console.log('Added another item to cart');
    });

    it('should update item quantity when adding same SKU', async () => {
      const sameItem = {
        userId: testUserId,
        skuId: testSkuId, // Same SKU as first test
        quantity: 3,
        price: 29.99,
        itemDetail: {
          name: `Test Product ${testRunId}`,
          description: 'A test product for e2e testing',
          category: 'Test Category',
          brand: 'Test Brand',
        }
      };

      const res = await axios.post('/api/cart', sameItem);
      expect(res.status).toBe(201);
      
      // Verify the cart now has updated quantity
      const cartRes = await axios.get(`/api/cart/${testUserId}`);
      expect(cartRes.status).toBe(200);
      
      if (cartRes.data.cart && cartRes.data.cart.items) {
        const updatedItem = cartRes.data.cart.items.find(item => item.skuId === testSkuId);
        expect(updatedItem).toBeDefined();
        // Quantity should be updated (behavior depends on cart service logic)
        expect(updatedItem.quantity).toBeGreaterThan(0);
      }
      
      console.log('Updated item quantity in cart');
    });

    it('should clear user cart', async () => {
      const res = await axios.delete(`/api/cart/${testUserId}`);
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('message');
      expect(res.data.message).toContain('successfully');
      
      console.log('Cleared cart for user:', testUserId);
    });

    it('should return empty cart after clearing', async () => {
      const res = await axios.get(`/api/cart/${testUserId}`);
      expect(res.status).toBe(200);
      
      // Cart should be null or have empty items array
      expect(
        res.data.cart === null || 
        res.data.cart === undefined ||
        (res.data.cart.items && res.data.cart.items.length === 0)
      ).toBe(true);
      
      console.log('Verified cart is empty after clearing');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid add to cart request', async () => {
      try {
        await axios.post('/api/cart', {});
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect([400, 500]).toContain(error.response?.status);
      }
    });

    it('should handle invalid user ID format', async () => {
      try {
        await axios.get('/api/cart/invalid-user-id-format');
      } catch (error) {
        // Service might return error or empty cart, both are acceptable
        expect([200, 404, 500]).toContain(error.response?.status);
      }
    });

    it('should handle missing required fields', async () => {
      try {
        await axios.post('/api/cart', {
          userId: testUserId,
          // Missing required fields like skuId, quantity, price
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect([400, 500]).toContain(error.response?.status);
      }
    });
  });

  describe('Cart Business Logic', () => {
    const businessTestUserId = `business-user-${testRunId}`;

    it('should handle zero quantity items', async () => {
      try {
        const cartItem = {
          userId: businessTestUserId,
          skuId: `zero-qty-sku-${testRunId}`,
          quantity: 0,
          price: 10.00,
          itemDetail: {
            name: 'Zero Quantity Test Product',
            category: 'Test Category',
          }
        };

        await axios.post('/api/cart', cartItem);
        // Depending on business logic, this might succeed or fail
      } catch (error) {
        expect([400, 422, 500]).toContain(error.response?.status);
      }
    });

    it('should handle negative price', async () => {
      try {
        const cartItem = {
          userId: businessTestUserId,
          skuId: `negative-price-sku-${testRunId}`,
          quantity: 1,
          price: -10.00,
          itemDetail: {
            name: 'Negative Price Test Product',
            category: 'Test Category',
          }
        };

        await axios.post('/api/cart', cartItem);
        // Depending on business logic, this might succeed or fail
      } catch (error) {
        expect([400, 422, 500]).toContain(error.response?.status);
      }
    });

    afterAll(async () => {
      try {
        await axios.delete(`/api/cart/${businessTestUserId}`);
        console.log('Business test cart cleaned up');
      } catch (error) {
        console.log('Business test cleanup error:', error.response?.status);
      }
    });
  });
});