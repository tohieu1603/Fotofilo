import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import { InventoryManagerService } from './inventory-manager.service';

describe('Redis Race Condition Prevention Tests', () => {
  let redisService: RedisService;
  let inventoryManager: InventoryManagerService;
  let configService: ConfigService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        InventoryManagerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                REDIS_HOST: process.env.REDIS_HOST || 'localhost',
                REDIS_PORT: process.env.REDIS_PORT || 6379,
                REDIS_DB: process.env.REDIS_DB || 1, // Use test database
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    redisService = module.get<RedisService>(RedisService);
    inventoryManager = module.get<InventoryManagerService>(InventoryManagerService);
    configService = module.get<ConfigService>(ConfigService);

    // Initialize Redis connection
    await redisService.onModuleInit();

    // Clean up test data
    await redisService.getClient().flushdb();
  });

  afterAll(async () => {
    // Clean up test data
    await redisService.getClient().flushdb();
    await redisService.onModuleDestroy();
  });

  beforeEach(async () => {
    // Clean up before each test
    await redisService.getClient().flushdb();

    // Set up initial inventory
    await redisService.setInitialInventory('TEST-SKU-001', 10);
    await redisService.setInitialInventory('TEST-SKU-002', 5);
    await redisService.setInitialInventory('TEST-SKU-003', 1);
  });

  describe('Atomic Inventory Operations', () => {
    it('should prevent race conditions when multiple orders try to reserve the same inventory', async () => {
      const sku = 'TEST-SKU-003'; // Only 1 unit available
      const concurrentOrders = 5;
      const reservationPromises: Promise<any>[] = [];

      // Create multiple concurrent orders trying to reserve the same item
      for (let i = 0; i < concurrentOrders; i++) {
        const reservationPromise = inventoryManager.reserveForOrder(
          `order-${i + 1}`,
          `customer-${i + 1}`,
          [{ sku, quantity: 1 }],
          60, // 1 minute timeout
        );
        reservationPromises.push(reservationPromise);
      }

      // Wait for all reservations to complete
      const results = await Promise.all(reservationPromises);

      // Only one should succeed
      const successfulReservations = results.filter(r => r.success);
      const failedReservations = results.filter(r => !r.success);

      expect(successfulReservations).toHaveLength(1);
      expect(failedReservations).toHaveLength(4);

      // Check inventory state
      const inventoryDetails = await redisService.getInventoryDetails(sku);
      expect(inventoryDetails?.available).toBe(0);
      expect(inventoryDetails?.reserved).toBe(1);
      expect(inventoryDetails?.total).toBe(1);

      // Verify error messages
      failedReservations.forEach(reservation => {
        expect(reservation.error).toContain('Insufficient stock');
      });
    });

    it('should atomically reserve multiple items or fail completely', async () => {
      // Try to reserve items where one has insufficient stock
      const result1 = await inventoryManager.reserveForOrder(
        'order-partial-fail',
        'customer-001',
        [
          { sku: 'TEST-SKU-001', quantity: 5 }, // Available: 10, should succeed
          { sku: 'TEST-SKU-002', quantity: 10 }, // Available: 5, should fail
        ],
        60,
      );

      // Should fail completely (atomic operation)
      expect(result1.success).toBe(false);
      expect(result1.error).toContain('Insufficient stock');

      // Verify no inventory was reserved
      const inventory1 = await redisService.getInventoryDetails('TEST-SKU-001');
      const inventory2 = await redisService.getInventoryDetails('TEST-SKU-002');

      expect(inventory1?.available).toBe(10);
      expect(inventory1?.reserved).toBe(0);
      expect(inventory2?.available).toBe(5);
      expect(inventory2?.reserved).toBe(0);

      // Try again with quantities that should succeed
      const result2 = await inventoryManager.reserveForOrder(
        'order-success',
        'customer-002',
        [
          { sku: 'TEST-SKU-001', quantity: 5 }, // Available: 10, should succeed
          { sku: 'TEST-SKU-002', quantity: 3 }, // Available: 5, should succeed
        ],
        60,
      );

      expect(result2.success).toBe(true);

      // Verify inventory was properly reserved
      const inventory1After = await redisService.getInventoryDetails('TEST-SKU-001');
      const inventory2After = await redisService.getInventoryDetails('TEST-SKU-002');

      expect(inventory1After?.available).toBe(5);
      expect(inventory1After?.reserved).toBe(5);
      expect(inventory2After?.available).toBe(2);
      expect(inventory2After?.reserved).toBe(3);
    });

    it('should handle concurrent reservations of different SKUs correctly', async () => {
      const promises = [
        inventoryManager.reserveForOrder('order-1', 'customer-1', [
          { sku: 'TEST-SKU-001', quantity: 3 },
        ]),
        inventoryManager.reserveForOrder('order-2', 'customer-2', [
          { sku: 'TEST-SKU-002', quantity: 2 },
        ]),
        inventoryManager.reserveForOrder('order-3', 'customer-3', [
          { sku: 'TEST-SKU-001', quantity: 4 },
        ]),
        inventoryManager.reserveForOrder('order-4', 'customer-4', [
          { sku: 'TEST-SKU-002', quantity: 1 },
        ]),
      ];

      const results = await Promise.all(promises);

      // All should succeed as they don't exceed available inventory
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Check final inventory state
      const inventory1 = await redisService.getInventoryDetails('TEST-SKU-001');
      const inventory2 = await redisService.getInventoryDetails('TEST-SKU-002');

      expect(inventory1?.available).toBe(3); // 10 - 3 - 4 = 3
      expect(inventory1?.reserved).toBe(7); // 3 + 4 = 7
      expect(inventory2?.available).toBe(2); // 5 - 2 - 1 = 2
      expect(inventory2?.reserved).toBe(3); // 2 + 1 = 3
    });

    it('should properly commit reservations', async () => {
      // Reserve inventory
      const reservationResult = await inventoryManager.reserveForOrder(
        'order-commit-test',
        'customer-commit',
        [
          { sku: 'TEST-SKU-001', quantity: 3 },
          { sku: 'TEST-SKU-002', quantity: 2 },
        ],
      );

      expect(reservationResult.success).toBe(true);

      // Commit the reservation
      const commitResult = await inventoryManager.commitOrderInventory('order-commit-test');
      expect(commitResult.success).toBe(true);

      // Check inventory state after commit
      const inventory1 = await redisService.getInventoryDetails('TEST-SKU-001');
      const inventory2 = await redisService.getInventoryDetails('TEST-SKU-002');

      expect(inventory1?.available).toBe(7); // 10 - 3 = 7
      expect(inventory1?.reserved).toBe(0); // Should be 0 after commit
      expect(inventory1?.sold).toBe(3); // Should track sold items

      expect(inventory2?.available).toBe(3); // 5 - 2 = 3
      expect(inventory2?.reserved).toBe(0); // Should be 0 after commit
      expect(inventory2?.sold).toBe(2); // Should track sold items
    });

    it('should properly release reservations', async () => {
      // Reserve inventory
      const reservationResult = await inventoryManager.reserveForOrder(
        'order-release-test',
        'customer-release',
        [
          { sku: 'TEST-SKU-001', quantity: 4 },
          { sku: 'TEST-SKU-002', quantity: 1 },
        ],
      );

      expect(reservationResult.success).toBe(true);

      // Release the reservation
      const releaseResult = await inventoryManager.releaseOrderInventory('order-release-test');
      expect(releaseResult.success).toBe(true);

      // Check inventory state after release
      const inventory1 = await redisService.getInventoryDetails('TEST-SKU-001');
      const inventory2 = await redisService.getInventoryDetails('TEST-SKU-002');

      expect(inventory1?.available).toBe(10); // Back to original
      expect(inventory1?.reserved).toBe(0); // Should be 0 after release

      expect(inventory2?.available).toBe(5); // Back to original
      expect(inventory2?.reserved).toBe(0); // Should be 0 after release
    });

    it('should handle reservation timeouts correctly', async () => {
      // Reserve with very short timeout for testing
      const reservationResult = await inventoryManager.reserveForOrder(
        'order-timeout-test',
        'customer-timeout',
        [{ sku: 'TEST-SKU-001', quantity: 2 }],
        1, // 1 second timeout
      );

      expect(reservationResult.success).toBe(true);

      // Wait for timeout + cleanup
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Run cleanup
      const cleanedCount = await redisService.cleanupExpiredReservations();

      // Check that reservation was cleaned up
      const inventoryAfter = await redisService.getInventoryDetails('TEST-SKU-001');
      expect(inventoryAfter?.available).toBe(10); // Should be back to original
      expect(inventoryAfter?.reserved).toBe(0); // Should be 0 after cleanup
    }, 10000); // 10 second timeout for this test
  });

  describe('Race Condition Stress Test', () => {
    it('should handle high concurrency without data corruption', async () => {
      const concurrentOperations = 20;
      const operationPromises: Promise<any>[] = [];

      // Create many concurrent operations
      for (let i = 0; i < concurrentOperations; i++) {
        const operation = async () => {
          const orderResult = await inventoryManager.reserveForOrder(
            `stress-order-${i}`,
            `stress-customer-${i}`,
            [{ sku: 'TEST-SKU-001', quantity: 1 }],
            60,
          );

          if (orderResult.success) {
            // Randomly commit or release
            if (Math.random() > 0.5) {
              await inventoryManager.commitOrderInventory(`stress-order-${i}`);
            } else {
              await inventoryManager.releaseOrderInventory(`stress-order-${i}`);
            }
          }

          return orderResult;
        };

        operationPromises.push(operation());
      }

      const results = await Promise.all(operationPromises);

      // Count successes and failures
      const successes = results.filter(r => r.success).length;
      const failures = results.filter(r => !r.success).length;

      // Should have exactly 10 successes (initial inventory) and 10 failures
      expect(successes).toBeLessThanOrEqual(10);
      expect(failures).toBe(concurrentOperations - successes);

      // Verify data integrity
      const finalInventory = await redisService.getInventoryDetails('TEST-SKU-001');
      expect(finalInventory?.available + finalInventory?.reserved + finalInventory?.sold).toBe(10);
    }, 15000); // 15 second timeout
  });
});