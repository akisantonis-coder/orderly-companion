import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Package, Truck, ChevronRight, Plus } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { SearchInput } from '@/components/SearchInput';
import { OrderCard } from '@/components/OrderCard';
import { ProductCard } from '@/components/ProductCard';
import { AddProductDialog } from '@/components/AddProductDialog';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { useDraftOrders, useCreateOrder, useAddOrderItem } from '@/hooks/useOrders';
import { useProductSearch } from '@/hooks/useProducts';
import { useSuppliers } from '@/hooks/useSuppliers';
import type { ProductWithSupplier } from '@/types';
import { toast } from 'sonner';

export default function Index() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithSupplier | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: draftOrders = [], isLoading: ordersLoading } = useDraftOrders();
  const { data: searchResults = [], isLoading: searchLoading } = useProductSearch(searchTerm);
  const { data: suppliers = [] } = useSuppliers();
  const createOrder = useCreateOrder();
  const addOrderItem = useAddOrderItem();

  const handleProductSelect = (product: ProductWithSupplier) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleAddProduct = async (product: ProductWithSupplier, quantity: number) => {
    try {
      // Check if there's already a draft order for this supplier
      let order = draftOrders.find(o => o.supplier_id === product.supplier_id);

      if (!order) {
        // Create new order for this supplier
        const newOrder = await createOrder.mutateAsync(product.supplier_id);
        await addOrderItem.mutateAsync({
          orderId: newOrder.id,
          productId: product.id,
          quantity,
        });
      } else {
        // Add to existing order
        await addOrderItem.mutateAsync({
          orderId: order.id,
          productId: product.id,
          quantity,
        });
      }

      toast.success('Το προϊόν προστέθηκε στην παραγγελία');
      setSearchTerm('');
    } catch (error) {
      toast.error('Σφάλμα κατά την προσθήκη');
    }
  };

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="md:hidden">
          <h1 className="text-2xl font-bold text-foreground">Διαχείριση Παραγγελιών</h1>
          <p className="text-muted-foreground mt-1">Αποθήκη</p>
        </div>

        {/* Search Section */}
        <section>
          <SearchInput
            placeholder="Αναζήτηση προϊόντων..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
          />

          {/* Search Results */}
          {searchTerm.length >= 2 && (
            <div className="mt-4 space-y-2 animate-fade-in">
              {searchLoading ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Αναζήτηση...
                </p>
              ) : searchResults.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-2">
                    Βρέθηκαν {searchResults.length} προϊόντα
                  </p>
                  {searchResults.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={handleProductSelect}
                    />
                  ))}
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Δεν βρέθηκαν προϊόντα
                </p>
              )}
            </div>
          )}
        </section>

        {/* Draft Orders Section */}
        {!searchTerm && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Ανοιχτές Παραγγελίες
              </h2>
              <Link to="/orders" className="text-sm text-primary font-medium flex items-center gap-1">
                Όλες
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {ordersLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="order-card h-24 animate-pulse bg-muted" />
                ))}
              </div>
            ) : draftOrders.length > 0 ? (
              <div className="space-y-2">
                {draftOrders.slice(0, 3).map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
                {draftOrders.length > 3 && (
                  <Link
                    to="/orders"
                    className="block text-center py-3 text-sm text-primary font-medium"
                  >
                    Εμφάνιση {draftOrders.length - 3} ακόμη παραγγελιών
                  </Link>
                )}
              </div>
            ) : (
              <EmptyState
                icon={Package}
                title="Δεν υπάρχουν ανοιχτές παραγγελίες"
                description="Αναζητήστε προϊόντα για να δημιουργήσετε νέα παραγγελία"
              />
            )}
          </section>
        )}

        {/* Quick Access - Suppliers */}
        {!searchTerm && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Προμηθευτές
              </h2>
              <Link to="/suppliers" className="text-sm text-primary font-medium flex items-center gap-1">
                Όλοι
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {suppliers.slice(0, 5).map((supplier) => {
                const orderCount = draftOrders.filter(o => o.supplier_id === supplier.id).length;
                return (
                  <Link
                    key={supplier.id}
                    to={`/suppliers/${supplier.id}`}
                    className="order-card flex flex-col items-center p-4 text-center hover:border-primary/50 transition-all"
                  >
                    <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center mb-2">
                      <Truck className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <span className="text-sm font-medium text-foreground line-clamp-2">
                      {supplier.name}
                    </span>
                    {orderCount > 0 && (
                      <span className="order-badge bg-primary text-primary-foreground mt-2">
                        {orderCount} παραγ.
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
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
