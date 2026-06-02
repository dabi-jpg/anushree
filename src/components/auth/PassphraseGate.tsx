import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { storeEncryptionKey, hasEncryptionKey } from '../../lib/encryption';

interface PassphraseGateProps {
  onUnlocked: () => void;
}

export const PassphraseGate: React.FC<PassphraseGateProps> = ({ onUnlocked }) => {
  const [passphrase, setPassphrase] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // If already unlocked, skip
  if (hasEncryptionKey()) {
    onUnlocked();
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (passphrase.length < 4) {
      setError('Passphrase must be at least 4 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      await storeEncryptionKey(passphrase);
      onUnlocked();
    } catch {
      setError('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white border-4 border-teal-accent w-full max-w-[420px] p-8 shadow-retro-pink"
      >
        <div className="text-center mb-6">
          <span className="text-3xl mb-3 block">🔐</span>
          <h2 className="font-press-start text-sm text-teal-accent uppercase mb-2 hollow-text">
            Unlock Chat
          </h2>
          <p className="font-vietnam text-[10px] text-pink-primary uppercase font-bold tracking-wider">
            Enter your shared secret to decrypt messages
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Shared passphrase"
            className="w-full bg-cream border-2 border-teal-accent text-teal-accent py-3 px-4 rounded-none focus:outline-none focus:border-pink-primary transition-all text-xs font-vietnam placeholder-teal-accent/30"
            required
            autoFocus
          />

          {error && (
            <p className="text-[8px] text-red-500 font-bold uppercase animate-pulse font-vietnam">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-pink-primary text-cream font-bold text-xs py-3 px-6 rounded-none hover:bg-teal-accent active:translate-y-1 transition-all shadow-retro-teal uppercase cursor-pointer disabled:opacity-50 font-press-start text-[10px]"
          >
            {isSubmitting ? 'Unlocking...' : 'Unlock Messages'}
          </button>

          <p className="text-[7px] text-teal-accent/60 font-vietnam text-center mt-2">
            This passphrase decrypts your messages. It's never sent to the server.
            <br />
            You'll need to re-enter it when you open a new tab.
          </p>
        </form>
      </motion.div>
    </div>
  );
};
