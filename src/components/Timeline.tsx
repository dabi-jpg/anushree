import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BIRTHDAY_CONFIG } from "../config";
import { ImageSwiper } from "./ui/image-swiper";

export const Timeline: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Combine image paths into a comma-separated list
  const imageUrls = BIRTHDAY_CONFIG.TIMELINE_ITEMS.map(item => item.image).join(",");
  const activeMemory = BIRTHDAY_CONFIG.TIMELINE_ITEMS[activeIndex];

  return (
    <section className="py-20 bg-white border-b-8 border-teal-accent relative select-none">
      {/* Tape decorations in corners */}
      <div className="absolute top-4 left-4 bg-yellow-100/70 border border-dashed border-teal-accent/30 px-4 py-1 text-[8px] text-teal-accent uppercase font-bold rotate-[-12deg] z-10">
        📌 Memories
      </div>

      <div className="max-w-[1200px] mx-auto px-6 flex flex-col items-center">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-black uppercase text-pink-primary mb-2 hollow-text-pink">
            Memory Lane
          </h2>
          <p className="font-vietnam text-[10px] text-teal-accent uppercase font-bold tracking-wider">
            Swipe left or right to browse memories.
          </p>
        </div>

        {/* Swiper Stack */}
        <div className="relative flex flex-col items-center justify-center min-h-[420px]">
          {/* Retro Polaroid frame background behind swiper */}
          <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-teal-accent/15 rounded-md -rotate-1"></div>

          <ImageSwiper
            images={imageUrls}
            cardWidth={260}
            cardHeight={260}
            className="z-10"
            onActiveIndexChange={(index) => setActiveIndex(index)}
          />
        </div>

        {/* Dynamic polaroid caption card under the swiper */}
        <AnimatePresence mode="wait">
          {activeMemory && (
            <motion.div
              key={activeMemory.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="text-center font-vietnam mt-6 w-full max-w-[320px] bg-cream border-2 border-teal-accent p-4 shadow-retro-teal relative"
            >
              {/* Sticky Tape Decoration */}
              <div className="absolute top-[-12px] left-1/2 transform -translate-x-1/2 w-20 h-5 bg-pink-200/40 border border-dashed border-pink-primary/30 rotate-2 z-20"></div>
              
              <p className="text-xs font-black text-teal-accent uppercase mb-1 tracking-tight leading-normal">
                {activeMemory.title}
              </p>
              <p className="text-[10px] font-medium text-pink-primary italic">
                "{activeMemory.caption}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
