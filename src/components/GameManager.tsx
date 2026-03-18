import React, { useState, useEffect } from 'react';
import { GameMode, PlayerStats } from '../types';
import { Blackjack } from './games/Blackjack';
import { CrazyEights } from './games/CrazyEights';
import { Hearts } from './games/Hearts';
import { Speed } from './games/Speed';
import { Onboarding } from './Onboarding';
import { Settings as SettingsView } from './Settings';
import { PlayerCountModal } from './PlayerCountModal';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, Settings, Info, RotateCcw, BarChart3, Target, Clock, TrendingUp } from 'lucide-react';
import { getStats } from '../utils/stats';

export const GameManager: React.FC = () => {
  const [mode, setMode] = useState<GameMode>(GameMode.MENU);
  const [stats, setStats] = useState<PlayerStats>(getStats());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedGameForSetup, setSelectedGameForSetup] = useState<{ mode: GameMode; title: string } | null>(null);
  const [playerCount, setPlayerCount] = useState(2);

  const GAME_CONFIGS = {
    [GameMode.BLACKJACK]: { min: 1, max: 4, default: 1 },
    [GameMode.CRAZY_EIGHTS]: { min: 2, max: 6, default: 2 },
    [GameMode.HEARTS]: { min: 4, max: 4, default: 4 },
    [GameMode.SPEED]: { min: 2, max: 2, default: 2 },
  };

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    if (mode === GameMode.MENU) {
      setStats(getStats());
    }
  }, [mode]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  const renderGame = () => {
    switch (mode) {
      case GameMode.BLACKJACK: return <Blackjack onBack={() => setMode(GameMode.MENU)} playerCount={playerCount} />;
      case GameMode.CRAZY_EIGHTS: return <CrazyEights onBack={() => setMode(GameMode.MENU)} playerCount={playerCount} />;
      case GameMode.HEARTS: return <Hearts onBack={() => setMode(GameMode.MENU)} />;
      case GameMode.SPEED: return <Speed onBack={() => setMode(GameMode.MENU)} />;
      default: return null;
    }
  };

  const handleGameClick = (mode: GameMode, title: string) => {
    const config = GAME_CONFIGS[mode as keyof typeof GAME_CONFIGS];
    if (config && config.min !== config.max) {
      setSelectedGameForSetup({ mode, title });
    } else {
      setPlayerCount(config?.default || 2);
      setMode(mode);
    }
  };

  if (mode !== GameMode.MENU) {
    return (
      <div className="felt-table w-full h-screen overflow-hidden flex flex-col">
        {renderGame()}
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-[#050505] text-white flex flex-col lg:flex-row overflow-hidden font-sans">
      <AnimatePresence>
        {showOnboarding && (
          <Onboarding onComplete={handleOnboardingComplete} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <SettingsView onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>

      <PlayerCountModal
        isOpen={!!selectedGameForSetup}
        onClose={() => setSelectedGameForSetup(null)}
        onSelect={(count) => {
          setPlayerCount(count);
          setMode(selectedGameForSetup!.mode);
          setSelectedGameForSetup(null);
        }}
        gameTitle={selectedGameForSetup?.title || ''}
        minPlayers={selectedGameForSetup ? GAME_CONFIGS[selectedGameForSetup.mode as keyof typeof GAME_CONFIGS].min : 1}
        maxPlayers={selectedGameForSetup ? GAME_CONFIGS[selectedGameForSetup.mode as keyof typeof GAME_CONFIGS].max : 4}
      />

      {/* Minimal Sidebar/Header */}
      <div className="w-full lg:w-80 h-auto lg:h-full p-4 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/5 relative bg-black/40 backdrop-blur-3xl z-20">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500 lg:hidden" />
        
        <div className="flex lg:flex-col justify-between items-center lg:items-start w-full gap-4 lg:gap-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col"
          >
            <div className="text-[8px] lg:text-[10px] font-black tracking-[0.4em] text-emerald-500 uppercase mb-0.5 lg:mb-1">Suite</div>
            <h1 className="text-xl lg:text-5xl font-black tracking-tighter leading-none italic">
              CARD<span className="text-emerald-500">.</span>
            </h1>
          </motion.div>

          <div className="hidden lg:block w-full space-y-8 mt-12">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4">Performance</div>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between group">
                  <span className="text-xs font-bold text-white/50 group-hover:text-white transition-colors">Total Wins</span>
                  <span className="text-xl font-black text-emerald-500">{stats.totalWins}</span>
                </div>
                <div className="flex items-center justify-between group">
                  <span className="text-xs font-bold text-white/50 group-hover:text-white transition-colors">Win Rate</span>
                  <span className="text-xl font-black text-blue-400">
                    {stats.totalGames > 0 ? Math.round((stats.totalWins / stats.totalGames) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4">Activity</div>
              <div className="flex items-end h-16 gap-1.5">
                {Object.values(GameMode).filter(m => m !== GameMode.MENU).map((m) => {
                  const gStats = stats[m as keyof PlayerStats] as any;
                  const height = stats.totalGames > 0 ? (gStats.gamesPlayed / stats.totalGames) * 100 : 0;
                  return (
                    <div key={m} className="flex-1 bg-white/5 rounded-t-sm relative group overflow-hidden h-full">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(height, 10)}%` }}
                        className="absolute bottom-0 left-0 w-full bg-emerald-500/40 group-hover:bg-emerald-500 transition-colors"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:mt-auto">
            <button 
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-emerald-500 hover:text-black transition-all"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-4 pt-8 border-t border-white/5">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-black text-xs">
            {stats.totalWins}
          </div>
          <div>
            <div className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Rank</div>
            <div className="text-xs font-bold text-white/70 tracking-tight">Master Shark</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 h-full p-4 md:p-10 lg:p-20 flex flex-col justify-start lg:justify-center relative overflow-y-auto bg-[#080808]">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="max-w-5xl mx-auto w-full z-10 py-8 lg:py-0">
          <header className="mb-8 lg:mb-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-3xl md:text-5xl lg:text-7xl font-black tracking-tighter uppercase italic mb-2 lg:mb-4">
                The <span className="text-emerald-500">Suite</span>
              </h2>
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="h-px w-8 lg:w-12 bg-emerald-500" />
                <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                  {stats.totalGames} Sessions Logged
                </span>
              </div>
            </motion.div>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
            <GameCard 
              title="Blackjack" 
              description="Beat the dealer to 21." 
              onClick={() => handleGameClick(GameMode.BLACKJACK, "Blackjack")}
              number="01"
              icon={<Trophy className="w-6 h-6" />}
              color="from-blue-500/20 to-indigo-500/20"
              stats={stats.BLACKJACK}
            />
            <GameCard 
              title="Crazy Eights" 
              description="Wild cards and strategy." 
              onClick={() => handleGameClick(GameMode.CRAZY_EIGHTS, "Crazy Eights")}
              number="02"
              icon={<RotateCcw className="w-6 h-6" />}
              color="from-emerald-500/20 to-teal-500/20"
              stats={stats.CRAZY_EIGHTS}
            />
            <GameCard 
              title="Hearts" 
              description="Avoid the hearts." 
              onClick={() => handleGameClick(GameMode.HEARTS, "Hearts")}
              number="03"
              icon={<Info className="w-6 h-6" />}
              color="from-rose-500/20 to-pink-500/20"
              stats={stats.HEARTS}
            />
            <GameCard 
              title="Speed" 
              description="Fast-paced matching." 
              onClick={() => handleGameClick(GameMode.SPEED, "Speed")}
              number="04"
              icon={<Play className="w-6 h-6" />}
              color="from-amber-500/20 to-orange-500/20"
              stats={stats.SPEED}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface GameCardProps {
  title: string;
  description: string;
  onClick: () => void;
  number: string;
  icon: React.ReactNode;
  color: string;
  stats: any;
}

const GameCard: React.FC<GameCardProps> = ({ title, description, onClick, number, icon, color, stats }) => (
  <motion.button
    whileHover={{ x: 10, scale: 1.01 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`group relative overflow-hidden p-6 md:p-8 lg:p-10 rounded-3xl bg-white/[0.02] border border-white/5 text-left transition-all hover:bg-white/[0.05] hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/5`}
  >
    <div className="absolute top-0 right-0 p-6 md:p-8 lg:p-10 opacity-5 group-hover:opacity-10 transition-opacity">
      <div className="text-5xl md:text-7xl lg:text-9xl font-black italic tracking-tighter leading-none">{number}</div>
    </div>
    
    <div className="relative z-10 flex flex-col h-full">
      <div className="flex justify-between items-start mb-6 lg:mb-8">
        <div className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-all duration-500">
          {icon}
        </div>
        <div className="text-right">
          <div className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Success Rate</div>
          <div className="text-lg lg:text-2xl font-black text-white group-hover:text-emerald-400 transition-colors">
            {stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0}%
          </div>
        </div>
      </div>
      
      <div className="mt-auto">
        <h3 className="text-xl lg:text-3xl font-black tracking-tighter text-white mb-1 lg:mb-2 uppercase group-hover:text-emerald-400 transition-colors italic">
          {title}
        </h3>
        <p className="text-white/30 text-[10px] lg:text-sm leading-relaxed group-hover:text-white/60 transition-colors mb-6 lg:mb-8 max-w-[90%] lg:max-w-[80%]">
          {description}
        </p>
        
        <div className="flex items-center justify-between pt-4 lg:pt-6 border-t border-white/5">
          <div className="flex items-center gap-2 lg:gap-3 text-[8px] lg:text-[10px] font-black tracking-[0.2em] text-emerald-500 uppercase">
            Initialize <Play className="w-2.5 h-2.5 lg:w-3 h-3 fill-current" />
          </div>
          <div className="text-[8px] lg:text-[10px] font-bold text-white/20">
            {stats.wins} Wins / {stats.gamesPlayed} Played
          </div>
        </div>
      </div>
    </div>
  </motion.button>
);
