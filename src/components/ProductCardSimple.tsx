import { Plus, Users, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ProductWithSupplier, UnitAbbreviation } from '@/types';

interface ProductCardSimpleProps {
  product: ProductWithSupplier;
  isInOrder: boolean;
  orderQuantity?: number;
  orderUnit?: UnitAbbreviation;
  onSelect: () => void;
  duplicateSuppliers?: string[];
}

export function ProductCardSimple({
  product,
  isInOrder,
  orderQuantity,
  orderUnit,
  onSelect,
  duplicateSuppliers = [],
}: ProductCardSimpleProps) {
  return (
    <div
      className={cn(
        'order-card flex items-center gap-3 group transition-all',
        isInOrder && 'ring-2 ring-success bg-success-light border-success/30'
      )}
    >
      {/* Product Info - Clickable */}
      <button
        onClick={onSelect}
        className="flex-1 text-left min-w-0 py-2"
      >
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground truncate">
            {product.name}
          </p>
          {duplicateSuppliers.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="shrink-0 gap-1 cursor-help">
                    <Users className="h-3 w-3" />
                    +{duplicateSuppliers.length}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium mb-1">Υπάρχει επίσης σε:</p>
                  <ul className="text-sm">
                    {duplicateSuppliers.map((name, i) => (
                      <li key={i}>• {name}</li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-sm text-muted-foreground">
            {product.unit}
          </span>
          {isInOrder && orderQuantity !== undefined && (
            <Badge className="bg-success text-success-foreground hover:bg-success/90 text-xs">
              <Check className="h-3 w-3 mr-1" />
              {orderQuantity} {orderUnit || product.unit}
            </Badge>
          )}
        </div>
      </button>

      {/* Add Button */}
      <Button
        variant={isInOrder ? 'secondary' : 'default'}
        size="icon"
        className={cn(
          'h-8 w-8 shrink-0',
          isInOrder && 'bg-success hover:bg-success/90 text-success-foreground'
        )}
        onClick={onSelect}
      >
        {isInOrder ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      </Button>
    </div>
  );
}
