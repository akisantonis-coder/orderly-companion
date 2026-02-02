import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, FileText, Mail } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { useOrder, useSendOrder } from '@/hooks/useOrders';
import { getFullUnitName } from '@/types';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

export default function OrderPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  const { data: order, isLoading } = useOrder(id);
  const sendOrder = useSendOrder();

  const handleSendOrder = async () => {
    try {
      await sendOrder.mutateAsync(id!);
      toast.success('Η παραγγελία εστάλη επιτυχώς');
      navigate('/orders');
    } catch (error) {
      toast.error('Σφάλμα κατά την αποστολή');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-6">
          <div className="h-96 bg-muted animate-pulse rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container py-6">
          <EmptyState
            icon={FileText}
            title="Η παραγγελία δεν βρέθηκε"
            action={
              <Button asChild>
                <Link to="/orders">Επιστροφή</Link>
              </Button>
            }
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="supplier-header">
        <div className="container flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="-ml-2">
            <Link to={`/orders/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold text-foreground">Προεπισκόπηση Παραγγελίας</h1>
          </div>
        </div>
      </div>

      <div className="container py-6 space-y-6">
        {/* Email Preview Card */}
        <div className="order-card space-y-6">
          {/* Email Header */}
          <div className="flex items-start gap-3 pb-4 border-b border-border">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Προς:</p>
              <p className="font-medium truncate">
                {order.supplier.email || order.supplier.name}
              </p>
            </div>
          </div>

          {/* Email Body */}
          <div className="space-y-4">
            <p className="text-foreground">Γεια σας,</p>
            
            <p className="text-foreground">
              Θα θέλαμε να παραγγείλουμε τα παρακάτω προϊόντα:
            </p>

            {/* Products Table */}
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Προϊόν
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                      Ποσότητα
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Μονάδα
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {order.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {item.product.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground text-right font-medium">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {getFullUnitName(item.product.unit, item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-foreground">
              Παρακαλούμε επιβεβαιώστε την παραλαβή και ενημερώστε μας για τυχόν ελλείψεις.
            </p>

            <p className="text-foreground">
              Ευχαριστούμε,<br />
              Αποθήκη
            </p>
          </div>

          {/* Email Footer */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Ημερομηνία: {format(new Date(), 'd MMMM yyyy, HH:mm', { locale: el })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              📎 Συνημμένο: Παραγγελία_{order.supplier.name.replace(/\s+/g, '_')}.pdf
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="fixed bottom-20 md:bottom-8 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
          <div className="container flex gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link to={`/orders/${id}`}>
                Επεξεργασία
              </Link>
            </Button>
            <Button
              className="flex-1"
              onClick={() => setSendDialogOpen(true)}
            >
              <Send className="h-4 w-4 mr-2" />
              Αποστολή
            </Button>
          </div>
        </div>
      </div>

      {/* Send Confirmation */}
      <AlertDialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Αποστολή παραγγελίας</AlertDialogTitle>
            <AlertDialogDescription>
              Θέλετε να στείλετε την παραγγελία στον προμηθευτή "{order.supplier.name}";
              {order.supplier.email && (
                <span className="block mt-2">
                  Email: {order.supplier.email}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ακύρωση</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendOrder}>
              Αποστολή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
