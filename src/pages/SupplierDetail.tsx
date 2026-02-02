import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Package, Plus } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { ProductCard } from '@/components/ProductCard';
import { OrderCard } from '@/components/OrderCard';
import { AddProductDialog } from '@/components/AddProductDialog';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupplier } from '@/hooks/useSuppliers';
import { useProducts } from '@/hooks/useProducts';
import { useDraftOrders, useCreateOrder, useAddOrderItem } from '@/hooks/useOrders';
import type { ProductWithSupplier } from '@/types';
import { toast } from 'sonner';

export default function SupplierDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<ProductWithSupplier | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: supplier, isLoading: supplierLoading } = useSupplier(id);
  const { data: products = [], isLoading: productsLoading } = useProducts(id);
  const { data: draftOrders = [] } = useDraftOrders();
  const createOrder = useCreateOrder();
  const addOrderItem = useAddOrderItem();

  const supplierOrders = draftOrders.filter(o => o.supplier_id === id);
  const selectedProductIds = new Set(
    supplierOrders.flatMap(order => order.items?.map(item => item.product_id) || [])
  );

  const handleProductSelect = (product: ProductWithSupplier) => {
    setSelectedProduct({
      ...product,
      supplier: supplier!,
    } as ProductWithSupplier);
    setDialogOpen(true);
  };

  const handleAddProduct = async (product: ProductWithSupplier, quantity: number) => {
    try {
      let order = supplierOrders[0];

      if (!order) {
        const newOrder = await createOrder.mutateAsync(product.supplier_id);
        await addOrderItem.mutateAsync({
          orderId: newOrder.id,
          productId: product.id,
          quantity,
        });
      } else {
        await addOrderItem.mutateAsync({
          orderId: order.id,
          productId: product.id,
          quantity,
        });
      }

      toast.success('Το προϊόν προστέθηκε στην παραγγελία');
    } catch (error) {
      toast.error('Σφάλμα κατά την προσθήκη');
    }
  };

  if (supplierLoading) {
    return (
      <Layout>
        <div className="container py-6">
          <div className="h-32 bg-muted animate-pulse rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (!supplier) {
    return (
      <Layout>
        <div className="container py-6">
          <EmptyState
            icon={Package}
            title="Ο προμηθευτής δεν βρέθηκε"
            action={
              <Button asChild>
                <Link to="/suppliers">Επιστροφή</Link>
              </Button>
            }
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="supplier-header">
        <div className="container flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="-ml-2">
            <Link to="/suppliers">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground truncate">
              {supplier.name}
            </h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
              {supplier.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">{supplier.email}</span>
                </span>
              )}
              {supplier.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {supplier.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products">
              Προϊόντα ({products.length})
            </TabsTrigger>
            <TabsTrigger value="orders">
              Παραγγελίες ({supplierOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-2 mt-4">
            {productsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="order-card h-20 animate-pulse bg-muted" />
                ))}
              </div>
            ) : products.length > 0 ? (
              products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{ ...product, supplier } as ProductWithSupplier}
                  isSelected={selectedProductIds.has(product.id)}
                  onSelect={() => handleProductSelect(product as ProductWithSupplier)}
                />
              ))
            ) : (
              <EmptyState
                icon={Package}
                title="Δεν υπάρχουν προϊόντα"
                description="Δεν έχουν καταχωρηθεί προϊόντα για αυτόν τον προμηθευτή"
              />
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-2 mt-4">
            {supplierOrders.length > 0 ? (
              supplierOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))
            ) : (
              <EmptyState
                icon={Package}
                title="Δεν υπάρχουν ανοιχτές παραγγελίες"
                description="Επιλέξτε προϊόντα για να δημιουργήσετε παραγγελία"
                action={
                  <Button onClick={() => document.querySelector('[value="products"]')?.dispatchEvent(new Event('click', { bubbles: true }))}>
                    <Plus className="h-4 w-4 mr-2" />
                    Προσθήκη προϊόντων
                  </Button>
                }
              />
            )}
          </TabsContent>
        </Tabs>
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
