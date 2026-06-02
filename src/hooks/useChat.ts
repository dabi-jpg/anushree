import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { encrypt, decrypt, getEncryptionKey, generateChecksum } from '../lib/encryption';
import type { MessageWithAttachment, Attachment } from '../types/database';

const PAGE_SIZE = 50;

export function useChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageWithAttachment[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const mountedRef = useRef(true);

  // Fetch the single conversation ID
  useEffect(() => {
    if (!user) {
      console.log('[Chat] No user session found. Skipping conversation fetch.');
      setIsLoading(false);
      return;
    }
    
    mountedRef.current = true;
    console.log('[Chat] Fetching conversation ID for user:', user.email);
    setIsLoading(true);

    const fetchConversation = async () => {
      try {
        const { data, error } = await supabase
          .from('conversation_members')
          .select('conversation_id')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (error) {
          console.error('[Chat] Error fetching conversation membership:', error);
          if (mountedRef.current) {
            setIsLoading(false);
          }
          return;
        }

        if (data && mountedRef.current) {
          console.log('[Chat] Successfully retrieved conversation ID:', data.conversation_id);
          setConversationId(data.conversation_id);
        } else if (mountedRef.current) {
          console.warn('[Chat] Conversation membership was empty.');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[Chat] Exception in fetchConversation:', err);
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    fetchConversation();

    return () => {
      mountedRef.current = false;
      console.log('[Chat] useChat unmounted.');
    };
  }, [user]);

  // Decrypt a message content
  const decryptMessage = useCallback(async (content: string | null): Promise<string> => {
    if (!content) return '';
    try {
      const key = await getEncryptionKey();
      if (!key) return content;
      return await decrypt(content, key);
    } catch (err) {
      console.error('[Chat] Decryption exception:', err);
      return content;
    }
  }, []);

  // Fetch messages with attachments
  const fetchMessages = useCallback(async (before?: string) => {
    if (!conversationId || !user) {
      console.log('[Chat] fetchMessages skipped (missing conversationId or user).');
      setIsLoading(false);
      return;
    }

    console.log('[Chat] Fetching messages. conversation:', conversationId, 'before:', before);

    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          attachments (*),
          read_receipts (*)
        `)
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[Chat] Error loading messages from database:', error);
        if (mountedRef.current) {
          setIsLoading(false);
        }
        return;
      }

      if (!data) {
        console.warn('[Chat] Query returned no messages data.');
        if (mountedRef.current) {
          setIsLoading(false);
        }
        return;
      }

      if (!mountedRef.current) return;

      console.log(`[Chat] Loaded ${data.length} messages.`);

      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      }

      // Decrypt messages
      const decryptedMessages = await Promise.all(
        (data as any[]).map(async (msg) => {
          const decryptedContent = msg.message_type === 'text'
            ? await decryptMessage(msg.content)
            : msg.content;

          return {
            ...msg,
            content: decryptedContent,
            attachments: msg.attachments || [],
            read_receipts: msg.read_receipts || [],
          } as MessageWithAttachment;
        })
      );

      if (mountedRef.current) {
        if (before) {
          setMessages(prev => [...prev, ...decryptedMessages.reverse()]);
        } else {
          setMessages(decryptedMessages.reverse());
        }
      }
    } catch (err) {
      console.error('[Chat] Exception fetching messages:', err);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [conversationId, user, decryptMessage]);

  // Initial fetch
  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    }
  }, [conversationId, fetchMessages]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!conversationId || !user) return;

    console.log('[Chat] Creating realtime subscription channel for messages:', conversationId);

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          console.log('[Chat] Realtime message insert event received:', payload.new.id);
          const newMsg = payload.new as any;

          try {
            // Fetch attachments for this message
            const { data: attachments, error } = await supabase
              .from('attachments')
              .select('*')
              .eq('message_id', newMsg.id);

            if (error) {
              console.error('[Chat] Error fetching realtime message attachments:', error);
            }

            const decryptedContent = newMsg.message_type === 'text'
              ? await decryptMessage(newMsg.content)
              : newMsg.content;

            const fullMessage: MessageWithAttachment = {
              ...newMsg,
              content: decryptedContent,
              attachments: (attachments as Attachment[]) || [],
              read_receipts: [],
            };

            if (mountedRef.current) {
              setMessages(prev => {
                // Avoid duplicates (from optimistic updates)
                if (prev.some(m => m.id === fullMessage.id)) return prev;
                return [...prev, fullMessage];
              });
            }
          } catch (err) {
            console.error('[Chat] Exception handling realtime message payload:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'read_receipts',
        },
        (payload) => {
          console.log('[Chat] Realtime read receipt event received:', payload.new.id);
          const receipt = payload.new as any;
          if (mountedRef.current) {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === receipt.message_id
                  ? {
                      ...msg,
                      read_receipts: [
                        ...(msg.read_receipts || []),
                        receipt,
                      ],
                    }
                  : msg
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log(`[Chat] Realtime subscription status is: ${status}`);
      });

    return () => {
      console.log('[Chat] Disconnecting realtime channel for messages:', conversationId);
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, decryptMessage]);

  // Send a message
  const sendMessage = useCallback(async (
    content: string,
    messageType: 'text' | 'image' | 'video' | 'voice' = 'text',
    attachmentData?: { path: string; fileType: string; fileSize: number; bucket: string }
  ): Promise<{ error: string | null }> => {
    if (!conversationId || !user) {
      console.error('[Chat] Failed to send message: conversationId or user is null.');
      return { error: 'Not connected' };
    }

    console.log('[Chat] Sending message of type:', messageType);
    setIsSending(true);

    try {
      let encryptedContent = content;
      let checksum: string | null = null;

      // Encrypt text messages
      if (messageType === 'text' && content) {
        const key = await getEncryptionKey();
        if (key) {
          encryptedContent = await encrypt(content, key);
          checksum = await generateChecksum(content);
        }
      }

      // Insert message
      const { data: messageData, error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: encryptedContent || null,
          message_type: messageType,
          checksum,
        })
        .select()
        .single();

      if (msgError) {
        console.error('[Chat] Error inserting message:', msgError);
        return { error: msgError.message };
      }

      console.log('[Chat] Message inserted successfully:', messageData.id);

      // Insert attachment if provided
      if (attachmentData && messageData) {
        console.log('[Chat] Inserting message attachment:', attachmentData.path);
        const { error: attachError } = await supabase
          .from('attachments')
          .insert({
            message_id: messageData.id,
            storage_path: attachmentData.path,
            file_type: attachmentData.fileType,
            file_size: attachmentData.fileSize,
            metadata: { bucket: attachmentData.bucket },
          });

        if (attachError) {
          console.error('[Chat] Error inserting attachment:', attachError);
        }
      }

      return { error: null };
    } catch (err: any) {
      console.error('[Chat] Exception in sendMessage:', err);
      return { error: err.message || 'Failed to send message' };
    } finally {
      if (mountedRef.current) {
        setIsSending(false);
      }
    }
  }, [conversationId, user]);

  // Load more messages (pagination)
  const loadMore = useCallback(() => {
    if (messages.length > 0 && hasMore) {
      console.log('[Chat] Loading more messages before:', messages[0].created_at);
      fetchMessages(messages[0].created_at);
    }
  }, [messages, hasMore, fetchMessages]);

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!conversationId || !user) return;

    try {
      console.log('[Chat] Marking conversation messages as read...');
      const { error } = await supabase.rpc('mark_messages_read' as any, {
        p_conversation_id: conversationId,
        p_user_id: user.id,
      });
      if (error) {
        console.error('[Chat] Error in mark_messages_read RPC:', error);
      }
    } catch (err) {
      console.error('[Chat] Exception in markAsRead:', err);
    }
  }, [conversationId, user]);

  return {
    messages,
    conversationId,
    isLoading,
    hasMore,
    isSending,
    sendMessage,
    loadMore,
    markAsRead,
  };
}
