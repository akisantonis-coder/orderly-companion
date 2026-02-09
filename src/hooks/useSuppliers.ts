import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Supplier } from '@/types';

export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async (): Promise<Supplier[]> => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      return data;
    },
  });
}

export function useSupplier(id: string | undefined) {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: async (): Promise<Supplier | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; email?: string; phone?: string }) => {
      // Get max sort_order
      const { data: maxItem } = await supabase
        .from('suppliers')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextSortOrder = (maxItem?.sort_order ?? -1) + 1;

      const { data: supplier, error } = await supabase
        .from('suppliers')
        .insert({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          sort_order: nextSortOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return supplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; email?: string; phone?: string } }) => {
      const { data: supplier, error } = await supabase
        .from('suppliers')
        .update({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return supplier;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', variables.id] });
    },
  });
}

export function useUpdateSupplierOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suppliers: { id: string; sort_order: number }[]) => {
      const updates = suppliers.map(supplier => 
        supabase
          .from('suppliers')
          .update({ sort_order: supplier.sort_order })
          .eq('id', supplier.id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}
