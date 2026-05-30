import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, X } from "lucide-react";

interface Candle {
  id: number;
  x: number;
  y: number;
  rotation: number;
}

export const SecretEgg: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [typedBuffer, setTypedBuffer] = useState("");
  const [candles, setCandles] = useState<Candle[]>([]);

  // Sound effect for power up
  const playPowerUpSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const notes = [330, 392, 659, 523, 587, 784]; // E4, G4, E5, C5, D5, G5
      let time = ctx.currentTime;
      
      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(note, time);
        gain.gain.setValueAtTime(0.04, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.15);
        time += 0.08;
      });
    } catch (e) {}
  };

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only record alphabetical letters
      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        const nextBuffer = (typedBuffer + e.key.toLowerCase()).slice(-8);
        setTypedBuffer(nextBuffer);

        if (nextBuffer === "anushree") {
          setIsOpen(true);
          playPowerUpSound();
          setTypedBuffer(""); // Reset buffer
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [typedBuffer]);

  const handleCakeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Only allow placing candles on the upper half cake layers
    if (y < 40 || y > 180) return;

    const newCandle: Candle = {
      id: Date.now(),
      x,
      y,
      rotation: Math.random() * 10 - 5
    };
    setCandles((prev) => [...prev, newCandle]);

    // Play tiny synth pluck sound
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(600 + Math.random() * 200, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (err) {}
  };

  const clearCandles = () => {
    setCandles([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 font-press-start select-none"
        >
          {/* Secret Modal */}
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            className="bg-white border-4 border-teal-accent w-full max-w-[550px] p-8 relative shadow-retro-pink"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 bg-pink-primary text-cream border-2 border-teal-accent p-1 hover:bg-teal-accent transition-all cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Banner Title */}
            <div className="text-center mb-6">
              <span className="bg-yellow-400 border border-teal-accent px-2 py-0.5 text-[6px] text-teal-accent font-bold uppercase rotate-6 inline-block mb-3">
                ⚠️ EASTER EGG UNLOCKED 👾
              </span>
              <h2 className="text-sm md:text-lg font-black text-pink-primary uppercase tracking-tight hollow-text-pink leading-normal">
                Secret Level Active
              </h2>
              <p className="font-vietnam text-[9px] text-teal-accent uppercase font-bold tracking-wider mt-1">
                You typed "anushree"! Aura Boost +1,000 ✨
              </p>
            </div>

            {/* Mini Game / Interaction Area */}
            <div className="bg-cream border-2 border-teal-accent p-4 mb-6 relative">
              <p className="text-[7px] text-pink-primary uppercase font-bold mb-3 text-center">
                🎂 Click on the cake to plant birthday candles!
              </p>

              {/* Pixel Art Cake Graphic container */}
              <div
                onClick={handleCakeClick}
                className="w-full h-44 bg-teal-accent/5 border border-dashed border-teal-accent flex items-end justify-center relative cursor-crosshair overflow-hidden rounded-sm"
              >
                {/* 2D Cake Layers */}
                <div className="flex flex-col items-center w-3/5 mb-2 relative z-0">
                  {/* Cherry top layer */}
                  <div className="w-16 h-8 bg-pink-300 border-2 border-teal-accent flex items-center justify-center relative rounded-t-sm">
                    <div className="w-3 h-3 bg-red-500 rounded-full border border-teal-accent absolute top-[-6px]"></div>
                  </div>
                  {/* Middle frosting layer */}
                  <div className="w-28 h-10 bg-pink-primary border-x-2 border-b-2 border-teal-accent flex items-center justify-around">
                    <div className="w-2 h-2 rounded-full bg-cream"></div>
                    <div className="w-2 h-2 rounded-full bg-cream"></div>
                    <div className="w-2 h-2 rounded-full bg-cream"></div>
                  </div>
                  {/* Bottom crust layer */}
                  <div className="w-40 h-12 bg-teal-accent/35 border-x-2 border-b-2 border-teal-accent flex items-center justify-around">
                    <div className="w-3 h-1 bg-yellow-400"></div>
                    <div className="w-3 h-1 bg-yellow-400"></div>
                    <div className="w-3 h-1 bg-yellow-400"></div>
                    <div className="w-3 h-1 bg-yellow-400"></div>
                  </div>
                </div>

                {/* Candles Placed */}
                {candles.map((candle) => (
                  <div
                    key={candle.id}
                    className="absolute z-20 flex flex-col items-center pointer-events-none"
                    style={{
                      left: `${candle.x}px`,
                      top: `${candle.y - 12}px`,
                      transform: `translateX(-50%) rotate(${candle.rotation}deg)`,
                    }}
                  >
                    {/* Flame */}
                    <div className="w-2 h-3 bg-orange-400 rounded-full border border-red-500 animate-pulse origin-bottom"></div>
                    {/* Candle stick */}
                    <div className="w-1.5 h-6 bg-yellow-300 border border-teal-accent"></div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-[7px] text-teal-accent font-bold font-vietnam uppercase mt-2">
                <span>Candles lit: {candles.length}</span>
                <button
                  onClick={clearCandles}
                  className="bg-white border border-teal-accent px-2 py-0.5 hover:bg-red-400 hover:text-white transition-all cursor-pointer rounded-none"
                >
                  Reset cake
                </button>
              </div>
            </div>

            {/* System Info Box */}
            <div className="border border-teal-accent/35 p-3 flex gap-3 items-center">
              <Award size={20} className="text-pink-primary flex-shrink-0 animate-spin" style={{ animationDuration: "6s" }} />
              <div className="font-vietnam text-[8px] leading-relaxed text-teal-accent">
                <span className="font-extrabold uppercase text-pink-primary block mb-1">
                  🔓 SECRET ACCESS AUTHORIZED
                </span>
                You are officially permitted to consume 100% of all birthday sweets today.
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
