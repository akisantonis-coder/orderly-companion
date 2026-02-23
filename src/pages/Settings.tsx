import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useSettings } from '@/hooks/useSettings';
import { storage } from '@/lib/storage';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Building2, FileText, Save, Download, Upload } from 'lucide-react';

export default function Settings() {
  const { settings, isLoading, updateCompany, updateDefaultOrderText } = useSettings();
  
  const [company, setCompany] = useState(settings.company);
  const [defaultText, setDefaultText] = useState(settings.defaultOrderText);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setCompany(settings.company);
    setDefaultText(settings.defaultOrderText);
    setHasChanges(false);
  }, [settings]);

  const handleCompanyChange = (field: keyof typeof company, value: string) => {
    setCompany(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleTextChange = (value: string) => {
    setDefaultText(value);
    setHasChanges(true);
  };

  const handleSave = () => {
    updateCompany(company);
    updateDefaultOrderText(defaultText);
    setHasChanges(false);
    toast.success('Οι ρυθμίσεις αποθηκεύτηκαν');
  };

  // Backup functionality
  const handleBackup = async () => {
    try {
      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {
          suppliers: await storage.getSuppliers(),
          products: await storage.getProducts(),
          orders: await storage.getAllOrders(),
          settings: settings
        }
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apothiki-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Το backup δημιουργήθηκε με επιτυχία');
    } catch (error) {
      console.error('Backup failed:', error);
      toast.error('Αποτυχία δημιουργίας backup');
    }
  };

  // Restore functionality
  const handleRestore = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const backupData = JSON.parse(text);
        
        if (!backupData.data) {
          throw new Error('Invalid backup file format');
        }

        // Clear existing data
        await storage.clearAllData();
        
        // Restore data
        if (backupData.data.suppliers) {
          for (const supplier of backupData.data.suppliers) {
            await storage.createSupplier(supplier);
          }
        }
        
        if (backupData.data.products) {
          for (const product of backupData.data.products) {
            await storage.createProduct(product);
          }
        }
        
        if (backupData.data.orders) {
          for (const order of backupData.data.orders) {
            await storage.createOrder(order);
          }
        }

        // Restore settings
        if (backupData.data.settings) {
          localStorage.setItem('app_settings', JSON.stringify(backupData.data.settings));
        }

        toast.success('Η επαναφορά ολοκληρώθηκε. Επανεκκινήστε την εφαρμογή.');
        
        // Reload after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
      } catch (error) {
        console.error('Restore failed:', error);
        toast.error('Αποτυχία επαναφοράς. Ελέγξτε το αρχείο backup.');
      }
    };
    
    input.click();
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

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <SettingsIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ρυθμίσεις</h1>
            <p className="text-sm text-muted-foreground">Διαχείριση στοιχείων εταιρίας και προεπιλογών</p>
          </div>
        </div>

        {/* Company Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Στοιχεία Εταιρίας</CardTitle>
            </div>
            <CardDescription>
              Τα στοιχεία αυτά θα εμφανίζονται στα PDF και emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Όνομα Εταιρίας *</Label>
                <Input
                  id="company-name"
                  value={company.name}
                  onChange={(e) => handleCompanyChange('name', e.target.value)}
                  placeholder="Όνομα Εταιρίας"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-taxId">ΑΦΜ</Label>
                <Input
                  id="company-taxId"
                  value={company.taxId}
                  onChange={(e) => handleCompanyChange('taxId', e.target.value)}
                  placeholder="ΑΦΜ"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-address">Διεύθυνση</Label>
                <Input
                  id="company-address"
                  value={company.address}
                  onChange={(e) => handleCompanyChange('address', e.target.value)}
                  placeholder="Διεύθυνση"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-phone">Τηλέφωνο</Label>
                <Input
                  id="company-phone"
                  value={company.phone}
                  onChange={(e) => handleCompanyChange('phone', e.target.value)}
                  placeholder="Τηλέφωνο"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-email">Email</Label>
                <Input
                  id="company-email"
                  type="email"
                  value={company.email}
                  onChange={(e) => handleCompanyChange('email', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-website">Ιστοσελίδα</Label>
                <Input
                  id="company-website"
                  value={company.website}
                  onChange={(e) => handleCompanyChange('website', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Default Order Text */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Προεπιλεγμένο Κείμενο Παραγγελίας</CardTitle>
            </div>
            <CardDescription>
              Το κείμενο που θα εμφανίζεται στα PDF και emails. Χρησιμοποιήστε [ΕΙΔΗ] για τη λίστα ειδών και [ΕΤΑΙΡΙΑ] για το όνομά σας.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="default-text">Κείμενο</Label>
              <Textarea
                id="default-text"
                value={defaultText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Προεπιλεγμένο κείμενο παραγγελίας..."
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Μεταβλητές: [ΕΙΔΗ] = λίστα ειδών, [ΕΤΑΙΡΙΑ] = όνομα εταιρίας
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Backup/Restore */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Save className="h-5 w-5 text-primary" />
              <CardTitle>Αντίγραφο Ασφαλείας</CardTitle>
            </div>
            <CardDescription>
              Δημιουργήστε αντίγραφο ασφαλείας όλων των δεδομένων σας ή επαναφέρετε από υπάρχον backup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={handleBackup} 
                variant="outline" 
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Δημιουργία Backup
              </Button>
              <Button 
                onClick={handleRestore} 
                variant="outline" 
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Επαναφορά Backup
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Το backup περιλαμβάνει προμηθευτές, προϊόντα, παραγγελίες και ρυθμίσεις. 
              Η επαναφορά θα αντικαταστήσει όλα τα υπάρχοντα δεδομένα.
            </p>
          </CardContent>
        </Card>

        {/* Save Button */}
        {hasChanges && (
          <div className="fixed bottom-20 md:bottom-8 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
            <div className="container">
              <Button onClick={handleSave} className="w-full" size="lg">
                <Save className="h-4 w-4 mr-2" />
                Αποθήκευση Ρυθμίσεων
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
