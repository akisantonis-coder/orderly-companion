import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, Plus, Users, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ProductWithSupplier } from '@/types';

interface SortableProductCardProps {
  product: ProductWithSupplier;
  isSelected: boolean;
  orderQuantity?: number;
  onSelect: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  duplicateSuppliers?: string[];
}

export function SortableProductCard({
  product,
  isSelected,
  orderQuantity,
  onSelect,
  onEdit,
  onDelete,
  duplicateSuppliers = [],
}: SortableProductCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isInOrder = isSelected && orderQuantity !== undefined && orderQuantity > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'order-card flex items-center gap-3 group transition-all',
        isInOrder && 'ring-2 ring-success bg-success-light border-success/30'
      )}
    >
      {/* Drag Handle */}
      <button
        className="touch-none text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing p-1"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

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
          {isInOrder && (
            <Badge className="bg-success text-success-foreground hover:bg-success/90 text-xs">
              <Check className="h-3 w-3 mr-1" />
              {orderQuantity} {product.unit}
            </Badge>
          )}
        </div>
      </button>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

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
