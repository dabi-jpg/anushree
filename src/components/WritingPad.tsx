import React from "react";
import { ArrowLeft, Sparkles, PartyPopper } from "lucide-react";
import { BIRTHDAY_CONFIG } from "../config";
import { motion } from "framer-motion";

interface WritingPadProps {
  decryptionKey: string;
  onBack: () => void;
}

// Client-side RC4 Decryption Routine
function decryptLetter(key: string, encryptedHex: string) {
  try {
    // Hex to binary string conversion
    const binary = String.fromCharCode(
      ...encryptedHex.match(/.{1,2}/g)!.map((val) => parseInt(val, 16))
    );

    // RC4 setup
    let s = [], j = 0, x, res = "";
    for (let i = 0; i < 256; i++) {
      s[i] = i;
    }
    for (let i = 0; i < 256; i++) {
      j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
      x = s[i];
      s[i] = s[j];
      s[j] = x;
    }
    let i = 0;
    j = 0;
    for (let y = 0; y < binary.length; y++) {
      i = (i + 1) % 256;
      j = (j + s[i]) % 256;
      x = s[i];
      s[i] = s[j];
      s[j] = x;
      res += String.fromCharCode(binary.charCodeAt(y) ^ s[(s[i] + s[j]) % 256]);
    }
    return JSON.parse(res);
  } catch (e) {
    console.error("Decryption failed", e);
    return null;
  }
}

interface LetterPayload {
  header: string;
  body: string[];
}

export const WritingPad: React.FC<WritingPadProps> = ({ decryptionKey, onBack }) => {
  const decrypted: LetterPayload | null = decryptLetter(
    decryptionKey,
    BIRTHDAY_CONFIG.ENCRYPTED_LETTER
  );

  return (
    <div className="bg-cream min-h-screen text-on-surface select-none relative overflow-x-hidden font-jakarta pb-24">
      {/* Top AppBar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-cream/80 backdrop-blur-md border-b-2 border-teal-accent/10">
        <nav className="flex justify-between items-center px-6 py-4 w-full max-w-[600px] mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-teal-accent hover:text-pink-primary font-bold text-[10px] uppercase font-press-start cursor-pointer"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className="font-press-start text-[10px] text-teal-accent tracking-tighter">
            To Anushree
          </div>
          <div className="flex items-center gap-4">
            <PartyPopper className="text-teal-accent animate-bounce" size={18} />
          </div>
        </nav>
      </header>

      {/* Main Container */}
      <main className="pt-24 pb-12 px-6 max-w-[600px] mx-auto flex flex-col gap-6 relative z-10">
        {/* Subtle Memory Collage Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex flex-wrap gap-8 overflow-hidden justify-center items-center p-8 z-0">
          <img alt="" className="w-40 h-40 object-cover rounded-full rotate-6" src="/memory_1.jpg" />
          <img alt="" className="w-32 h-32 object-cover rounded-xl -rotate-12" src="/memory_2.jpg" />
          <img alt="" className="w-48 h-48 object-cover rounded-3xl rotate-3" src="/memory_3.jpg" />
          <img alt="" className="w-36 h-36 object-cover rounded-full -rotate-6" src="/memory_4.jpg" />
          <img alt="" className="w-44 h-44 object-cover rounded-xl rotate-12" src="/memory_5.jpg" />
        </div>

        {/* Header Section */}
        <div className="text-center z-10">
          <h1 className="font-press-start text-[14px] text-pink-primary mb-2 leading-relaxed hollow-text-pink">
            A Special Message
          </h1>
        </div>

        {/* Writing Pad Area */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 bg-white rounded-lg border-2 border-teal-accent shadow-[6px_6px_0px_rgba(255,105,180,1)] overflow-hidden"
        >
          {/* Paper Header */}
          <div className="h-10 bg-[#E0F2F1] flex items-center justify-between px-4 border-b-2 border-teal-accent">
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-pink-primary"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-teal-accent"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-cream border border-teal-accent/30"></div>
            </div>
            <span className="font-press-start text-[8px] text-teal-accent/70 uppercase">Notepad</span>
          </div>

          <div className="p-6 min-h-[420px] flex flex-col relative bg-white notebook-lines overflow-y-auto max-h-[500px] select-text">
            {decrypted ? (
              <div className="w-full flex-grow text-gray-800 font-vietnam text-xs leading-[2.2rem] whitespace-pre-line p-0">
                <p className="font-bold text-sm mb-4 text-pink-primary font-jakarta uppercase tracking-wide">
                  {decrypted.header}
                </p>
                {decrypted.body.map((paragraph, index) => {
                  if (paragraph.startsWith("Love,") || paragraph.startsWith("PS:")) {
                    return (
                      <p key={index} className="mt-6 font-semibold whitespace-pre-line">
                        {paragraph}
                      </p>
                    );
                  }
                  return (
                    <p key={index} className="mb-6 indent-4">
                      {paragraph}
                    </p>
                  );
                })}
                <p className="mt-8 font-press-start text-[9px] text-pink-primary animate-pulse font-black uppercase tracking-widest text-center border-2 border-dashed border-pink-primary p-3 bg-pink-primary/5 shadow-retro-pink-sm">
                  ✨ Yes you should be a Influencer ✨
                </p>
              </div>
            ) : (
              <div className="w-full flex-grow flex flex-col items-center justify-center text-center p-6 gap-3">
                <p className="font-press-start text-[10px] text-red-500 uppercase animate-pulse">
                  Decryption Failed
                </p>
                <p className="font-vietnam text-xs text-teal-accent uppercase font-bold tracking-wider max-w-[250px]">
                  The letter text is secure. Please enter the correct key to unlock.
                </p>
              </div>
            )}

            {/* Bottom Decor */}
            <div className="mt-6 flex justify-between items-center text-teal-accent/60 border-t border-dashed border-teal-accent/25 pt-4">
              <div className="flex items-center gap-1">
                <Sparkles className="text-pink-primary animate-pulse" size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider font-vietnam">
                  Handwritten with Care
                </span>
              </div>
              <span className="font-vietnam text-xs italic opacity-50">2026</span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-cream/90 backdrop-blur-lg border-t-2 border-teal-accent/10 px-6 pb-6 pt-4 flex justify-around items-center max-w-[600px] mx-auto">
        <button
          onClick={onBack}
          className="flex flex-col items-center justify-center text-teal-accent/60 hover:text-pink-primary transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined">home</span>
        </button>
        <button
          className="flex flex-col items-center justify-center text-pink-primary cursor-default"
        >
          <span className="material-symbols-outlined fill-1">edit_note</span>
        </button>
        <button
          onClick={onBack}
          className="flex flex-col items-center justify-center text-teal-accent/60 hover:text-pink-primary transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined">auto_awesome</span>
        </button>
      </nav>
    </div>
  );
};
