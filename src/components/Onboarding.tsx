import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Play, Shield, Info, Heart } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    title: "CARD SUITE 4-IN-1",
    description: "Welcome to the ultimate digital card game collection. Experience Blackjack, Crazy Eights, Hearts, and Speed in a premium, high-fidelity environment.",
    icon: <Play className="w-12 h-12 text-emerald-500" />,
    color: "from-emerald-500/20 to-emerald-900/20"
  },
  {
    title: "ABOUT THE SUITE",
    description: "Designed for enthusiasts, this collection brings together classic mechanics with modern aesthetics. Every card flip and shuffle is crafted for precision and style.",
    icon: <Info className="w-12 h-12 text-blue-500" />,
    color: "from-blue-500/20 to-blue-900/20"
  },
  {
    title: "LEGAL & TERMS",
    description: "By playing, you agree to our terms of use. This is a digital simulation for entertainment purposes only. No real money is involved. Play responsibly.",
    icon: <Shield className="w-12 h-12 text-amber-500" />,
    color: "from-amber-500/20 to-amber-900/20"
  },
  {
    title: "HAVE FUN!",
    description: "Compete against our advanced AI, track your progress with detailed analytics, and master the deck. The table is waiting for you.",
    icon: <Heart className="w-12 h-12 text-rose-500" />,
    color: "from-rose-500/20 to-rose-900/20"
  }
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const next = () => {
    if (currentSlide === slides.length - 1) {
      onComplete();
    } else {
      setCurrentSlide(s => s + 1);
    }
  };

  const prev = () => {
    setCurrentSlide(s => Math.max(0, s - 1));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0a] flex items-center justify-center overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          className={`w-full h-full flex flex-col items-center justify-center p-12 bg-gradient-to-br ${slides[currentSlide].color}`}
        >
          <div className="max-w-2xl w-full text-center">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-24 h-24 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center mx-auto mb-12 shadow-2xl"
            >
              {slides[currentSlide].icon}
            </motion.div>
            
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-6xl font-black tracking-tighter text-white mb-6 uppercase italic"
            >
              {slides[currentSlide].title}
            </motion.h2>
            
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/60 text-xl leading-relaxed mb-16"
            >
              {slides[currentSlide].description}
            </motion.p>

            <div className="flex items-center justify-center gap-4">
              {currentSlide > 0 && (
                <button 
                  onClick={prev}
                  className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              
              <button 
                onClick={next}
                className="px-12 h-16 rounded-full bg-emerald-500 text-emerald-950 font-black text-xl flex items-center gap-3 hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20"
              >
                {currentSlide === slides.length - 1 ? "GET STARTED" : "CONTINUE"}
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div className="flex justify-center gap-2 mt-12">
              {slides.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-8 bg-emerald-500' : 'w-2 bg-white/20'}`} 
                />
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
