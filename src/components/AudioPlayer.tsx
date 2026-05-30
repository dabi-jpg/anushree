import React, { useState, useRef } from "react";
import { Play, Pause, Square } from "lucide-react";
import { motion } from "framer-motion";

export const AudioPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayPause = () => {
    if (isPlaying) {
      pausePlayback();
    } else {
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.play().catch((err) => {
          console.error("Playback failed", err);
          setIsPlaying(false);
        });
      }
    }
  };

  const pausePlayback = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <section className="py-20 bg-white border-b-8 border-teal-accent select-none">
      <div className="max-w-[800px] mx-auto px-6 flex flex-col items-center">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-black uppercase text-teal-accent mb-2 hollow-text">
            Secret Message
          </h2>
          <p className="font-vietnam text-[10px] text-pink-primary uppercase font-bold tracking-wider">
            Press Play to hear what I have to say.
          </p>
        </div>

        {/* Cassette Tape Mockup */}
        <div className="bg-pink-primary border-4 border-teal-accent p-6 w-full max-w-[420px] shadow-retro-teal relative">
          {/* Cassette Label */}
          <div className="bg-white border-2 border-teal-accent p-6 flex flex-col items-center justify-center min-h-[140px]">
            {/* Tape Wheels Screen */}
            <div className="w-full bg-cream border-2 border-teal-accent h-16 flex items-center justify-around relative rounded-sm shadow-inner">
              {/* Wheel Left */}
              <motion.div
                animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 rounded-full border-2 border-teal-accent bg-white flex items-center justify-center relative overflow-hidden"
              >
                {/* Spokes */}
                <div className="absolute w-full h-0.5 bg-teal-accent"></div>
                <div className="absolute w-full h-0.5 bg-teal-accent rotate-45"></div>
                <div className="absolute w-full h-0.5 bg-teal-accent rotate-90"></div>
                <div className="absolute w-full h-0.5 bg-teal-accent rotate-[135deg]"></div>
                <div className="w-4 h-4 rounded-full bg-cream border border-teal-accent z-10"></div>
              </motion.div>

              {/* Tape Roll Visual */}
              <div className="absolute left-1/4 right-1/4 h-6 bg-amber-900/40 rounded-full border border-teal-accent/25 z-0 pointer-events-none"></div>

              {/* Wheel Right */}
              <motion.div
                animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 rounded-full border-2 border-teal-accent bg-white flex items-center justify-center relative overflow-hidden"
              >
                {/* Spokes */}
                <div className="absolute w-full h-0.5 bg-teal-accent"></div>
                <div className="absolute w-full h-0.5 bg-teal-accent rotate-45"></div>
                <div className="absolute w-full h-0.5 bg-teal-accent rotate-90"></div>
                <div className="absolute w-full h-0.5 bg-teal-accent rotate-[135deg]"></div>
                <div className="w-4 h-4 rounded-full bg-cream border border-teal-accent z-10"></div>
              </motion.div>
            </div>
          </div>

          {/* Cassette holes at bottom */}
          <div className="flex justify-around items-center mt-6 px-12">
            <div className="w-4 h-4 bg-teal-accent rounded-full"></div>
            <div className="w-3 h-3 bg-teal-accent rounded-full"></div>
            <div className="w-4 h-4 bg-teal-accent rounded-full"></div>
          </div>
        </div>

        {/* Cassette Controls Player Box */}
        <div className="flex gap-4 mt-8 bg-cream border-2 border-teal-accent p-3 shadow-retro-teal">
          <button
            onClick={handlePlayPause}
            className={`border border-teal-accent px-4 py-2 text-[8px] font-bold uppercase transition-all flex items-center gap-2 cursor-pointer ${
              isPlaying
                ? "bg-pink-primary text-cream"
                : "bg-white text-teal-accent hover:bg-pink-primary hover:text-cream"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause size={10} /> PAUSE
              </>
            ) : (
              <>
                <Play size={10} /> PLAY
              </>
            )}
          </button>
          <button
            onClick={stopPlayback}
            className="border border-teal-accent px-4 py-2 text-[8px] font-bold uppercase transition-all flex items-center gap-2 cursor-pointer bg-white text-teal-accent hover:bg-red-500 hover:text-white"
          >
            <Square size={10} /> STOP
          </button>
        </div>

        {/* Hidden Audio element for anushree.m4a */}
        <audio
          ref={audioRef}
          src="/anushree.m4a"
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      </div>
    </section>
  );
};
