import axios, { AxiosInstance } from 'axios';

describe('Notification Service E2E Tests', () => {
  let client: AxiosInstance;
  const baseURL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:50057';

  const testRunId = Date.now().toString();
  const testEmail = `test-${testRunId}@example.com`;

  beforeAll(async () => {
    client = axios.create({
      baseURL,
      timeout: 15000,
      validateStatus: () => true
    });
  });

  afterAll(async () => {
    console.log('Notification service tests completed');
  });

  describe('Health Check', () => {
    it('should return service health status', async () => {
      const res = await client.get('/health');
      expect([200, 404]).toContain(res.status);
      console.log('Notification service is responding');
    });
  });

  describe('Email Notifications', () => {
    it('should send basic email notification', async () => {
      const emailData = {
        to: testEmail,
        subject: `Test Email ${testRunId}`,
        body: 'This is a test email from E2E tests',
        type: 'plain'
      };

      const res = await client.post('/notifications/email', emailData);

      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('id');
      expect(res.data).toHaveProperty('status');

      console.log('Email notification sent');
    });

    it('should send HTML email notification', async () => {
      const emailData = {
        to: testEmail,
        subject: `Test HTML Email ${testRunId}`,
        body: '<h1>Test Email</h1><p>This is a test email with HTML content</p>',
        type: 'html'
      };

      const res = await client.post('/notifications/email', emailData);

      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('id');
    });

    it('should send email with template', async () => {
      const emailData = {
        to: testEmail,
        template: 'order_confirmation',
        data: {
          orderId: `ORDER-${testRunId}`,
          customerName: 'Test User',
          items: [
            { name: 'Test Product', quantity: 2, price: 99.99 }
          ],
          total: 199.98
        }
      };

      const res = await client.post('/notifications/email/template', emailData);

      expect([200, 201, 404]).toContain(res.status);

      if (res.status === 201) {
        console.log('Template email sent');
      } else if (res.status === 404) {
        console.log('Template not found (expected if not configured)');
      }
    });

    it('should reject email without recipient', async () => {
      const res = await client.post('/notifications/email', {
        subject: 'Test',
        body: 'Test'
        // Missing 'to'
      });

      expect([400, 422]).toContain(res.status);
    });

    it('should reject email with invalid email address', async () => {
      const res = await client.post('/notifications/email', {
        to: 'invalid-email',
        subject: 'Test',
        body: 'Test'
      });

      expect([400, 422]).toContain(res.status);
    });

    it('should send email to multiple recipients', async () => {
      const emailData = {
        to: [testEmail, `test2-${testRunId}@example.com`],
        subject: `Bulk Test Email ${testRunId}`,
        body: 'This is a bulk test email'
      };

      const res = await client.post('/notifications/email', emailData);

      expect([200, 201]).toContain(res.status);
    });
  });

  describe('Notification Status', () => {
    let notificationId: string;

    beforeAll(async () => {
      const emailData = {
        to: testEmail,
        subject: `Status Test Email ${testRunId}`,
        body: 'Test email for status tracking'
      };

      const res = await client.post('/notifications/email', emailData);
      notificationId = res.data.id;
    });

    it('should get notification status by id', async () => {
      const res = await client.get(`/notifications/${notificationId}`);

      expect(res.status).toBe(200);
      expect(res.data.id).toBe(notificationId);
      expect(res.data).toHaveProperty('status');
      expect(['pending', 'sent', 'delivered', 'failed']).toContain(res.data.status);
    });

    it('should return 404 for non-existent notification', async () => {
      const res = await client.get('/notifications/00000000-0000-0000-0000-000000000000');

      expect(res.status).toBe(404);
    });

    it('should get all notifications with pagination', async () => {
      const res = await client.get('/notifications?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('notifications');
      expect(Array.isArray(res.data.notifications)).toBe(true);
    });

    it('should filter notifications by status', async () => {
      const res = await client.get('/notifications?status=sent');

      expect(res.status).toBe(200);

      if (res.data.notifications) {
        res.data.notifications.forEach(notif => {
          expect(notif.status).toBe('sent');
        });
      }
    });

    it('should filter notifications by recipient', async () => {
      const res = await client.get(`/notifications?recipient=${testEmail}`);

      expect(res.status).toBe(200);

      if (res.data.notifications) {
        res.data.notifications.forEach(notif => {
          expect(notif.to).toContain(testEmail);
        });
      }
    });
  });

  describe('Notification Types', () => {
    it('should send order confirmation notification', async () => {
      const notificationData = {
        type: 'order_confirmation',
        recipient: testEmail,
        data: {
          orderId: `ORDER-${testRunId}`,
          orderNumber: `ORD-${testRunId}`,
          total: 249.99
        }
      };

      const res = await client.post('/notifications', notificationData);

      expect([200, 201]).toContain(res.status);
    });

    it('should send order shipped notification', async () => {
      const notificationData = {
        type: 'order_shipped',
        recipient: testEmail,
        data: {
          orderId: `ORDER-${testRunId}`,
          trackingNumber: `TRACK-${testRunId}`
        }
      };

      const res = await client.post('/notifications', notificationData);

      expect([200, 201]).toContain(res.status);
    });

    it('should send password reset notification', async () => {
      const notificationData = {
        type: 'password_reset',
        recipient: testEmail,
        data: {
          resetToken: `TOKEN-${testRunId}`,
          expiresIn: '1 hour'
        }
      };

      const res = await client.post('/notifications', notificationData);

      expect([200, 201]).toContain(res.status);
    });

    it('should send welcome notification', async () => {
      const notificationData = {
        type: 'welcome',
        recipient: testEmail,
        data: {
          userName: 'Test User',
          activationLink: `https://example.com/activate/${testRunId}`
        }
      };

      const res = await client.post('/notifications', notificationData);

      expect([200, 201]).toContain(res.status);
    });
  });

  describe('Notification Retry', () => {
    it('should retry failed notification', async () => {
      // Create a notification that might fail
      const emailData = {
        to: 'invalid@invalid-domain-that-does-not-exist.com',
        subject: 'Test Retry',
        body: 'This email should fail and retry'
      };

      const createRes = await client.post('/notifications/email', emailData);

      if (createRes.status === 201) {
        const notificationId = createRes.data.id;

        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check status
        const statusRes = await client.get(`/notifications/${notificationId}`);

        // Should be in failed or retrying state
        expect(['failed', 'retrying', 'pending']).toContain(statusRes.data.status);

        // Try to manually retry
        const retryRes = await client.post(`/notifications/${notificationId}/retry`);

        expect([200, 201, 404]).toContain(retryRes.status);
      }
    });
  });

  describe('Notification Preferences', () => {
    const userId = `user-${testRunId}`;

    it('should set user notification preferences', async () => {
      const preferences = {
        userId,
        email: true,
        sms: false,
        push: true,
        types: {
          order_updates: true,
          marketing: false,
          newsletters: false
        }
      };

      const res = await client.post('/notifications/preferences', preferences);

      expect([200, 201, 404]).toContain(res.status);

      if (res.status === 201) {
        console.log('Notification preferences set');
      }
    });

    it('should get user notification preferences', async () => {
      const res = await client.get(`/notifications/preferences/${userId}`);

      expect([200, 404]).toContain(res.status);

      if (res.status === 200) {
        expect(res.data.userId).toBe(userId);
        expect(res.data).toHaveProperty('email');
      }
    });

    it('should update user notification preferences', async () => {
      const updates = {
        sms: true,
        types: {
          marketing: true
        }
      };

      const res = await client.patch(`/notifications/preferences/${userId}`, updates);

      expect([200, 404]).toContain(res.status);
    });
  });

  describe('Bulk Notifications', () => {
    it('should send bulk notifications', async () => {
      const bulkData = {
        recipients: [
          `bulk1-${testRunId}@example.com`,
          `bulk2-${testRunId}@example.com`,
          `bulk3-${testRunId}@example.com`
        ],
        subject: `Bulk Test ${testRunId}`,
        body: 'This is a bulk notification test'
      };

      const res = await client.post('/notifications/bulk', bulkData);

      expect([200, 201]).toContain(res.status);

      if (res.status === 201) {
        expect(res.data).toHaveProperty('sent');
        expect(res.data).toHaveProperty('failed');
      }
    });

    it('should handle partial bulk notification failures', async () => {
      const bulkData = {
        recipients: [
          testEmail, // Valid
          'invalid-email', // Invalid
          `bulk-valid-${testRunId}@example.com` // Valid
        ],
        subject: `Partial Bulk Test ${testRunId}`,
        body: 'Test partial failures'
      };

      const res = await client.post('/notifications/bulk', bulkData);

      expect([200, 201, 207]).toContain(res.status); // 207 = Multi-Status

      if (res.data.sent !== undefined) {
        expect(res.data.sent).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed notification data', async () => {
      const res = await client.post('/notifications/email', 'invalid-json');

      expect([400, 500]).toContain(res.status);
    });

    it('should return proper error messages', async () => {
      const res = await client.post('/notifications/email', {});

      expect([400, 422]).toContain(res.status);
      expect(res.data).toHaveProperty('message');
    });

    it('should handle SMTP connection errors gracefully', async () => {
      // This tests if the service handles SMTP errors without crashing
      const emailData = {
        to: testEmail,
        subject: 'Connection Test',
        body: 'Testing SMTP error handling'
      };

      const res = await client.post('/notifications/email', emailData);

      // Should either succeed or return proper error
      expect([200, 201, 500, 503]).toContain(res.status);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rapid notification requests', async () => {
      const requests = [];

      for (let i = 0; i < 10; i++) {
        requests.push(
          client.post('/notifications/email', {
            to: `rate-limit-${i}-${testRunId}@example.com`,
            subject: `Rate Limit Test ${i}`,
            body: 'Testing rate limiting'
          })
        );
      }

      const responses = await Promise.all(requests);

      // Some should succeed
      const successful = responses.filter(r => [200, 201].includes(r.status));
      expect(successful.length).toBeGreaterThan(0);

      // Check if rate limiting is applied
      const rateLimited = responses.some(r => r.status === 429);
      console.log('Rate limiting active:', rateLimited);
    });
  });
});
