import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Product, ProductWithSupplier } from '@/types';

interface SortableProductCardProps {
  product: ProductWithSupplier;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export function SortableProductCard({
  product,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`order-card flex items-center gap-3 group ${
        isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
      }`}
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
        <p className="font-medium text-foreground truncate">
          {product.name}
        </p>
        <p className="text-sm text-muted-foreground">
          {product.unit}
        </p>
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
        variant={isSelected ? 'secondary' : 'default'}
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={onSelect}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
