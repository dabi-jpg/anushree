import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

/**
 * AppShell — persistent floating navigation bar at the bottom of protected pages.
 * Provides navigation between Birthday site and Chat, plus logout.
 */
export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signOut, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isChat = location.pathname === '/chat';
  const isBirthday = location.pathname === '/' || location.pathname === '/birthday';

  return (
    <div className="min-h-screen bg-cream selection:bg-pink-primary selection:text-white relative">
      {/* Page content */}
      <div className="pb-20">
        {children}
      </div>

      {/* Floating bottom navigation */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 25 }}
        className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-4"
      >
        <div className="max-w-[500px] mx-auto bg-white/95 backdrop-blur-md border-2 border-teal-accent rounded-2xl shadow-retro-teal px-2 py-2 flex items-center justify-around">
          {/* Birthday button */}
          <button
            onClick={() => navigate('/')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              isBirthday
                ? 'bg-pink-primary/10 text-pink-primary'
                : 'text-teal-accent/60 hover:text-teal-accent'
            }`}
          >
            <span className="text-lg">🎂</span>
            <span className="font-vietnam text-[7px] font-bold uppercase tracking-wider">Birthday</span>
          </button>

          {/* Chat button */}
          <button
            onClick={() => navigate('/chat')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all cursor-pointer relative ${
              isChat
                ? 'bg-teal-accent/10 text-teal-accent'
                : 'text-teal-accent/60 hover:text-teal-accent'
            }`}
          >
            <span className="text-lg">💬</span>
            <span className="font-vietnam text-[7px] font-bold uppercase tracking-wider">Chat</span>
          </button>

          {/* Profile / Logout */}
          <button
            onClick={signOut}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-teal-accent/60 hover:text-red-400 transition-all cursor-pointer"
            title={`Signed in as ${profile?.display_name || 'User'}`}
          >
            <span className="text-lg">👋</span>
            <span className="font-vietnam text-[7px] font-bold uppercase tracking-wider">Logout</span>
          </button>
        </div>
      </motion.nav>
    </div>
  );
};
