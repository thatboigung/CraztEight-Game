import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, Play } from 'lucide-react';

interface PlayerCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (count: number) => void;
  minPlayers: number;
  maxPlayers: number;
  gameTitle: string;
}

export const PlayerCountModal: React.FC<PlayerCountModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  minPlayers,
  maxPlayers,
  gameTitle,
}) => {
  const [count, setCount] = React.useState(minPlayers);

  const options = [];
  for (let i = minPlayers; i <= maxPlayers; i++) {
    options.push(i);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-xl relative"
          >
            {/* Background Glow */}
            <div className="absolute -inset-20 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="bg-[#0a0a0a] rounded-[4rem] border border-white/5 shadow-2xl overflow-hidden relative z-10">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500" />
              
              <div className="p-12 md:p-16">
                <header className="mb-12">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Configuration</div>
                    <button
                      onClick={onClose}
                      className="text-white/20 hover:text-white transition-colors p-2 -mr-2"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <h3 className="text-5xl md:text-7xl font-black text-white tracking-tighter italic uppercase leading-none">
                    {gameTitle}<br />
                    <span className="text-emerald-500">Setup.</span>
                  </h3>
                </header>

                <div className="space-y-12">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-6 block">
                      Select Table Size
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                      {options.map((option) => (
                        <button
                          key={option}
                          onClick={() => setCount(option)}
                          className={`relative group p-6 rounded-3xl border transition-all duration-500 ${
                            count === option
                              ? 'bg-emerald-500 border-emerald-500 text-emerald-950'
                              : 'bg-white/[0.02] border-white/5 text-white/40 hover:border-white/20 hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="text-3xl font-black italic tracking-tighter">{option}</div>
                          <div className="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-60">Players</div>
                          {count === option && (
                            <motion.div
                              layoutId="active-pill"
                              className="absolute inset-0 bg-emerald-400 -z-10"
                              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-6 pt-8 border-t border-white/5">
                    <div className="flex-1 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-emerald-500">
                        <Users className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-white uppercase italic tracking-tight">Multi-AI Session</div>
                        <div className="text-[10px] text-white/30 uppercase tracking-[0.2em] mt-1">
                          Playing against {count - 1} AI opponents
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelect(count)}
                      className="w-full md:w-auto px-12 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black py-6 rounded-3xl text-xl transition-all shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-3 group whitespace-nowrap"
                    >
                      START SESSION
                      <Play className="w-6 h-6 fill-current group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
