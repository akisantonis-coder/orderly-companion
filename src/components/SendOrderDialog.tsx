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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface SendOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierName: string;
  onConfirm: (userEmail: string, customMessage: string) => void;
  isLoading?: boolean;
}

const DEFAULT_MESSAGE = `Γεια σας,

Θα θέλαμε να παραγγείλουμε τα παρακάτω προϊόντα.

Παρακαλούμε επιβεβαιώστε την παραλαβή και ενημερώστε μας για τυχόν ελλείψεις.

Ευχαριστούμε,
Αποθήκη`;

export function SendOrderDialog({
  open,
  onOpenChange,
  supplierName,
  onConfirm,
  isLoading,
}: SendOrderDialogProps) {
  const [userEmail, setUserEmail] = useState('');
  const [customMessage, setCustomMessage] = useState(DEFAULT_MESSAGE);

  const handleConfirm = () => {
    onConfirm(userEmail, customMessage);
  };

  const isValid = userEmail.includes('@') && userEmail.length > 3;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Αποστολή παραγγελίας
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Στείλε την παραγγελία για τον προμηθευτή "{supplierName}" στο email σου.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="user-email">Το email σας</Label>
                <Input
                  id="user-email"
                  type="email"
                  placeholder="example@email.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-message">Μήνυμα</Label>
                <Textarea
                  id="custom-message"
                  placeholder="Γράψε το μήνυμά σου..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Το μήνυμα θα εμφανιστεί στο email πριν τον πίνακα προϊόντων.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Ακύρωση</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
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
