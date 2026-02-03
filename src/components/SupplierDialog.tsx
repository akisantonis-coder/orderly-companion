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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Supplier } from '@/types';

const supplierSchema = z.object({
  name: z.string().trim().min(1, 'Το όνομα είναι υποχρεωτικό').max(100, 'Μέγιστο 100 χαρακτήρες'),
  email: z.string().trim().email('Μη έγκυρο email').max(255).optional().or(z.literal('')),
  phone: z.string().trim().max(20, 'Μέγιστο 20 χαρακτήρες').optional().or(z.literal('')),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
  onSubmit: (data: SupplierFormData) => Promise<void>;
  isLoading?: boolean;
}

export function SupplierDialog({
  open,
  onOpenChange,
  supplier,
  onSubmit,
  isLoading,
}: SupplierDialogProps) {
  const isEditing = !!supplier;

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (supplier) {
        form.reset({
          name: supplier.name,
          email: supplier.email || '',
          phone: supplier.phone || '',
        });
      } else {
        form.reset({
          name: '',
          email: '',
          phone: '',
        });
      }
    }
  }, [open, supplier, form]);

  const handleSubmit = async (data: SupplierFormData) => {
    await onSubmit({
      ...data,
      email: data.email || undefined,
      phone: data.phone || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Επεξεργασία Προμηθευτή' : 'Νέος Προμηθευτής'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Όνομα *</FormLabel>
                  <FormControl>
                    <Input placeholder="π.χ. ΑΦΟΙ ΠΑΠΑΔΟΠΟΥΛΟΙ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="info@supplier.gr" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Τηλέφωνο</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel" 
                      placeholder="210 1234567" 
                      {...field} 
                    />
                  </FormControl>
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
