import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QuantityInput } from './QuantityInput';
import type { ProductWithSupplier } from '@/types';

interface AddProductDialogProps {
  product: ProductWithSupplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (product: ProductWithSupplier, quantity: number) => void;
}

export function AddProductDialog({
  product,
  open,
  onOpenChange,
  onConfirm,
}: AddProductDialogProps) {
  const [quantity, setQuantity] = useState(1);

  const handleConfirm = () => {
    if (product) {
      onConfirm(product, quantity);
      setQuantity(1);
      onOpenChange(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setQuantity(1);
    }
    onOpenChange(newOpen);
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Προσθήκη προϊόντος</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="font-medium text-foreground mb-1">{product.name}</p>
          <p className="text-sm text-muted-foreground">{product.supplier.name}</p>

          <div className="mt-6">
            <label className="text-sm font-medium text-foreground mb-3 block">
              Ποσότητα
            </label>
            <QuantityInput
              value={quantity}
              onChange={setQuantity}
              unit={product.unit}
              step={product.unit === 'kg' ? 0.5 : 1}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Ακύρωση
          </Button>
          <Button onClick={handleConfirm}>
            Προσθήκη
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
