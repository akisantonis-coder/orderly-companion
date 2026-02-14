import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { Product, ProductWithSupplier, UnitAbbreviation } from '@/types';

export function useProducts(supplierId?: string) {
  return useQuery({
    queryKey: ['products', supplierId],
    queryFn: async (): Promise<Product[]> => {
      const url = supplierId
        ? `/api/products?supplier_id=${supplierId}`
        : '/api/products';
      const data = await apiRequest('GET', url);
      return data.map((p: any) => ({
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
      return apiRequest('PUT', '/api/products/order', products);
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
      const data = await apiRequest('GET', '/api/products/with-suppliers');
      return data.map((p: any) => ({
        ...p,
        unit: p.unit as UnitAbbreviation,
        supplier: p.supplier as ProductWithSupplier['supplier']
      }));
    },
  });
}

export function useProductSearch(searchTerm: string) {
  const sanitizedTerm = searchTerm
    .trim()
    .slice(0, 100)
    .replace(/[%_]/g, '');

  return useQuery({
    queryKey: ['product-search', sanitizedTerm],
    queryFn: async (): Promise<ProductWithSupplier[]> => {
      if (sanitizedTerm.length < 2) return [];
      const data = await apiRequest('GET', `/api/products/search?q=${encodeURIComponent(sanitizedTerm)}`);
      return data.map((p: any) => ({
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
      return apiRequest('POST', '/api/products', data);
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
    mutationFn: async ({ id, data }: { id: string; data: { name: string; unit: UnitAbbreviation; supplier_id?: string } }) => {
      return apiRequest('PATCH', `/api/products/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-with-suppliers'] });
    },
  });
}

export function useProductDuplicates(productName: string, currentSupplierId?: string) {
  return useQuery({
    queryKey: ['product-duplicates', productName, currentSupplierId],
    queryFn: async (): Promise<ProductWithSupplier[]> => {
      if (!productName || productName.length < 2) return [];
      const params = new URLSearchParams({ name: productName });
      if (currentSupplierId) params.set('exclude_supplier_id', currentSupplierId);
      const data = await apiRequest('GET', `/api/products/duplicates?${params}`);
      return data.map((p: any) => ({
        ...p,
        unit: p.unit as UnitAbbreviation,
        supplier: p.supplier as ProductWithSupplier['supplier']
      }));
    },
    enabled: !!productName && productName.length >= 2,
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-with-suppliers'] });
    },
  });
}
