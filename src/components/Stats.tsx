import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BIRTHDAY_CONFIG } from "../config";
import { CardSwiper } from "./ui/card-swiper";

export const Stats: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeQuote = BIRTHDAY_CONFIG.WISE_WORDS[activeIndex];

  return (
    <section className="py-20 bg-cream relative border-b-8 border-teal-accent retro-grid select-none">
      {/* Corner badge */}
      <div className="absolute top-4 right-4 bg-teal-accent text-cream border-2 border-white px-3 py-1 text-[8px] uppercase font-bold rotate-[5deg]">
        ✉️ Postcards
      </div>

      <div className="max-w-[1000px] mx-auto px-6 flex flex-col items-center">
        {/* Title */}
        <div className="text-center mb-16 max-w-[600px]">
          <h2 className="text-sm md:text-base font-black uppercase text-teal-accent mb-2 hollow-text leading-relaxed">
            Wise words bout you By your friend and your gay bestfriend
          </h2>
          <p className="font-vietnam text-[9px] text-pink-primary uppercase font-bold tracking-wider mt-2">
            Swipe left or right to read the postcards.
          </p>
        </div>

        {/* Card Swiper Stack */}
        <div className="relative flex flex-col items-center justify-center min-h-[340px]">
          <CardSwiper
            cardWidth={320}
            cardHeight={200}
            onActiveIndexChange={(index) => setActiveIndex(index)}
          >
            {BIRTHDAY_CONFIG.WISE_WORDS.map((item, idx) => (
              <div
                key={idx}
                className="w-full h-full p-6 flex flex-col justify-between bg-white relative notebook-lines"
              >
                {/* Stamp visual on the right */}
                <div className="absolute top-2 right-2 w-10 h-10 border border-dashed border-pink-primary/40 flex items-center justify-center text-xs opacity-40 select-none">
                  📬
                </div>

                {/* ID / Card number */}
                <div className="flex justify-between items-center z-10">
                  <span className="text-[6px] font-bold text-teal-accent/40 uppercase font-vietnam">
                    POSTCARD #{idx + 1}
                  </span>
                </div>

                {/* Postcard Message / Quote */}
                <div className="my-auto z-10 px-2">
                  <p className="font-vietnam text-[10px] md:text-xs font-semibold text-teal-accent italic leading-relaxed text-center whitespace-pre-line">
                    "{item.message}"
                  </p>
                </div>

                {/* Small indicator tag */}
                <div className="w-full flex justify-between items-center z-10 text-[6px] text-pink-primary/50 font-bold font-vietnam uppercase">
                  <span>HBD Anushree Card</span>
                  <span>2026 Edition</span>
                </div>
              </div>
            ))}
          </CardSwiper>
        </div>

        {/* Dynamic polaroid caption card under the swiper showing author */}
        <AnimatePresence mode="wait">
          {activeQuote && (
            <motion.div
              key={activeQuote.author}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="text-center font-vietnam mt-8 w-full max-w-[280px] bg-white border-2 border-teal-accent p-3 shadow-retro-teal relative"
            >
              {/* Tape decoration */}
              <div className="absolute top-[-12px] left-1/2 transform -translate-x-1/2 w-16 h-5 bg-pink-200/40 border border-dashed border-pink-primary/30 rotate-[-2deg] z-20"></div>

              <p className="text-[10px] font-black text-teal-accent uppercase tracking-wide leading-relaxed">
                By: {activeQuote.author}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
