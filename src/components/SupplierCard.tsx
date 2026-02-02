import { ChevronRight, Truck, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Supplier } from '@/types';

interface SupplierCardProps {
  supplier: Supplier;
  orderCount?: number;
}

export function SupplierCard({ supplier, orderCount = 0 }: SupplierCardProps) {
  return (
    <Link 
      to={`/suppliers/${supplier.id}`}
      className="order-card flex items-center gap-4 hover:border-primary/50 transition-all duration-200"
    >
      <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
        <Truck className="h-6 w-6 text-accent-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">
          {supplier.name}
        </h3>
        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
          {supplier.email && (
            <span className="flex items-center gap-1 truncate">
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

      <div className="flex items-center gap-2 shrink-0">
        {orderCount > 0 && (
          <span className="order-badge bg-primary text-primary-foreground">
            {orderCount}
          </span>
        )}
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </Link>
  );
}
