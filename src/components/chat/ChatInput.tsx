import React, { useState, useRef, useCallback } from 'react';
import { Send, Image, Film, Mic, X, Loader2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { VoiceRecorder } from './VoiceRecorder';
import { useFileUpload } from '../../hooks/useFileUpload';
import { sanitizeInput } from '../../lib/security';

interface ChatInputProps {
  onSendMessage: (content: string, type?: 'text' | 'image' | 'video' | 'voice', attachmentData?: any) => Promise<{ error: string | null }>;
  onTyping: () => void;
  onStopTyping: () => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onTyping,
  onStopTyping,
  disabled,
}) => {
  const [text, setText] = useState('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { isUploading, progress, error: uploadError, upload, resetUpload } = useFileUpload();

  // Auto-resize textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onTyping();

    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  // Send text message
  const handleSendText = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const sanitized = sanitizeInput(trimmed);
    setText('');
    onStopTyping();

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await onSendMessage(sanitized, 'text');
  };

  // Handle Enter key (Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>, _type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowAttachMenu(false);

    // Reset input so same file can be re-selected
    e.target.value = '';
  }, []);

  // Send file
  const handleSendFile = async () => {
    if (!previewFile) return;

    const type = previewFile.type.startsWith('image/') ? 'image' as const : 'video' as const;

    const result = await upload(previewFile);
    if (result) {
      await onSendMessage('', type, {
        path: result.path,
        fileType: result.fileType,
        fileSize: result.fileSize,
        bucket: result.bucket,
      });
    }

    // Cleanup preview
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(null);
    setPreviewUrl(null);
    resetUpload();
  };

  // Cancel file preview
  const cancelPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(null);
    setPreviewUrl(null);
    resetUpload();
  };

  // Handle voice recording complete
  const handleVoiceComplete = async (blob: Blob) => {
    setShowVoiceRecorder(false);

    const file = new File([blob], `voice_${Date.now()}.webm`, { type: blob.type });
    const result = await upload(file);
    if (result) {
      await onSendMessage('', 'voice', {
        path: result.path,
        fileType: result.fileType,
        fileSize: result.fileSize,
        bucket: result.bucket,
      });
    }
    resetUpload();
  };

  // Voice recorder mode
  if (showVoiceRecorder) {
    return (
      <div className="p-3 bg-cream/80 backdrop-blur-sm border-t border-teal-accent/10">
        <VoiceRecorder
          onRecordingComplete={handleVoiceComplete}
          onCancel={() => setShowVoiceRecorder(false)}
        />
      </div>
    );
  }

  // File preview mode
  if (previewFile && previewUrl) {
    return (
      <div className="p-3 bg-cream/80 backdrop-blur-sm border-t border-teal-accent/10">
        <div className="flex items-end gap-3">
          {/* Preview */}
          <div className="relative flex-shrink-0">
            <button
              onClick={cancelPreview}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center z-10 cursor-pointer hover:bg-red-600"
            >
              <X size={12} />
            </button>
            {previewFile.type.startsWith('image/') ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg border-2 border-teal-accent/30"
              />
            ) : (
              <video
                src={previewUrl}
                className="w-20 h-20 object-cover rounded-lg border-2 border-teal-accent/30"
              />
            )}
          </div>

          {/* Caption input could go here */}
          <div className="flex-1 font-vietnam text-[10px] text-teal-accent/60">
            {previewFile.name}
            <br />
            {(previewFile.size / (1024 * 1024)).toFixed(1)} MB
            {uploadError && (
              <p className="text-red-500 text-[9px] mt-1">{uploadError}</p>
            )}
          </div>

          {/* Send */}
          <button
            onClick={handleSendFile}
            disabled={isUploading}
            className="bg-teal-accent text-cream rounded-full p-3 hover:bg-pink-primary transition-all cursor-pointer disabled:opacity-50 flex-shrink-0"
          >
            {isUploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>

        {/* Upload progress */}
        {isUploading && (
          <div className="mt-2 h-1 bg-teal-accent/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-accent transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  // Normal input mode
  return (
    <div className="p-3 bg-cream/80 backdrop-blur-sm border-t border-teal-accent/10">
      <div className="flex items-end gap-2">
        {/* Attachment button */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="text-teal-accent/60 hover:text-teal-accent p-2 rounded-full hover:bg-teal-accent/10 transition-all cursor-pointer"
            disabled={disabled}
          >
            <span className="text-lg">📎</span>
          </button>

          {/* Attachment menu */}
          <AnimatePresence>
            {showAttachMenu && (
              <div className="absolute bottom-12 left-0 bg-white border-2 border-teal-accent rounded-xl shadow-retro-teal p-2 flex flex-col gap-1 min-w-[140px] z-50">
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 text-[10px] font-vietnam font-bold text-teal-accent hover:bg-cream rounded-lg transition-all cursor-pointer"
                >
                  <Image size={14} /> Photo
                </button>
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 text-[10px] font-vietnam font-bold text-teal-accent hover:bg-cream rounded-lg transition-all cursor-pointer"
                >
                  <Film size={14} /> Video
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onBlur={onStopTyping}
          placeholder="Type a message..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-white border border-teal-accent/20 rounded-2xl px-4 py-3 text-[13px] font-vietnam text-teal-accent placeholder-teal-accent/30 resize-none focus:outline-none focus:border-pink-primary transition-all max-h-[120px]"
          style={{ minHeight: '44px' }}
        />

        {/* Voice or Send button */}
        {text.trim() ? (
          <button
            onClick={handleSendText}
            disabled={disabled}
            className="bg-pink-primary text-cream rounded-full p-3 hover:bg-teal-accent transition-all cursor-pointer disabled:opacity-50 flex-shrink-0 shadow-sm"
          >
            <Send size={18} />
          </button>
        ) : (
          <button
            onClick={() => setShowVoiceRecorder(true)}
            disabled={disabled}
            className="text-teal-accent/60 hover:text-pink-primary p-3 rounded-full hover:bg-pink-primary/10 transition-all cursor-pointer disabled:opacity-50 flex-shrink-0"
          >
            <Mic size={18} />
          </button>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={(e) => handleFileSelect(e, 'image')}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm"
        onChange={(e) => handleFileSelect(e, 'video')}
        className="hidden"
      />
    </div>
  );
};
