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
    if (!user) return;
    mountedRef.current = true;

    const fetchConversation = async () => {
      const { data, error } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching conversation:', error);
        return;
      }

      if (data && mountedRef.current) {
        setConversationId(data.conversation_id);
      }
    };

    fetchConversation();

    return () => { mountedRef.current = false; };
  }, [user]);

  // Decrypt a message content
  const decryptMessage = useCallback(async (content: string | null): Promise<string> => {
    if (!content) return '';
    try {
      const key = await getEncryptionKey();
      if (!key) return content;
      return await decrypt(content, key);
    } catch {
      return content;
    }
  }, []);

  // Fetch messages with attachments
  const fetchMessages = useCallback(async (before?: string) => {
    if (!conversationId || !user) return;

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
      console.error('Error fetching messages:', error);
      return;
    }

    if (!data || !mountedRef.current) return;

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

    if (before) {
      setMessages(prev => [...prev, ...decryptedMessages.reverse()]);
    } else {
      setMessages(decryptedMessages.reverse());
    }

    setIsLoading(false);
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
          const newMsg = payload.new as any;

          // Fetch attachments for this message
          const { data: attachments } = await supabase
            .from('attachments')
            .select('*')
            .eq('message_id', newMsg.id);

          const decryptedContent = newMsg.message_type === 'text'
            ? await decryptMessage(newMsg.content)
            : newMsg.content;

          const fullMessage: MessageWithAttachment = {
            ...newMsg,
            content: decryptedContent,
            attachments: (attachments as Attachment[]) || [],
            read_receipts: [],
          };

          setMessages(prev => {
            // Avoid duplicates (from optimistic updates)
            if (prev.some(m => m.id === fullMessage.id)) return prev;
            return [...prev, fullMessage];
          });
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
          const receipt = payload.new as any;
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
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, decryptMessage]);

  // Send a message
  const sendMessage = useCallback(async (
    content: string,
    messageType: 'text' | 'image' | 'video' | 'voice' = 'text',
    attachmentData?: { path: string; fileType: string; fileSize: number; bucket: string }
  ): Promise<{ error: string | null }> => {
    if (!conversationId || !user) return { error: 'Not connected' };

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
        return { error: msgError.message };
      }

      // Insert attachment if provided
      if (attachmentData && messageData) {
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
          console.error('Error inserting attachment:', attachError);
        }
      }

      return { error: null };
    } catch {
      return { error: 'Failed to send message' };
    } finally {
      setIsSending(false);
    }
  }, [conversationId, user]);

  // Load more messages (pagination)
  const loadMore = useCallback(() => {
    if (messages.length > 0 && hasMore) {
      fetchMessages(messages[0].created_at);
    }
  }, [messages, hasMore, fetchMessages]);

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!conversationId || !user) return;

    try {
      await supabase.rpc('mark_messages_read' as any, {
        p_conversation_id: conversationId,
        p_user_id: user.id,
      });
    } catch (err) {
      console.error('Error marking messages as read:', err);
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
