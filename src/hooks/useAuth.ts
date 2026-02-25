'use client';
import { useState, useEffect, useCallback } from 'react';
import { AuthSession } from '@/types/student';
import { login, logout, getCurrentSession, initDefaultUser } from '@/lib/auth';

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initDefaultUser().then(() => {
      const s = getCurrentSession();
      setSession(s);
      setLoading(false);
    });
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const result = await login(username, password);
    if (result.success) {
      setSession(getCurrentSession());
    }
    return result;
  }, []);

  const signOut = useCallback(() => {
    logout();
    setSession(null);
  }, []);

  return { session, loading, signIn, signOut, isAuthenticated: !!session };
}
