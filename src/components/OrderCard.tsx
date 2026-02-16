import { ChevronRight, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { OrderWithDetails } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { el } from 'date-fns/locale';

interface OrderCardProps {
  order: OrderWithDetails;
}

export function OrderCard({ order }: OrderCardProps) {
  const itemCount = order.items?.length || 0;
  const totalQuantity = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <Link 
      to={`/orders/${order.id}`}
      className="order-card flex items-center gap-4 hover:border-primary/50 transition-all duration-200"
    >
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Package className="h-6 w-6 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">
          {order.supplier.name}
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          {itemCount} {itemCount === 1 ? 'είδος' : 'είδη'} • {totalQuantity} τεμ.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Τροποποίηση: {formatDistanceToNow(new Date(order.updated_at), { addSuffix: true, locale: el })}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="order-badge bg-warning/10 text-warning">
          Πρόχειρη
        </span>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </Link>
  );
}
