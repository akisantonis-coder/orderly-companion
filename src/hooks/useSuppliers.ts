import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storage } from '@/lib/storage';
import type { Supplier } from '@/types';

export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async (): Promise<Supplier[]> => {
      return storage.getSuppliers();
    },
  });
}

export function useSupplier(id: string | undefined) {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: async (): Promise<Supplier | null> => {
      if (!id) return null;
      const supplier = await storage.getSupplier(id);
      return supplier || null;
    },
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; email?: string; phone?: string }) => {
      console.log('[useCreateSupplier] Creating supplier with data:', data);
      try {
        const result = await storage.createSupplier({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          sort_order: 0,
        });
        console.log('[useCreateSupplier] Supplier created successfully:', result);
        return result;
      } catch (error: any) {
        console.error('[useCreateSupplier] Error creating supplier:', error);
        console.error('[useCreateSupplier] Error message:', error?.message);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[useCreateSupplier] Invalidating suppliers query');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (error: any) => {
      console.error('[useCreateSupplier] Mutation error:', error);
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; email?: string; phone?: string } }) => {
      return storage.updateSupplier(id, {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
      });
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
      await storage.updateSupplierOrders(suppliers);
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
      await storage.deleteSupplier(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}
