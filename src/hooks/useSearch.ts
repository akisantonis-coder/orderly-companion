import { useQuery } from '@tanstack/react-query';
import { storage } from '@/lib/storage';
import type { Supplier, ProductWithSupplier } from '@/types';

export interface SearchResult {
  type: 'supplier' | 'product';
  supplier?: Supplier;
  product?: ProductWithSupplier;
}

export function useSearch(searchTerm: string) {
  const sanitizedTerm = searchTerm
    .trim()
    .slice(0, 100)
    .replace(/[%_]/g, '');

  return useQuery({
    queryKey: ['search', sanitizedTerm],
    queryFn: async (): Promise<SearchResult[]> => {
      if (sanitizedTerm.length < 2) return [];

      const results: SearchResult[] = [];

      // Search suppliers
      const suppliers = await storage.getSuppliers();
      const matchingSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(sanitizedTerm.toLowerCase())
      );
      
      matchingSuppliers.forEach(supplier => {
        results.push({
          type: 'supplier',
          supplier,
        });
      });

      // Search products
      const products = await storage.searchProducts(sanitizedTerm);
      products.forEach(product => {
        results.push({
          type: 'product',
          product,
        });
      });

      return results.slice(0, 50); // Limit results
    },
    enabled: sanitizedTerm.length >= 2 && sanitizedTerm.length <= 100,
  });
}
