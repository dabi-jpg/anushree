import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, initError, retryInit } = useAuth();

  if (initError) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6 retro-grid">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[420px] w-full bg-white border-4 border-teal-accent p-6 shadow-retro-teal-lg text-center rounded-2xl"
        >
          <div className="text-4xl mb-4 animate-bounce">⚡</div>
          <h2 className="font-press-start text-[11px] text-pink-primary uppercase tracking-wider mb-4">
            Connection Error
          </h2>
          <p className="font-vietnam text-xs text-teal-accent/80 mb-6 leading-relaxed">
            {initError}
          </p>
          <button
            onClick={retryInit}
            className="w-full py-3 bg-teal-accent text-white font-press-start text-[9px] uppercase border-2 border-teal-accent hover:bg-white hover:text-teal-accent transition-all duration-200 shadow-retro-pink-sm cursor-pointer active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            Retry Connection
          </button>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center retro-grid">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-teal-accent border-t-pink-primary rounded-full mx-auto mb-4"
          />
          <p className="font-press-start text-[10px] text-teal-accent uppercase tracking-wider">
            Loading...
          </p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
