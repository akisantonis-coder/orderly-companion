import { useState } from 'react';
import { Search as SearchIcon, Truck } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { SearchInput } from '@/components/SearchInput';
import { ProductCard } from '@/components/ProductCard';
import { AddProductDialog } from '@/components/AddProductDialog';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { useDraftOrders, useCreateOrder, useAddOrderItem } from '@/hooks/useOrders';
import { useSearch } from '@/hooks/useSearch';
import { useProductsWithSuppliers } from '@/hooks/useProducts';
import type { ProductWithSupplier, UnitAbbreviation } from '@/types';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithSupplier | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: searchResults = [], isLoading: searchLoading } = useSearch(searchTerm);
  const { data: allProducts = [], isLoading: allLoading } = useProductsWithSuppliers();
  const { data: draftOrders = [] } = useDraftOrders();
  const createOrder = useCreateOrder();
  const addOrderItem = useAddOrderItem();

  const isLoading = searchTerm.length >= 2 ? searchLoading : allLoading;

  // Get set of product IDs that are already in draft orders
  const selectedProductIds = new Set(
    draftOrders.flatMap(order => order.items?.map(item => item.product_id) || [])
  );

  const handleProductSelect = (product: ProductWithSupplier) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleAddProduct = async (product: ProductWithSupplier, quantity: number, unit: UnitAbbreviation) => {
    try {
      let order = draftOrders.find(o => o.supplier_id === product.supplier_id);

      if (!order) {
        const newOrder = await createOrder.mutateAsync(product.supplier_id);
        await addOrderItem.mutateAsync({
          orderId: newOrder.id,
          productId: product.id,
          quantity,
          unit,
        });
      } else {
        await addOrderItem.mutateAsync({
          orderId: order.id,
          productId: product.id,
          quantity,
          unit,
        });
      }

      toast.success('Το είδος προστέθηκε στην παραγγελία');
    } catch (error) {
      toast.error('Σφάλμα κατά την προσθήκη');
    }
  };

  // Separate suppliers and products from search results
  const suppliers = searchResults.filter(r => r.type === 'supplier').map(r => r.supplier!);
  const products = searchTerm.length >= 2 
    ? searchResults.filter(r => r.type === 'product').map(r => r.product!)
    : allProducts;

  // Group products by supplier
  const productsBySupplier = products.reduce((acc, product) => {
    const supplierName = product.supplier.name;
    if (!acc[supplierName]) {
      acc[supplierName] = [];
    }
    acc[supplierName].push(product);
    return acc;
  }, {} as Record<string, ProductWithSupplier[]>);

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="md:hidden">
          <h1 className="text-2xl font-bold text-foreground">Αναζήτηση</h1>
          <p className="text-muted-foreground mt-1">Βρείτε προμηθευτές και είδη</p>
        </div>

        {/* Search */}
        <SearchInput
          placeholder="Αναζήτηση προμηθευτών και ειδών..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          autoFocus
        />

        {/* Results */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="order-card h-20 animate-pulse bg-muted" />
            ))}
          </div>
        ) : (
          <>
            {/* Suppliers Results */}
            {suppliers.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Προμηθευτές
                </h3>
                <div className="space-y-2">
                  {suppliers.map((supplier) => (
                    <Link
                      key={supplier.id}
                      to={`/suppliers/${supplier.id}`}
                      className="order-card flex items-center gap-3 hover:bg-muted/50 transition-colors"
                    >
                      <Truck className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {supplier.name}
                        </p>
                        {supplier.email && (
                          <p className="text-sm text-muted-foreground truncate">
                            {supplier.email}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Products Results */}
            {products.length > 0 ? (
              <div className="space-y-6">
                {Object.entries(productsBySupplier).map(([supplierName, supplierProducts]) => (
                  <div key={supplierName}>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      {supplierName}
                    </h3>
                    <div className="space-y-2">
                      {supplierProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          isSelected={selectedProductIds.has(product.id)}
                          onSelect={handleProductSelect}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : searchTerm.length >= 2 && suppliers.length === 0 ? (
              <EmptyState
                icon={SearchIcon}
                title="Δεν βρέθηκαν αποτελέσματα"
                description={`Δεν βρέθηκαν προμηθευτές ή είδη για "${searchTerm}"`}
              />
            ) : null}

            {/* Empty State when no search */}
            {searchTerm.length < 2 && products.length === 0 && (
              <EmptyState
                icon={SearchIcon}
                title="Αναζητήστε προμηθευτές και είδη"
                description="Πληκτρολογήστε τουλάχιστον 2 χαρακτήρες για αναζήτηση"
              />
            )}
          </>
        )}
      </div>

      <AddProductDialog
        product={selectedProduct}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleAddProduct}
      />
    </Layout>
  );
}
