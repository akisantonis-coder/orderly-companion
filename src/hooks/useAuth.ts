import { useState, useCallback } from 'react';

export function useAuth() {
  const [loading] = useState(false);

  const signOut = useCallback(async () => {
    return { error: null };
  }, []);

  return {
    session: { user: { email: 'user@app.local' } },
    user: { email: 'user@app.local' },
    loading,
    signIn: async (_email: string, _password: string) => ({ error: null }),
    signUp: async (_email: string, _password: string, _displayName?: string) => ({ error: null }),
    signOut,
  };
}
