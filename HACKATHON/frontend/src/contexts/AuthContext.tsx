import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, type Profile } from '@/lib/supabase';

const GUEST_STORAGE_KEY = 'ekishaan_guest_user_session';

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  /** True once signup succeeds but Supabase requires email confirmation before a session exists. */
  signup: (name: string, email: string, password: string, location?: string) => Promise<{ needsEmailConfirmation: boolean }>;
  login: (email: string, password: string) => Promise<void>;
  guestLogin: (name?: string, email?: string) => void;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (patch: Partial<Pick<Profile, 'name' | 'location' | 'land_size' | 'primary_crops' | 'experience' | 'phone'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const createMockUser = (email = 'farmer@ekishaan.org', name = 'Farmer User'): User => ({
  id: 'guest-farmer-id-101',
  app_metadata: { provider: 'email' },
  user_metadata: { full_name: name },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email,
  role: 'authenticated',
  updated_at: new Date().toISOString(),
});

const createMockProfile = (email = 'farmer@ekishaan.org', name = 'Farmer User'): Profile => ({
  id: 'guest-farmer-id-101',
  name,
  email,
  location: 'Ludhiana, Punjab',
  land_size: '5.0 acres',
  primary_crops: ['Wheat', 'Rice', 'Cotton'],
  experience: '10 years',
  phone: '+91 9876543210',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[supabase] Failed to load profile:', error.message);
      return;
    }
    setProfile(data);
  }, []);

  const guestLogin = useCallback((name?: string, email?: string) => {
    const guestUser = createMockUser(email || 'farmer@ekishaan.org', name || 'Farmer User');
    const guestProf = createMockProfile(email || 'farmer@ekishaan.org', name || 'Farmer User');
    setUser(guestUser);
    setProfile(guestProf);
    try {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ email: guestUser.email, name: guestProf.name }));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    // Check if guest user session exists in localStorage
    try {
      const savedGuest = localStorage.getItem(GUEST_STORAGE_KEY);
      if (savedGuest) {
        const { email, name } = JSON.parse(savedGuest);
        setUser(createMockUser(email, name));
        setProfile(createMockProfile(email, name));
      }
    } catch {
      // Ignore
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        try {
          const savedGuest = localStorage.getItem(GUEST_STORAGE_KEY);
          if (savedGuest) {
            const { email, name } = JSON.parse(savedGuest);
            setUser(createMockUser(email, name));
            setProfile(createMockProfile(email, name));
          } else {
            const guestUser = createMockUser();
            const guestProf = createMockProfile();
            setUser(guestUser);
            setProfile(guestProf);
          }
        } catch {
          setUser(createMockUser());
          setProfile(createMockProfile());
        }
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        // If no supabase session, check guest session before fallback
        try {
          const savedGuest = localStorage.getItem(GUEST_STORAGE_KEY);
          if (savedGuest) {
            const { email, name } = JSON.parse(savedGuest);
            setUser(createMockUser(email, name));
            setProfile(createMockProfile(email, name));
          } else {
            setUser(createMockUser());
            setProfile(createMockProfile());
          }
        } catch {
          setUser(createMockUser());
          setProfile(createMockProfile());
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const assertConfigured = () => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase is not configured yet. Add your project keys to .env.local (see .env.local.example).'
      );
    }
  };

  const signup = async (name: string, email: string, password: string, location?: string) => {
    if (!isSupabaseConfigured) {
      guestLogin(name, email);
      return { needsEmailConfirmation: false };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name, location } },
    });
    if (error) throw error;
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      throw new Error('An account with this email already exists. Try logging in instead.');
    }
    return { needsEmailConfirmation: !data.session };
  };

  const login = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      guestLogin(undefined, email);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    try {
      localStorage.removeItem(GUEST_STORAGE_KEY);
    } catch {
      // Ignore
    }
    setUser(null);
    setProfile(null);

    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore signout error if session already gone
      }
    }
  };

  const resetPassword = async (email: string) => {
    assertConfigured();
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  const updateProfile: AuthContextValue['updateProfile'] = async (patch) => {
    if (user?.id === 'guest-farmer-id-101') {
      setProfile((prev) => (prev ? { ...prev, ...patch } : createMockProfile()));
      return;
    }
    assertConfigured();
    if (!user) throw new Error('You must be logged in to update your profile.');
    const { data, error } = await supabase.from('profiles').update(patch).eq('id', user.id).select().single();
    if (error) throw error;
    setProfile(data);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signup, login, guestLogin, logout, resetPassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
