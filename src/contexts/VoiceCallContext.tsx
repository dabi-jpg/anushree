import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Profile } from '../types/database';

export type CallState = 'idle' | 'calling' | 'ringing' | 'connected';

interface VoiceCallContextType {
  callState: CallState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  callDuration: number;
  peerProfile: Profile | null;
  activeCallSession: any | null;
  initiateCall: (receiverId: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  permissionError: string | null;
  clearPermissionError: () => void;
}

const VoiceCallContext = createContext<VoiceCallContextType | undefined>(undefined);

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export function VoiceCallProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [callState, setCallState] = useState<CallState>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [peerProfile, setPeerProfile] = useState<Profile | null>(null);
  const [activeCallSession, setActiveCallSession] = useState<any | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const myChannelRef = useRef<any>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  // Cleanup helper
  const resetLocalCallState = useCallback(() => {
    console.log('[CALL] [CONNECTION] Resetting local call state.');
    if (pcRef.current) {
      console.log('[CALL] [WEBRTC] Closing peer connection.');
      pcRef.current.close();
      pcRef.current = null;
    }

    if (localStreamRef.current) {
      console.log('[CALL] [WEBRTC] Stopping local media tracks.');
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    setCallState('idle');
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setCallDuration(0);
    setPeerProfile(null);
    setActiveCallSession(null);
    pendingCandidatesRef.current = [];
  }, []);

  // Send a signal broadcast helper
  const sendSignal = useCallback(async (peerId: string, event: string, payload: any) => {
    console.log(`[CALL] [SIGNALING] Sending signal: "${event}" to peer: ${peerId}. SessionId: ${payload.sessionId}. SenderId: ${user?.id}`);
    const peerChannel = supabase.channel(`calls:${peerId}`);
    peerChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        peerChannel.send({
          type: 'broadcast',
          event,
          payload: {
            senderId: user?.id,
            ...payload
          }
        }).then(() => {
          console.log(`[CALL] [SIGNALING] Signal broadcast success: "${event}" to peer: ${peerId}`);
          supabase.removeChannel(peerChannel);
        });
      }
    });
  }, [user]);

  // DB helpers
  const updateSessionStatus = useCallback(async (sessionId: string, status: string, additionalFields: any = {}) => {
    console.log(`[CALL] Updating DB session ${sessionId} status to: ${status}`);
    const { data, error } = await supabase
      .from('call_sessions')
      .update({ status, ...additionalFields })
      .eq('id', sessionId)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('[CALL] Error updating call session in DB:', error);
    }
    return data;
  }, []);

  // Initiate call (caller role)
  const initiateCall = useCallback(async (receiverId: string) => {
    if (!user) return;
    resetLocalCallState();
    setCallState('calling');
    console.log(`[CALL] [START] Initiating call to receiver: ${receiverId}`);

    try {
      // 1. Fetch peer profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', receiverId)
        .maybeSingle();
      setPeerProfile(profile);

      // 2. Request mic permission
      console.log('[CALL] [WEBRTC] Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setPermissionError(null);

      // 3. Create call session row in database
      const { data: session, error: dbError } = await supabase
        .from('call_sessions')
        .insert({
          caller_id: user.id,
          receiver_id: receiverId,
          status: 'ringing'
        })
        .select()
        .single();

      if (dbError || !session) {
        console.error('[CALL] Failed to create call session in DB:', dbError);
        resetLocalCallState();
        return;
      }
      setActiveCallSession(session);

      // 4. Initialize RTCPeerConnection
      console.log('[CALL] [WEBRTC] Creating RTCPeerConnection.');
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      // Add local audio tracks
      stream.getTracks().forEach(track => {
        console.log('[CALL] [WEBRTC] Adding local track to peer connection:', track.kind);
        pc.addTrack(track, stream);
      });

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('[CALL] [ICE] Local ICE Candidate generated:', event.candidate.candidate);
          sendSignal(receiverId, 'ice_candidate', { candidate: event.candidate, sessionId: session.id });
        }
      };

      // Handle remote tracks
      pc.ontrack = (event) => {
        console.log('[CALL] [CONNECTION] Remote track received.');
        if (event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      // Log peer connection state changes
      pc.onconnectionstatechange = () => {
        console.log('[CALL] [CONNECTION] Connection state changed:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setCallState('connected');
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          console.warn('[CALL] [CONNECTION] Connection lost or failed.');
        }
      };

      // 5. Create local WebRTC Offer
      console.log('[CALL] [WEBRTC] Creating SDP offer...');
      const offer = await pc.createOffer();
      console.log('[CALL] [WEBRTC] Setting local description (SDP offer).');
      await pc.setLocalDescription(offer);

      // 6. Broadcast Offer to recipient's channel
      sendSignal(receiverId, 'call_offer', {
        sdp: offer,
        sessionId: session.id,
        callerId: user.id
      });

      // 7. Start ringing timeout (30 seconds)
      callTimeoutRef.current = setTimeout(async () => {
        console.log('[CALL] Call went unanswered for 30s. Triggering missed call.');
        await updateSessionStatus(session.id, 'missed', { ended_at: new Date().toISOString() });
        sendSignal(receiverId, 'call_end', { sessionId: session.id });
        resetLocalCallState();
      }, 30000);

    } catch (err: any) {
      console.error('[CALL] Error initiating voice call:', err);
      setPermissionError(err.name === 'NotAllowedError' ? 'Microphone permission denied.' : 'Unable to access microphone.');
      resetLocalCallState();
    }
  }, [user, resetLocalCallState, sendSignal, updateSessionStatus]);

  // Reject call
  const rejectCall = useCallback(async () => {
    if (!activeCallSession) return;
    const peerId = activeCallSession.caller_id;
    console.log(`[CALL] Rejecting call session: ${activeCallSession.id}`);
    
    await updateSessionStatus(activeCallSession.id, 'rejected', { ended_at: new Date().toISOString() });
    sendSignal(peerId, 'call_reject', { sessionId: activeCallSession.id });
    resetLocalCallState();
  }, [activeCallSession, updateSessionStatus, sendSignal, resetLocalCallState]);

  // Accept call (receiver role)
  const acceptCall = useCallback(async () => {
    if (!user || !activeCallSession) return;
    const callerId = activeCallSession.caller_id;
    console.log(`[CALL] Accepting call session: ${activeCallSession.id} from: ${callerId}`);

    // Clear auto-reject timeout
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    try {
      console.log('[CALL] [WEBRTC] Requesting microphone access to accept call...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setPermissionError(null);

      // Create WebRTC connection
      console.log('[CALL] [WEBRTC] Creating RTCPeerConnection.');
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      // Add local track
      stream.getTracks().forEach(track => {
        console.log('[CALL] [WEBRTC] Adding local track to peer connection:', track.kind);
        pc.addTrack(track, stream);
      });

      // Handle ICE
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('[CALL] [ICE] Local ICE Candidate generated:', event.candidate.candidate);
          sendSignal(callerId, 'ice_candidate', { candidate: event.candidate, sessionId: activeCallSession.id });
        }
      };

      // Handle remote tracks
      pc.ontrack = (event) => {
        console.log('[CALL] [CONNECTION] Remote track received.');
        if (event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('[CALL] [CONNECTION] Connection state changed:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setCallState('connected');
        }
      };

      // Set remote SDP description from caller offer
      console.log('[CALL] [WEBRTC] Setting remote description (SDP offer) from caller.');
      await pc.setRemoteDescription(new RTCSessionDescription(activeCallSession.offerSdp));

      // Create SDP Answer
      console.log('[CALL] [WEBRTC] Creating SDP answer...');
      const answer = await pc.createAnswer();
      console.log('[CALL] [WEBRTC] Setting local description (SDP answer).');
      await pc.setLocalDescription(answer);

      // Send SDP Answer to caller
      sendSignal(callerId, 'call_answer', { sdp: answer, sessionId: activeCallSession.id });

      // Update call session state in DB
      const now = new Date().toISOString();
      const updatedSession = await updateSessionStatus(activeCallSession.id, 'connected', { connected_at: now });
      setActiveCallSession(updatedSession);
      setCallState('connected');

      // Add any ice candidates queued before accepting
      if (pendingCandidatesRef.current.length > 0) {
        console.log(`[CALL] [ICE] Processing ${pendingCandidatesRef.current.length} queued ICE candidates.`);
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current = [];
      }

      // Start duration counter
      setCallDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('[CALL] Error accepting call:', err);
      setPermissionError(err.name === 'NotAllowedError' ? 'Microphone permission denied.' : 'Unable to access microphone.');
      await updateSessionStatus(activeCallSession.id, 'failed', { ended_at: new Date().toISOString() });
      sendSignal(callerId, 'call_reject', { sessionId: activeCallSession.id });
      resetLocalCallState();
    }
  }, [user, activeCallSession, sendSignal, updateSessionStatus, resetLocalCallState]);

  // End Call
  const endCall = useCallback(async () => {
    if (!activeCallSession) return;
    const peerId = user?.id === activeCallSession.caller_id ? activeCallSession.receiver_id : activeCallSession.caller_id;
    console.log(`[CALL] Ending call session: ${activeCallSession.id}`);

    // Calculate duration
    let duration = callDuration;
    if (activeCallSession.connected_at) {
      duration = Math.floor((Date.now() - new Date(activeCallSession.connected_at).getTime()) / 1000);
    }

    await updateSessionStatus(activeCallSession.id, 'ended', {
      ended_at: new Date().toISOString(),
      duration_seconds: duration > 0 ? duration : null
    });
    
    sendSignal(peerId, 'call_end', { sessionId: activeCallSession.id });
    resetLocalCallState();
  }, [user, activeCallSession, callDuration, updateSessionStatus, sendSignal, resetLocalCallState]);

  // Mute audio
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        console.log(`[CALL] Microphone is now ${audioTrack.enabled ? 'unmuted' : 'muted'}.`);
      }
    }
  }, []);

  const clearPermissionError = useCallback(() => {
    setPermissionError(null);
  }, []);

  // Listen to incoming signaling channel calls:${user.id}
  useEffect(() => {
    if (!user) return;

    const channelName = `calls:${user.id}`;
    console.log(`[CALL] [SIGNALING] Subscribing to personal signaling channel: ${channelName} (signaling subscription started)`);
    
    const myChannel = supabase.channel(channelName)
      .on('broadcast', { event: 'call_offer' }, async ({ payload }) => {
        console.log(`[CALL] [SIGNALING] Received signal: "call_offer" on channel: ${channelName}. Event type: call_offer. Sender ID: ${payload.callerId}, Receiver ID: ${user.id}, Session ID: ${payload.sessionId}`);
        
        // Fetch caller profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', payload.callerId)
          .maybeSingle();

        setPeerProfile(profile);
        setActiveCallSession({
          id: payload.sessionId,
          caller_id: payload.callerId,
          receiver_id: user.id,
          status: 'ringing',
          offerSdp: payload.sdp
        });
        setCallState('ringing');

        // Automatically reject if unanswered after 30s
        callTimeoutRef.current = setTimeout(async () => {
          console.log('[CALL] Ringing timed out. Rejecting call automatically.');
          await updateSessionStatus(payload.sessionId, 'missed', { ended_at: new Date().toISOString() });
          sendSignal(payload.callerId, 'call_reject', { sessionId: payload.sessionId });
          resetLocalCallState();
        }, 30000);
      })
      .on('broadcast', { event: 'call_answer' }, async ({ payload }) => {
        console.log(`[CALL] [SIGNALING] Received signal: "call_answer" on channel: ${channelName}. Event type: call_answer. Sender ID: ${payload.senderId}, Receiver ID: ${user.id}, Session ID: ${payload.sessionId}`);
        if (pcRef.current) {
          console.log('[CALL] [WEBRTC] Setting remote description (SDP answer) from receiver.');
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          setCallState('connected');

          // Update call session
          const now = new Date().toISOString();
          await updateSessionStatus(payload.sessionId, 'connected', { connected_at: now });

          // Start call timer
          setCallDuration(0);
          durationIntervalRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
          }, 1000);

          if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
          }
        }
      })
      .on('broadcast', { event: 'ice_candidate' }, async ({ payload }) => {
        console.log(`[CALL] [SIGNALING] Received signal: "ice_candidate" on channel: ${channelName}. Event type: ice_candidate. Sender ID: ${payload.senderId}, Receiver ID: ${user.id}, Session ID: ${payload.sessionId}`);
        if (pcRef.current && pcRef.current.remoteDescription) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } else {
          // If we haven't set the remote description yet, queue candidate
          console.log('[CALL] [ICE] Queueing candidate since remoteDescription is not yet set.');
          pendingCandidatesRef.current.push(payload.candidate);
        }
      })
      .on('broadcast', { event: 'call_reject' }, ({ payload }) => {
        console.log(`[CALL] [SIGNALING] Received signal: "call_reject" on channel: ${channelName}. Event type: call_reject. Session ID: ${payload?.sessionId}`);
        resetLocalCallState();
      })
      .on('broadcast', { event: 'call_end' }, ({ payload }) => {
        console.log(`[CALL] [SIGNALING] Received signal: "call_end" on channel: ${channelName}. Event type: call_end. Session ID: ${payload?.sessionId}`);
        resetLocalCallState();
      });

    myChannel.subscribe((status) => {
      console.log(`[CALL] [SIGNALING] personal channel subscription status: ${status} for channel: ${channelName}`);
      if (status === 'SUBSCRIBED') {
        console.log(`[CALL] [SIGNALING] personal channel subscription successful: ${channelName}`);
      }
    });

    myChannelRef.current = myChannel;

    return () => {
      console.log(`[CALL] [SIGNALING] Unsubscribing from personal channel: ${channelName}`);
      supabase.removeChannel(myChannel);
      resetLocalCallState();
    };
  }, [user, resetLocalCallState, updateSessionStatus, sendSignal]);

  const contextValue = React.useMemo(() => ({
    callState,
    localStream,
    remoteStream,
    isMuted,
    callDuration,
    peerProfile,
    activeCallSession,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    permissionError,
    clearPermissionError
  }), [
    callState,
    localStream,
    remoteStream,
    isMuted,
    callDuration,
    peerProfile,
    activeCallSession,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    permissionError,
    clearPermissionError
  ]);

  return (
    <VoiceCallContext.Provider value={contextValue}>
      {children}
    </VoiceCallContext.Provider>
  );
}

export function useVoiceCall() {
  const context = useContext(VoiceCallContext);
  if (context === undefined) {
    throw new Error('useVoiceCall must be used within a VoiceCallProvider');
  }
  return context;
}
