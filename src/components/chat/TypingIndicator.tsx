import React from 'react';
import { motion } from 'framer-motion';

export const TypingIndicator: React.FC<{ name: string }> = ({ name }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 px-4 py-2"
    >
      <div className="bg-white/80 border border-teal-accent/30 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-2">
        <span className="font-vietnam text-[10px] text-teal-accent/70 font-semibold">
          {name}
        </span>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
              className="w-1.5 h-1.5 rounded-full bg-teal-accent/50"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
