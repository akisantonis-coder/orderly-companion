import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storage } from '@/lib/storage';
import type { Order, OrderItem, OrderWithDetails, UnitAbbreviation } from '@/types';

export function useDraftOrders() {
  return useQuery({
    queryKey: ['draft-orders'],
    queryFn: async (): Promise<OrderWithDetails[]> => {
      const data = await storage.getDraftOrders();
      return data.map((order: any) => ({
        ...order,
        status: order.status as Order['status'],
        supplier: order.supplier,
        items: (order.items || []).map((item: any) => ({
          ...item,
          quantity: Number(item.quantity),
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
      const data = await storage.getOrder(orderId);
      if (!data) return null;
      return {
        ...data,
        status: data.status as Order['status'],
        supplier: data.supplier,
        items: (data.items || []).map((item: any) => ({
          ...item,
          quantity: Number(item.quantity),
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
      const data = await storage.getOrderBySupplierId(supplierId);
      if (!data) return null;
      return {
        ...data,
        status: data.status as Order['status'],
        supplier: data.supplier,
        items: (data.items || []).map((item: any) => ({
          ...item,
          quantity: Number(item.quantity),
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
      const data = await storage.createOrder({ 
        supplier_id: supplierId,
        status: 'draft',
      });
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
      const existing = await storage.findExistingOrderItem(orderId, productId);
      
      if (existing) {
        // Update existing item
        const updated = await storage.updateOrderItem(existing.id, {
          quantity: String(Number(existing.quantity) + quantity),
          unit,
        });
        // Update order timestamp
        await storage.updateOrder(orderId, { updated_at: new Date() });
        return { ...updated, quantity: Number(updated.quantity), unit: updated.unit as UnitAbbreviation };
      }

      // Create new item
      const maxSortOrder = await storage.getMaxOrderItemSortOrder(orderId);
      const item = await storage.addOrderItem({
        order_id: orderId,
        product_id: productId,
        quantity: String(quantity),
        unit,
        sort_order: maxSortOrder + 1,
      });
      
      // Update order timestamp
      await storage.updateOrder(orderId, { updated_at: new Date() });
      
      return { ...item, quantity: Number(item.quantity), unit: item.unit as UnitAbbreviation };
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
      const updateData: any = { quantity: String(quantity) };
      if (unit) updateData.unit = unit;

      const data = await storage.updateOrderItem(itemId, updateData);
      if (!data) throw new Error('Order item not found');
      
      // Update order timestamp
      const orderItem = await storage.getOrderItem(itemId);
      if (orderItem) {
        await storage.updateOrder(orderItem.order_id, { updated_at: new Date() });
      }
      
      return { ...data, quantity: Number(data.quantity), unit: data.unit as UnitAbbreviation };
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
      await storage.updateOrderItemOrders(items);
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
      const item = await storage.getOrderItem(itemId);
      await storage.deleteOrderItem(itemId);
      
      // Update order timestamp
      if (item) {
        await storage.updateOrder(item.order_id, { updated_at: new Date() });
      }
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
      await storage.deleteOrder(orderId);
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
      // Mark order as sent (offline - no email sending)
      await storage.updateOrder(orderId, {
        status: 'sent',
        sent_at: new Date(),
      });
      
      return { success: true, userEmail };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
      queryClient.invalidateQueries({ queryKey: ['order-by-supplier'] });
    },
  });
}
