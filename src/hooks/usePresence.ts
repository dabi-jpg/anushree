import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const HEARTBEAT_INTERVAL = 30_000; // 30 seconds

export function usePresence() {
  const { user, profile } = useAuth();
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  const [otherLastSeen, setOtherLastSeen] = useState<string | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) return;

    // Update own last_seen periodically
    const updateLastSeen = async () => {
      try {
        console.log('[Presence] [updateLastSeen] [AWAIT] update_last_seen RPC starting for ID:', user.id);
        const rpcPromise = supabase.rpc('update_last_seen' as any, { p_user_id: user.id });
        await rpcPromise;
        console.log('[Presence] [updateLastSeen] [AWAIT] update_last_seen RPC finished.');
      } catch (err) {
        console.error('[Presence] [updateLastSeen] Exception:', err);
      }
    };

    // Initial update
    updateLastSeen();

    // Heartbeat
    heartbeatRef.current = setInterval(updateLastSeen, HEARTBEAT_INTERVAL);

    // Track other user's presence via realtime
    console.log('[Presence] Subscribing to global presence channel...');
    const channel = supabase
      .channel('presence:global')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const otherUsers = Object.values(state)
          .flat()
          .filter((p: any) => p.userId !== user.id);
        setIsOtherOnline(otherUsers.length > 0);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const otherLeft = leftPresences.some((p: any) => p.userId !== user.id);
        if (otherLeft) setIsOtherOnline(false);
      })
      .subscribe(async (status) => {
        console.log('[Presence] realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[Presence] [subscribe] [AWAIT] channel.track starting...');
          const trackPromise = channel.track({
            userId: user.id,
            displayName: profile?.display_name || 'User',
            onlineAt: new Date().toISOString(),
          });
          await trackPromise;
          console.log('[Presence] [subscribe] [AWAIT] channel.track completed.');
        }
      });

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  // Fetch other user's last_seen
  const fetchOtherLastSeen = useCallback(async () => {
    if (!user) return;

    console.log('[Presence] [fetchOtherLastSeen] [AWAIT] profiles.select starting...');
    const selectPromise = supabase
      .from('profiles')
      .select('last_seen')
      .neq('id', user.id)
      .limit(1)
      .single();
    const { data } = await selectPromise;
    console.log('[Presence] [fetchOtherLastSeen] [AWAIT] profiles.select completed. Result:', data);

    if (data) {
      setOtherLastSeen((data as any).last_seen);
    }
  }, [user]);

  useEffect(() => {
    fetchOtherLastSeen();
  }, [fetchOtherLastSeen]);

  return { isOtherOnline, otherLastSeen };
}
