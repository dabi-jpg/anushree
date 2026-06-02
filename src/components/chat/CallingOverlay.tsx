import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceCall } from '../../contexts/VoiceCallContext';
import { Phone, PhoneOff, Mic, MicOff, AlertCircle } from 'lucide-react';

export const CallingOverlay: React.FC = () => {
  const {
    callState,
    remoteStream,
    isMuted,
    callDuration,
    peerProfile,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    permissionError,
    clearPermissionError,
  } = useVoiceCall();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play remote audio stream when available
  useEffect(() => {
    if (audioRef.current && remoteStream) {
      console.log('[CALL] [WEBRTC] Binding remote audio stream to audio element.');
      audioRef.current.srcObject = remoteStream;
      audioRef.current.play().catch(err => {
        console.error('[CALL] [WEBRTC] Error playing remote audio stream:', err);
      });
    }
  }, [remoteStream]);

  // Format call duration MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (callState === 'idle' && !permissionError) return null;

  return (
    <>
      {/* Hidden audio element to play remote stream */}
      <audio ref={audioRef} autoPlay style={{ display: 'none' }} />

      <AnimatePresence>
        {/* Permission Error Notification */}
        {permissionError && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-[400px] bg-white border-4 border-pink-primary p-4 rounded-xl shadow-retro-pink flex items-center gap-3"
          >
            <AlertCircle className="text-pink-primary flex-shrink-0" size={24} />
            <div className="flex-1">
              <h4 className="font-press-start text-[8px] text-pink-primary uppercase tracking-wider mb-1">
                Mic Permission Error
              </h4>
              <p className="font-vietnam text-[10px] text-teal-accent/80">
                {permissionError}
              </p>
            </div>
            <button
              onClick={clearPermissionError}
              className="px-3 py-1 font-press-start text-[8px] uppercase border-2 border-teal-accent bg-cream hover:bg-teal-accent hover:text-white cursor-pointer active:translate-x-0.5 active:translate-y-0.5 rounded-md"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {/* Incoming Call Screen */}
        {callState === 'ringing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-teal-accent/25 backdrop-blur-md flex items-center justify-center p-6 retro-grid"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-[380px] w-full bg-white border-4 border-teal-accent p-6 shadow-retro-teal-lg text-center rounded-2xl"
            >
              <h2 className="font-press-start text-[10px] text-pink-primary uppercase tracking-wider mb-6 animate-pulse">
                📞 Incoming Voice Call
              </h2>
              
              <div className="w-24 h-24 rounded-full bg-pink-primary/10 border-4 border-teal-accent mx-auto mb-4 flex items-center justify-center overflow-hidden">
                <span className="text-4xl">
                  {peerProfile?.display_name === 'Anushree' ? '🎀' : '🎮'}
                </span>
              </div>

              <h3 className="font-vietnam text-lg font-bold text-teal-accent mb-2">
                {peerProfile?.display_name || 'Someone'}
              </h3>
              
              <p className="font-vietnam text-xs text-teal-accent/60 mb-8 uppercase tracking-widest text-[9px]">
                {peerProfile?.email || 'Calling you...'}
              </p>

              <div className="flex gap-4">
                <button
                  onClick={rejectCall}
                  className="flex-1 py-3 bg-pink-primary text-white border-2 border-pink-primary font-press-start text-[8px] uppercase tracking-wider hover:bg-white hover:text-pink-primary hover:shadow-none shadow-retro-pink-sm cursor-pointer transition-all duration-150 rounded-xl flex items-center justify-center gap-2 active:translate-x-0.5 active:translate-y-0.5"
                >
                  <PhoneOff size={14} /> Reject
                </button>
                <button
                  onClick={acceptCall}
                  className="flex-1 py-3 bg-teal-accent text-white border-2 border-teal-accent font-press-start text-[8px] uppercase tracking-wider hover:bg-white hover:text-teal-accent hover:shadow-none shadow-retro-teal-sm cursor-pointer transition-all duration-150 rounded-xl flex items-center justify-center gap-2 active:translate-x-0.5 active:translate-y-0.5"
                >
                  <Phone size={14} /> Accept
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Outgoing or Active Call Fullscreen UI */}
        {(callState === 'calling' || callState === 'connected') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-cream flex flex-col items-center justify-center p-6 retro-grid"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-[420px] w-full bg-white border-4 border-teal-accent px-6 py-10 shadow-retro-teal-lg text-center rounded-2xl relative"
            >
              {/* Call indicator */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-cream border border-teal-accent/25 rounded-full px-3 py-1 font-press-start text-[7px] text-teal-accent uppercase tracking-wider">
                {callState === 'calling' ? 'Calling...' : 'Connected'}
              </div>

              {/* Peer Profile Card */}
              <div className="mt-4">
                <div className="w-28 h-28 rounded-full bg-pink-primary/10 border-4 border-teal-accent mx-auto mb-6 flex items-center justify-center overflow-hidden relative">
                  <span className="text-5xl">
                    {peerProfile?.display_name === 'Anushree' ? '🎀' : '🎮'}
                  </span>
                  {/* Bouncy ring visual during call */}
                  {callState === 'calling' && (
                    <div className="absolute inset-0 border-4 border-pink-primary rounded-full animate-ping opacity-35" />
                  )}
                </div>

                <h3 className="font-vietnam text-xl font-bold text-teal-accent mb-2">
                  {peerProfile?.display_name || 'Loading...'}
                </h3>
                
                <p className="font-vietnam text-xs text-teal-accent/50 mb-8 uppercase tracking-widest text-[9px]">
                  {peerProfile?.email}
                </p>
              </div>

              {/* Call Timer */}
              {callState === 'connected' && (
                <div className="mb-10 font-press-start text-xl text-teal-accent tracking-widest bg-cream border-2 border-teal-accent rounded-xl py-3 max-w-[150px] mx-auto shadow-retro-teal-sm">
                  {formatDuration(callDuration)}
                </div>
              )}

              {/* Calling waiting status */}
              {callState === 'calling' && (
                <p className="font-press-start text-[8px] text-pink-primary uppercase tracking-widest animate-pulse mb-10">
                  Waiting for answer...
                </p>
              )}

              {/* Call controls */}
              <div className="flex justify-center gap-6">
                {/* Mute button */}
                {callState === 'connected' && (
                  <button
                    onClick={toggleMute}
                    className={`w-14 h-14 rounded-full border-2 border-teal-accent shadow-retro-teal-sm flex items-center justify-center transition-all duration-150 cursor-pointer active:translate-x-0.5 active:translate-y-0.5 ${
                      isMuted ? 'bg-pink-primary text-white border-pink-primary shadow-retro-pink-sm' : 'bg-cream text-teal-accent hover:bg-teal-accent hover:text-white'
                    }`}
                    title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                  >
                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                )}

                {/* End call button */}
                <button
                  onClick={endCall}
                  className="w-14 h-14 rounded-full bg-pink-primary text-white border-2 border-pink-primary shadow-retro-pink-sm flex items-center justify-center transition-all duration-150 cursor-pointer hover:bg-white hover:text-pink-primary hover:shadow-none active:translate-x-0.5 active:translate-y-0.5"
                  title="End Call"
                >
                  <PhoneOff size={20} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
