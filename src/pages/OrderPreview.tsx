import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, FileText, Mail, Share2, Copy, Check, Download, Edit2, X } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SendOrderDialog } from '@/components/SendOrderDialog';
import { useOrder, useSendOrder } from '@/hooks/useOrders';
import { useSettings } from '@/hooks/useSettings';
import { getFullUnitName } from '@/types';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { exportOrderToPDF, exportOrderToExcel, generateOrderText } from '@/utils/orderExport';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function OrderPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [customOrderText, setCustomOrderText] = useState('');

  const { data: order, isLoading } = useOrder(id);
  const { settings } = useSettings();
  const sendOrder = useSendOrder();

  // Initialize custom text from settings when order loads
  useEffect(() => {
    if (order) {
      const generatedText = generateOrderText(order, settings.defaultOrderText);
      setCustomOrderText(generatedText);
    }
  }, [order, settings.defaultOrderText]);

  // Generate order text for display/sharing
  const getOrderText = (): string => {
    if (customOrderText) {
      return customOrderText;
    }
    if (order && settings.defaultOrderText) {
      return generateOrderText(order, settings.defaultOrderText);
    }
    // Fallback to old format
    const date = format(new Date(), 'd MMMM yyyy, HH:mm', { locale: el });
    const itemsList = order?.items
      ?.map((item: any) => {
        const unit = item.unit || item.product.unit;
        return `• ${item.product.name}: ${item.quantity} ${getFullUnitName(unit, item.quantity)}`;
      })
      .join('\n') || '';

    return `📦 ΠΑΡΑΓΓΕΛΙΑ - ${order?.supplier.name || ''}

Ημερομηνία: ${date}

Είδη:
${itemsList}

---
Αποστολή από την εφαρμογή Αποθήκη`;
  };

  const handleShare = async () => {
    if (!order) return;
    
    const text = getOrderText();
    
    // Try Web Share API first (works on mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Παραγγελία - ${order.supplier.name}`,
          text: text,
        });
        return;
      } catch (error) {
        // User cancelled or error - fall back to clipboard
        if ((error as Error).name === 'AbortError') return;
      }
    }
    
    // Fallback: copy to clipboard
    await handleCopy();
  };

  const handleCopy = async () => {
    if (!order) return;
    
    const text = getOrderText();
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Η παραγγελία αντιγράφηκε');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Σφάλμα κατά την αντιγραφή');
    }
  };

  const handleSendOrder = async (userEmail: string, customMessage: string) => {
    try {
      await sendOrder.mutateAsync({ orderId: id!, userEmail, customMessage });
      toast.success('Η παραγγελία εστάλη επιτυχώς');
      navigate('/orders');
    } catch (error: any) {
      toast.error(error.message || 'Σφάλμα κατά την αποστολή');
    }
  };

  const handleExportPDF = () => {
    if (order) {
      exportOrderToPDF(order, customOrderText || settings.defaultOrderText);
      toast.success('Το PDF κατέβηκε');
    }
  };

  const handleExportExcel = () => {
    if (order) {
      exportOrderToExcel(order, customOrderText || settings.defaultOrderText);
      toast.success('Το Excel κατέβηκε');
    }
  };

  const handleSaveText = () => {
    setIsEditingText(false);
    toast.success('Το κείμενο αποθηκεύτηκε');
  };

  const handleResetText = () => {
    if (order && settings.defaultOrderText) {
      const generatedText = generateOrderText(order, settings.defaultOrderText);
      setCustomOrderText(generatedText);
    }
    setIsEditingText(false);
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
        {/* Company Info Card */}
        {settings.company.name && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{settings.company.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              {settings.company.address && <p>{settings.company.address}</p>}
              <div className="flex gap-4 flex-wrap">
                {settings.company.phone && <p>Τηλ: {settings.company.phone}</p>}
                {settings.company.email && <p>Email: {settings.company.email}</p>}
                {settings.company.taxId && <p>ΑΦΜ: {settings.company.taxId}</p>}
              </div>
            </CardContent>
          </Card>
        )}

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

          {/* Order Text Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Κείμενο Παραγγελίας</h3>
              {!isEditingText && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingText(true)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Επεξεργασία
                </Button>
              )}
            </div>

            {isEditingText ? (
              <div className="space-y-3">
                <Textarea
                  value={customOrderText}
                  onChange={(e) => setCustomOrderText(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveText}>
                    Αποθήκευση
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleResetText}>
                    Επαναφορά
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-border p-4 bg-muted/50">
                <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
                  {getOrderText()}
                </pre>
              </div>
            )}
          </div>

          {/* Products Table */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Είδη Παραγγελίας</h3>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Είδος
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
                  {order.items?.map((item) => {
                    // Use order item unit if available
                    const displayUnit = item.unit || item.product.unit;
                    return (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {item.product.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground text-right font-medium">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {getFullUnitName(displayUnit, item.quantity)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
          <div className="container flex flex-col gap-3">
            <div className="flex gap-3">
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
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Κοινοποίηση
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Αντιγράφηκε!' : 'Αντιγραφή'}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Εξαγωγή PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <FileText className="h-4 w-4 mr-2" />
                    Εξαγωγή Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Send Confirmation */}
      <SendOrderDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        supplierName={order.supplier.name}
        onConfirm={handleSendOrder}
        isLoading={sendOrder.isPending}
      />
    </Layout>
  );
}
