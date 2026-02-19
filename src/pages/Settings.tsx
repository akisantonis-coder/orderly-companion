import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useSettings } from '@/hooks/useSettings';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Building2, FileText, Save } from 'lucide-react';

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
