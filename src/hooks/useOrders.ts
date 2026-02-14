import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { Order, OrderItem, OrderWithDetails, UnitAbbreviation } from '@/types';

export function useDraftOrders() {
  return useQuery({
    queryKey: ['draft-orders'],
    queryFn: async (): Promise<OrderWithDetails[]> => {
      const data = await apiRequest('GET', '/api/orders/draft');
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
      const data = await apiRequest('GET', `/api/orders/${orderId}`);
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
      const data = await apiRequest('GET', `/api/orders/by-supplier/${supplierId}`);
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
      const data = await apiRequest('POST', '/api/orders', { supplier_id: supplierId });
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
      const data = await apiRequest('POST', '/api/order-items', {
        order_id: orderId,
        product_id: productId,
        quantity,
        unit,
      });
      return { ...data, quantity: Number(data.quantity), unit: data.unit as UnitAbbreviation };
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

      const data = await apiRequest('PATCH', `/api/order-items/${itemId}`, updateData);
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
      return apiRequest('PUT', '/api/order-items/order', items);
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
      await apiRequest('DELETE', `/api/order-items/${itemId}`);
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
      await apiRequest('DELETE', `/api/orders/${orderId}`);
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
      return apiRequest('POST', `/api/orders/${orderId}/send`, { userEmail, customMessage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
      queryClient.invalidateQueries({ queryKey: ['order-by-supplier'] });
    },
  });
}
