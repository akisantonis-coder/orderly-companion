import Dexie, { type Table } from 'dexie';

// Types - Προσθέτουμε την υποστήριξη για τα νέα πεδία (PDF texts)
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
  // Προσθήκη για το Σημείο 8 (Custom PDF texts ανά παραγγελία αν χρειαστεί)
  pdf_intro?: string;
  pdf_footer?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: string;
  unit: string; // Σημείο 5: Δυνατότητα αλλαγής μονάδας
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
    
    // Version 2: Προσθέτουμε indexes για καλύτερη αναζήτηση (Σημείο 3)
    this.version(2).stores({
      suppliers: 'id, name, sort_order',
      products: 'id, supplier_id, name, sort_order',
      orders: 'id, supplier_id, status, created_at',
      orderItems: 'id, order_id, product_id, [order_id+product_id]',
    });
  }
}

export const db = new AppDatabase();

// Helper functions για το Backup (Σημείο 9)
export async function exportDatabase() {
  const suppliers = await db.suppliers.toArray();
  const products = await db.products.toArray();
  const data = {
    suppliers,
    products,
    timestamp: new Date().toISOString(),
    version: 1
  };
  return JSON.stringify(data, null, 2);
}

export async function importDatabase(jsonData: string) {
  const data = JSON.parse(jsonData);
  if (!data.suppliers || !data.products) throw new Error('Invalid backup file');
  
  await db.transaction('rw', [db.suppliers, db.products], async () => {
    // Χρησιμοποιούμε bulkPut για να κάνει update αν υπάρχει ήδη το ID ή insert αν είναι νέο
    await db.suppliers.bulkPut(data.suppliers);
    await db.products.bulkPut(data.products);
  });
}

export function generateId(): string {
  return crypto.randomUUID();
}