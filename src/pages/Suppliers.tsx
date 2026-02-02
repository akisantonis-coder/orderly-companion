import { Truck } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { SupplierCard } from '@/components/SupplierCard';
import { EmptyState } from '@/components/EmptyState';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useDraftOrders } from '@/hooks/useOrders';

export default function Suppliers() {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const { data: draftOrders = [] } = useDraftOrders();

  // Count orders per supplier
  const orderCountBySupplier = draftOrders.reduce((acc, order) => {
    acc[order.supplier_id] = (acc[order.supplier_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Προμηθευτές</h1>
          <p className="text-muted-foreground mt-1">
            {suppliers.length} καταχωρημένοι προμηθευτές
          </p>
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
            {suppliers.map((supplier) => (
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
            description="Δεν έχουν καταχωρηθεί προμηθευτές ακόμη"
          />
        )}
      </div>
    </Layout>
  );
}
