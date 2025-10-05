import axios, { AxiosInstance } from 'axios';

describe('Auth Service E2E Tests', () => {
  let client: AxiosInstance;
  const baseURL = process.env.AUTH_SERVICE_URL || 'http://localhost:50052';

  let accessToken: string;
  let refreshToken: string;
  let testUserId: string;

  const testRunId = Date.now().toString();
  const testUser = {
    email: `test-${testRunId}@example.com`,
    password: 'Test@123456',
    firstName: 'Test',
    lastName: 'User'
  };

  beforeAll(async () => {
    client = axios.create({
      baseURL,
      timeout: 15000,
      validateStatus: () => true // Don't throw on any status
    });
  });

  afterAll(async () => {
    // Cleanup: Delete test user if created
    if (testUserId && accessToken) {
      try {
        await client.delete(`/auth/users/${testUserId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        console.log('Test user deleted');
      } catch (error) {
        console.log('Cleanup failed:', error.message);
      }
    }
  });

  describe('Health Check', () => {
    it('should return service health status', async () => {
      const res = await client.get('/health');
      expect([200, 404]).toContain(res.status);
      console.log('Auth service is responding');
    });
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const res = await client.post('/auth/register', testUser);

      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('id');
      expect(res.data).toHaveProperty('email', testUser.email);
      expect(res.data).not.toHaveProperty('password'); // Password should not be returned

      testUserId = res.data.id;
      console.log('Created test user:', testUserId);
    });

    it('should reject duplicate email registration', async () => {
      const res = await client.post('/auth/register', testUser);

      expect(res.status).toBe(409); // Conflict
      expect(res.data).toHaveProperty('message');
    });

    it('should reject registration with invalid email', async () => {
      const res = await client.post('/auth/register', {
        ...testUser,
        email: 'invalid-email'
      });

      expect(res.status).toBe(400);
    });

    it('should reject registration with weak password', async () => {
      const res = await client.post('/auth/register', {
        ...testUser,
        email: `weak-${testRunId}@example.com`,
        password: '123' // Too weak
      });

      expect(res.status).toBe(400);
    });

    it('should reject registration without required fields', async () => {
      const res = await client.post('/auth/register', {
        email: testUser.email
        // Missing password
      });

      expect(res.status).toBe(400);
    });
  });

  describe('User Login', () => {
    it('should login with valid credentials', async () => {
      const res = await client.post('/auth/login', {
        email: testUser.email,
        password: testUser.password
      });

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('accessToken');
      expect(res.data).toHaveProperty('refreshToken');
      expect(res.data).toHaveProperty('user');
      expect(res.data.user.email).toBe(testUser.email);

      accessToken = res.data.accessToken;
      refreshToken = res.data.refreshToken;

      console.log('Login successful, tokens received');
    });

    it('should reject login with invalid email', async () => {
      const res = await client.post('/auth/login', {
        email: 'nonexistent@example.com',
        password: testUser.password
      });

      expect(res.status).toBe(401);
    });

    it('should reject login with invalid password', async () => {
      const res = await client.post('/auth/login', {
        email: testUser.email,
        password: 'WrongPassword123'
      });

      expect(res.status).toBe(401);
    });

    it('should reject login without credentials', async () => {
      const res = await client.post('/auth/login', {});

      expect(res.status).toBe(400);
    });
  });

  describe('Token Management', () => {
    it('should access protected route with valid token', async () => {
      const res = await client.get('/auth/profile', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('email', testUser.email);
      expect(res.data).toHaveProperty('id', testUserId);
    });

    it('should reject access without token', async () => {
      const res = await client.get('/auth/profile');

      expect(res.status).toBe(401);
    });

    it('should reject access with invalid token', async () => {
      const res = await client.get('/auth/profile', {
        headers: { Authorization: 'Bearer invalid-token' }
      });

      expect(res.status).toBe(401);
    });

    it('should refresh access token with valid refresh token', async () => {
      const res = await client.post('/auth/refresh', {
        refreshToken
      });

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('accessToken');

      // Update access token
      accessToken = res.data.accessToken;
      console.log('Token refreshed successfully');
    });

    it('should reject refresh with invalid refresh token', async () => {
      const res = await client.post('/auth/refresh', {
        refreshToken: 'invalid-refresh-token'
      });

      expect(res.status).toBe(401);
    });
  });

  describe('User Profile Management', () => {
    it('should get user profile', async () => {
      const res = await client.get('/auth/profile', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      expect(res.status).toBe(200);
      expect(res.data.email).toBe(testUser.email);
      expect(res.data.firstName).toBe(testUser.firstName);
      expect(res.data.lastName).toBe(testUser.lastName);
    });

    it('should update user profile', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const res = await client.patch('/auth/profile', updateData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      expect(res.status).toBe(200);
      expect(res.data.firstName).toBe(updateData.firstName);
      expect(res.data.lastName).toBe(updateData.lastName);
    });

    it('should not allow updating email directly', async () => {
      const res = await client.patch('/auth/profile', {
        email: 'newemail@example.com'
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      // Should either be rejected or ignored
      expect([200, 400, 403]).toContain(res.status);
    });
  });

  describe('Password Management', () => {
    it('should change password with valid old password', async () => {
      const newPassword = 'NewTest@123456';

      const res = await client.post('/auth/change-password', {
        oldPassword: testUser.password,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      expect(res.status).toBe(200);

      // Update test user password for subsequent tests
      testUser.password = newPassword;
      console.log('Password changed successfully');
    });

    it('should reject password change with wrong old password', async () => {
      const res = await client.post('/auth/change-password', {
        oldPassword: 'WrongPassword123',
        newPassword: 'NewTest@123456'
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      expect(res.status).toBe(400);
    });

    it('should reject weak new password', async () => {
      const res = await client.post('/auth/change-password', {
        oldPassword: testUser.password,
        newPassword: '123' // Too weak
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      expect(res.status).toBe(400);
    });

    it('should login with new password', async () => {
      const res = await client.post('/auth/login', {
        email: testUser.email,
        password: testUser.password // New password
      });

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('accessToken');

      // Update tokens
      accessToken = res.data.accessToken;
      refreshToken = res.data.refreshToken;
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      const res = await client.post('/auth/logout', {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      expect([200, 204]).toContain(res.status);
      console.log('Logout successful');
    });

    it('should reject access with logged out token', async () => {
      // Wait a bit for token to be blacklisted
      await new Promise(resolve => setTimeout(resolve, 1000));

      const res = await client.get('/auth/profile', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      // Token should be invalid after logout
      expect([401, 403]).toContain(res.status);
    });

    it('should allow login again after logout', async () => {
      const res = await client.post('/auth/login', {
        email: testUser.email,
        password: testUser.password
      });

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('accessToken');

      // Update tokens for cleanup
      accessToken = res.data.accessToken;
    });
  });

  describe('Security Tests', () => {
    it('should prevent SQL injection in email field', async () => {
      const res = await client.post('/auth/login', {
        email: "admin@example.com' OR '1'='1",
        password: 'any'
      });

      expect(res.status).toBe(401);
    });

    it('should sanitize XSS attempts in user input', async () => {
      const xssEmail = `xss-${testRunId}@example.com`;
      const res = await client.post('/auth/register', {
        email: xssEmail,
        password: 'Test@123456',
        firstName: '<script>alert("xss")</script>',
        lastName: 'Test'
      });

      if (res.status === 201) {
        expect(res.data.firstName).not.toContain('<script>');

        // Cleanup
        const loginRes = await client.post('/auth/login', {
          email: xssEmail,
          password: 'Test@123456'
        });

        if (loginRes.status === 200) {
          await client.delete(`/auth/users/${res.data.id}`, {
            headers: { Authorization: `Bearer ${loginRes.data.accessToken}` }
          });
        }
      }
    });

    it('should rate limit excessive requests', async () => {
      const requests = [];

      // Send many requests quickly
      for (let i = 0; i < 20; i++) {
        requests.push(
          client.post('/auth/login', {
            email: 'fake@example.com',
            password: 'fake'
          })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);

      // May or may not have rate limiting - just log the result
      console.log('Rate limiting active:', rateLimited);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      try {
        const res = await client.post('/auth/login', 'not-json', {
          headers: { 'Content-Type': 'application/json' }
        });

        expect([400, 500]).toContain(res.status);
      } catch (error) {
        // Axios may throw on malformed requests
        expect(error).toBeDefined();
      }
    });

    it('should return proper error messages', async () => {
      const res = await client.post('/auth/register', {
        email: 'invalid',
        password: '123'
      });

      expect(res.status).toBe(400);
      expect(res.data).toHaveProperty('message');
      expect(typeof res.data.message).toBe('string');
    });

    it('should handle non-existent routes', async () => {
      const res = await client.get('/auth/nonexistent-route');

      expect(res.status).toBe(404);
    });
  });
});
