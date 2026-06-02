import { useState } from "react";
import { Hero } from "../Hero";
import { Timeline } from "../Timeline";
import { Stats } from "../Stats";
import { AudioPlayer } from "../AudioPlayer";
import { ConfettiButton } from "../ConfettiButton";
import { SecretEgg } from "../SecretEgg";
import { WritingPad } from "../WritingPad";
import { motion, AnimatePresence } from "framer-motion";

/**
 * BirthdayPage — wraps all existing birthday content into a routable page.
 * This is a direct extraction from the original App.tsx with zero visual changes.
 */
export const BirthdayPage: React.FC = () => {
  const [isBirthdayModeOpen, setIsBirthdayModeOpen] = useState(false);
  const [showWritingPad, setShowWritingPad] = useState(false);

  return (
    <>
      {/* Easter Egg keyboard listener */}
      <SecretEgg />

      <AnimatePresence mode="wait">
        {showWritingPad ? (
          <motion.div
            key="writing-pad"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <WritingPad onBack={() => setShowWritingPad(false)} />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col w-full"
          >
            {/* Hero Section */}
            <Hero
              onOpenBirthdayMode={() => setIsBirthdayModeOpen(true)}
              isBirthdayModeOpen={isBirthdayModeOpen}
            />

            {/* Birthday Mode Content */}
            <AnimatePresence>
              {isBirthdayModeOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="flex flex-col w-full"
                >
                  {/* Memory Timeline Swiper */}
                  <Timeline />

                  {/* Anushree Statistics */}
                  <Stats />

                  {/* Voice Note Cassette Mixtape */}
                  <AudioPlayer />

                  {/* Do Not Press Confetti Warning */}
                  <ConfettiButton onSuccess={() => setShowWritingPad(true)} />

                  {/* Cute Footnote */}
                  <footer className="py-12 bg-white border-t-8 border-teal-accent text-center font-vietnam select-none">
                    <p className="text-[10px] text-teal-accent font-extrabold uppercase mb-2">
                      Designed with love &amp; chaos for Anushree's Birthday
                    </p>
                    <p className="text-[8px] text-pink-primary font-bold uppercase tracking-widest">
                      Special thanks to Bijin, Ditae, and Neha for helping with this! ❤️
                    </p>
                    <p
                      className="text-[11px] font-press-start font-black uppercase tracking-widest mt-4 animate-pulse text-[#39FF14]"
                      style={{ textShadow: "0 0 10px #39FF14, 0 0 20px #39FF14" }}
                    >
                      PS You should be an Influencer
                    </p>
                  </footer>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
