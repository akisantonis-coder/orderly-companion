import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Package } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validate inputs
    const trimmedEmail = email.trim();
    if (!trimmedEmail || trimmedEmail.length > 254) {
      setError('Παρακαλώ εισάγετε ένα έγκυρο email');
      setIsLoading(false);
      return;
    }

    if (password.length < 6 || password.length > 128) {
      setError('Ο κωδικός πρέπει να είναι 6-128 χαρακτήρες');
      setIsLoading(false);
      return;
    }

    const { error: signInError } = await signIn(trimmedEmail, password);

    if (signInError) {
      setError(signInError.message === 'Invalid login credentials' 
        ? 'Λάθος email ή κωδικός' 
        : signInError.message);
      setIsLoading(false);
    } else {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Package className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Αποθήκη</CardTitle>
          <CardDescription>
            Συνδεθείτε στον λογαριασμό σας
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
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Σύνδεση
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Δεν έχετε λογαριασμό;{' '}
              <Link to="/signup" className="text-primary hover:underline">
                Εγγραφή
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
