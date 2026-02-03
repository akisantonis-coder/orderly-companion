import { useState } from 'react';
import { Mail, Send } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SendOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierName: string;
  supplierEmail: string | null;
  onConfirm: (sendCopyToUser: boolean, userEmail?: string) => void;
  isLoading?: boolean;
}

export function SendOrderDialog({
  open,
  onOpenChange,
  supplierName,
  supplierEmail,
  onConfirm,
  isLoading,
}: SendOrderDialogProps) {
  const [sendCopy, setSendCopy] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const handleConfirm = () => {
    onConfirm(sendCopy, sendCopy ? userEmail : undefined);
  };

  const isValid = !sendCopy || (sendCopy && userEmail.includes('@'));

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Αποστολή παραγγελίας
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Θέλετε να στείλετε την παραγγελία στον προμηθευτή "{supplierName}";
              </p>
              
              {supplierEmail ? (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-foreground">
                    <span className="text-muted-foreground">Email προμηθευτή:</span>{' '}
                    <span className="font-medium">{supplierEmail}</span>
                  </p>
                </div>
              ) : (
                <div className="bg-destructive/10 text-destructive p-3 rounded-lg">
                  <p className="text-sm">
                    ⚠️ Ο προμηθευτής δεν έχει email. Προσθέστε email πρώτα.
                  </p>
                </div>
              )}

              {supplierEmail && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="send-copy"
                      checked={sendCopy}
                      onCheckedChange={(checked) => setSendCopy(checked === true)}
                    />
                    <Label htmlFor="send-copy" className="text-sm font-normal cursor-pointer">
                      Αποστολή αντιγράφου στο email μου
                    </Label>
                  </div>

                  {sendCopy && (
                    <Input
                      type="email"
                      placeholder="Το email σας"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Ακύρωση</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!supplierEmail || !isValid || isLoading}
          >
            {isLoading ? (
              'Αποστολή...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Αποστολή
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
