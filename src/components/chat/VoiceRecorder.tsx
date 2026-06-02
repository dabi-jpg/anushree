import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Send, X } from 'lucide-react';
import { motion } from 'framer-motion';

const MAX_DURATION = 120; // 2 minutes

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecordingComplete, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Try webm first, fall back to mp4
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setDuration(0);

      // Duration timer — stop via refs directly to avoid forward reference
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= MAX_DURATION) {
            if (mediaRecorderRef.current?.state === 'recording') {
              mediaRecorderRef.current.stop();
            }
            setIsRecording(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  }, []);

  const handleSend = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
    }
  };

  const handleCancel = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    onCancel();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioUrl]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-3 bg-white border-2 border-teal-accent rounded-2xl px-4 py-3 shadow-retro-teal w-full"
    >
      {!audioBlob ? (
        // Recording state
        <>
          <button
            onClick={handleCancel}
            className="text-red-400 hover:text-red-600 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="flex-1 flex items-center gap-3">
            {isRecording && (
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-3 h-3 rounded-full bg-red-500"
              />
            )}
            <span className="font-vietnam text-xs text-teal-accent font-bold tabular-nums">
              {formatTime(duration)}
            </span>
            <span className="font-vietnam text-[8px] text-teal-accent/50 uppercase">
              {isRecording ? 'Recording...' : 'Ready'}
            </span>
          </div>

          {!isRecording ? (
            <button
              onClick={startRecording}
              className="bg-pink-primary text-cream rounded-full p-2 hover:bg-teal-accent transition-all cursor-pointer"
            >
              <Mic size={18} />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-all cursor-pointer"
            >
              <Square size={16} />
            </button>
          )}
        </>
      ) : (
        // Preview state
        <>
          <button
            onClick={handleCancel}
            className="text-red-400 hover:text-red-600 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="flex-1">
            <audio src={audioUrl!} controls className="w-full h-8" />
          </div>

          <button
            onClick={handleSend}
            className="bg-teal-accent text-cream rounded-full p-2 hover:bg-pink-primary transition-all cursor-pointer"
          >
            <Send size={16} />
          </button>
        </>
      )}
    </motion.div>
  );
};
