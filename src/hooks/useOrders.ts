import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Order, OrderItem, OrderWithDetails, UnitAbbreviation } from '@/types';

export function useDraftOrders() {
  return useQuery({
    queryKey: ['draft-orders'],
    queryFn: async (): Promise<OrderWithDetails[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          supplier:suppliers(*),
          items:order_items(
            *,
            product:products(*)
          )
        `)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      return data.map(order => ({
        ...order,
        status: order.status as Order['status'],
        supplier: order.supplier,
        items: order.items
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((item: any) => ({
            ...item,
            unit: item.unit as UnitAbbreviation,
            product: {
              ...item.product,
              unit: item.product.unit as UnitAbbreviation
            }
          }))
      })) as OrderWithDetails[];
    },
  });
}

export function useOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async (): Promise<OrderWithDetails | null> => {
      if (!orderId) return null;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          supplier:suppliers(*),
          items:order_items(
            *,
            product:products(*)
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      
      return {
        ...data,
        status: data.status as Order['status'],
        supplier: data.supplier,
        items: data.items
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((item: any) => ({
            ...item,
            unit: item.unit as UnitAbbreviation,
            product: {
              ...item.product,
              unit: item.product.unit as UnitAbbreviation
            }
          }))
      } as OrderWithDetails;
    },
    enabled: !!orderId,
  });
}

export function useOrderBySupplierId(supplierId: string | undefined) {
  return useQuery({
    queryKey: ['order-by-supplier', supplierId],
    queryFn: async (): Promise<OrderWithDetails | null> => {
      if (!supplierId) return null;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          supplier:suppliers(*),
          items:order_items(
            *,
            product:products(*)
          )
        `)
        .eq('supplier_id', supplierId)
        .eq('status', 'draft')
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        status: data.status as Order['status'],
        supplier: data.supplier,
        items: data.items
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((item: any) => ({
            ...item,
            unit: item.unit as UnitAbbreviation,
            product: {
              ...item.product,
              unit: item.product.unit as UnitAbbreviation
            }
          }))
      } as OrderWithDetails;
    },
    enabled: !!supplierId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplierId: string): Promise<Order> => {
      const { data, error } = await supabase
        .from('orders')
        .insert({ supplier_id: supplierId })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        status: data.status as Order['status']
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-by-supplier'] });
    },
  });
}

export function useAddOrderItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      orderId, 
      productId, 
      quantity,
      unit 
    }: { 
      orderId: string; 
      productId: string; 
      quantity: number;
      unit: UnitAbbreviation;
    }): Promise<OrderItem> => {
      // Check if item already exists
      const { data: existing } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
        .eq('product_id', productId)
        .maybeSingle();

      if (existing) {
        // Update existing item quantity and unit
        const { data, error } = await supabase
          .from('order_items')
          .update({ 
            quantity: existing.quantity + quantity,
            unit 
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return { ...data, unit: data.unit as UnitAbbreviation };
      }

      // Get max sort_order for new item
      const { data: maxItem } = await supabase
        .from('order_items')
        .select('sort_order')
        .eq('order_id', orderId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextSortOrder = (maxItem?.sort_order ?? -1) + 1;

      // Create new item with unit
      const { data, error } = await supabase
        .from('order_items')
        .insert({ 
          order_id: orderId, 
          product_id: productId, 
          quantity,
          unit,
          sort_order: nextSortOrder
        })
        .select()
        .single();

      if (error) throw error;

      // Update order timestamp
      await supabase
        .from('orders')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', orderId);

      return { ...data, unit: data.unit as UnitAbbreviation };
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['draft-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-by-supplier'] });
    },
  });
}

export function useUpdateOrderItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      itemId, 
      quantity,
      unit 
    }: { 
      itemId: string; 
      quantity: number;
      unit?: UnitAbbreviation;
    }): Promise<OrderItem> => {
      const updateData: { quantity: number; unit?: string } = { quantity };
      if (unit) updateData.unit = unit;

      const { data, error } = await supabase
        .from('order_items')
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return { ...data, unit: data.unit as UnitAbbreviation };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order'] });
      queryClient.invalidateQueries({ queryKey: ['draft-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-by-supplier'] });
    },
  });
}

export function useUpdateOrderItemsOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      const updates = items.map(item => 
        supabase
          .from('order_items')
          .update({ sort_order: item.sort_order })
          .eq('id', item.id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order'] });
      queryClient.invalidateQueries({ queryKey: ['draft-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-by-supplier'] });
    },
  });
}

export function useDeleteOrderItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string): Promise<void> => {
      const { error } = await supabase
        .from('order_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order'] });
      queryClient.invalidateQueries({ queryKey: ['draft-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-by-supplier'] });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string): Promise<void> => {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-by-supplier'] });
    },
  });
}

export function useSendOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      orderId, 
      userEmail,
      customMessage
    }: { 
      orderId: string; 
      userEmail: string;
      customMessage?: string;
    }): Promise<{ success: boolean; userEmail?: string }> => {
      const { data, error } = await supabase.functions.invoke('send-order-email', {
        body: { orderId, userEmail, customMessage }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
      queryClient.invalidateQueries({ queryKey: ['order-by-supplier'] });
    },
  });
}
