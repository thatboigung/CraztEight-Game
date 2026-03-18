import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, CheckCircle2 } from 'lucide-react';

interface RulesModalProps {
  gameName: string;
  rules: string[];
  howToPlay: string[];
  onClose: () => void;
  storageKey: string;
}

export const RulesModal: React.FC<RulesModalProps> = ({ 
  gameName, 
  rules, 
  howToPlay, 
  onClose,
  storageKey 
}) => {
  const [showAgain, setShowAgain] = useState(true);

  const handleClose = () => {
    if (!showAgain) {
      localStorage.setItem(storageKey, 'false');
    }
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-slate-900 border border-emerald-500/30 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.2)]"
      >
        {/* Header */}
        <div className="bg-emerald-500 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BookOpen className="text-emerald-950 w-6 h-6" />
            <h2 className="text-emerald-950 text-xl font-black uppercase tracking-widest">{gameName} Rules</h2>
          </div>
          <button onClick={handleClose} className="text-emerald-950/60 hover:text-emerald-950 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <section>
            <h3 className="text-emerald-400 text-xs font-black uppercase tracking-[0.3em] mb-4">How to Play</h3>
            <ul className="space-y-3">
              {howToPlay.map((item, i) => (
                <li key={i} className="flex gap-3 text-slate-300 text-sm leading-relaxed">
                  <span className="text-emerald-500 font-bold">{i + 1}.</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-emerald-400 text-xs font-black uppercase tracking-[0.3em] mb-4">Game Rules</h3>
            <ul className="space-y-3">
              {rules.map((rule, i) => (
                <li key={i} className="flex gap-3 text-slate-300 text-sm leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  {rule}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-950/50 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input 
                type="checkbox" 
                checked={showAgain}
                onChange={(e) => setShowAgain(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${showAgain ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 group-hover:border-white/40'}`}>
                {showAgain && <CheckCircle2 className="w-4 h-4 text-emerald-950" />}
              </div>
            </div>
            <span className="text-xs font-bold text-white/60 uppercase tracking-widest group-hover:text-white/80 transition-colors">Show this again</span>
          </label>

          <button 
            onClick={handleClose}
            className="w-full sm:w-auto bg-emerald-500 text-emerald-950 font-black px-10 py-4 rounded-2xl text-sm hover:bg-emerald-400 transition-all shadow-xl hover:scale-105 active:scale-95 uppercase tracking-widest"
          >
            Got it, Let's Play
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
