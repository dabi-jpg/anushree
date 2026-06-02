import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../hooks/useChat';
import { useTyping } from '../../hooks/useTyping';
import { usePresence } from '../../hooks/usePresence';
import { useVoiceCall } from '../../contexts/VoiceCallContext';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types/database';

export const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { initiateCall } = useVoiceCall();
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null);

  const {
    messages,
    conversationId,
    isLoading,
    hasMore,
    isSending,
    sendMessage,
    loadMore,
    markAsRead,
  } = useChat();

  const { isOtherTyping, otherTypingName, setTyping, stopTyping } = useTyping(conversationId);
  const { isOtherOnline, otherLastSeen } = usePresence();

  // Fetch other user's profile
  useEffect(() => {
    if (!user) return;
    let mounted = true;

    const fetchOtherProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('[ChatPage] Error fetching other user profile:', error);
          return;
        }

        if (!data) {
          console.log('[ChatPage] Other user profile does not exist yet.');
          return;
        }

        if (data && mounted) {
          console.log('[ChatPage] Loaded other user profile:', data.display_name);
          setOtherProfile(data as Profile);
        }
      } catch (err) {
        console.error('[ChatPage] Exception in fetchOtherProfile:', err);
      }
    };

    fetchOtherProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  // Mark messages as read when the page is visible
  useEffect(() => {
    if (!conversationId || !user) return;

    markAsRead();

    // Mark as read when tab becomes visible
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        markAsRead();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [conversationId, user, messages.length, markAsRead]);

  // Format last seen
  const formatLastSeen = () => {
    if (isOtherOnline) return 'Online';
    if (!otherLastSeen) return 'Offline';

    const diff = Date.now() - new Date(otherLastSeen).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return 'Offline';
  };



  return (
    <div className="min-h-screen bg-cream flex flex-col max-w-[700px] mx-auto relative">
      {/* Chat header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-teal-accent/10 px-4 py-3"
      >
        <div className="flex items-center gap-3">
          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            className="text-teal-accent hover:text-pink-primary transition-colors cursor-pointer p-1"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Avatar */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-pink-primary/20 border-2 border-teal-accent/30 flex items-center justify-center overflow-hidden">
              <span className="text-lg">
                {otherProfile?.display_name === 'Anushree' ? '🎀' : '🎮'}
              </span>
            </div>
            {/* Online indicator */}
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
              isOtherOnline ? 'bg-green-400' : 'bg-gray-300'
            }`} />
          </div>

          {/* Name + status */}
          <div className="flex-1 min-w-0">
            <h2 className="font-vietnam text-sm font-bold text-teal-accent truncate">
              {otherProfile?.display_name || 'Chat'}
            </h2>
            <p className="font-vietnam text-[10px] text-teal-accent/50">
              {isOtherTyping ? (
                <span className="text-pink-primary animate-pulse">typing...</span>
              ) : (
                formatLastSeen()
              )}
            </p>
          </div>

          {/* Encrypted badge */}
          <div className="flex items-center gap-1 bg-cream/80 rounded-full px-3 py-1 border border-teal-accent/15">
            <span className="text-[10px]">🔒</span>
            <span className="font-vietnam text-[8px] text-teal-accent/50 font-bold uppercase">
              Encrypted
            </span>
          </div>

          {/* Phone Call Button */}
          {otherProfile && (
            <button
              onClick={() => {
                if (!isOtherOnline) {
                  if (window.confirm(`${otherProfile.display_name} appears offline. Call anyway?`)) {
                    initiateCall(otherProfile.id);
                  }
                } else {
                  initiateCall(otherProfile.id);
                }
              }}
              className="p-2 bg-teal-accent hover:bg-pink-primary text-white border-2 border-teal-accent hover:border-pink-primary transition-all duration-200 rounded-xl cursor-pointer shadow-retro-teal-sm hover:shadow-retro-pink-sm active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center"
              title={`Call ${otherProfile.display_name}`}
            >
              <Phone size={16} />
            </button>
          )}
        </div>
      </motion.header>

      {/* Messages */}
      <MessageList
        messages={messages}
        currentUserId={user?.id || ''}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        isOtherTyping={isOtherTyping}
        otherTypingName={otherTypingName}
      />

      {/* Input area — positioned above the AppShell nav bar */}
      <div className="sticky bottom-16">
        <ChatInput
          onSendMessage={sendMessage}
          onTyping={() => setTyping(profile?.display_name || 'User')}
          onStopTyping={stopTyping}
          disabled={isSending}
        />
      </div>
    </div>
  );
};
