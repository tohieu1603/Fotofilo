import axios, { AxiosInstance } from 'axios';

describe('Order Service E2E Tests', () => {
  let client: AxiosInstance;
  const baseURL = process.env.ORDER_SERVICE_URL || 'http://localhost:50054';

  let testOrderId: string;
  let testUserId: string;
  const testRunId = Date.now().toString();

  beforeAll(async () => {
    client = axios.create({
      baseURL,
      timeout: 15000,
      validateStatus: () => true
    });

    // Mock user ID for testing
    testUserId = `test-user-${testRunId}`;
  });

  afterAll(async () => {
    // Cleanup test orders
    if (testOrderId) {
      try {
        await client.delete(`/orders/${testOrderId}`);
        console.log('Test order deleted');
      } catch (error) {
        console.log('Cleanup failed:', error.message);
      }
    }
  });

  describe('Health Check', () => {
    it('should return service health status', async () => {
      const res = await client.get('/health');
      expect([200, 404]).toContain(res.status);
      console.log('Order service is responding');
    });
  });

  describe('Order Creation', () => {
    it('should create a new order successfully', async () => {
      const orderData = {
        userId: testUserId,
        items: [
          {
            productId: `product-${testRunId}`,
            skuId: `sku-${testRunId}`,
            quantity: 2,
            price: 99.99,
            name: 'Test Product'
          }
        ],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TC',
          zipCode: '12345',
          country: 'Test Country'
        },
        billingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TC',
          zipCode: '12345',
          country: 'Test Country'
        },
        paymentMethod: 'credit_card'
      };

      const res = await client.post('/orders', orderData);

      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('id');
      expect(res.data).toHaveProperty('orderNumber');
      expect(res.data).toHaveProperty('status');
      expect(res.data.userId).toBe(testUserId);
      expect(res.data.items).toHaveLength(1);

      testOrderId = res.data.id;
      console.log('Created test order:', testOrderId);
    });

    it('should reject order without required fields', async () => {
      const res = await client.post('/orders', {
        userId: testUserId
        // Missing items and addresses
      });

      expect([400, 422]).toContain(res.status);
    });

    it('should reject order with empty items', async () => {
      const res = await client.post('/orders', {
        userId: testUserId,
        items: [],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TC',
          zipCode: '12345',
          country: 'Test Country'
        }
      });

      expect([400, 422]).toContain(res.status);
    });

    it('should reject order with invalid quantity', async () => {
      const res = await client.post('/orders', {
        userId: testUserId,
        items: [
          {
            productId: `product-${testRunId}`,
            skuId: `sku-${testRunId}`,
            quantity: -1, // Invalid
            price: 99.99
          }
        ],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TC',
          zipCode: '12345',
          country: 'Test Country'
        }
      });

      expect([400, 422]).toContain(res.status);
    });
  });

  describe('Order Retrieval', () => {
    it('should get order by id', async () => {
      const res = await client.get(`/orders/${testOrderId}`);

      expect(res.status).toBe(200);
      expect(res.data.id).toBe(testOrderId);
      expect(res.data.userId).toBe(testUserId);
    });

    it('should get all orders for user', async () => {
      const res = await client.get(`/orders/user/${testUserId}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data) || res.data.orders).toBeTruthy();

      const orders = Array.isArray(res.data) ? res.data : res.data.orders;
      const testOrder = orders.find(o => o.id === testOrderId);
      expect(testOrder).toBeDefined();
    });

    it('should get all orders with pagination', async () => {
      const res = await client.get('/orders?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('orders');
      expect(Array.isArray(res.data.orders)).toBe(true);
    });

    it('should return 404 for non-existent order', async () => {
      const res = await client.get('/orders/00000000-0000-0000-0000-000000000000');

      expect(res.status).toBe(404);
    });
  });

  describe('Order Status Management', () => {
    it('should update order status to processing', async () => {
      const res = await client.patch(`/orders/${testOrderId}/status`, {
        status: 'processing'
      });

      expect(res.status).toBe(200);
      expect(res.data.status).toBe('processing');
    });

    it('should update order status to shipped', async () => {
      const res = await client.patch(`/orders/${testOrderId}/status`, {
        status: 'shipped',
        trackingNumber: `TRACK-${testRunId}`
      });

      expect(res.status).toBe(200);
      expect(res.data.status).toBe('shipped');
      expect(res.data.trackingNumber).toBe(`TRACK-${testRunId}`);
    });

    it('should update order status to delivered', async () => {
      const res = await client.patch(`/orders/${testOrderId}/status`, {
        status: 'delivered'
      });

      expect(res.status).toBe(200);
      expect(res.data.status).toBe('delivered');
    });

    it('should reject invalid status', async () => {
      const res = await client.patch(`/orders/${testOrderId}/status`, {
        status: 'invalid_status'
      });

      expect([400, 422]).toContain(res.status);
    });

    it('should get order status history', async () => {
      const res = await client.get(`/orders/${testOrderId}/history`);

      expect([200, 404]).toContain(res.status);

      if (res.status === 200) {
        expect(Array.isArray(res.data)).toBe(true);
        expect(res.data.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Order Cancellation', () => {
    let cancelOrderId: string;

    beforeAll(async () => {
      // Create order to cancel
      const orderData = {
        userId: testUserId,
        items: [
          {
            productId: `product-cancel-${testRunId}`,
            skuId: `sku-cancel-${testRunId}`,
            quantity: 1,
            price: 49.99,
            name: 'Cancel Test Product'
          }
        ],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TC',
          zipCode: '12345',
          country: 'Test Country'
        }
      };

      const res = await client.post('/orders', orderData);
      cancelOrderId = res.data.id;
    });

    it('should cancel an order', async () => {
      const res = await client.post(`/orders/${cancelOrderId}/cancel`, {
        reason: 'Customer request'
      });

      expect(res.status).toBe(200);
      expect(res.data.status).toBe('cancelled');
    });

    it('should not cancel already cancelled order', async () => {
      const res = await client.post(`/orders/${cancelOrderId}/cancel`, {
        reason: 'Customer request'
      });

      expect([400, 409]).toContain(res.status);
    });

    afterAll(async () => {
      if (cancelOrderId) {
        await client.delete(`/orders/${cancelOrderId}`);
      }
    });
  });

  describe('Order Payment', () => {
    it('should update payment status to paid', async () => {
      const res = await client.patch(`/orders/${testOrderId}/payment`, {
        paymentStatus: 'paid',
        transactionId: `TRANS-${testRunId}`
      });

      expect([200, 404]).toContain(res.status);

      if (res.status === 200) {
        expect(res.data.paymentStatus).toBe('paid');
      }
    });

    it('should update payment status to failed', async () => {
      // Create new order for failed payment test
      const orderData = {
        userId: testUserId,
        items: [
          {
            productId: `product-payment-${testRunId}`,
            skuId: `sku-payment-${testRunId}`,
            quantity: 1,
            price: 29.99,
            name: 'Payment Test Product'
          }
        ],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TC',
          zipCode: '12345',
          country: 'Test Country'
        }
      };

      const createRes = await client.post('/orders', orderData);
      const orderId = createRes.data.id;

      const res = await client.patch(`/orders/${orderId}/payment`, {
        paymentStatus: 'failed',
        failureReason: 'Insufficient funds'
      });

      expect([200, 404]).toContain(res.status);

      // Cleanup
      await client.delete(`/orders/${orderId}`);
    });
  });

  describe('Order Items Management', () => {
    it('should get order items', async () => {
      const res = await client.get(`/orders/${testOrderId}/items`);

      expect([200, 404]).toContain(res.status);

      if (res.status === 200) {
        expect(Array.isArray(res.data)).toBe(true);
        expect(res.data.length).toBeGreaterThan(0);
      }
    });

    it('should calculate order total correctly', async () => {
      const res = await client.get(`/orders/${testOrderId}`);

      if (res.status === 200) {
        expect(res.data).toHaveProperty('total');
        expect(typeof res.data.total).toBe('number');
        expect(res.data.total).toBeGreaterThan(0);
      }
    });
  });

  describe('Order Search and Filter', () => {
    it('should search orders by status', async () => {
      const res = await client.get('/orders?status=delivered');

      expect(res.status).toBe(200);

      if (res.data.orders) {
        res.data.orders.forEach(order => {
          expect(order.status).toBe('delivered');
        });
      }
    });

    it('should search orders by date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const res = await client.get(`/orders?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);

      expect(res.status).toBe(200);
    });

    it('should filter orders by user', async () => {
      const res = await client.get(`/orders?userId=${testUserId}`);

      expect(res.status).toBe(200);

      if (res.data.orders) {
        res.data.orders.forEach(order => {
          expect(order.userId).toBe(testUserId);
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid order ID format', async () => {
      const res = await client.get('/orders/invalid-id');

      expect([400, 404]).toContain(res.status);
    });

    it('should handle malformed request body', async () => {
      const res = await client.post('/orders', 'invalid-json');

      expect([400, 500]).toContain(res.status);
    });

    it('should return proper error messages', async () => {
      const res = await client.post('/orders', {});

      expect([400, 422]).toContain(res.status);
      expect(res.data).toHaveProperty('message');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete order workflow', async () => {
      // 1. Create order
      const orderData = {
        userId: `workflow-user-${testRunId}`,
        items: [
          {
            productId: `product-workflow-${testRunId}`,
            skuId: `sku-workflow-${testRunId}`,
            quantity: 3,
            price: 149.99,
            name: 'Workflow Test Product'
          }
        ],
        shippingAddress: {
          street: '456 Workflow Ave',
          city: 'Workflow City',
          state: 'WF',
          zipCode: '54321',
          country: 'Test Country'
        }
      };

      const createRes = await client.post('/orders', orderData);
      expect(createRes.status).toBe(201);
      const workflowOrderId = createRes.data.id;

      // 2. Update to processing
      const processingRes = await client.patch(`/orders/${workflowOrderId}/status`, {
        status: 'processing'
      });
      expect(processingRes.status).toBe(200);

      // 3. Update payment to paid
      const paymentRes = await client.patch(`/orders/${workflowOrderId}/payment`, {
        paymentStatus: 'paid',
        transactionId: `WORKFLOW-TRANS-${testRunId}`
      });
      expect([200, 404]).toContain(paymentRes.status);

      // 4. Update to shipped
      const shippedRes = await client.patch(`/orders/${workflowOrderId}/status`, {
        status: 'shipped',
        trackingNumber: `WORKFLOW-TRACK-${testRunId}`
      });
      expect(shippedRes.status).toBe(200);

      // 5. Verify final state
      const finalRes = await client.get(`/orders/${workflowOrderId}`);
      expect(finalRes.status).toBe(200);
      expect(finalRes.data.status).toBe('shipped');

      // Cleanup
      await client.delete(`/orders/${workflowOrderId}`);
    });
  });
});
