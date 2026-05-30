import { useState, useEffect } from "react";
import { PasswordGate } from "./components/PasswordGate";
import { Hero } from "./components/Hero";
import { Timeline } from "./components/Timeline";
import { Stats } from "./components/Stats";
import { AudioPlayer } from "./components/AudioPlayer";
import { ConfettiButton } from "./components/ConfettiButton";
import { SecretEgg } from "./components/SecretEgg";
import { WritingPad } from "./components/WritingPad";
import { motion, AnimatePresence } from "framer-motion";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isBirthdayModeOpen, setIsBirthdayModeOpen] = useState(false);
  const [showWritingPad, setShowWritingPad] = useState(false);

  // Load login state from session storage so it doesn't prompt for password on refresh.
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem("hbd_anushree_auth");
    if (sessionAuth === "true") {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    sessionStorage.setItem("hbd_anushree_auth", "true");
  };

  return (
    <div className="min-h-screen bg-cream selection:bg-pink-primary selection:text-white">
      {/* Easter Egg keyboard listener */}
      <SecretEgg />

      <AnimatePresence mode="wait">
        {!isLoggedIn ? (
          <motion.div
            key="login"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <PasswordGate onSuccess={handleLoginSuccess} />
          </motion.div>
        ) : showWritingPad ? (
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
                      Designed with love & chaos for Anushree's Birthday
                    </p>
                    <p className="text-[8px] text-pink-primary font-bold uppercase tracking-widest">
                      Special thanks to Bijin, Ditae, and Neha for helping with this! ❤️
                    </p>
                    <p className="text-[11px] font-press-start font-black uppercase tracking-widest mt-4 animate-pulse text-[#39FF14]" style={{ textShadow: "0 0 10px #39FF14, 0 0 20px #39FF14" }}>
                      PS You should be an Influencer
                    </p>
                  </footer>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
