export interface ItemDetail {
  name: string;
  description?: string;
  brand?: string;
  attributes?: Record<string, string>;
  [key: string]: unknown; 
} 