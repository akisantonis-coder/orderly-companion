import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuantityInput } from '@/components/QuantityInput';
import type { OrderItemWithProduct, UnitAbbreviation } from '@/types';

interface OrderItemRowProps {
  item: OrderItemWithProduct;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onDelete: (itemId: string) => void;
}

export function OrderItemRow({
  item,
  onUpdateQuantity,
  onDelete,
}: OrderItemRowProps) {
  // Use item.unit (the order-specific unit), fallback to product.unit
  const displayUnit: UnitAbbreviation = item.unit || item.product.unit;

  return (
    <div className="order-card flex items-center gap-3">
      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">
          {item.product.name}
        </p>
        <p className="text-sm text-muted-foreground">
          {displayUnit}
        </p>
      </div>

      {/* Quantity Controls with Unit */}
      <div className="flex items-center gap-2">
        <QuantityInput
          value={item.quantity}
          onChange={(value) => onUpdateQuantity(item.id, value)}
        />
        <span className="text-sm text-muted-foreground min-w-[2rem]">
          {displayUnit}
        </span>
      </div>

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
