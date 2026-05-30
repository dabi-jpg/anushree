import React, { useState } from "react";
import { motion } from "framer-motion";
import { BIRTHDAY_CONFIG } from "../config";

interface PasswordGateProps {
  onSuccess: () => void;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === BIRTHDAY_CONFIG.PASSWORD) {
      setError(false);
      onSuccess();
    } else {
      setError(true);
      // Reset error after animation completes so it can shake again
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <div className="bg-cream min-h-screen flex flex-col items-center justify-center text-on-surface p-6 font-press-start select-none relative overflow-hidden">
      <main className="w-full flex items-center justify-center relative min-h-screen z-10">
        {/* Animated Login Card */}
        <motion.div
          animate={error ? { x: [-10, 10, -10, 10, -5, 5, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          className="bg-white border-4 border-teal-accent w-full max-w-[450px] p-10 flex flex-col relative z-10 mx-auto rounded-none shadow-retro-pink"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold mb-4 tracking-tight hollow-text select-none">
              Login
            </h1>
            <p className="text-[10px] text-teal-accent leading-relaxed font-medium uppercase font-vietnam">
              A tiny birthday surprise 🎂
            </p>
          </div>

          {/* Form */}
          <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-bold text-teal-accent uppercase font-vietnam">
                Password
              </label>
              <input
                className="w-full bg-cream border-2 border-teal-accent text-teal-accent py-4 px-5 rounded-none focus:outline-none focus:ring-0 focus:border-pink-primary transition-all text-xs placeholder-teal-accent/30 font-vietnam"
                placeholder="••••••••"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            {error && (
              <p className="text-[8px] text-red-500 font-bold uppercase animate-pulse">
                Access Denied. Try again!
              </p>
            )}

            <button
              className="w-full bg-pink-primary text-cream font-bold text-xs py-4 px-6 mt-2 rounded-none hover:bg-teal-accent active:translate-y-1 transition-all shadow-retro-teal uppercase cursor-pointer"
              type="submit"
            >
              Enter
            </button>
          </form>

          {/* Footer Hint */}
          <div className="mt-10 text-center font-vietnam">
            <p className="text-[8px] text-pink-primary font-medium">
              hint (LogitechG402@)
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
