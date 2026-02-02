import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, Trash2, Eye, Plus } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { OrderItemRow } from '@/components/OrderItemRow';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
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
import {
  useOrder,
  useUpdateOrderItem,
  useDeleteOrderItem,
  useDeleteOrder,
  useSendOrder,
} from '@/hooks/useOrders';
import { toast } from 'sonner';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  const { data: order, isLoading } = useOrder(id);
  const updateOrderItem = useUpdateOrderItem();
  const deleteOrderItem = useDeleteOrderItem();
  const deleteOrder = useDeleteOrder();
  const sendOrder = useSendOrder();

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    try {
      await updateOrderItem.mutateAsync({ itemId, quantity });
    } catch (error) {
      toast.error('Σφάλμα κατά την ενημέρωση');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteOrderItem.mutateAsync(itemId);
      toast.success('Το προϊόν αφαιρέθηκε');
    } catch (error) {
      toast.error('Σφάλμα κατά τη διαγραφή');
    }
  };

  const handleDeleteOrder = async () => {
    try {
      await deleteOrder.mutateAsync(id!);
      toast.success('Η παραγγελία διαγράφηκε');
      navigate('/orders');
    } catch (error) {
      toast.error('Σφάλμα κατά τη διαγραφή');
    }
  };

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
          <div className="space-y-4">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-20 bg-muted animate-pulse rounded-xl" />
            <div className="h-20 bg-muted animate-pulse rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container py-6">
          <EmptyState
            icon={Trash2}
            title="Η παραγγελία δεν βρέθηκε"
            description="Η παραγγελία μπορεί να έχει διαγραφεί"
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

  const totalItems = order.items?.length || 0;
  const totalQuantity = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <Layout>
      {/* Sticky Header */}
      <div className="supplier-header">
        <div className="container flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="-ml-2">
            <Link to="/orders">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground truncate">
              {order.supplier.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {totalItems} προϊόντα • {totalQuantity} τεμ.
            </p>
          </div>
        </div>
      </div>

      <div className="container py-6 space-y-4">
        {/* Order Items */}
        {order.items && order.items.length > 0 ? (
          <div className="space-y-2">
            {order.items.map((item) => (
              <OrderItemRow
                key={item.id}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Plus}
            title="Δεν υπάρχουν προϊόντα"
            description="Προσθέστε προϊόντα στην παραγγελία"
            action={
              <Button asChild>
                <Link to="/search">
                  <Plus className="h-4 w-4 mr-2" />
                  Προσθήκη
                </Link>
              </Button>
            }
          />
        )}

        {/* Actions */}
        {order.items && order.items.length > 0 && (
          <div className="fixed bottom-20 md:bottom-8 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
            <div className="container flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Διαγραφή
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                asChild
              >
                <Link to={`/orders/${id}/preview`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Προεπισκόπηση
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
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Διαγραφή παραγγελίας</AlertDialogTitle>
            <AlertDialogDescription>
              Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την παραγγελία; Η ενέργεια δεν μπορεί να αναιρεθεί.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ακύρωση</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
