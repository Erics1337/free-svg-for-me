'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase, Profile, getUserProfile } from '../lib/supabase';
import { User, AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  credits: number;
  freeProGenerationsUsed: number;
  freeProGenerationsRemaining: number;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null; user: User | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    try {
      const profileData = await getUserProfile();
      setProfile(profileData);
    } catch (err) {
      console.error('Failed to refresh profile:', err);
      setProfile(null);
    }
  }, [user]);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          try {
            const profileData = await getUserProfile();
            setProfile(profileData);
          } catch (err) {
            console.error('Failed to load initial profile:', err);
            setProfile(null);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to get session:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        try {
          const profileData = await getUserProfile();
          setProfile(profileData);
        } catch (err) {
          console.error('Failed to load profile on auth change:', err);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') !== 'success') return;

    // Clean the URL immediately
    window.history.replaceState({}, document.title, window.location.pathname);

    // Poll for updated credits — webhook may arrive slightly after redirect
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      const updated = await getUserProfile();
      if (updated) setProfile(updated);
      if (attempts >= 8) clearInterval(poll); // stop after ~8s
    }, 1000);

    return () => clearInterval(poll);
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { error, user: data.user };
  };

  const signInWithGoogle = async (): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      console.error('Google sign in error:', error);
    }
    return { error: error ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const credits = profile?.credits ?? 0;
  const freeProGenerationsUsed = profile?.free_pro_generations_used ?? 0;
  const FREE_PRO_LIMIT = 3;
  const freeProGenerationsRemaining = Math.max(0, FREE_PRO_LIMIT - freeProGenerationsUsed);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated: !!user,
        credits,
        freeProGenerationsUsed,
        freeProGenerationsRemaining,
        refreshProfile,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
