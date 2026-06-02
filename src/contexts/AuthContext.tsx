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
      console.log('[Auth] [ensureProfileAndConversation] [START]');
      console.log('[Auth] [ensureProfileAndConversation] Step 1: Lookup profile by auth user id. User:', email, 'ID:', userId);

      // 1. Lookup profile by auth user id
      const selectPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const timeoutPromise = new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout after 5 seconds')), 5000)
      );

      console.log('[Auth] [ensureProfileAndConversation] [AWAIT] profiles.select * starting for ID:', userId);
      let selectResult: any;
      try {
        selectResult = await Promise.race([selectPromise, timeoutPromise]);
        console.log('[Auth] [ensureProfileAndConversation] [AWAIT] profiles.select * completed. Status:', selectResult?.status, 'Data:', selectResult?.data, 'Error:', selectResult?.error);
      } catch (err: any) {
        console.error('[Auth] [ensureProfileAndConversation] [AWAIT] profiles.select * failed or timed out. Exception:', err);
        selectResult = { data: null, error: err, status: 0 };
      }

      const profile = selectResult?.data;
      const selectError = selectResult?.error;

      if (selectError) {
        console.error('[Auth] Error querying profiles, skipping creation:', selectError);
        return null;
      }

      let currentProfile = profile;

      // 2. If profile does not exist: INSERT profile
      if (!currentProfile) {
        const displayName = email.split('@')[0] || email;
        console.log('[Auth] [ensureProfileAndConversation] Step 2: Profile not found. Inserting profile for ID:', userId, 'Email:', email, 'DisplayName:', displayName);
        
        console.log('[Auth] [ensureProfileAndConversation] [AWAIT] profiles.insert starting...');
        const insertPromise = supabase
          .from('profiles')
          .insert({
            id: userId,
            email: email,
            display_name: displayName,
          });
        const { error: insertError } = await insertPromise;
        console.log('[Auth] [ensureProfileAndConversation] [AWAIT] profiles.insert completed. Error:', insertError);

        if (insertError) {
          console.error('[Auth] Error inserting profile:', insertError.message);
          return null;
        }

        // 3. Fetch profile again
        console.log('[Auth] [ensureProfileAndConversation] Step 3: Fetching profile again for user ID:', userId);
        console.log('[Auth] [ensureProfileAndConversation] [AWAIT] profiles.select * retry starting...');
        const refetchPromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        const { data: refetchedProfile, error: refetchError } = await refetchPromise;
        console.log('[Auth] [ensureProfileAndConversation] [AWAIT] profiles.select * retry completed. Result:', { refetchedProfile, refetchError });

        if (refetchError) {
          console.error('[Auth] Error refetching profile:', refetchError);
          return null;
        }
        currentProfile = refetchedProfile;
      }

      // 4. Ensure conversation membership check runs in the background
      console.log('[Auth] [ensureProfileAndConversation] Step 4: Dispatching background conversation membership check RPC...');
      console.log('[Auth] [ensureProfileAndConversation] [AWAIT] ensure_profile_and_conversation RPC starting...');
      supabase.rpc('ensure_profile_and_conversation' as any, {
        p_user_id: userId,
        p_email: email,
      }).then(
        ({ data, error }) => {
          console.log('[Auth] [ensureProfileAndConversation] [RPC ensure_profile_and_conversation] Finished background RPC check. Data:', data, 'Error:', error);
        },
        (err: any) => {
          console.error('[Auth] [ensureProfileAndConversation] Background RPC check exception:', err);
        }
      );
      console.log('[Auth] [ensureProfileAndConversation] [END] Returning profile:', currentProfile);
      return currentProfile;
    } catch (err) {
      console.error('[Auth] Exception in ensureProfileAndConversation:', err);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    console.log('[Auth] Initializing auth state. Retry trigger:', retryTrigger);

    const initAuth = async () => {
      try {
        console.log('[Auth] [initAuth] Step 1: Fetching session...');
        console.log('[Auth] [initAuth] [AWAIT] supabase.auth.getSession() starting...');
        const sessionPromise = supabase.auth.getSession();
        const { data: { session: currentSession }, error: sessionError } = await sessionPromise;
        console.log('[Auth] [initAuth] [AWAIT] supabase.auth.getSession() completed. Session user:', currentSession?.user?.email, 'Error:', sessionError);
        
        if (sessionError) {
          throw sessionError;
        }

        if (mounted) {
          if (currentSession?.user) {
            console.log('[Auth] [initAuth] Found active user session:', currentSession.user.email);
            setSession(currentSession);
            setUser(currentSession.user);

            // Ensure profile exists and user is in the shared conversation
            console.log('[Auth] [initAuth] [AWAIT] ensureProfileAndConversation starting...');
            const profilePromise = ensureProfileAndConversation(
              currentSession.user.id,
              currentSession.user.email || ''
            );
            const userProfile = await profilePromise;
            console.log('[Auth] [initAuth] [AWAIT] ensureProfileAndConversation completed. Profile:', userProfile);

            if (mounted) {
              if (userProfile) {
                setProfile(userProfile);
              } else {
                console.warn('[Auth] ensureProfileAndConversation returned null. Setting default fallback profile.');
                setProfile({
                  id: currentSession.user.id,
                  email: currentSession.user.email || '',
                  display_name: (currentSession.user.email || '').split('@')[0] || 'User',
                  avatar_url: null,
                  created_at: new Date().toISOString(),
                  last_seen: new Date().toISOString(),
                  status: 'offline'
                });
              }
              setInitError(null);
            }
          } else {
            console.log('[Auth] [initAuth] No active session found.');
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
          setIsLoading(false);
          console.log('[Auth] Initial loading state cleared.');
        }
      }
    };

    initAuth();

    // Listen for auth changes
    console.log('[Auth] Setting up onAuthStateChange listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        console.log('[Auth] [onAuthStateChange] triggered:', event, newSession?.user?.email);

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          console.log('[Auth] [onAuthStateChange] [AWAIT] ensureProfileAndConversation starting...');
          const profilePromise = ensureProfileAndConversation(
            newSession.user.id,
            newSession.user.email || ''
          );
          const userProfile = await profilePromise;
          console.log('[Auth] [onAuthStateChange] [AWAIT] ensureProfileAndConversation completed. Profile:', userProfile);
          if (mounted) {
            if (userProfile) {
              setProfile(userProfile);
            } else {
              setProfile({
                id: newSession.user.id,
                email: newSession.user.email || '',
                display_name: (newSession.user.email || '').split('@')[0] || 'User',
                avatar_url: null,
                created_at: new Date().toISOString(),
                last_seen: new Date().toISOString(),
                status: 'offline'
              });
            }
            setInitError(null);
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
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[Auth] Error during supabase.auth.signOut:', err);
    }
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    setProfile(null);
    setSession(null);
    setInitError(null);
    window.location.href = '/login';
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
