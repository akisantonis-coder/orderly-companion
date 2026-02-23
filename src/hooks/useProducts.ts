import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storage } from '@/lib/storage';
import type { Product, ProductWithSupplier, UnitAbbreviation } from '@/types';

export function useProducts(supplierId?: string) {
  return useQuery({
    queryKey: ['products', supplierId],
    queryFn: async (): Promise<Product[]> => {
      return storage.getProducts(supplierId);
    },
  });
}

export function useProductCountBySupplier() {
  return useQuery({
    queryKey: ['product-count-by-supplier'],
    queryFn: async (): Promise<Record<string, number>> => {
      const products = await storage.getProducts();
      return products.reduce((acc, product) => {
        acc[product.supplier_id] = (acc[product.supplier_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    },
  });
}

export function useUpdateProductOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (products: { id: string; sort_order: number }[]) => {
      await storage.updateProductOrders(products);
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
      return storage.getProductsWithSuppliers() as Promise<ProductWithSupplier[]>;
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
      return storage.searchProducts(sanitizedTerm) as Promise<ProductWithSupplier[]>;
    },
    enabled: sanitizedTerm.length >= 2 && sanitizedTerm.length <= 100,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; supplier_id: string; unit: UnitAbbreviation }) => {
      return storage.createProduct({
        name: data.name,
        supplier_id: data.supplier_id,
        unit: data.unit,
        sort_order: 0,
      });
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
      return storage.updateProduct(id, data);
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
      return storage.findProductDuplicates(productName, currentSupplierId) as Promise<ProductWithSupplier[]>;
    },
    enabled: !!productName && productName.length >= 2,
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await storage.deleteProduct(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-with-suppliers'] });
    },
  });
}
