import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronRight, Truck, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Supplier } from '@/types';

interface SortableSupplierCardProps {
  supplier: Supplier;
  orderCount?: number;
  isDragEnabled: boolean;
}

export function SortableSupplierCard({ 
  supplier, 
  orderCount = 0,
  isDragEnabled 
}: SortableSupplierCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: supplier.id,
    disabled: !isDragEnabled
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="order-card flex items-center gap-3 hover:border-primary/50 transition-all duration-200"
    >
      {/* Drag Handle - only visible in edit mode */}
      {isDragEnabled && (
        <button
          className="touch-none text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing p-1"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
      )}

      <Link 
        to={`/suppliers/${supplier.id}`}
        className="flex items-center gap-4 flex-1 min-w-0"
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
    </div>
  );
}
