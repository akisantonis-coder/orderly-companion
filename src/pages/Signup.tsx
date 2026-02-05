import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Package, CheckCircle2 } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validate inputs
    const trimmedEmail = email.trim();
    const trimmedName = displayName.trim();
    
    if (!trimmedEmail || trimmedEmail.length > 254) {
      setError('Παρακαλώ εισάγετε ένα έγκυρο email');
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Μη έγκυρη μορφή email');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Ο κωδικός πρέπει να είναι τουλάχιστον 6 χαρακτήρες');
      setIsLoading(false);
      return;
    }

    if (password.length > 128) {
      setError('Ο κωδικός δεν μπορεί να υπερβαίνει τους 128 χαρακτήρες');
      setIsLoading(false);
      return;
    }

    if (trimmedName && trimmedName.length > 100) {
      setError('Το όνομα δεν μπορεί να υπερβαίνει τους 100 χαρακτήρες');
      setIsLoading(false);
      return;
    }

    const { error: signUpError } = await signUp(trimmedEmail, password, trimmedName || undefined);

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('Αυτό το email χρησιμοποιείται ήδη');
      } else {
        setError(signUpError.message);
      }
      setIsLoading(false);
    } else {
      setSuccess(true);
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            </div>
            <CardTitle className="text-2xl">Επιβεβαίωση Email</CardTitle>
            <CardDescription>
              Σας στείλαμε ένα email επιβεβαίωσης στο <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            <p>Παρακαλώ κάντε κλικ στον σύνδεσμο στο email σας για να ενεργοποιήσετε τον λογαριασμό σας.</p>
          </CardContent>
          <CardFooter>
            <Link to="/login" className="w-full">
              <Button variant="outline" className="w-full">
                Επιστροφή στη σύνδεση
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Package className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Δημιουργία Λογαριασμού</CardTitle>
          <CardDescription>
            Εισάγετε τα στοιχεία σας για να εγγραφείτε
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="displayName">Όνομα (προαιρετικό)</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Το όνομά σας"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isLoading}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                maxLength={254}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Κωδικός</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
                maxLength={128}
              />
              <p className="text-xs text-muted-foreground">
                Τουλάχιστον 6 χαρακτήρες
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Εγγραφή
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Έχετε ήδη λογαριασμό;{' '}
              <Link to="/login" className="text-primary hover:underline">
                Σύνδεση
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
