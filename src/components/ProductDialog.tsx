import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useProductDuplicates } from '@/hooks/useProducts';
import type { Product, UnitAbbreviation } from '@/types';

const UNIT_OPTIONS: { value: UnitAbbreviation; label: string }[] = [
  { value: 'τεμ', label: 'Τεμάχια (τεμ)' },
  { value: 'κιβ', label: 'Κιβώτια (κιβ)' },
  { value: 'παλ', label: 'Παλέτες (παλ)' },
  { value: 'kg', label: 'Κιλά (kg)' },
];

const productSchema = z.object({
  name: z.string().trim().min(1, 'Το όνομα είναι υποχρεωτικό').max(200, 'Μέγιστο 200 χαρακτήρες'),
  unit: z.enum(['τεμ', 'κιβ', 'παλ', 'kg'], { required_error: 'Επιλέξτε μονάδα' }),
  supplier_id: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  supplierId: string;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isLoading?: boolean;
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
  supplierId,
  onSubmit,
  isLoading,
}: ProductDialogProps) {
  const isEditing = !!product;
  const { data: suppliers = [] } = useSuppliers();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      unit: 'τεμ',
      supplier_id: supplierId,
    },
  });

  const watchedName = form.watch('name');
  const { data: duplicates = [] } = useProductDuplicates(
    isEditing ? product?.name || '' : watchedName,
    supplierId
  );

  useEffect(() => {
    if (open) {
      if (product) {
        form.reset({
          name: product.name,
          unit: product.unit,
          supplier_id: product.supplier_id,
        });
      } else {
        form.reset({
          name: '',
          unit: 'τεμ',
          supplier_id: supplierId,
        });
      }
    }
  }, [open, product, form, supplierId]);

  const handleSubmit = async (data: ProductFormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  // Filter suppliers to exclude current one for the move option
  const otherSuppliers = suppliers.filter(s => s.id !== supplierId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Επεξεργασία Είδους' : 'Νέο Είδος'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Όνομα Είδους *</FormLabel>
                  <FormControl>
                    <Input placeholder="π.χ. Γάλα Εβαπορέ 410gr" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Μονάδα Μέτρησης *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Επιλέξτε μονάδα" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {UNIT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEditing && otherSuppliers.length > 0 && (
              <FormField
                control={form.control}
                name="supplier_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Μετακίνηση σε Προμηθευτή</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Επιλέξτε προμηθευτή" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={supplierId}>
                          Τρέχων προμηθευτής
                        </SelectItem>
                        {otherSuppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Show duplicates in other suppliers */}
            {duplicates.length > 0 && (
              <div className="rounded-lg border border-border p-3 bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Υπάρχει και σε άλλους προμηθευτές:
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {duplicates.map((dup) => (
                    <Badge key={dup.id} variant="secondary">
                      {dup.supplier.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Ακύρωση
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Αποθήκευση...' : isEditing ? 'Ενημέρωση' : 'Δημιουργία'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
