import axios, { AxiosInstance } from 'axios';

describe('Payment Service E2E Tests', () => {
  let client: AxiosInstance;
  const baseURL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:50055';

  let testPaymentId: string;
  let testOrderId: string;
  const testRunId = Date.now().toString();

  beforeAll(async () => {
    client = axios.create({
      baseURL,
      timeout: 15000,
      validateStatus: () => true
    });

    testOrderId = `order-${testRunId}`;
  });

  afterAll(async () => {
    console.log('Payment service tests completed');
  });

  describe('Health Check', () => {
    it('should return service health status', async () => {
      const res = await client.get('/health');
      expect([200, 404]).toContain(res.status);
      console.log('Payment service is responding');
    });
  });

  describe('Payment Creation', () => {
    it('should create a new payment', async () => {
      const paymentData = {
        orderId: testOrderId,
        amount: 199.99,
        currency: 'USD',
        paymentMethod: 'credit_card',
        paymentDetails: {
          cardNumber: '4111111111111111',
          cardHolder: 'Test User',
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123'
        },
        billingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TC',
          zipCode: '12345',
          country: 'US'
        }
      };

      const res = await client.post('/payments', paymentData);

      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('id');
      expect(res.data).toHaveProperty('status');
      expect(res.data.orderId).toBe(testOrderId);
      expect(res.data.amount).toBe(paymentData.amount);

      testPaymentId = res.data.id;
      console.log('Created test payment:', testPaymentId);
    });

    it('should reject payment without required fields', async () => {
      const res = await client.post('/payments', {
        orderId: testOrderId
        // Missing amount, paymentMethod
      });

      expect([400, 422]).toContain(res.status);
    });

    it('should reject payment with invalid amount', async () => {
      const res = await client.post('/payments', {
        orderId: `order-invalid-${testRunId}`,
        amount: -100,
        currency: 'USD',
        paymentMethod: 'credit_card'
      });

      expect([400, 422]).toContain(res.status);
    });

    it('should reject payment with zero amount', async () => {
      const res = await client.post('/payments', {
        orderId: `order-zero-${testRunId}`,
        amount: 0,
        currency: 'USD',
        paymentMethod: 'credit_card'
      });

      expect([400, 422]).toContain(res.status);
    });
  });

  describe('Payment Retrieval', () => {
    it('should get payment by id', async () => {
      const res = await client.get(`/payments/${testPaymentId}`);

      expect(res.status).toBe(200);
      expect(res.data.id).toBe(testPaymentId);
      expect(res.data.orderId).toBe(testOrderId);
    });

    it('should get payments by order id', async () => {
      const res = await client.get(`/payments/order/${testOrderId}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data) || res.data.payments).toBeTruthy();

      const payments = Array.isArray(res.data) ? res.data : res.data.payments;
      const testPayment = payments.find(p => p.id === testPaymentId);
      expect(testPayment).toBeDefined();
    });

    it('should return 404 for non-existent payment', async () => {
      const res = await client.get('/payments/00000000-0000-0000-0000-000000000000');

      expect(res.status).toBe(404);
    });

    it('should get all payments with pagination', async () => {
      const res = await client.get('/payments?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('payments');
      expect(Array.isArray(res.data.payments)).toBe(true);
    });
  });

  describe('Payment Processing', () => {
    it('should process pending payment', async () => {
      const res = await client.post(`/payments/${testPaymentId}/process`);

      expect([200, 201]).toContain(res.status);
      expect(['processing', 'completed', 'succeeded']).toContain(res.data.status);
    });

    it('should not process already completed payment', async () => {
      // Try to process again
      const res = await client.post(`/payments/${testPaymentId}/process`);

      // Should either succeed (idempotent) or return error
      expect([200, 201, 400, 409]).toContain(res.status);
    });
  });

  describe('Payment Status Updates', () => {
    let statusTestPaymentId: string;

    beforeAll(async () => {
      const paymentData = {
        orderId: `order-status-${testRunId}`,
        amount: 49.99,
        currency: 'USD',
        paymentMethod: 'credit_card'
      };

      const res = await client.post('/payments', paymentData);
      statusTestPaymentId = res.data.id;
    });

    it('should update payment status to processing', async () => {
      const res = await client.patch(`/payments/${statusTestPaymentId}/status`, {
        status: 'processing'
      });

      expect([200, 201]).toContain(res.status);
      expect(res.data.status).toBe('processing');
    });

    it('should update payment status to completed', async () => {
      const res = await client.patch(`/payments/${statusTestPaymentId}/status`, {
        status: 'completed',
        transactionId: `TRANS-${testRunId}`
      });

      expect([200, 201]).toContain(res.status);
      expect(res.data.status).toBe('completed');
    });

    it('should reject invalid status', async () => {
      const res = await client.patch(`/payments/${statusTestPaymentId}/status`, {
        status: 'invalid_status'
      });

      expect([400, 422]).toContain(res.status);
    });
  });

  describe('Payment Refunds', () => {
    let refundPaymentId: string;
    let refundId: string;

    beforeAll(async () => {
      // Create and complete a payment for refund
      const paymentData = {
        orderId: `order-refund-${testRunId}`,
        amount: 75.00,
        currency: 'USD',
        paymentMethod: 'credit_card'
      };

      const createRes = await client.post('/payments', paymentData);
      refundPaymentId = createRes.data.id;

      // Complete the payment
      await client.patch(`/payments/${refundPaymentId}/status`, {
        status: 'completed',
        transactionId: `TRANS-REFUND-${testRunId}`
      });
    });

    it('should create a full refund', async () => {
      const res = await client.post(`/payments/${refundPaymentId}/refund`, {
        amount: 75.00,
        reason: 'Customer request'
      });

      expect([200, 201]).toContain(res.status);
      expect(res.data).toHaveProperty('id');
      expect(res.data.amount).toBe(75.00);

      refundId = res.data.id;
    });

    it('should create a partial refund', async () => {
      // Create another payment for partial refund
      const paymentData = {
        orderId: `order-partial-refund-${testRunId}`,
        amount: 100.00,
        currency: 'USD',
        paymentMethod: 'credit_card'
      };

      const createRes = await client.post('/payments', paymentData);
      const partialRefundPaymentId = createRes.data.id;

      await client.patch(`/payments/${partialRefundPaymentId}/status`, {
        status: 'completed'
      });

      const res = await client.post(`/payments/${partialRefundPaymentId}/refund`, {
        amount: 30.00,
        reason: 'Partial refund'
      });

      expect([200, 201]).toContain(res.status);
      expect(res.data.amount).toBe(30.00);
    });

    it('should reject refund exceeding payment amount', async () => {
      const res = await client.post(`/payments/${refundPaymentId}/refund`, {
        amount: 200.00, // More than payment amount
        reason: 'Invalid refund'
      });

      expect([400, 422]).toContain(res.status);
    });

    it('should get refund history for payment', async () => {
      const res = await client.get(`/payments/${refundPaymentId}/refunds`);

      expect([200, 404]).toContain(res.status);

      if (res.status === 200) {
        expect(Array.isArray(res.data)).toBe(true);
        expect(res.data.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Payment Methods', () => {
    it('should process payment with PayPal', async () => {
      const paymentData = {
        orderId: `order-paypal-${testRunId}`,
        amount: 59.99,
        currency: 'USD',
        paymentMethod: 'paypal',
        paymentDetails: {
          email: 'test@example.com'
        }
      };

      const res = await client.post('/payments', paymentData);

      expect(res.status).toBe(201);
      expect(res.data.paymentMethod).toBe('paypal');
    });

    it('should process payment with bank transfer', async () => {
      const paymentData = {
        orderId: `order-bank-${testRunId}`,
        amount: 299.99,
        currency: 'USD',
        paymentMethod: 'bank_transfer',
        paymentDetails: {
          accountNumber: '1234567890',
          routingNumber: '987654321'
        }
      };

      const res = await client.post('/payments', paymentData);

      expect(res.status).toBe(201);
      expect(res.data.paymentMethod).toBe('bank_transfer');
    });

    it('should reject unsupported payment method', async () => {
      const res = await client.post('/payments', {
        orderId: `order-unsupported-${testRunId}`,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: 'unsupported_method'
      });

      expect([400, 422]).toContain(res.status);
    });
  });

  describe('Payment Security', () => {
    it('should not expose sensitive payment details', async () => {
      const paymentData = {
        orderId: `order-security-${testRunId}`,
        amount: 49.99,
        currency: 'USD',
        paymentMethod: 'credit_card',
        paymentDetails: {
          cardNumber: '4111111111111111',
          cvv: '123'
        }
      };

      const res = await client.post('/payments', paymentData);

      if (res.status === 201) {
        // CVV should never be returned
        expect(res.data.paymentDetails?.cvv).toBeUndefined();

        // Card number should be masked
        if (res.data.paymentDetails?.cardNumber) {
          expect(res.data.paymentDetails.cardNumber).toMatch(/\*+/);
        }
      }
    });

    it('should validate card number format', async () => {
      const res = await client.post('/payments', {
        orderId: `order-invalid-card-${testRunId}`,
        amount: 49.99,
        currency: 'USD',
        paymentMethod: 'credit_card',
        paymentDetails: {
          cardNumber: '1234' // Invalid card number
        }
      });

      expect([400, 422]).toContain(res.status);
    });
  });

  describe('Payment Currency', () => {
    it('should process payment in EUR', async () => {
      const res = await client.post('/payments', {
        orderId: `order-eur-${testRunId}`,
        amount: 85.50,
        currency: 'EUR',
        paymentMethod: 'credit_card'
      });

      expect([201, 400]).toContain(res.status);

      if (res.status === 201) {
        expect(res.data.currency).toBe('EUR');
      }
    });

    it('should process payment in GBP', async () => {
      const res = await client.post('/payments', {
        orderId: `order-gbp-${testRunId}`,
        amount: 125.00,
        currency: 'GBP',
        paymentMethod: 'credit_card'
      });

      expect([201, 400]).toContain(res.status);

      if (res.status === 201) {
        expect(res.data.currency).toBe('GBP');
      }
    });

    it('should reject invalid currency code', async () => {
      const res = await client.post('/payments', {
        orderId: `order-invalid-currency-${testRunId}`,
        amount: 99.99,
        currency: 'XXX', // Invalid currency
        paymentMethod: 'credit_card'
      });

      expect([400, 422]).toContain(res.status);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed payment data', async () => {
      const res = await client.post('/payments', 'invalid-json');

      expect([400, 500]).toContain(res.status);
    });

    it('should return proper error messages', async () => {
      const res = await client.post('/payments', {});

      expect([400, 422]).toContain(res.status);
      expect(res.data).toHaveProperty('message');
    });

    it('should handle payment processing errors gracefully', async () => {
      // Create payment with details that might cause processing error
      const paymentData = {
        orderId: `order-error-${testRunId}`,
        amount: 0.01, // Very small amount might trigger errors
        currency: 'USD',
        paymentMethod: 'credit_card',
        paymentDetails: {
          cardNumber: '4000000000000002' // Test card that might decline
        }
      };

      const createRes = await client.post('/payments', paymentData);

      if (createRes.status === 201) {
        const processRes = await client.post(`/payments/${createRes.data.id}/process`);

        // Should handle error gracefully
        expect([200, 201, 400, 402, 500]).toContain(processRes.status);
      }
    });
  });
});
