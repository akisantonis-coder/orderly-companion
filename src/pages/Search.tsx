import { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { SearchInput } from '@/components/SearchInput';
import { ProductCard } from '@/components/ProductCard';
import { AddProductDialog } from '@/components/AddProductDialog';
import { EmptyState } from '@/components/EmptyState';
import { useDraftOrders, useCreateOrder, useAddOrderItem } from '@/hooks/useOrders';
import { useProductSearch, useProductsWithSuppliers } from '@/hooks/useProducts';
import type { ProductWithSupplier, UnitAbbreviation } from '@/types';
import { toast } from 'sonner';

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithSupplier | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: searchResults = [], isLoading: searchLoading } = useProductSearch(searchTerm);
  const { data: allProducts = [], isLoading: allLoading } = useProductsWithSuppliers();
  const { data: draftOrders = [] } = useDraftOrders();
  const createOrder = useCreateOrder();
  const addOrderItem = useAddOrderItem();

  const displayProducts = searchTerm.length >= 2 ? searchResults : allProducts;
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

      toast.success('Το προϊόν προστέθηκε στην παραγγελία');
    } catch (error) {
      toast.error('Σφάλμα κατά την προσθήκη');
    }
  };

  // Group products by supplier
  const productsBySupplier = displayProducts.reduce((acc, product) => {
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
          <p className="text-muted-foreground mt-1">Βρείτε και προσθέστε προϊόντα</p>
        </div>

        {/* Search */}
        <SearchInput
          placeholder="Αναζήτηση προϊόντων..."
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
        ) : displayProducts.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(productsBySupplier).map(([supplierName, products]) => (
              <div key={supplierName}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {supplierName}
                </h3>
                <div className="space-y-2">
                  {products.map((product) => (
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
        ) : searchTerm.length >= 2 ? (
          <EmptyState
            icon={SearchIcon}
            title="Δεν βρέθηκαν αποτελέσματα"
            description={`Δεν βρέθηκαν προϊόντα για "${searchTerm}"`}
          />
        ) : (
          <EmptyState
            icon={SearchIcon}
            title="Αναζητήστε προϊόντα"
            description="Πληκτρολογήστε τουλάχιστον 2 χαρακτήρες για αναζήτηση"
          />
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
