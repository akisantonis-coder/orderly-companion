import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product, ProductWithSupplier, UnitAbbreviation } from '@/types';

export function useProducts(supplierId?: string) {
  return useQuery({
    queryKey: ['products', supplierId],
    queryFn: async (): Promise<Product[]> => {
      let query = supabase
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

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

export function useUpdateProductOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (products: { id: string; sort_order: number }[]) => {
      // Update all products in a single batch
      const updates = products.map(p => 
        supabase
          .from('products')
          .update({ sort_order: p.sort_order })
          .eq('id', p.id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-with-suppliers'] });
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
  // Sanitize and validate search input
  const sanitizedTerm = searchTerm
    .trim()
    .slice(0, 100) // Max 100 characters
    .replace(/[%_]/g, ''); // Remove LIKE wildcards that could affect query

  return useQuery({
    queryKey: ['product-search', sanitizedTerm],
    queryFn: async (): Promise<ProductWithSupplier[]> => {
      if (sanitizedTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .ilike('name', `%${sanitizedTerm}%`)
        .order('name')
        .limit(20);

      if (error) throw error;
      
      return data.map(p => ({
        ...p,
        unit: p.unit as UnitAbbreviation,
        supplier: p.supplier as ProductWithSupplier['supplier']
      }));
    },
    enabled: sanitizedTerm.length >= 2 && sanitizedTerm.length <= 100,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; supplier_id: string; unit: UnitAbbreviation }) => {
      const { data: product, error } = await supabase
        .from('products')
        .insert({
          name: data.name,
          supplier_id: data.supplier_id,
          unit: data.unit,
        })
        .select()
        .single();

      if (error) throw error;
      return product;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', variables.supplier_id] });
      queryClient.invalidateQueries({ queryKey: ['products-with-suppliers'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; unit: UnitAbbreviation } }) => {
      const { data: product, error } = await supabase
        .from('products')
        .update({
          name: data.name,
          unit: data.unit,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-with-suppliers'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-with-suppliers'] });
    },
  });
}
