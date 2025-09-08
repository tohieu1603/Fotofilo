export interface DatabaseConfig {
  connectionTimeout: number;
  acquireTimeout: number;
  timeout: number;
  maxConnections: number;
  minConnections: number;
}

export interface ServiceDatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  schema?: string;
}

export interface DatabaseConnectionOptions {
  serviceName: string;
  config: ServiceDatabaseConfig;
  pool?: DatabaseConfig;
}
