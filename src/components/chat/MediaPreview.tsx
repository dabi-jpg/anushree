import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface MediaPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  type: 'image' | 'video';
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({ isOpen, onClose, src, type }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>

          {/* Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {type === 'image' ? (
              <img
                src={src}
                alt="Full size preview"
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              />
            ) : (
              <video
                src={src}
                controls
                autoPlay
                className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
