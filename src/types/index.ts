// Core types for the warehouse order management app

export interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  sort_order?: number;
}

export interface Product {
  id: string;
  name: string;
  supplier_id: string;
  unit: UnitAbbreviation;
  created_at: string;
  sort_order?: number;
  supplier?: Supplier;
}

export interface Order {
  id: string;
  supplier_id: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  supplier?: Supplier;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit: UnitAbbreviation;
  sort_order: number;
  created_at: string;
  product?: Product;
}

export type OrderStatus = 'draft' | 'sent' | 'confirmed' | 'cancelled';

// Unit abbreviations used during editing
export type UnitAbbreviation = 'κιβ' | 'τεμ' | 'παλ' | 'kg';

// Unit full names for final order
export const UNIT_FULL_NAMES: Record<UnitAbbreviation, string> = {
  'κιβ': 'κιβώτια',
  'τεμ': 'τεμάχια',
  'παλ': 'παλέτες',
  'kg': 'κιλά',
};

// Helper to get full unit name
export function getFullUnitName(unit: UnitAbbreviation, quantity: number): string {
  // Handle singular forms if needed
  if (quantity === 1) {
    const singularForms: Record<UnitAbbreviation, string> = {
      'κιβ': 'κιβώτιο',
      'τεμ': 'τεμάχιο',
      'παλ': 'παλέτα',
      'kg': 'κιλό',
    };
    return singularForms[unit];
  }
  return UNIT_FULL_NAMES[unit];
}

// Order with supplier and items populated
export interface OrderWithDetails extends Order {
  supplier: Supplier;
  items: (OrderItem & { product: Product })[];
}

// Product search result
export interface ProductWithSupplier extends Product {
  supplier: Supplier;
}

// Order item with product populated
export type OrderItemWithProduct = OrderItem & { product: Product };
