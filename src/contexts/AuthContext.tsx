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

  // Ensure user profile and conversation member exist using direct queries
  const ensureProfileAndConversation = useCallback(async (userId: string, email: string) => {
    try {
      console.log('[Auth] [ensureProfileAndConversation] Starting check for user:', email, 'ID:', userId);

      // 1. Lookup profile by auth user id
      console.log('[Auth] [SELECT] Querying profile table for user ID:', userId);
      const { data: profile, error: selectError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      console.log('[Auth] [SELECT] Querying profile table finished. Data:', profile, 'Error:', selectError);

      if (selectError) {
        console.error('[Auth] Error querying profiles:', selectError);
        return null;
      }

      let currentProfile = profile;

      // 2. If profile does not exist: INSERT profile
      if (!currentProfile) {
        const displayName = email.split('@')[0] || email;
        console.log('[Auth] [INSERT] Profile not found. Inserting profile for ID:', userId, 'Email:', email, 'DisplayName:', displayName);
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: email,
            display_name: displayName,
          });
        console.log('[Auth] [INSERT] Insert profile query finished. Error:', insertError);

        if (insertError) {
          console.error('[Auth] Error inserting profile:', insertError.message);
          return null;
        }

        // 3. Fetch profile again
        console.log('[Auth] [SELECT] Fetching profile again for user ID:', userId);
        const { data: refetchedProfile, error: refetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        console.log('[Auth] [SELECT] Fetching profile again finished. Data:', refetchedProfile, 'Error:', refetchError);

        if (refetchError) {
          console.error('[Auth] Error refetching profile:', refetchError);
          return null;
        }
        currentProfile = refetchedProfile;
      }

      // 4. Ensure conversation membership check runs in the background
      console.log('[Auth] [RPC ensure_profile_and_conversation] Start background RPC check...');
      supabase.rpc('ensure_profile_and_conversation' as any, {
        p_user_id: userId,
        p_email: email,
      }).then(
        ({ data, error }) => {
          console.log('[Auth] [RPC ensure_profile_and_conversation] Finished background RPC check. Data:', data, 'Error:', error);
        },
        (err: any) => {
          console.error('[Auth] Background RPC check exception:', err);
        }
      );

      return currentProfile;
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
