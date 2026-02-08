import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QuantityInput } from './QuantityInput';
import type { ProductWithSupplier, UnitAbbreviation } from '@/types';

const UNITS: { value: UnitAbbreviation; label: string }[] = [
  { value: 'τεμ', label: 'Τεμάχια (τεμ)' },
  { value: 'κιβ', label: 'Κιβώτια (κιβ)' },
  { value: 'παλ', label: 'Παλέτες (παλ)' },
  { value: 'kg', label: 'Κιλά (kg)' },
];

interface AddProductDialogProps {
  product: ProductWithSupplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (product: ProductWithSupplier, quantity: number, unit: UnitAbbreviation) => void;
}

export function AddProductDialog({
  product,
  open,
  onOpenChange,
  onConfirm,
}: AddProductDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<UnitAbbreviation>('τεμ');

  // Reset unit to product's unit when dialog opens
  useEffect(() => {
    if (product && open) {
      setUnit(product.unit);
      setQuantity(1);
    }
  }, [product, open]);

  const handleConfirm = () => {
    if (product) {
      onConfirm(product, quantity, unit);
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

        <div className="py-4 space-y-6">
          <div>
            <p className="font-medium text-foreground mb-1">{product.name}</p>
            <p className="text-sm text-muted-foreground">{product.supplier.name}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              Μονάδα μέτρησης
            </label>
            <Select value={unit} onValueChange={(v) => setUnit(v as UnitAbbreviation)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => (
                  <SelectItem key={u.value} value={u.value}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              Ποσότητα
            </label>
            <QuantityInput
              value={quantity}
              onChange={setQuantity}
              unit={unit}
              step={unit === 'kg' ? 0.5 : 1}
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
