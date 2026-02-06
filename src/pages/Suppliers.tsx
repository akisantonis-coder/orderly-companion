import { useState } from 'react';
import { Truck, Plus } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { SupplierCard } from '@/components/SupplierCard';
import { SupplierDialog } from '@/components/SupplierDialog';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { useSuppliers, useCreateSupplier } from '@/hooks/useSuppliers';
import { useDraftOrders } from '@/hooks/useOrders';
import { toast } from 'sonner';

export default function Suppliers() {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const { data: draftOrders = [] } = useDraftOrders();
  const createSupplier = useCreateSupplier();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Count orders per supplier
  const orderCountBySupplier = draftOrders.reduce((acc, order) => {
    acc[order.supplier_id] = (acc[order.supplier_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sort suppliers: those with open orders first, then alphabetically
  const sortedSuppliers = [...suppliers].sort((a, b) => {
    const aHasOrders = orderCountBySupplier[a.id] || 0;
    const bHasOrders = orderCountBySupplier[b.id] || 0;
    
    // Suppliers with orders come first
    if (aHasOrders > 0 && bHasOrders === 0) return -1;
    if (bHasOrders > 0 && aHasOrders === 0) return 1;
    
    // Then sort alphabetically
    return a.name.localeCompare(b.name, 'el');
  });

  const handleCreateSupplier = async (data: { name: string; email?: string; phone?: string }) => {
    try {
      await createSupplier.mutateAsync(data);
      toast.success('Ο προμηθευτής δημιουργήθηκε');
    } catch (error) {
      toast.error('Σφάλμα κατά τη δημιουργία');
      throw error;
    }
  };

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Προμηθευτές</h1>
            <p className="text-muted-foreground mt-1">
              {suppliers.length} καταχωρημένοι προμηθευτές
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Νέος
          </Button>
        </div>

        {/* Suppliers List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="order-card h-20 animate-pulse bg-muted" />
            ))}
          </div>
        ) : suppliers.length > 0 ? (
          <div className="space-y-2">
            {sortedSuppliers.map((supplier) => (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                orderCount={orderCountBySupplier[supplier.id] || 0}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Truck}
            title="Δεν υπάρχουν προμηθευτές"
            description="Δημιουργήστε τον πρώτο σας προμηθευτή"
            action={
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Νέος Προμηθευτής
              </Button>
            }
          />
        )}
      </div>

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateSupplier}
        isLoading={createSupplier.isPending}
      />
    </Layout>
  );
}
