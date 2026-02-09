import { useState, useEffect, useCallback } from 'react';
import type { Product, Supplier, UnitAbbreviation } from '@/types';

const OFFLINE_ORDERS_KEY = 'offline_orders';
const OFFLINE_SUPPLIERS_KEY = 'offline_suppliers';
const OFFLINE_PRODUCTS_KEY = 'offline_products';

export interface OfflineOrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit: UnitAbbreviation;
  sort_order: number;
  product: {
    id: string;
    name: string;
    unit: UnitAbbreviation;
  };
}

export interface OfflineOrder {
  id: string;
  supplier_id: string;
  supplier: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
  items: OfflineOrderItem[];
  created_at: string;
  updated_at: string;
}

function generateId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function useOfflineOrders() {
  const [offlineOrders, setOfflineOrders] = useState<OfflineOrder[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Load orders from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(OFFLINE_ORDERS_KEY);
    if (stored) {
      try {
        setOfflineOrders(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing offline orders:', e);
      }
    }
  }, []);

  // Save orders to localStorage
  useEffect(() => {
    localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(offlineOrders));
  }, [offlineOrders]);

  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const createOfflineOrder = useCallback((supplier: Supplier): OfflineOrder => {
    const newOrder: OfflineOrder = {
      id: generateId(),
      supplier_id: supplier.id,
      supplier: {
        id: supplier.id,
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
      },
      items: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setOfflineOrders(prev => [...prev, newOrder]);
    return newOrder;
  }, []);

  const addOfflineOrderItem = useCallback((
    orderId: string,
    product: Product,
    quantity: number,
    unit: UnitAbbreviation
  ) => {
    setOfflineOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      
      const existingItem = order.items.find(item => item.product_id === product.id);
      
      if (existingItem) {
        return {
          ...order,
          updated_at: new Date().toISOString(),
          items: order.items.map(item =>
            item.product_id === product.id
              ? { ...item, quantity: item.quantity + quantity, unit }
              : item
          ),
        };
      }

      const maxSortOrder = Math.max(...order.items.map(i => i.sort_order), -1);
      
      const newItem: OfflineOrderItem = {
        id: generateId(),
        product_id: product.id,
        quantity,
        unit,
        sort_order: maxSortOrder + 1,
        product: {
          id: product.id,
          name: product.name,
          unit: product.unit,
        },
      };

      return {
        ...order,
        updated_at: new Date().toISOString(),
        items: [...order.items, newItem],
      };
    }));
  }, []);

  const updateOfflineOrderItem = useCallback((
    orderId: string, 
    itemId: string, 
    quantity: number,
    unit?: UnitAbbreviation
  ) => {
    setOfflineOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      return {
        ...order,
        updated_at: new Date().toISOString(),
        items: order.items.map(item =>
          item.id === itemId 
            ? { ...item, quantity, ...(unit && { unit }) } 
            : item
        ),
      };
    }));
  }, []);

  const updateOfflineOrderItemsOrder = useCallback((
    orderId: string,
    itemUpdates: { id: string; sort_order: number }[]
  ) => {
    setOfflineOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      return {
        ...order,
        updated_at: new Date().toISOString(),
        items: order.items.map(item => {
          const update = itemUpdates.find(u => u.id === item.id);
          return update ? { ...item, sort_order: update.sort_order } : item;
        }).sort((a, b) => a.sort_order - b.sort_order),
      };
    }));
  }, []);

  const deleteOfflineOrderItem = useCallback((orderId: string, itemId: string) => {
    setOfflineOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      return {
        ...order,
        updated_at: new Date().toISOString(),
        items: order.items.filter(item => item.id !== itemId),
      };
    }));
  }, []);

  const deleteOfflineOrder = useCallback((orderId: string) => {
    setOfflineOrders(prev => prev.filter(order => order.id !== orderId));
  }, []);

  const getOfflineOrderBySupplierId = useCallback((supplierId: string): OfflineOrder | undefined => {
    return offlineOrders.find(order => order.supplier_id === supplierId);
  }, [offlineOrders]);

  const clearOfflineOrder = useCallback((orderId: string) => {
    setOfflineOrders(prev => prev.filter(order => order.id !== orderId));
  }, []);

  return {
    offlineOrders,
    isOnline,
    createOfflineOrder,
    addOfflineOrderItem,
    updateOfflineOrderItem,
    updateOfflineOrderItemsOrder,
    deleteOfflineOrderItem,
    deleteOfflineOrder,
    getOfflineOrderBySupplierId,
    clearOfflineOrder,
  };
}

// Offline storage for suppliers
export function useOfflineSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(OFFLINE_SUPPLIERS_KEY);
    if (stored) {
      try {
        setSuppliers(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing offline suppliers:', e);
      }
    }
  }, []);

  const cacheSuppliers = useCallback((newSuppliers: Supplier[]) => {
    setSuppliers(newSuppliers);
    localStorage.setItem(OFFLINE_SUPPLIERS_KEY, JSON.stringify(newSuppliers));
  }, []);

  return { cachedSuppliers: suppliers, cacheSuppliers };
}

// Offline storage for products
export function useOfflineProducts() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(OFFLINE_PRODUCTS_KEY);
    if (stored) {
      try {
        setProducts(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing offline products:', e);
      }
    }
  }, []);

  const cacheProducts = useCallback((newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem(OFFLINE_PRODUCTS_KEY, JSON.stringify(newProducts));
  }, []);

  return { cachedProducts: products, cacheProducts };
}
