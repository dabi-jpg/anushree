import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { isAllowedEmail, validatePassword, isRateLimited, incrementRateLimit } from '../../lib/auth';
import { Navigate } from 'react-router-dom';

const RATE_LIMIT_KEY = 'auth_attempts';
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000; // 1 minute

export const LoginPage: React.FC = () => {
  const { user, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  // Already logged in — redirect
  if (user) {
    return <Navigate to="/" replace />;
  }

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Rate limit check
    const rateCheck = isRateLimited(RATE_LIMIT_KEY, MAX_ATTEMPTS, WINDOW_MS);
    if (rateCheck.limited) {
      const seconds = Math.ceil(rateCheck.remainingMs / 1000);
      setError(`Too many attempts. Try again in ${seconds}s.`);
      triggerShake();
      return;
    }

    // Allowlist check
    if (!isAllowedEmail(email)) {
      setError('This email is not authorized.');
      triggerShake();
      incrementRateLimit(RATE_LIMIT_KEY, WINDOW_MS);
      return;
    }

    // Password validation for signup
    if (mode === 'signup') {
      const validation = validatePassword(password);
      if (!validation.valid) {
        setError(validation.errors[0]);
        triggerShake();
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        triggerShake();
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        const result = await signUp(email, password);
        if (result.error) {
          setError(result.error);
          triggerShake();
          incrementRateLimit(RATE_LIMIT_KEY, WINDOW_MS);
        } else {
          setSuccess('Account created! Check your email for verification, then sign in.');
          setMode('signin');
          setPassword('');
          setConfirmPassword('');
        }
      } else {
        const result = await signIn(email, password);
        if (result.error) {
          setError(result.error);
          triggerShake();
          incrementRateLimit(RATE_LIMIT_KEY, WINDOW_MS);
        }
        // On success, AuthContext will update and we'll redirect via the Navigate above
      }
    } catch {
      setError('Something went wrong. Please try again.');
      triggerShake();
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordValidation = mode === 'signup' ? validatePassword(password) : null;

  return (
    <div className="bg-cream min-h-screen flex flex-col items-center justify-center text-on-surface p-6 font-press-start select-none relative overflow-hidden">
      <main className="w-full flex items-center justify-center relative min-h-screen z-10">
        <motion.div
          animate={shake ? { x: [-10, 10, -10, 10, -5, 5, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          className="bg-white border-4 border-teal-accent w-full max-w-[450px] p-10 flex flex-col relative z-10 mx-auto rounded-none shadow-retro-pink"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold mb-4 tracking-tight hollow-text select-none">
              {mode === 'signin' ? 'Login' : 'Sign Up'}
            </h1>
            <p className="text-[10px] text-teal-accent leading-relaxed font-medium uppercase font-vietnam">
              A tiny birthday surprise 🎂
            </p>
          </div>

          {/* Form */}
          <form className="w-full flex flex-col gap-5" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-teal-accent uppercase font-vietnam">
                Email
              </label>
              <input
                className="w-full bg-cream border-2 border-teal-accent text-teal-accent py-3 px-4 rounded-none focus:outline-none focus:ring-0 focus:border-pink-primary transition-all text-xs placeholder-teal-accent/30 font-vietnam"
                placeholder="your@email.com"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-teal-accent uppercase font-vietnam">
                Password
              </label>
              <input
                className="w-full bg-cream border-2 border-teal-accent text-teal-accent py-3 px-4 rounded-none focus:outline-none focus:ring-0 focus:border-pink-primary transition-all text-xs placeholder-teal-accent/30 font-vietnam"
                placeholder="••••••••"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                minLength={8}
              />
            </div>

            {/* Password strength indicator for signup */}
            {mode === 'signup' && password.length > 0 && passwordValidation && (
              <div className="flex flex-col gap-1">
                {['At least 8 characters', 'At least one uppercase letter', 'At least one lowercase letter', 'At least one number', 'At least one special character'].map((rule, i) => {
                  const checks = [
                    password.length >= 8,
                    /[A-Z]/.test(password),
                    /[a-z]/.test(password),
                    /[0-9]/.test(password),
                    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
                  ];
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className={`text-[8px] ${checks[i] ? 'text-green-600' : 'text-red-400'}`}>
                        {checks[i] ? '✓' : '✗'}
                      </span>
                      <span className={`text-[8px] font-vietnam ${checks[i] ? 'text-green-600' : 'text-red-400'}`}>
                        {rule}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Confirm password for signup */}
            {mode === 'signup' && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-teal-accent uppercase font-vietnam">
                  Confirm Password
                </label>
                <input
                  className="w-full bg-cream border-2 border-teal-accent text-teal-accent py-3 px-4 rounded-none focus:outline-none focus:ring-0 focus:border-pink-primary transition-all text-xs placeholder-teal-accent/30 font-vietnam"
                  placeholder="••••••••"
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-[8px] text-red-500 font-bold uppercase animate-pulse font-vietnam">
                {error}
              </p>
            )}

            {/* Success */}
            {success && (
              <p className="text-[8px] text-green-600 font-bold uppercase font-vietnam">
                {success}
              </p>
            )}

            {/* Submit */}
            <button
              className="w-full bg-pink-primary text-cream font-bold text-xs py-4 px-6 mt-1 rounded-none hover:bg-teal-accent active:translate-y-1 transition-all shadow-retro-teal uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Please wait...'
                : mode === 'signin'
                  ? 'Enter'
                  : 'Create Account'}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="mt-8 text-center font-vietnam">
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError('');
                setSuccess('');
                setPassword('');
                setConfirmPassword('');
              }}
              className="text-[9px] text-pink-primary font-medium hover:text-teal-accent transition-colors cursor-pointer underline underline-offset-2"
            >
              {mode === 'signin'
                ? "First time? Create an account"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
