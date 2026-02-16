import { Package, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { OrderCard } from '@/components/OrderCard';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { useDraftOrders } from '@/hooks/useOrders';

export default function Orders() {
  const { data: draftOrders = [], isLoading } = useDraftOrders();

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Παραγγελίες</h1>
            <p className="text-muted-foreground mt-1">
              {draftOrders.length} ανοιχτές παραγγελίες
            </p>
          </div>
          <Button asChild>
            <Link to="/search">
              <Plus className="h-4 w-4 mr-2" />
              Νέα
            </Link>
          </Button>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="order-card h-24 animate-pulse bg-muted" />
            ))}
          </div>
        ) : draftOrders.length > 0 ? (
          <div className="space-y-2">
            {draftOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Package}
            title="Δεν υπάρχουν ανοιχτές παραγγελίες"
            description="Αναζητήστε είδη για να δημιουργήσετε νέα παραγγελία"
            action={
              <Button asChild>
                <Link to="/search">
                  <Plus className="h-4 w-4 mr-2" />
                  Νέα παραγγελία
                </Link>
              </Button>
            }
          />
        )}
      </div>
    </Layout>
  );
}
