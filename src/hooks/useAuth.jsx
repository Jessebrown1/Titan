import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const checkAdmin = useCallback(async (sess) => {
    if (!sess) return false;
    // is_admin() is a SECURITY DEFINER function backed by the admins table.
    const { data, error } = await supabase.rpc('is_admin');
    if (error) {
      console.error(error);
      return false;
    }
    return Boolean(data);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      const admin = await checkAdmin(data.session);
      if (!active) return;
      setSession(data.session);
      setIsAdmin(admin);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      // Defer the RPC so it doesn't run inside the auth callback lock.
      setTimeout(async () => {
        const admin = await checkAdmin(sess);
        if (active) setIsAdmin(admin);
      }, 0);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [checkAdmin]);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const admin = await checkAdmin(data.session);
    if (!admin) {
      await supabase.auth.signOut();
      throw new Error('This account is not authorised to access the dashboard.');
    }
    setSession(data.session);
    setIsAdmin(true);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, isAdmin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
