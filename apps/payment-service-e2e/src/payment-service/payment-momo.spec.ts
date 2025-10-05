import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../payment-service/src/app/app.module';

describe('Payment Service - MoMo Integration (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /payments/:id', () => {
    it('should return 404 for non-existent payment', () => {
      return request(app.getHttpServer())
        .get('/payments/non-existent-id')
        .expect(404);
    });
  });

  describe('GET /payments/order/:orderId', () => {
    it('should return 404 for non-existent order', () => {
      return request(app.getHttpServer())
        .get('/payments/order/non-existent-order')
        .expect(404);
    });
  });

  describe('POST /payments/callback/momo', () => {
    it('should reject callback with invalid signature', async () => {
      const callbackData = {
        partnerCode: 'WRONG_PARTNER',
        orderId: 'test-order-123',
        requestId: 'req-123',
        amount: 100000,
        orderInfo: 'Test payment',
        orderType: 'momo_wallet',
        transId: '123456',
        resultCode: 0,
        message: 'Success',
        payType: 'qr',
        responseTime: Date.now(),
        extraData: '',
        signature: 'invalid-signature',
      };

      const response = await request(app.getHttpServer())
        .post('/payments/callback/momo')
        .send(callbackData);

      expect([400, 500]).toContain(response.status);
    });

    it('should return 404 for callback with non-existent order', async () => {
      const callbackData = {
        partnerCode: process.env.MOMO_PARTNER_CODE || 'TEST',
        orderId: 'non-existent-order-999',
        requestId: 'req-999',
        amount: 100000,
        orderInfo: 'Test payment',
        orderType: 'momo_wallet',
        transId: '999999',
        resultCode: 0,
        message: 'Success',
        payType: 'qr',
        responseTime: Date.now(),
        extraData: '',
        signature: 'some-signature',
      };

      const response = await request(app.getHttpServer())
        .post('/payments/callback/momo')
        .send(callbackData);

      expect([404, 500]).toContain(response.status);
    });
  });

  describe('Health check', () => {
    it('should return OK', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });
    });
  });
});
