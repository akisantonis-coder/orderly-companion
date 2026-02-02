import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product, ProductWithSupplier, UnitAbbreviation } from '@/types';

export function useProducts(supplierId?: string) {
  return useQuery({
    queryKey: ['products', supplierId],
    queryFn: async (): Promise<Product[]> => {
      let query = supabase
        .from('products')
        .select('*')
        .order('name');

      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data.map(p => ({
        ...p,
        unit: p.unit as UnitAbbreviation
      }));
    },
  });
}

export function useProductsWithSuppliers() {
  return useQuery({
    queryKey: ['products-with-suppliers'],
    queryFn: async (): Promise<ProductWithSupplier[]> => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .order('name');

      if (error) throw error;
      
      return data.map(p => ({
        ...p,
        unit: p.unit as UnitAbbreviation,
        supplier: p.supplier as ProductWithSupplier['supplier']
      }));
    },
  });
}

export function useProductSearch(searchTerm: string) {
  return useQuery({
    queryKey: ['product-search', searchTerm],
    queryFn: async (): Promise<ProductWithSupplier[]> => {
      if (!searchTerm.trim()) return [];

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .ilike('name', `%${searchTerm}%`)
        .order('name')
        .limit(20);

      if (error) throw error;
      
      return data.map(p => ({
        ...p,
        unit: p.unit as UnitAbbreviation,
        supplier: p.supplier as ProductWithSupplier['supplier']
      }));
    },
    enabled: searchTerm.trim().length >= 2,
  });
}
