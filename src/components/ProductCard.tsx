import { Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductWithSupplier } from '@/types';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  product: ProductWithSupplier;
  isSelected?: boolean;
  onSelect: (product: ProductWithSupplier) => void;
}

export function ProductCard({ product, isSelected, onSelect }: ProductCardProps) {
  return (
    <div 
      className={cn(
        'order-card flex items-center gap-3 cursor-pointer transition-all duration-200',
        'hover:border-primary/50 active:scale-[0.98]',
        isSelected && 'product-selected border-success bg-success-light'
      )}
      onClick={() => onSelect(product)}
    >
      <div className="flex-1 min-w-0">
        <p className="product-name text-foreground">{product.name}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs text-muted-foreground">{product.supplier.name}</span>
          <span className="unit-badge">{product.unit}</span>
        </div>
      </div>

      <Button
        size="icon"
        variant={isSelected ? "default" : "secondary"}
        className={cn(
          'h-10 w-10 rounded-full shrink-0 transition-all',
          isSelected && 'bg-success hover:bg-success/90'
        )}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(product);
        }}
      >
        {isSelected ? (
          <Check className="h-5 w-5" />
        ) : (
          <Plus className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}
