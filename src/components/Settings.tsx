import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Database, Shield, Info, FileText, BarChart3, RotateCcw } from 'lucide-react';
import { getStats, resetStats } from '../utils/stats';

interface SettingsProps {
  onClose: () => void;
}

type SettingsTab = 'profile' | 'data' | 'legal' | 'about';

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const stats = getStats();

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all game statistics? This action cannot be undone.')) {
      resetStats();
      window.location.reload();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-center justify-center p-0 md:p-6 font-sans"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full h-full md:h-[80vh] max-w-5xl bg-[#0f172a] md:rounded-[3rem] border-0 md:border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Sidebar */}
        <div className="w-full md:w-1/3 bg-black/20 p-6 md:p-12 border-b md:border-b-0 md:border-r border-white/5 flex flex-row md:flex-col justify-between items-center md:items-start overflow-x-auto md:overflow-x-visible no-scrollbar">
          <div className="flex flex-row md:flex-col items-center md:items-start gap-8 md:gap-0 w-full">
            <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-white md:mb-12 uppercase italic whitespace-nowrap">Settings</h2>
            <nav className="flex flex-row md:flex-col gap-2 md:space-y-4">
              <SettingNavItem 
                icon={<User className="w-4 h-4 md:w-5 md:h-5" />} 
                label="Profile" 
                active={activeTab === 'profile'} 
                onClick={() => setActiveTab('profile')}
              />
              <SettingNavItem 
                icon={<Database className="w-4 h-4 md:w-5 md:h-5" />} 
                label="Data" 
                active={activeTab === 'data'} 
                onClick={() => setActiveTab('data')}
              />
              <SettingNavItem 
                icon={<Shield className="w-4 h-4 md:w-5 md:h-5" />} 
                label="Legal" 
                active={activeTab === 'legal'} 
                onClick={() => setActiveTab('legal')}
              />
              <SettingNavItem 
                icon={<Info className="w-4 h-4 md:w-5 md:h-5" />} 
                label="About" 
                active={activeTab === 'about'} 
                onClick={() => setActiveTab('about')}
              />
            </nav>
          </div>
          
          <div className="hidden md:block text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
            Card Suite v1.2.0
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 md:p-12 relative overflow-y-auto">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 md:top-8 md:right-8 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all z-50"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          <div className="max-w-2xl mx-auto md:mx-0">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="flex items-center gap-6 mb-12">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-emerald-500 flex items-center justify-center text-emerald-950">
                      <User className="w-10 h-10 md:w-12 md:h-12" />
                    </div>
                    <div>
                      <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Player Profile</h3>
                      <p className="text-emerald-400 font-bold text-xs md:text-sm uppercase tracking-widest">Master of Cards</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <StatCard label="Total Games" value={stats.totalGames} icon={<BarChart3 className="w-4 h-4" />} />
                    <StatCard label="Total Wins" value={stats.totalWins} icon={<RotateCcw className="w-4 h-4" />} />
                    <StatCard label="Win Rate" value={stats.totalGames > 0 ? `${Math.round((stats.totalWins / stats.totalGames) * 100)}%` : '0%'} icon={<RotateCcw className="w-4 h-4 text-emerald-500" />} />
                  </div>

                  <div className="pt-8 border-t border-white/5">
                    <h4 className="text-sm font-black text-white/40 uppercase tracking-[0.2em] mb-6">Game Analytics</h4>
                    <div className="space-y-4">
                      {Object.entries(stats).filter(([key]) => !['totalWins', 'totalGames'].includes(key)).map(([game, data]: [string, any]) => (
                        <div key={game} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex justify-between items-center">
                          <div>
                            <div className="text-xs font-black text-white uppercase tracking-widest">{game.replace('_', ' ')}</div>
                            <div className="text-[10px] text-white/40 uppercase font-bold mt-1">
                              Last Played: {data.lastPlayed ? new Date(data.lastPlayed).toLocaleDateString() : 'Never'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black text-white">{data.wins}W / {data.losses}L</div>
                            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                              {data.gamesPlayed > 0 ? `${Math.round((data.wins / data.gamesPlayed) * 100)}% WR` : '0% WR'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'data' && (
                <motion.div
                  key="data"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-8">Data Management</h3>
                  
                  <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500">
                        <Database className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-white uppercase tracking-tight">Reset Statistics</h4>
                        <p className="text-white/40 text-xs">Clear all wins, losses, and game history.</p>
                      </div>
                    </div>
                    <p className="text-white/60 text-sm leading-relaxed mb-8">
                      This will permanently delete your local game statistics and progress. This action cannot be undone and will refresh the application.
                    </p>
                    <button 
                      onClick={handleReset}
                      className="w-full bg-red-500 hover:bg-red-400 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-red-500/20 uppercase tracking-widest text-sm"
                    >
                      Reset All Data
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'legal' && (
                <motion.div
                  key="legal"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-8">Legal & Privacy</h3>
                  
                  <div className="space-y-6">
                    <LegalSection 
                      icon={<Shield className="w-5 h-5" />}
                      title="Privacy Policy"
                      content="We respect your privacy. All game data is stored locally on your device using browser storage. We do not collect, store, or share any personal information on our servers."
                    />
                    <LegalSection 
                      icon={<FileText className="w-5 h-5" />}
                      title="Terms of Service"
                      content="By using Card Suite, you agree to the local-only nature of the application. The software is provided 'as is' without warranty of any kind."
                    />
                    <LegalSection 
                      icon={<Shield className="w-5 h-5" />}
                      title="Cookie Policy"
                      content="We use local storage only to save your game progress and preferences. No tracking cookies are used."
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'about' && (
                <motion.div
                  key="about"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-8">About Card Suite</h3>
                  
                  <div className="bg-emerald-500/5 p-8 rounded-[2rem] border border-emerald-500/10">
                    <div className="text-center mb-8">
                      <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-emerald-500/20 rotate-3">
                        <RotateCcw className="w-10 h-10 text-emerald-950" />
                      </div>
                      <h4 className="text-2xl font-black text-white uppercase tracking-tighter italic">Card Suite</h4>
                      <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Premium Gaming Experience</p>
                    </div>

                    <div className="space-y-4 text-white/60 text-sm leading-relaxed">
                      <p>Card Suite is a collection of classic card games reimagined with a modern, high-fidelity interface. Our goal is to provide a seamless, distraction-free gaming experience.</p>
                      <p>Built with performance and aesthetics in mind, every animation and interaction is tuned for maximum satisfaction.</p>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Version</div>
                        <div className="text-white font-bold">1.2.0 Stable</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Developer</div>
                        <div className="text-white font-bold">Card Suite Team</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const SettingNavItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean; 
  onClick: () => void;
  className?: string;
}> = ({ icon, label, active, onClick, className }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl transition-all whitespace-nowrap w-full ${active ? 'bg-emerald-500 text-emerald-950 font-black' : 'text-white/40 hover:bg-white/5 hover:text-white font-bold'} ${className}`}
  >
    {icon}
    <span className="text-[10px] md:text-sm uppercase tracking-widest">{label}</span>
  </button>
);

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
    <div className="flex items-center gap-2 text-white/40 mb-1">
      {icon}
      <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <div className="text-xl font-black text-white">{value}</div>
  </div>
);

const LegalSection: React.FC<{ icon: React.ReactNode; title: string; content: string }> = ({ icon, title, content }) => (
  <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
    <div className="flex items-center gap-3 mb-3">
      <div className="text-emerald-400">{icon}</div>
      <h4 className="text-sm font-black text-white uppercase tracking-widest">{title}</h4>
    </div>
    <p className="text-white/40 text-xs leading-relaxed">{content}</p>
  </div>
);
