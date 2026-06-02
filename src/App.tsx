import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./components/auth/LoginPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { BirthdayPage } from "./components/birthday/BirthdayPage";
import { ChatPage } from "./components/chat/ChatPage";
import { AppShell } from "./components/layout/AppShell";
import { useSessionTimeout } from "./hooks/useSessionTimeout";
import { useAuth } from "./contexts/AuthContext";
import { PassphraseGate } from "./components/auth/PassphraseGate";
import { hasEncryptionKey } from "./lib/encryption";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

function ChatPassphraseWrapper({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(() => hasEncryptionKey());
  
  if (!isUnlocked) {
    return <PassphraseGate onUnlocked={() => setIsUnlocked(true)} />;
  }
  
  return <>{children}</>;
}

function SessionTimeoutWarning() {
  const { showWarning, remainingSeconds } = useSessionTimeout();

  if (!showWarning) return null;

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] bg-yellow-400 border-2 border-teal-accent px-6 py-3 shadow-retro-teal text-center"
    >
      <p className="font-press-start text-[8px] text-teal-accent uppercase">
        ⚠️ Session expires in {remainingSeconds}s — move your mouse to stay active
      </p>
    </motion.div>
  );
}

function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-cream selection:bg-pink-primary selection:text-white">
      {/* Session timeout warning (only when logged in) */}
      {user && (
        <AnimatePresence>
          <SessionTimeoutWarning />
        </AnimatePresence>
      )}

      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell>
                <BirthdayPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <AppShell>
                <ChatPassphraseWrapper>
                  <ChatPage />
                </ChatPassphraseWrapper>
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
