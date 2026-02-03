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
