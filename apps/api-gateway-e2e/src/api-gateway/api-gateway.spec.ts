import axios, { AxiosError } from 'axios';

interface CartItem {
  id: string;
  skuId: string;
  quantity: number;
  price: number;
  itemDetail: {
    name: string;
    description: string;
    brand: string;
    category: string;
    image: string;
    attributes: Record<string, string>;
    variants: Record<string, string>;
  };
}

describe('API Gateway E2E Tests', () => {
  const baseURL = process.env.API_GATEWAY_URL || 'http://localhost:3000';
  let authToken: string;
  let testUserId: string;
  let testProductId: string;

  beforeAll(async () => {
    // Configure axios default
    axios.defaults.baseURL = baseURL;
    axios.defaults.timeout = 10000;
  });

  describe('Health Check', () => {
    it('should return API status', async () => {
      const res = await axios.get('/api');
      expect(res.status).toBe(200);
    });

    it('should return Swagger docs', async () => {
      const res = await axios.get('/api/docs');
      expect(res.status).toBe(200);
    });
  });

  describe('Authentication Flow', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'Test123!@#',
      firstName: 'Test',
      lastName: 'User',
      role: 'USER'
    };

    it('should register a new user', async () => {
      try {
        const res = await axios.post('/auth/register', testUser);
        expect(res.status).toBe(201);
        expect(res.data).toHaveProperty('user');
        expect(res.data.user.email).toBe(testUser.email);
        testUserId = res.data.user.id;
      } catch (error) {
        // User might already exist, continue with login
        const axiosError = error as AxiosError;
        console.log('User already exists:', axiosError?.response?.data || 'continuing...');
      }
    });

    it('should login user and return JWT token', async () => {
      const res = await axios.post('/auth/login', {
        email: testUser.email,
        password: testUser.password
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('accessToken');
      expect(res.data).toHaveProperty('user');
      
      authToken = res.data.accessToken;
      testUserId = res.data.user.id;
    });

    it('should validate JWT token', async () => {
      const res = await axios.get('/auth/validate', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('user');
    });

    it('should refresh JWT token', async () => {
      const res = await axios.post('/auth/refresh', {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('accessToken');
    });

    it('should logout user', async () => {
      const res = await axios.post('/auth/logout', {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      expect(res.status).toBe(200);
    });

    // Re-login for subsequent tests
    it('should re-login for product tests', async () => {
      const res = await axios.post('/auth/login', {
        email: testUser.email,
        password: testUser.password
      });
      
      authToken = res.data.accessToken;
    });
  });

  describe('Product Management', () => {
    const testProduct = {
      name: 'Test Product E2E',
      description: 'A test product for e2e testing',
      price: 99.99,
      stock: 100,
      categoryId: 'test-category-id',
      brandId: 'test-brand-id',
      tags: ['test', 'e2e'],
      images: ['https://example.com/image.jpg']
    };

    it('should create a new product', async () => {
      const res = await axios.post('/products', testProduct, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('id');
      expect(res.data.name).toBe(testProduct.name);
      testProductId = res.data.id;
    });

    it('should get all products', async () => {
      const res = await axios.get('/products');
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.products)).toBe(true);
    });

    it('should get product by ID', async () => {
      const res = await axios.get(`/products/${testProductId}`);
      
      expect(res.status).toBe(200);
      expect(res.data.id).toBe(testProductId);
      expect(res.data.name).toBe(testProduct.name);
    });

    it('should update product', async () => {
      const updatedData = {
        name: 'Updated Test Product',
        price: 129.99
      };

      const res = await axios.patch(`/products/${testProductId}`, updatedData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      expect(res.status).toBe(200);
      expect(res.data.name).toBe(updatedData.name);
      expect(res.data.price).toBe(updatedData.price);
    });

    it('should search products', async () => {
      const res = await axios.get('/products?search=Test&limit=10&offset=0');
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('products');
      expect(res.data).toHaveProperty('total');
    });
  });

  describe('Cart Management', () => {
    const addToCartData = {
      userId: '',
      skuId: 'test-sku-123',
      quantity: 2,
      price: 99.99,
      itemDetail: {
        name: 'Test Product',
        description: 'Test Description',
        brand: 'Test Brand',
        category: 'Test Category',
        image: 'https://example.com/image.jpg',
        attributes: {
          color: 'blue',
          size: 'M'
        },
        variants: {
          style: 'casual'
        }
      }
    };

    beforeAll(() => {
      addToCartData.userId = testUserId;
    });

    it('should add item to cart', async () => {
      const res = await axios.post('/carts/add', addToCartData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('cart');
      expect(res.data).toHaveProperty('message');
      expect(res.data.cart.items.length).toBeGreaterThan(0);
    });

    it('should get user cart', async () => {
      const res = await axios.post('/carts/get', 
        { userId: testUserId }, 
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('cart');
      expect(res.data.cart.userId).toBe(testUserId);
    });

    it('should update cart item quantity', async () => {
      const updateData = {
        ...addToCartData,
        quantity: 5
      };

      const res = await axios.post('/carts/add', updateData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      expect(res.status).toBe(201);
      // Should update existing item or add new one
      expect(res.data.cart.items.some((item: CartItem) => item.quantity === 5)).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthorized access', async () => {
      try {
        await axios.post('/products', { name: 'Test' });
        fail('Should have thrown an error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(401);
      }
    });

    it('should handle invalid JWT token', async () => {
      try {
        await axios.get('/auth/validate', {
          headers: { Authorization: 'Bearer invalid-token' }
        });
        fail('Should have thrown an error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(401);
      }
    });

    it('should handle non-existent product', async () => {
      try {
        await axios.get('/products/non-existent-id');
        fail('Should have thrown an error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(404);
      }
    });

    it('should handle invalid product data', async () => {
      try {
        await axios.post('/products', { name: '' }, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        fail('Should have thrown an error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(400);
      }
    });

    it('should handle malformed cart data', async () => {
      try {
        await axios.post('/carts/add', { userId: 'invalid' }, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        fail('Should have thrown an error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(400);
      }
    });
  });

  describe('Performance & Load Tests', () => {
    it('should handle concurrent requests', async () => {
      const promises = Array(10).fill(0).map(() => 
        axios.get('/products')
      );
      
      const results = await Promise.all(promises);
      results.forEach(res => {
        expect(res.status).toBe(200);
      });
    });

    it('should respond within acceptable time', async () => {
      const start = Date.now();
      await axios.get('/products');
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(2000); // 2 seconds
    });

    it('should handle large product list', async () => {
      const res = await axios.get('/products?limit=100');
      
      expect(res.status).toBe(200);
      expect(res.data.products.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Integration Tests', () => {
    it('should complete full user journey', async () => {
      // 1. Register new user
      const newUser = {
        email: `journey-${Date.now()}@example.com`,
        password: 'Journey123!@#',
        firstName: 'Journey',
        lastName: 'User',
        role: 'USER'
      };

      const registerRes = await axios.post('/auth/register', newUser);
      expect(registerRes.status).toBe(201);
      const journeyUserId = registerRes.data.user.id;

      // 2. Login
      const loginRes = await axios.post('/auth/login', {
        email: newUser.email,
        password: newUser.password
      });
      expect(loginRes.status).toBe(200);
      const journeyToken = loginRes.data.accessToken;

      // 3. Browse products
      const productsRes = await axios.get('/products');
      expect(productsRes.status).toBe(200);

      // 4. Add to cart
      const cartRes = await axios.post('/carts/add', {
        userId: journeyUserId,
        skuId: 'journey-sku-123',
        quantity: 1,
        price: 49.99,
        itemDetail: {
          name: 'Journey Product',
          description: 'A product for user journey',
          brand: 'Journey Brand',
          category: 'Journey Category',
          image: 'https://example.com/journey.jpg',
          attributes: { color: 'red' },
          variants: { size: 'L' }
        }
      }, {
        headers: { Authorization: `Bearer ${journeyToken}` }
      });
      expect(cartRes.status).toBe(201);

      // 5. Get cart
      const getCartRes = await axios.post('/carts/get', 
        { userId: journeyUserId }, 
        {
          headers: { Authorization: `Bearer ${journeyToken}` }
        }
      );
      expect(getCartRes.status).toBe(200);
      expect(getCartRes.data.cart.items.length).toBe(1);

      // 6. Logout
      const logoutRes = await axios.post('/auth/logout', {}, {
        headers: { Authorization: `Bearer ${journeyToken}` }
      });
      expect(logoutRes.status).toBe(200);
    });
  });

  describe('Cleanup', () => {
    it('should clean up test data', async () => {
      // Delete test product
      if (testProductId) {
        try {
          await axios.delete(`/products/${testProductId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
        } catch (error) {
          const axiosError = error as AxiosError;
          console.log('Test product cleanup failed:', axiosError.message);
        }
      }

      // Additional cleanup can be added here
      console.log('Test cleanup completed');
    });
  });
});

// Helper functions for complex scenarios
const waitForCondition = async (
  condition: () => Promise<boolean>, 
  timeout = 5000, 
  interval = 100
): Promise<boolean> => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  return false;
};

const generateRandomUser = () => ({
  email: `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@example.com`,
  password: 'Test123!@#',
  firstName: 'Test',
  lastName: 'User',
  role: 'USER'
});

// Export helper functions for potential reuse
export { waitForCondition, generateRandomUser };
