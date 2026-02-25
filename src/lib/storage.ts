import { db, generateId, type Supplier, type Product, type Order, type OrderItem, type PdfSettings } from './db';

export interface IStorage {
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(data: Omit<Supplier, 'id' | 'created_at'>): Promise<Supplier>;
  updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier | undefined>;
  updateSupplierOrders(items: { id: string; sort_order: number }[]): Promise<void>;
  deleteSupplier(id: string): Promise<void>;

  getProducts(supplierId?: string): Promise<Product[]>;
  getProductsWithSuppliers(): Promise<(Product & { supplier: Supplier })[]>;
  searchProducts(term: string): Promise<(Product & { supplier: Supplier })[]>;
  findProductDuplicates(name: string, excludeSupplierId?: string): Promise<(Product & { supplier: Supplier })[]>;
  createProduct(data: Omit<Product, 'id' | 'created_at'>): Promise<Product>;
  updateProduct(id: string, data: Partial<Product>): Promise<Product | undefined>;
  updateProductOrders(items: { id: string; sort_order: number }[]): Promise<void>;
  deleteProduct(id: string): Promise<void>;

  getDraftOrders(): Promise<any[]>;
  getOrder(id: string): Promise<any | undefined>;
  getOrderBySupplierId(supplierId: string): Promise<any | undefined>;
  getAllOrders(): Promise<any[]>;
  createOrder(data: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order>;
  updateOrder(id: string, data: Partial<Order>): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<void>;

  getOrderItem(id: string): Promise<OrderItem | undefined>;
  addOrderItem(data: Omit<OrderItem, 'id' | 'created_at'>): Promise<OrderItem>;
  updateOrderItem(id: string, data: Partial<OrderItem>): Promise<OrderItem | undefined>;
  updateOrderItemOrders(items: { id: string; sort_order: number }[]): Promise<void>;
  deleteOrderItem(id: string): Promise<void>;
  findExistingOrderItem(orderId: string, productId: string): Promise<OrderItem | undefined>;
  getMaxOrderItemSortOrder(orderId: string): Promise<number>;

  getPdfSettings(): Promise<PdfSettings>;
  updatePdfSettings(data: Partial<PdfSettings>): Promise<PdfSettings>;

  clearAllData(): Promise<void>;
}

export class IndexedDBStorage implements IStorage {
  async getPdfSettings(): Promise<PdfSettings> {
    let current = await db.settings.get('app');
    if (!current) {
      current = {
        id: 'app',
        pdfIntroduction: '',
        pdfFooter: '',
        updated_at: new Date(),
      };
      await db.settings.add(current);
    }
    return current;
  }

  async updatePdfSettings(data: Partial<PdfSettings>): Promise<PdfSettings> {
    const current = await this.getPdfSettings();
    const updated: PdfSettings = {
      ...current,
      ...data,
      updated_at: new Date(),
    };
    await db.settings.put(updated);
    return updated;
  }

  // ========== SUPPLIERS ==========
  async getSuppliers(): Promise<Supplier[]> {
    return db.suppliers.orderBy('sort_order').toArray();
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    return db.suppliers.get(id);
  }

  async createSupplier(data: Omit<Supplier, 'id' | 'created_at'>): Promise<Supplier> {
    const maxItem = await db.suppliers.orderBy('sort_order').last();
    const nextSortOrder = (maxItem?.sort_order ?? -1) + 1;

    const supplier: Supplier = {
      id: generateId(),
      ...data,
      sort_order: data.sort_order ?? nextSortOrder,
      created_at: new Date(),
    };

    await db.suppliers.add(supplier);
    return supplier;
  }

  async updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier | undefined> {
    const supplier = await db.suppliers.get(id);
    if (!supplier) return undefined;

    const updated = { ...supplier, ...data };
    await db.suppliers.update(id, updated);
    return updated;
  }

  async updateSupplierOrders(items: { id: string; sort_order: number }[]): Promise<void> {
    await db.transaction('rw', db.suppliers, async () => {
      for (const item of items) {
        await db.suppliers.update(item.id, { sort_order: item.sort_order });
      }
    });
  }

  async deleteSupplier(id: string): Promise<void> {
    // Delete related products and orders
    await db.transaction('rw', db.suppliers, db.products, db.orders, db.orderItems, async () => {
      // Delete products
      const products = await db.products.where('supplier_id').equals(id).toArray();
      await db.products.bulkDelete(products.map(p => p.id));

      // Delete orders and their items
      const orders = await db.orders.where('supplier_id').equals(id).toArray();
      for (const order of orders) {
        await db.orderItems.where('order_id').equals(order.id).delete();
      }
      await db.orders.bulkDelete(orders.map(o => o.id));

      // Delete supplier
      await db.suppliers.delete(id);
    });
  }

  // ========== PRODUCTS ==========
  async getProducts(supplierId?: string): Promise<Product[]> {
    if (supplierId) {
      return db.products
        .where('supplier_id')
        .equals(supplierId)
        .sortBy('sort_order');
    }
    return db.products.orderBy('sort_order').toArray();
  }

  async getProductsWithSuppliers(): Promise<(Product & { supplier: Supplier })[]> {
    const products = await db.products.toArray();
    const suppliers = await db.suppliers.toArray();
    const supplierMap = new Map(suppliers.map(s => [s.id, s]));

    return products
      .map(product => ({
        ...product,
        supplier: supplierMap.get(product.supplier_id)!,
      }))
      .filter(p => p.supplier);
  }

  async searchProducts(term: string): Promise<(Product & { supplier: Supplier })[]> {
    const lowerTerm = term.toLowerCase();
    const products = await this.getProductsWithSuppliers();
    
    return products.filter(
      p =>
        p.name.toLowerCase().includes(lowerTerm) ||
        p.supplier.name.toLowerCase().includes(lowerTerm)
    ).slice(0, 20);
  }

  async findProductDuplicates(name: string, excludeSupplierId?: string): Promise<(Product & { supplier: Supplier })[]> {
    const lowerName = name.toLowerCase();
    const products = await this.getProductsWithSuppliers();
    
    return products.filter(
      p =>
        p.name.toLowerCase() === lowerName &&
        (!excludeSupplierId || p.supplier_id !== excludeSupplierId)
    );
  }

  async createProduct(data: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    const product: Product = {
      id: generateId(),
      ...data,
      created_at: new Date(),
    };

    await db.products.add(product);
    return product;
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product | undefined> {
    const product = await db.products.get(id);
    if (!product) return undefined;

    const updated = { ...product, ...data };
    await db.products.update(id, updated);
    return updated;
  }

  async updateProductOrders(items: { id: string; sort_order: number }[]): Promise<void> {
    await db.transaction('rw', db.products, async () => {
      for (const item of items) {
        await db.products.update(item.id, { sort_order: item.sort_order });
      }
    });
  }

  async deleteProduct(id: string): Promise<void> {
    // Delete related order items
    await db.transaction('rw', db.products, db.orderItems, async () => {
      await db.orderItems.where('product_id').equals(id).delete();
      await db.products.delete(id);
    });
  }

  // ========== ORDERS ==========
  async getDraftOrders(): Promise<any[]> {
    const orders = await db.orders
      .where('status')
      .equals('draft')
      .sortBy('updated_at');
    
    return Promise.all(
      orders.map(async order => {
        const supplier = await db.suppliers.get(order.supplier_id);
        const items = await db.orderItems
          .where('order_id')
          .equals(order.id)
          .sortBy('sort_order');
        
        const itemsWithProducts = await Promise.all(
          items.map(async item => {
            const product = await db.products.get(item.product_id);
            return { ...item, product };
          })
        );

        return {
          ...order,
          supplier,
          items: itemsWithProducts,
        };
      })
    );
  }

  async getOrder(id: string): Promise<any | undefined> {
    const order = await db.orders.get(id);
    if (!order) return undefined;

    const supplier = await db.suppliers.get(order.supplier_id);
    const items = await db.orderItems
      .where('order_id')
      .equals(id)
      .sortBy('sort_order');
    
    const itemsWithProducts = await Promise.all(
      items.map(async item => {
        const product = await db.products.get(item.product_id);
        return { ...item, product };
      })
    );

    return {
      ...order,
      supplier,
      items: itemsWithProducts,
    };
  }

  async getOrderBySupplierId(supplierId: string): Promise<any | undefined> {
    // Find draft order for this supplier
    const orders = await db.orders
      .where('supplier_id')
      .equals(supplierId)
      .toArray();
    
    const draftOrder = orders.find(order => order.status === 'draft');
    if (!draftOrder) return undefined;
    
    return this.getOrder(draftOrder.id);
  }

  async createOrder(data: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> {
    const now = new Date();
    const order: Order = {
      id: generateId(),
      ...data,
      created_at: now,
      updated_at: now,
    };

    await db.orders.add(order);
    return order;
  }

  async updateOrder(id: string, data: Partial<Order>): Promise<Order | undefined> {
    const order = await db.orders.get(id);
    if (!order) return undefined;

    const updated = {
      ...order,
      ...data,
      updated_at: new Date(),
    };
    await db.orders.update(id, updated);
    return updated;
  }

  async deleteOrder(id: string): Promise<void> {
    await db.transaction('rw', db.orders, db.orderItems, async () => {
      await db.orderItems.where('order_id').equals(id).delete();
      await db.orders.delete(id);
    });
  }

  // ========== ORDER ITEMS ==========
  async getOrderItem(id: string): Promise<OrderItem | undefined> {
    return db.orderItems.get(id);
  }

  async addOrderItem(data: Omit<OrderItem, 'id' | 'created_at'>): Promise<OrderItem> {
    const item: OrderItem = {
      id: generateId(),
      ...data,
      created_at: new Date(),
    };

    await db.orderItems.add(item);
    return item;
  }

  async updateOrderItem(id: string, data: Partial<OrderItem>): Promise<OrderItem | undefined> {
    const item = await db.orderItems.get(id);
    if (!item) return undefined;

    const updated = { ...item, ...data };
    await db.orderItems.update(id, updated);
    return updated;
  }

  async updateOrderItemOrders(items: { id: string; sort_order: number }[]): Promise<void> {
    await db.transaction('rw', db.orderItems, async () => {
      for (const item of items) {
        await db.orderItems.update(item.id, { sort_order: item.sort_order });
      }
    });
  }

  async deleteOrderItem(id: string): Promise<void> {
    await db.orderItems.delete(id);
  }

  async findExistingOrderItem(orderId: string, productId: string): Promise<OrderItem | undefined> {
    return db.orderItems
      .where('[order_id+product_id]')
      .equals([orderId, productId])
      .first();
  }

  async getMaxOrderItemSortOrder(orderId: string): Promise<number> {
    const items = await db.orderItems
      .where('order_id')
      .equals(orderId)
      .sortBy('sort_order');
    
    if (items.length === 0) return -1;
    return items[items.length - 1].sort_order;
  }

  async getAllOrders(): Promise<any[]> {
    return db.orders.toArray();
  }

  async clearAllData(): Promise<void> {
    await db.transaction('rw', db.suppliers, db.products, db.orders, db.orderItems, async () => {
      await db.suppliers.clear();
      await db.products.clear();
      await db.orders.clear();
      await db.orderItems.clear();
    });
  }
}

export const storage = new IndexedDBStorage();
