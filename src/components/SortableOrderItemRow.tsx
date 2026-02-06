import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { QuantityInput } from '@/components/QuantityInput';
import { Button } from '@/components/ui/button';
import type { OrderItem, Product } from '@/types';

interface SortableOrderItemRowProps {
  item: OrderItem & { product: Product };
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onDelete: (itemId: string) => void;
}

export function SortableOrderItemRow({
  item,
  onUpdateQuantity,
  onDelete,
}: SortableOrderItemRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="order-card flex items-center gap-3"
    >
      {/* Drag Handle */}
      <button
        className="touch-none text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing p-1"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">
          {item.product.name}
        </p>
        <p className="text-sm text-muted-foreground">
          {item.product.unit}
        </p>
      </div>

      {/* Quantity Controls */}
      <QuantityInput
        value={item.quantity}
        onChange={(value) => onUpdateQuantity(item.id, value)}
      />

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(item.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
