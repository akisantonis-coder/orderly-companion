import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      unit: 'τεμ',
    },
  });

  useEffect(() => {
    if (open) {
      if (product) {
        form.reset({
          name: product.name,
          unit: product.unit,
        });
      } else {
        form.reset({
          name: '',
          unit: 'τεμ',
        });
      }
    }
  }, [open, product, form]);

  const handleSubmit = async (data: ProductFormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Επεξεργασία Προϊόντος' : 'Νέο Προϊόν'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Όνομα Προϊόντος *</FormLabel>
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
