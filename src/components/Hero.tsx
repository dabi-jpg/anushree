import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BIRTHDAY_CONFIG } from "../config";

interface HeroProps {
  onOpenBirthdayMode: () => void;
  isBirthdayModeOpen: boolean;
}

export const Hero: React.FC<HeroProps> = ({ onOpenBirthdayMode, isBirthdayModeOpen }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isItBirthday: false,
  });

  // Floating particles generator
  const [particles, setParticles] = useState<Array<{ id: number; char: string; left: number; delay: number; size: number }>>([]);

  useEffect(() => {
    // Generate particles only once on client side
    const chars = ["❤️", "⭐", "🎂", "🎮", "👾", "✨"];
    const generated = Array.from({ length: 18 }).map((_, idx) => ({
      id: idx,
      char: chars[idx % chars.length],
      left: Math.random() * 90 + 5, // percentage
      delay: Math.random() * 5, // seconds
      size: Math.random() * 1.5 + 0.8, // rem
    }));
    setParticles(generated);
  }, []);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(BIRTHDAY_CONFIG.BIRTHDAY_DATE) - +new Date();
      let timeLeftData = { days: 0, hours: 0, minutes: 0, seconds: 0, isItBirthday: false };

      if (difference <= 0) {
        timeLeftData.isItBirthday = true;
      } else {
        timeLeftData.days = Math.floor(difference / (1000 * 60 * 60 * 24));
        timeLeftData.hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        timeLeftData.minutes = Math.floor((difference / 1000 / 60) % 60);
        timeLeftData.seconds = Math.floor((difference / 1000) % 60);
      }
      return timeLeftData;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="min-h-screen w-full bg-cream relative overflow-hidden flex flex-col justify-center items-center p-6 border-b-8 border-teal-accent retro-grid">
      {/* Floating Particles Background */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute bottom-[-50px] animate-float opacity-0 text-center"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              fontSize: `${p.size}rem`,
              animationDuration: "8s",
            }}
          >
            {p.char}
          </div>
        ))}
      </div>

      {/* Drifting Polaroids */}
      <div className="absolute inset-0 pointer-events-none z-10 hidden md:block select-none">
        {/* Polaroid 1 */}
        <motion.div
          animate={{
            y: [0, -15, 0],
            rotate: [3, -3, 3],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{ left: "8%", top: "15%" }}
          className="absolute bg-white border-2 border-teal-accent p-3 pb-6 w-48 shadow-retro-pink-sm"
        >
          <img src="/memory_1.jpg" alt="First Pic" className="w-full aspect-square object-cover border border-teal-accent mb-2" />
          <p className="font-vietnam text-[8px] text-teal-accent font-bold text-center">First Photo 📸</p>
        </motion.div>

        {/* Polaroid 2 */}
        <motion.div
          animate={{
            y: [0, 15, 0],
            rotate: [-4, 4, -4],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          style={{ right: "8%", top: "20%" }}
          className="absolute bg-white border-2 border-teal-accent p-3 pb-6 w-48 shadow-retro-pink-sm"
        >
          <img src="/memory_5.jpg" alt="Kurta Garba" className="w-full aspect-square object-cover border border-teal-accent mb-2" />
          <p className="font-vietnam text-[8px] text-teal-accent font-bold text-center">Garba Night ✨</p>
        </motion.div>
      </div>

      {/* Hero Content Card */}
      <div className="bg-white border-4 border-teal-accent w-full max-w-[700px] p-8 md:p-12 relative z-20 shadow-retro-pink flex flex-col items-center text-center">
        {/* Scrapbook Doodle Banner */}
        <span className="absolute top-[-18px] bg-pink-primary border-2 border-teal-accent px-4 py-1 text-[8px] md:text-[10px] text-cream uppercase tracking-widest font-bold rotate-1 shadow-retro-teal">
          ★ LEVEL 20+ SURPRISE ★
        </span>

        {/* Heading */}
        <h2 className="text-xl md:text-3xl font-black mb-4 uppercase tracking-tight hollow-text leading-tight md:leading-normal">
          Happy Birthday, Anushree 🎉
        </h2>

        {/* Subheading */}
        <p className="font-vietnam text-xs md:text-sm font-semibold text-teal-accent max-w-[500px] mb-8 leading-relaxed">
          One more year of being chaotic, funny, annoying, and somehow still amazing.
        </p>

        {/* Live Countdown & Mode Swapper */}
        <AnimatePresence mode="wait">
          {!timeLeft.isItBirthday ? (
            <motion.div
              key="countdown"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-cream border-2 border-teal-accent p-4 md:p-6 w-full max-w-[450px] mb-4 shadow-retro-teal"
            >
              <p className="text-[8px] md:text-[10px] text-pink-primary mb-3 uppercase tracking-wider font-bold">
                ⌛ Birthday begins in...
              </p>
              <div className="grid grid-cols-4 gap-2 text-center text-teal-accent">
                <div>
                  <div className="text-sm md:text-lg font-bold">{timeLeft.days}</div>
                  <div className="text-[6px] font-bold uppercase font-vietnam">Days</div>
                </div>
                <div className="text-sm md:text-lg font-bold">:</div>
                <div>
                  <div className="text-sm md:text-lg font-bold">
                    {String(timeLeft.hours).padStart(2, "0")}
                  </div>
                  <div className="text-[6px] font-bold uppercase font-vietnam">Hrs</div>
                </div>
                <div className="text-sm md:text-lg font-bold">:</div>
                <div>
                  <div className="text-sm md:text-lg font-bold">
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </div>
                  <div className="text-[6px] font-bold uppercase font-vietnam">Mins</div>
                </div>
                <div className="text-sm md:text-lg font-bold">:</div>
                <div>
                  <div className="text-sm md:text-lg font-bold">
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </div>
                  <div className="text-[6px] font-bold uppercase font-vietnam">Secs</div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="birthday-active"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex flex-col items-center"
            >
              <div className="bg-pink-primary text-cream border-2 border-teal-accent px-6 py-4 mb-6 shadow-retro-teal text-center uppercase tracking-wide text-[10px] md:text-xs font-bold leading-normal animate-bounce">
                🎂 IT'S YOUR BIRTHDAY 🎂
              </div>

              {!isBirthdayModeOpen && (
                <button
                  onClick={onOpenBirthdayMode}
                  className="bg-teal-accent text-cream border-2 border-white px-8 py-5 text-[10px] md:text-xs font-black uppercase shadow-retro-pink hover:bg-pink-primary hover:text-cream active:translate-y-1 transition-all cursor-pointer"
                >
                  Open Birthday Mode
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {isBirthdayModeOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[8px] text-pink-primary font-bold uppercase mt-2 tracking-widest font-vietnam"
          >
            ↓ Scroll down to explore!
          </motion.div>
        )}
      </div>
    </section>
  );
};
