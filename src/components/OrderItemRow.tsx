import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuantityInput } from './QuantityInput';
import type { OrderItem, Product } from '@/types';
import { cn } from '@/lib/utils';

interface OrderItemRowProps {
  item: OrderItem & { product: Product };
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onDelete: (itemId: string) => void;
}

export function OrderItemRow({ item, onUpdateQuantity, onDelete }: OrderItemRowProps) {
  return (
    <div className={cn(
      'order-card flex flex-col sm:flex-row sm:items-center gap-4',
      'bg-success-light border-success/30'
    )}>
      <div className="flex-1 min-w-0">
        <p className="product-name text-foreground font-medium">{item.product.name}</p>
        <span className="unit-badge mt-1.5">{item.product.unit}</span>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3">
        <QuantityInput
          value={item.quantity}
          onChange={(quantity) => onUpdateQuantity(item.id, quantity)}
          unit={item.product.unit}
          step={item.product.unit === 'kg' ? 0.5 : 1}
        />

        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
