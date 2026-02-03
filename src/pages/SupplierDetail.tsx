import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Package, Plus, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { ProductCard } from '@/components/ProductCard';
import { OrderCard } from '@/components/OrderCard';
import { AddProductDialog } from '@/components/AddProductDialog';
import { SupplierDialog } from '@/components/SupplierDialog';
import { ProductDialog } from '@/components/ProductDialog';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSupplier, useUpdateSupplier, useDeleteSupplier } from '@/hooks/useSuppliers';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { useDraftOrders, useCreateOrder, useAddOrderItem } from '@/hooks/useOrders';
import type { ProductWithSupplier, Product, UnitAbbreviation } from '@/types';
import { toast } from 'sonner';

export default function SupplierDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Dialog states
  const [selectedProduct, setSelectedProduct] = useState<ProductWithSupplier | null>(null);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteSupplierOpen, setDeleteSupplierOpen] = useState(false);
  const [deleteProductOpen, setDeleteProductOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Queries
  const { data: supplier, isLoading: supplierLoading } = useSupplier(id);
  const { data: products = [], isLoading: productsLoading } = useProducts(id);
  const { data: draftOrders = [] } = useDraftOrders();
  
  // Mutations
  const createOrder = useCreateOrder();
  const addOrderItem = useAddOrderItem();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const supplierOrders = draftOrders.filter(o => o.supplier_id === id);
  const selectedProductIds = new Set(
    supplierOrders.flatMap(order => order.items?.map(item => item.product_id) || [])
  );

  const handleProductSelect = (product: ProductWithSupplier) => {
    setSelectedProduct({
      ...product,
      supplier: supplier!,
    } as ProductWithSupplier);
    setAddProductDialogOpen(true);
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

  const handleUpdateSupplier = async (data: { name: string; email?: string; phone?: string }) => {
    if (!id) return;
    try {
      await updateSupplier.mutateAsync({ id, data });
      toast.success('Ο προμηθευτής ενημερώθηκε');
    } catch (error) {
      toast.error('Σφάλμα κατά την ενημέρωση');
      throw error;
    }
  };

  const handleDeleteSupplier = async () => {
    if (!id) return;
    try {
      await deleteSupplier.mutateAsync(id);
      toast.success('Ο προμηθευτής διαγράφηκε');
      navigate('/suppliers');
    } catch (error) {
      toast.error('Σφάλμα κατά τη διαγραφή. Βεβαιωθείτε ότι δεν υπάρχουν προϊόντα ή παραγγελίες.');
    }
  };

  const handleCreateProduct = async (data: { name: string; unit: UnitAbbreviation }) => {
    if (!id) return;
    try {
      await createProduct.mutateAsync({ ...data, supplier_id: id });
      toast.success('Το προϊόν δημιουργήθηκε');
    } catch (error) {
      toast.error('Σφάλμα κατά τη δημιουργία');
      throw error;
    }
  };

  const handleUpdateProduct = async (data: { name: string; unit: UnitAbbreviation }) => {
    if (!editingProduct) return;
    try {
      await updateProduct.mutateAsync({ id: editingProduct.id, data });
      toast.success('Το προϊόν ενημερώθηκε');
      setEditingProduct(null);
    } catch (error) {
      toast.error('Σφάλμα κατά την ενημέρωση');
      throw error;
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct.mutateAsync(productToDelete.id);
      toast.success('Το προϊόν διαγράφηκε');
      setProductToDelete(null);
      setDeleteProductOpen(false);
    } catch (error) {
      toast.error('Σφάλμα κατά τη διαγραφή');
    }
  };

  const openEditProduct = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProduct(product);
    setProductDialogOpen(true);
  };

  const openDeleteProduct = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setProductToDelete(product);
    setDeleteProductOpen(true);
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSupplierDialogOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Επεξεργασία
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setDeleteSupplierOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Διαγραφή
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

          <TabsContent value="products" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button 
                size="sm" 
                onClick={() => {
                  setEditingProduct(null);
                  setProductDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Νέο Προϊόν
              </Button>
            </div>
            
            {productsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="order-card h-20 animate-pulse bg-muted" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="space-y-2">
                {products.map((product) => (
                  <div key={product.id} className="relative group">
                    <ProductCard
                      product={{ ...product, supplier } as ProductWithSupplier}
                      isSelected={selectedProductIds.has(product.id)}
                      onSelect={() => handleProductSelect(product as ProductWithSupplier)}
                    />
                    <div className="absolute right-14 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => openEditProduct(product, e)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => openDeleteProduct(product, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Package}
                title="Δεν υπάρχουν προϊόντα"
                description="Προσθέστε το πρώτο προϊόν για αυτόν τον προμηθευτή"
                action={
                  <Button onClick={() => {
                    setEditingProduct(null);
                    setProductDialogOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Νέο Προϊόν
                  </Button>
                }
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

      {/* Add product to order dialog */}
      <AddProductDialog
        product={selectedProduct}
        open={addProductDialogOpen}
        onOpenChange={setAddProductDialogOpen}
        onConfirm={handleAddProduct}
      />

      {/* Supplier edit dialog */}
      <SupplierDialog
        open={supplierDialogOpen}
        onOpenChange={setSupplierDialogOpen}
        supplier={supplier}
        onSubmit={handleUpdateSupplier}
        isLoading={updateSupplier.isPending}
      />

      {/* Product create/edit dialog */}
      <ProductDialog
        open={productDialogOpen}
        onOpenChange={(open) => {
          setProductDialogOpen(open);
          if (!open) setEditingProduct(null);
        }}
        product={editingProduct}
        supplierId={id!}
        onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
        isLoading={createProduct.isPending || updateProduct.isPending}
      />

      {/* Delete supplier confirmation */}
      <DeleteConfirmDialog
        open={deleteSupplierOpen}
        onOpenChange={setDeleteSupplierOpen}
        title="Διαγραφή Προμηθευτή"
        description="Είστε σίγουροι ότι θέλετε να διαγράψετε αυτόν τον προμηθευτή; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί."
        onConfirm={handleDeleteSupplier}
        isLoading={deleteSupplier.isPending}
      />

      {/* Delete product confirmation */}
      <DeleteConfirmDialog
        open={deleteProductOpen}
        onOpenChange={setDeleteProductOpen}
        title="Διαγραφή Προϊόντος"
        description={`Είστε σίγουροι ότι θέλετε να διαγράψετε το προϊόν "${productToDelete?.name}";`}
        onConfirm={handleDeleteProduct}
        isLoading={deleteProduct.isPending}
      />
    </Layout>
  );
}
