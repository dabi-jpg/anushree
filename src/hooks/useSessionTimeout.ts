import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const WARNING_BEFORE = 3 * 60 * 1000; // Show warning 3 minutes before timeout

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
];

export function useSessionTimeout() {
  const { signOut } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const lastActivityRef = useRef(Date.now());
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
  }, []);

  useEffect(() => {
    // Listen for user activity
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      if (showWarning) {
        setShowWarning(false);
      }
    };

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Check inactivity every 10 seconds
    checkIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;

      if (elapsed >= IDLE_TIMEOUT) {
        // Timeout — sign out
        signOut();
        return;
      }

      if (elapsed >= IDLE_TIMEOUT - WARNING_BEFORE) {
        // Show warning
        setShowWarning(true);
        const remaining = Math.ceil((IDLE_TIMEOUT - elapsed) / 1000);
        setRemainingSeconds(remaining);
      }
    }, 10_000);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [signOut, showWarning]);

  return { showWarning, remainingSeconds, resetTimer };
}
