import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const TYPING_TIMEOUT = 3000; // 3 seconds
const DEBOUNCE_MS = 500;

export function useTyping(conversationId: string | null) {
  const { user } = useAuth();
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [otherTypingName, setOtherTypingName] = useState('');
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase.channel(`typing:${conversationId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.userId !== user.id) {
          setIsOtherTyping(true);
          setOtherTypingName(payload.payload.displayName || '');

          // Clear previous timeout
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }

          // Auto-clear after timeout
          typingTimeoutRef.current = setTimeout(() => {
            setIsOtherTyping(false);
            setOtherTypingName('');
          }, TYPING_TIMEOUT);
        }
      })
      .on('broadcast', { event: 'stop_typing' }, (payload) => {
        if (payload.payload.userId !== user.id) {
          setIsOtherTyping(false);
          setOtherTypingName('');
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  const setTyping = useCallback((displayName: string) => {
    if (!channelRef.current || !user) return;

    // Debounce broadcasts
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user.id, displayName },
      });
    }, DEBOUNCE_MS);
  }, [user]);

  const stopTyping = useCallback(() => {
    if (!channelRef.current || !user) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    channelRef.current.send({
      type: 'broadcast',
      event: 'stop_typing',
      payload: { userId: user.id },
    });
  }, [user]);

  return { isOtherTyping, otherTypingName, setTyping, stopTyping };
}
