import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck, Play, Pause } from 'lucide-react';
import { format } from 'date-fns';
import type { MessageWithAttachment } from '../../types/database';
import { getSignedUrl, type BucketName } from '../../lib/storage';
import { MediaPreview } from './MediaPreview';

interface MessageBubbleProps {
  message: MessageWithAttachment;
  isMine: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMine }) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  const attachment = message.attachments?.[0];
  const isRead = (message.read_receipts?.length ?? 0) > 0;
  const timestamp = format(new Date(message.created_at), 'h:mm a');

  // Fetch signed URL for attachments
  useEffect(() => {
    if (!attachment) return;

    const fetchUrl = async () => {
      const bucket = (attachment.metadata as any)?.bucket as BucketName;
      if (!bucket) return;

      const url = await getSignedUrl(bucket, attachment.storage_path);
      if (url) setMediaUrl(url);
    };

    fetchUrl();

    // Refresh URL every 4 minutes (URLs expire in 5)
    const refreshInterval = setInterval(fetchUrl, 4 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [attachment]);

  const toggleAudio = () => {
    if (!audioRef) return;
    if (isAudioPlaying) {
      audioRef.pause();
    } else {
      audioRef.play();
    }
    setIsAudioPlaying(!isAudioPlaying);
  };

  const renderContent = () => {
    switch (message.message_type) {
      case 'text':
        return (
          <p className="font-vietnam text-[13px] leading-relaxed break-words whitespace-pre-wrap">
            {message.content}
          </p>
        );

      case 'image':
        return (
          <div className="max-w-[240px]">
            {mediaUrl ? (
              <img
                src={mediaUrl}
                alt="Shared image"
                className="rounded-lg w-full cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setPreviewOpen(true)}
                loading="lazy"
              />
            ) : (
              <div className="w-[240px] h-[180px] bg-teal-accent/10 rounded-lg animate-pulse flex items-center justify-center">
                <span className="text-[10px] font-vietnam text-teal-accent/50">Loading...</span>
              </div>
            )}
            {message.content && (
              <p className="font-vietnam text-[11px] mt-2 leading-relaxed break-words">
                {message.content}
              </p>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="max-w-[280px]">
            {mediaUrl ? (
              <video
                src={mediaUrl}
                controls
                preload="metadata"
                className="rounded-lg w-full"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="w-[280px] h-[160px] bg-teal-accent/10 rounded-lg animate-pulse flex items-center justify-center">
                <span className="text-[10px] font-vietnam text-teal-accent/50">Loading...</span>
              </div>
            )}
          </div>
        );

      case 'voice':
        return (
          <div className="flex items-center gap-3 min-w-[180px]">
            <button
              onClick={toggleAudio}
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer transition-all ${
                isMine
                  ? 'bg-white/20 hover:bg-white/30'
                  : 'bg-teal-accent/20 hover:bg-teal-accent/30'
              }`}
            >
              {isAudioPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>

            {/* Waveform placeholder */}
            <div className="flex-1 flex items-center gap-0.5 h-6">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={isAudioPlaying ? {
                    height: [4, Math.random() * 20 + 4, 4],
                  } : {}}
                  transition={{
                    duration: 0.5,
                    repeat: isAudioPlaying ? Infinity : 0,
                    delay: i * 0.03,
                  }}
                  className={`w-1 rounded-full ${
                    isMine ? 'bg-white/40' : 'bg-teal-accent/40'
                  }`}
                  style={{ height: `${Math.random() * 12 + 4}px` }}
                />
              ))}
            </div>

            {attachment && (
              <span className="font-vietnam text-[9px] opacity-60 flex-shrink-0">
                {Math.round(attachment.file_size / 1024)}KB
              </span>
            )}

            {mediaUrl && (
              <audio
                ref={(el) => setAudioRef(el)}
                src={mediaUrl}
                onEnded={() => setIsAudioPlaying(false)}
                className="hidden"
              />
            )}
          </div>
        );

      default:
        return <p className="font-vietnam text-xs italic opacity-60">Unsupported message</p>;
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        className={`flex ${isMine ? 'justify-end' : 'justify-start'} px-4 mb-2 group`}
      >
        <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
          {/* Bubble */}
          <div
            className={`px-4 py-3 shadow-sm ${
              isMine
                ? 'bg-pink-primary text-white rounded-2xl rounded-br-sm'
                : 'bg-white text-teal-accent border border-teal-accent/15 rounded-2xl rounded-bl-sm'
            }`}
          >
            {renderContent()}
          </div>

          {/* Timestamp + status */}
          <div className={`flex items-center gap-1.5 mt-1 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
            <span className="font-vietnam text-[9px] text-teal-accent/40">
              {timestamp}
            </span>
            {isMine && (
              <span className={`${isRead ? 'text-blue-400' : 'text-teal-accent/30'}`}>
                {isRead ? <CheckCheck size={12} /> : <Check size={12} />}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Media preview modal */}
      {mediaUrl && (message.message_type === 'image' || message.message_type === 'video') && (
        <MediaPreview
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          src={mediaUrl}
          type={message.message_type}
        />
      )}
    </>
  );
};
