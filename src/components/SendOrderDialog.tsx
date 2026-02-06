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

interface SendOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierName: string;
  onConfirm: (userEmail: string) => void;
  isLoading?: boolean;
}

export function SendOrderDialog({
  open,
  onOpenChange,
  supplierName,
  onConfirm,
  isLoading,
}: SendOrderDialogProps) {
  const [userEmail, setUserEmail] = useState('');

  const handleConfirm = () => {
    onConfirm(userEmail);
  };

  const isValid = userEmail.includes('@') && userEmail.length > 3;

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
                <p className="text-xs text-muted-foreground">
                  Θα λάβετε την παραγγελία στο email σας για να την προωθήσετε ή κοινοποιήσετε.
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
