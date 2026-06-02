import React, { useRef, useEffect, useCallback } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { AnimatePresence } from 'framer-motion';
import type { MessageWithAttachment } from '../../types/database';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

interface MessageListProps {
  messages: MessageWithAttachment[];
  currentUserId: string;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isOtherTyping: boolean;
  otherTypingName: string;
}

export const MessageList = React.memo<MessageListProps>(({
  messages,
  currentUserId,
  isLoading,
  hasMore,
  onLoadMore,
  isOtherTyping,
  otherTypingName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(messages.length);
  const isNearBottomRef = useRef(true);

  // Check if user is near bottom
  const checkNearBottom = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  // Scroll to bottom when new messages arrive (if user is near bottom)
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length]);

  // Initial scroll to bottom
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
  }, [isLoading]);

  // Infinite scroll (load more on scroll to top)
  const handleScroll = useCallback(() => {
    checkNearBottom();
    if (!containerRef.current) return;

    const { scrollTop } = containerRef.current;
    if (scrollTop < 50 && hasMore && !isLoading) {
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore, checkNearBottom]);

  // Format date dividers
  const formatDateDivider = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  // Group messages by date
  const groupedMessages = React.useMemo(() => {
    const groups: { date: string; messages: MessageWithAttachment[] }[] = [];
    let currentDate = '';

    messages.forEach((msg) => {
      const msgDate = format(new Date(msg.created_at), 'yyyy-MM-dd');
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msg.created_at, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    return groups;
  }, [messages]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto overflow-x-hidden py-4 scroll-smooth"
      style={{
        backgroundImage: 'linear-gradient(rgba(0,128,128,0.02) 1px, transparent 1px)',
        backgroundSize: '100% 2rem',
      }}
    >
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-teal-accent border-t-pink-primary rounded-full animate-spin" />
        </div>
      )}

      {/* Load more button */}
      {hasMore && !isLoading && messages.length > 0 && (
        <div className="flex justify-center py-3">
          <button
            onClick={onLoadMore}
            className="font-vietnam text-[9px] text-teal-accent/50 hover:text-teal-accent font-bold uppercase tracking-wider cursor-pointer transition-colors bg-cream/50 px-4 py-2 rounded-full border border-teal-accent/20"
          >
            Load earlier messages
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
          <span className="text-4xl mb-4">💬</span>
          <p className="font-press-start text-[10px] text-teal-accent/60 uppercase mb-2">
            No messages yet
          </p>
          <p className="font-vietnam text-[10px] text-pink-primary/60">
            Send the first message to start your private conversation!
          </p>
        </div>
      )}

      {/* Messages grouped by date */}
      {groupedMessages.map((group) => (
        <div key={group.date}>
          {/* Date divider */}
          <div className="flex items-center justify-center py-3">
            <div className="bg-cream/80 border border-teal-accent/15 rounded-full px-4 py-1.5">
              <span className="font-vietnam text-[9px] text-teal-accent/50 font-bold uppercase tracking-wider">
                {formatDateDivider(group.date)}
              </span>
            </div>
          </div>

          {/* Messages */}
          {group.messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMine={msg.sender_id === currentUserId}
            />
          ))}
        </div>
      ))}

      {/* Typing indicator */}
      <AnimatePresence>
        {isOtherTyping && (
          <TypingIndicator name={otherTypingName} />
        )}
      </AnimatePresence>

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}, (prev, next) => {
  return (
    prev.isLoading === next.isLoading &&
    prev.hasMore === next.hasMore &&
    prev.isOtherTyping === next.isOtherTyping &&
    prev.otherTypingName === next.otherTypingName &&
    prev.currentUserId === next.currentUserId &&
    prev.messages.length === next.messages.length &&
    prev.messages === next.messages
  );
});

MessageList.displayName = 'MessageList';
