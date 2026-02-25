import Dexie, { type Table } from 'dexie';

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  sort_order: number;
  created_at: Date;
}

export interface Product {
  id: string;
  supplier_id: string;
  name: string;
  unit: string;
  sort_order: number;
  created_at: Date;
}

export interface Order {
  id: string;
  supplier_id: string;
  status: 'pending' | 'sent';
  custom_text?: string;
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

export class AppDatabase extends Dexie {
  suppliers!: Table<Supplier>;
  products!: Table<Product>;
  orders!: Table<Order>;
  orderItems!: Table<OrderItem>;

  constructor() {
    super('WarehouseAppDB');
    this.version(2).stores({
      suppliers: 'id, name, sort_order',
      products: 'id, supplier_id, name, sort_order',
      orders: 'id, supplier_id, status, created_at',
      orderItems: 'id, order_id, product_id, [order_id+product_id]',
    });
  }
}

export const db = new AppDatabase();

export async function exportDatabase() {
  const suppliers = await db.suppliers.toArray();
  const products = await db.products.toArray();
  return JSON.stringify({ suppliers, products, version: 1 }, null, 2);
}

export async function importDatabase(jsonData: string) {
  const data = JSON.parse(jsonData);
  await db.transaction('rw', [db.suppliers, db.products], async () => {
    await db.suppliers.bulkPut(data.suppliers);
    await db.products.bulkPut(data.products);
  });
}

export function generateId(): string {
  return crypto.randomUUID();
}