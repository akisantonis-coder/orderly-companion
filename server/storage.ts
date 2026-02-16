import { suppliers, products, orders, orderItems } from "@shared/schema";
import type { Supplier, InsertSupplier, Product, InsertProduct, Order, InsertOrder, OrderItem, InsertOrderItem } from "@shared/schema";
import { db } from "./db";
import { eq, and, ilike, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(data: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, data: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  updateSupplierOrders(items: { id: string; sort_order: number }[]): Promise<void>;
  deleteSupplier(id: string): Promise<void>;

  getProducts(supplierId?: string): Promise<Product[]>;
  getProductsWithSuppliers(): Promise<(Product & { supplier: Supplier })[]>;
  searchProducts(term: string): Promise<(Product & { supplier: Supplier })[]>;
  findProductDuplicates(name: string, excludeSupplierId?: string): Promise<(Product & { supplier: Supplier })[]>;
  createProduct(data: InsertProduct): Promise<Product>;
  updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product | undefined>;
  updateProductOrders(items: { id: string; sort_order: number }[]): Promise<void>;
  deleteProduct(id: string): Promise<void>;

  getDraftOrders(): Promise<any[]>;
  getOrder(id: string): Promise<any | undefined>;
  getOrderBySupplierId(supplierId: string): Promise<any | undefined>;
  createOrder(data: InsertOrder): Promise<Order>;
  updateOrder(id: string, data: Partial<Order>): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<void>;

  getOrderItem(id: string): Promise<OrderItem | undefined>;
  addOrderItem(data: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: string, data: Partial<InsertOrderItem>): Promise<OrderItem | undefined>;
  updateOrderItemOrders(items: { id: string; sort_order: number }[]): Promise<void>;
  deleteOrderItem(id: string): Promise<void>;
  findExistingOrderItem(orderId: string, productId: string): Promise<OrderItem | undefined>;
  getMaxOrderItemSortOrder(orderId: string): Promise<number>;
  getSettings(): Promise<Settings>;
  updateSettings(data: Partial<InsertSettings>): Promise<Settings>;
}

export class DatabaseStorage implements IStorage {
  async getSettings(): Promise<Settings> {
    const [item] = await db.select().from(settings).where(eq(settings.id, 1));
    if (!item) {
      const [newItem] = await db.insert(settings).values({ id: 1 }).returning();
      return newItem;
    }
    return item;
  }

  async updateSettings(data: Partial<InsertSettings>): Promise<Settings> {
    const [item] = await db.update(settings)
      .set({ ...data, updated_at: new Date() })
      .where(eq(settings.id, 1))
      .returning();
    return item;
  }
  async getSuppliers(): Promise<Supplier[]> {
    return db.select().from(suppliers).orderBy(asc(suppliers.sort_order));
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier || undefined;
  }

  async createSupplier(data: InsertSupplier): Promise<Supplier> {
    const [maxItem] = await db.select({ max: sql<number>`COALESCE(MAX(${suppliers.sort_order}), -1)` }).from(suppliers);
    const nextSortOrder = (maxItem?.max ?? -1) + 1;

    const [supplier] = await db.insert(suppliers).values({
      ...data,
      sort_order: data.sort_order ?? nextSortOrder,
    }).returning();
    return supplier;
  }

  async updateSupplier(id: string, data: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [supplier] = await db.update(suppliers).set(data).where(eq(suppliers.id, id)).returning();
    return supplier || undefined;
  }

  async updateSupplierOrders(items: { id: string; sort_order: number }[]): Promise<void> {
    for (const item of items) {
      await db.update(suppliers).set({ sort_order: item.sort_order }).where(eq(suppliers.id, item.id));
    }
  }

  async deleteSupplier(id: string): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }

  async getProducts(supplierId?: string): Promise<Product[]> {
    if (supplierId) {
      return db.select().from(products)
        .where(eq(products.supplier_id, supplierId))
        .orderBy(asc(products.sort_order), asc(products.name));
    }
    return db.select().from(products).orderBy(asc(products.sort_order), asc(products.name));
  }

  async getProductsWithSuppliers(): Promise<(Product & { supplier: Supplier })[]> {
    const result = await db.query.products.findMany({
      with: { supplier: true },
      orderBy: [asc(products.name)],
    });
    return result as (Product & { supplier: Supplier })[];
  }

  async searchProducts(term: string): Promise<(Product & { supplier: Supplier })[]> {
    const result = await db.query.products.findMany({
      where: ilike(products.name, `%${term}%`),
      with: { supplier: true },
      orderBy: [asc(products.name)],
      limit: 20,
    });
    return result as (Product & { supplier: Supplier })[];
  }

  async findProductDuplicates(name: string, excludeSupplierId?: string): Promise<(Product & { supplier: Supplier })[]> {
    const conditions = [ilike(products.name, name)];
    if (excludeSupplierId) {
      conditions.push(sql`${products.supplier_id} != ${excludeSupplierId}`);
    }
    const result = await db.query.products.findMany({
      where: and(...conditions),
      with: { supplier: true },
    });
    return result as (Product & { supplier: Supplier })[];
  }

  async createProduct(data: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(data).returning();
    return product;
  }

  async updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    return product || undefined;
  }

  async updateProductOrders(items: { id: string; sort_order: number }[]): Promise<void> {
    for (const item of items) {
      await db.update(products).set({ sort_order: item.sort_order }).where(eq(products.id, item.id));
    }
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getDraftOrders(): Promise<any[]> {
    const result = await db.query.orders.findMany({
      where: eq(orders.status, "draft"),
      with: {
        supplier: true,
        items: {
          with: { product: true },
          orderBy: [asc(orderItems.sort_order)],
        },
      },
      orderBy: [desc(orders.updated_at)],
    });
    return result;
  }

  async getOrder(id: string): Promise<any | undefined> {
    const result = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        supplier: true,
        items: {
          with: { product: true },
          orderBy: [asc(orderItems.sort_order)],
        },
      },
    });
    return result || undefined;
  }

  async getOrderBySupplierId(supplierId: string): Promise<any | undefined> {
    const result = await db.query.orders.findFirst({
      where: and(eq(orders.supplier_id, supplierId), eq(orders.status, "draft")),
      with: {
        supplier: true,
        items: {
          with: { product: true },
          orderBy: [asc(orderItems.sort_order)],
        },
      },
    });
    return result || undefined;
  }

  async createOrder(data: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(data).returning();
    return order;
  }

  async updateOrder(id: string, data: Partial<Order>): Promise<Order | undefined> {
    const [order] = await db.update(orders).set(data).where(eq(orders.id, id)).returning();
    return order || undefined;
  }

  async deleteOrder(id: string): Promise<void> {
    await db.delete(orders).where(eq(orders.id, id));
  }

  async getOrderItem(id: string): Promise<OrderItem | undefined> {
    const [item] = await db.select().from(orderItems).where(eq(orderItems.id, id));
    return item || undefined;
  }

  async addOrderItem(data: InsertOrderItem): Promise<OrderItem> {
    const [item] = await db.insert(orderItems).values(data).returning();
    return item;
  }

  async updateOrderItem(id: string, data: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    const [item] = await db.update(orderItems).set(data).where(eq(orderItems.id, id)).returning();
    return item || undefined;
  }

  async updateOrderItemOrders(items: { id: string; sort_order: number }[]): Promise<void> {
    for (const item of items) {
      await db.update(orderItems).set({ sort_order: item.sort_order }).where(eq(orderItems.id, item.id));
    }
  }

  async deleteOrderItem(id: string): Promise<void> {
    await db.delete(orderItems).where(eq(orderItems.id, id));
  }

  async findExistingOrderItem(orderId: string, productId: string): Promise<OrderItem | undefined> {
    const [item] = await db.select().from(orderItems)
      .where(and(eq(orderItems.order_id, orderId), eq(orderItems.product_id, productId)));
    return item || undefined;
  }

  async getMaxOrderItemSortOrder(orderId: string): Promise<number> {
    const [result] = await db.select({ max: sql<number>`COALESCE(MAX(${orderItems.sort_order}), -1)` })
      .from(orderItems).where(eq(orderItems.order_id, orderId));
    return result?.max ?? -1;
  }
}

export const storage = new DatabaseStorage();
