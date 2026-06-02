import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';
import { isAllowedEmail } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  initError: string | null;
  retryInit: () => void;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const retryInit = useCallback(() => {
    console.log('[Auth] Retrying initialization...');
    setInitError(null);
    setIsLoading(true);
    setRetryTrigger(prev => prev + 1);
  }, []);

  // Ensure user profile and conversation member exist using database RPC
  const ensureProfileAndConversation = useCallback(async (userId: string, email: string) => {
    try {
      console.log('[Auth] Ensuring profile & conversation for user:', email);
      const { data, error } = await supabase.rpc('ensure_profile_and_conversation' as any, {
        p_user_id: userId,
        p_email: email,
      });

      if (error) {
        console.error('[Auth] Error calling ensure_profile_and_conversation rpc:', error);
        return null;
      }

      console.log('[Auth] ensure_profile_and_conversation rpc succeeded. Profile returned:', data?.profile);
      return data?.profile as Profile;
    } catch (err) {
      console.error('[Auth] Exception in ensureProfileAndConversation:', err);
      return null;
    }
  }, []);

  // Initialize auth state with 10s timeout
  useEffect(() => {
    let mounted = true;
    console.log('[Auth] Initializing auth state. Retry trigger:', retryTrigger);

    const timeoutId = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn('[Auth] Initialization timed out after 10s.');
        setInitError('Connection timed out. Please check your network connection.');
        setIsLoading(false);
      }
    }, 10000);

    const initAuth = async () => {
      try {
        console.log('[Auth] Fetching session...');
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (mounted) {
          if (currentSession?.user) {
            console.log('[Auth] Found active user session:', currentSession.user.email);
            setSession(currentSession);
            setUser(currentSession.user);

            // Ensure profile exists and user is in the shared conversation
            const userProfile = await ensureProfileAndConversation(
              currentSession.user.id,
              currentSession.user.email || ''
            );

            if (mounted) {
              if (userProfile) {
                setProfile(userProfile);
                setInitError(null);
              } else {
                console.error('[Auth] Failed to initialize profile/conversation.');
                setInitError('Could not load or create your profile. Please verify your account setup.');
              }
            }
          } else {
            console.log('[Auth] No active session found.');
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        }
      } catch (err: any) {
        console.error('[Auth] Auth init error:', err);
        if (mounted) {
          setInitError(err.message || 'An error occurred during startup. Please try again.');
        }
      } finally {
        if (mounted) {
          clearTimeout(timeoutId);
          setIsLoading(false);
          console.log('[Auth] Initial loading state cleared.');
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        console.log('[Auth] onAuthStateChange event triggered:', event, newSession?.user?.email);

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          const userProfile = await ensureProfileAndConversation(
            newSession.user.id,
            newSession.user.email || ''
          );
          if (mounted) {
            setProfile(userProfile);
            if (userProfile) {
              setInitError(null);
            } else {
              setInitError('Could not load or create your profile.');
            }
          }
        } else {
          setProfile(null);
        }

        if (event === 'SIGNED_OUT') {
          console.log('[Auth] User signed out. Clearing local states.');
          setProfile(null);
          setInitError(null);
          sessionStorage.removeItem('chat_encryption_key');
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
      console.log('[Auth] Auth initialization cleanup.');
    };
  }, [retryTrigger, ensureProfileAndConversation]);

  const signUp = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    // Client-side allowlist check
    if (!isAllowedEmail(email)) {
      return { error: 'This email is not authorized to access this application.' };
    }

    const { error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    // Client-side allowlist check
    if (!isAllowedEmail(email)) {
      return { error: 'This email is not authorized to access this application.' };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    console.log('[Auth] Executing signOut.');
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setInitError(null);
    sessionStorage.removeItem('chat_encryption_key');
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, profile, session, isLoading, initError, retryInit, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
