export interface InventoryItem {
  sku: string;
  quantity: number;
}

export interface ReservationItem {
  reservationKey: string;
}

export interface InventoryCheckResult {
  sku: string;
  available: number;
  reserved: number;
  total: number;
  canReserve: boolean;
}

export interface InventoryReservation {
  sku: string;
  quantity: number;
  reserved: boolean;
  reservationKey?: string;
}

export interface InventoryReservationResult {
  success: boolean;
  reservations: InventoryReservation[];
  failureReason?: string;
}

export interface InventoryReleaseResult {
  success: boolean;
  released: Array<{
    sku: string;
    quantity: number;
  }>;
}

export interface InventoryCommitResult {
  success: boolean;
  committed: Array<{
    sku: string;
    quantity: number;
  }>;
}

export interface InventoryDetails {
  available: number;
  reserved: number;
  total: number;
  sold: number;
}

export interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
}

// Extended Redis interface to include our custom commands
declare module 'ioredis' {
  interface RedisCommander<Context> {
    checkAndReserveInventory(
      itemsJson: string,
      timeout?: string,
    ): Promise<string>;
    releaseInventory(itemsJson: string): Promise<string>;
    commitInventory(itemsJson: string): Promise<string>;
    checkInventory(skusJson: string): Promise<string>;
  }
}