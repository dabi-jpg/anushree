import React, { useState } from "react";
import confetti from "canvas-confetti";
import { AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiButtonProps {
  onSuccess: () => void;
}

const RANDOM_PROMPTS = [
  "Are you sure you want to proceed?",
  "Curiosity killed the cat...",
  "There is still time to turn back.",
  "What if it's a trap?",
  "You're very persistent, aren't you?",
  "Almost there... maybe?",
  "Okay, just a few more clicks...",
  "Keep going, don't stop now!",
  "Is this really what you want?",
  "Entering restricted memory space..."
];

export const ConfettiButton: React.FC<ConfettiButtonProps> = ({ onSuccess }) => {
  const [clickCount, setClickCount] = useState(0);
  const [message, setMessage] = useState("DO NOT PRESS THIS RED BUTTON.");
  const [showPasswordGate, setShowPasswordGate] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [error, setError] = useState(false);

  const handlePress = () => {
    if (showPasswordGate) return;

    // Blast confetti!
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.85 }
    });

    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= 10) {
      setShowPasswordGate(true);
      setMessage("Enter the secret key to proceed.");
    } else if (newCount >= 5) {
      // Pick random prompt
      const idx = Math.floor(Math.random() * RANDOM_PROMPTS.length);
      setMessage(RANDOM_PROMPTS[idx]);
    } else {
      // Step-by-step buildup
      const buildups = [
        "DO NOT PRESS THIS RED BUTTON.",
        "Seriously, stop pressing it.",
        "Warning: System stability at risk.",
        "Unauthorized access detected!"
      ];
      setMessage(buildups[newCount % buildups.length]);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "266887777447773333") {
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 }
      });
      // Trigger the page transition!
      setTimeout(() => {
        onSuccess();
      }, 800);
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <section className="py-20 bg-cream relative border-b-8 border-teal-accent retro-grid select-none">
      <div className="max-w-[700px] mx-auto px-6 flex flex-col items-center">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-black uppercase text-red-500 mb-2 hollow-text" style={{ WebkitTextStroke: "2px #ef4444" }}>
            Danger Zone
          </h2>
          <p className="font-vietnam text-[10px] text-teal-accent uppercase font-bold tracking-wider">
            Click only if you are ready to hear what i have to say
          </p>
        </div>

        {/* Hazard Stripes Warning box */}
        <div className="border-4 border-red-500 bg-white p-8 w-full max-w-[450px] shadow-retro-teal relative">
          {/* Top Yellow/Black Caution bar */}
          <div className="h-6 bg-yellow-400 w-full mb-6 border-b-2 border-red-500 flex justify-center items-center overflow-hidden gap-2">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div key={idx} className="w-4 h-8 bg-black transform -skew-x-12 flex-shrink-0"></div>
            ))}
          </div>

          <div className="flex flex-col items-center text-center">
            {/* Warning Message Bubble */}
            <div className="bg-cream border-2 border-teal-accent p-4 mb-8 relative w-full rounded-none shadow-retro-teal">
              {/* Little speech arrow */}
              <div className="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 w-4 h-4 bg-cream border-r-2 border-b-2 border-teal-accent rotate-45"></div>
              <p className="font-vietnam text-xs font-black text-red-500 uppercase leading-relaxed">
                {message}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {showPasswordGate ? (
                <motion.form
                  key="password-gate"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handlePasswordSubmit}
                  className="w-full flex flex-col gap-4"
                >
                  <motion.div
                    animate={error ? { x: [-10, 10, -10, 10, -5, 5, 0] } : { x: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col gap-2"
                  >
                    <input
                      type="password"
                      placeholder="ENTER SECRET CODE"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-cream border-2 border-red-500 text-red-500 py-3 px-4 rounded-none focus:outline-none focus:ring-0 focus:border-teal-accent text-center font-press-start text-[10px]"
                      required
                    />
                    {error && (
                      <p className="text-[8px] text-red-500 font-bold uppercase font-press-start mt-1">
                        INCORRECT PASSWORD
                      </p>
                    )}
                  </motion.div>
                  <button
                    type="submit"
                    className="w-full bg-red-500 text-cream font-bold text-[10px] font-press-start py-3 px-6 rounded-none hover:bg-teal-accent active:translate-y-1 transition-all shadow-retro-teal uppercase cursor-pointer"
                  >
                    CONFIRM CODE
                  </button>
                </motion.form>
              ) : (
                /* Huge 3D Caution Button */
                <button
                  onClick={handlePress}
                  className="w-32 h-32 bg-red-500 rounded-full border-4 border-teal-accent shadow-[0px_8px_0px_0px_rgba(0,128,128,1)] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center text-white cursor-pointer"
                >
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="flex items-center justify-center"
                  >
                    <AlertTriangle size={48} className="text-white fill-yellow-400 stroke-teal-accent stroke-2" />
                  </motion.div>
                </button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Prompt at the bottom */}
        {!showPasswordGate && clickCount >= 5 && (
          <div className="mt-6 font-press-start text-[8px] text-pink-primary uppercase animate-pulse">
            Keep clicking...
          </div>
        )}

        {/* Total Clicks Label */}
        {!showPasswordGate && clickCount > 0 && (
          <div className="mt-4 text-[8px] text-teal-accent font-bold uppercase tracking-wider font-vietnam">
            Total Times Clicked: {clickCount}
          </div>
        )}
      </div>
    </section>
  );
};
