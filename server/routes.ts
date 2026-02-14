import type { Express } from "express";
import { storage } from "./storage";
import { insertSupplierSchema, insertProductSchema, insertOrderSchema, insertOrderItemSchema } from "@shared/schema";

export function registerRoutes(app: Express) {
  // --- SUPPLIERS ---
  app.get("/api/suppliers", async (_req, res) => {
    const data = await storage.getSuppliers();
    res.json(data);
  });

  app.get("/api/suppliers/:id", async (req, res) => {
    const supplier = await storage.getSupplier(req.params.id);
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });
    res.json(supplier);
  });

  app.post("/api/suppliers", async (req, res) => {
    const parsed = insertSupplierSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const supplier = await storage.createSupplier(parsed.data);
    res.status(201).json(supplier);
  });

  app.patch("/api/suppliers/:id", async (req, res) => {
    const supplier = await storage.updateSupplier(req.params.id, req.body);
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });
    res.json(supplier);
  });

  app.put("/api/suppliers/order", async (req, res) => {
    await storage.updateSupplierOrders(req.body);
    res.json({ success: true });
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    await storage.deleteSupplier(req.params.id);
    res.json({ success: true });
  });

  // --- PRODUCTS ---
  app.get("/api/products", async (req, res) => {
    const supplierId = req.query.supplier_id as string | undefined;
    const data = await storage.getProducts(supplierId);
    res.json(data);
  });

  app.get("/api/products/with-suppliers", async (_req, res) => {
    const data = await storage.getProductsWithSuppliers();
    res.json(data);
  });

  app.get("/api/products/search", async (req, res) => {
    const term = (req.query.q as string || "").trim().slice(0, 100).replace(/[%_]/g, "");
    if (term.length < 2) return res.json([]);
    const data = await storage.searchProducts(term);
    res.json(data);
  });

  app.get("/api/products/duplicates", async (req, res) => {
    const name = req.query.name as string || "";
    const excludeSupplierId = req.query.exclude_supplier_id as string | undefined;
    if (!name || name.length < 2) return res.json([]);
    const data = await storage.findProductDuplicates(name, excludeSupplierId);
    res.json(data);
  });

  app.post("/api/products", async (req, res) => {
    const parsed = insertProductSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const product = await storage.createProduct(parsed.data);
    res.status(201).json(product);
  });

  app.patch("/api/products/:id", async (req, res) => {
    const product = await storage.updateProduct(req.params.id, req.body);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  });

  app.put("/api/products/order", async (req, res) => {
    await storage.updateProductOrders(req.body);
    res.json({ success: true });
  });

  app.delete("/api/products/:id", async (req, res) => {
    await storage.deleteProduct(req.params.id);
    res.json({ success: true });
  });

  // --- ORDERS ---
  app.get("/api/orders/draft", async (_req, res) => {
    const data = await storage.getDraftOrders();
    res.json(data);
  });

  app.get("/api/orders/by-supplier/:supplierId", async (req, res) => {
    const data = await storage.getOrderBySupplierId(req.params.supplierId);
    res.json(data || null);
  });

  app.get("/api/orders/:id", async (req, res) => {
    const order = await storage.getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  });

  app.post("/api/orders", async (req, res) => {
    const parsed = insertOrderSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const order = await storage.createOrder(parsed.data);
    res.status(201).json(order);
  });

  app.patch("/api/orders/:id", async (req, res) => {
    const order = await storage.updateOrder(req.params.id, req.body);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  });

  app.delete("/api/orders/:id", async (req, res) => {
    await storage.deleteOrder(req.params.id);
    res.json({ success: true });
  });

  // --- ORDER ITEMS ---
  app.post("/api/order-items", async (req, res) => {
    const { order_id, product_id, quantity, unit } = req.body;

    const existing = await storage.findExistingOrderItem(order_id, product_id);
    if (existing) {
      const updated = await storage.updateOrderItem(existing.id, {
        quantity: String(Number(existing.quantity) + Number(quantity)),
        unit,
      });
      await storage.updateOrder(order_id, { updated_at: new Date() });
      return res.json(updated);
    }

    const maxSortOrder = await storage.getMaxOrderItemSortOrder(order_id);
    const item = await storage.addOrderItem({
      order_id,
      product_id,
      quantity: String(quantity),
      unit,
      sort_order: maxSortOrder + 1,
    });
    await storage.updateOrder(order_id, { updated_at: new Date() });
    res.status(201).json(item);
  });

  app.patch("/api/order-items/:id", async (req, res) => {
    const item = await storage.updateOrderItem(req.params.id, req.body);
    if (!item) return res.status(404).json({ error: "Order item not found" });
    res.json(item);
  });

  app.put("/api/order-items/order", async (req, res) => {
    await storage.updateOrderItemOrders(req.body);
    res.json({ success: true });
  });

  app.delete("/api/order-items/:id", async (req, res) => {
    await storage.deleteOrderItem(req.params.id);
    res.json({ success: true });
  });

  // --- SEND ORDER (email) ---
  app.post("/api/orders/:id/send", async (req, res) => {
    const order = await storage.getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    await storage.updateOrder(req.params.id, {
      status: "sent",
      sent_at: new Date(),
    });

    res.json({
      success: true,
      message: "Order marked as sent",
    });
  });
}
