import Dexie, { type Table } from 'dexie';

// Types based on the existing schema
export interface Supplier {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  sort_order: number;
  created_at: Date;
}

export interface Product {
  id: string;
  name: string;
  supplier_id: string;
  unit: string;
  sort_order: number;
  created_at: Date;
}

export interface Order {
  id: string;
  supplier_id: string;
  status: 'draft' | 'sent';
  created_at: Date;
  updated_at: Date;
  sent_at?: Date | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: string;
  unit: string;
  sort_order: number;
  created_at: Date;
}

// Dexie Database
export class AppDatabase extends Dexie {
  suppliers!: Table<Supplier, string>;
  products!: Table<Product, string>;
  orders!: Table<Order, string>;
  orderItems!: Table<OrderItem, string>;

  constructor() {
    super('WarehouseAppDB');
    
    this.version(1).stores({
      suppliers: 'id, name, sort_order, created_at',
      products: 'id, supplier_id, name, sort_order, created_at',
      orders: 'id, supplier_id, status, created_at, updated_at, [supplier_id+status]',
      orderItems: 'id, order_id, product_id, sort_order, created_at, [order_id+product_id]',
    });
  }
}

export const db = new AppDatabase();

// Helper function to generate UUID
export function generateId(): string {
  return crypto.randomUUID();
}
