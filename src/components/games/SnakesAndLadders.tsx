import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Trophy, User, Bot, Play, ChevronRight, HelpCircle, X } from 'lucide-react';
import { GameMode } from '../../types';
import { recordGameResult } from '../../utils/stats';
import { getRandomName } from '../../utils/names';

interface Props {
  onBack: () => void;
  playerCount?: number;
}

interface Player {
  id: number;
  name: string;
  position: number; // 0 to 99
  color: string;
  isAI: boolean;
}

const BOARD_SIZE = 10;
const TOTAL_TILES = BOARD_SIZE * BOARD_SIZE;

const SNAKES: Record<number, number> = {
  16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78
};

const LADDERS: Record<number, number> = {
  3: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 81: 97
};

const PLAYER_COLORS = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#f59e0b', // Amber
];

interface PlayerConfig {
  name: string;
  isAI: boolean;
  color: string;
}

interface GameSetup {
  players: PlayerConfig[];
}

export const SnakesAndLadders: React.FC<Props> = ({ onBack }) => {
  const [showHelp, setShowHelp] = useState(false);
  const [setup, setSetup] = useState<GameSetup | null>(null);
  const [tempSetup, setTempSetup] = useState<PlayerConfig[]>([
    { name: 'You', isAI: false, color: PLAYER_COLORS[0] },
    { name: getRandomName(), isAI: true, color: PLAYER_COLORS[1] },
    { name: getRandomName(), isAI: true, color: PLAYER_COLORS[2] },
    { name: getRandomName(), isAI: true, color: PLAYER_COLORS[3] },
  ]);
  const [activeCount, setActiveCount] = useState(2);

  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  // Initialize players from setup
  useEffect(() => {
    if (setup) {
      setPlayers(setup.players.map((p, i) => ({
        id: i,
        name: p.name,
        position: 0,
        color: p.color,
        isAI: p.isAI
      })));
    }
  }, [setup]);

  if (!setup) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto">
        <div className="absolute inset-0 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} 
          className="w-full max-w-2xl bg-[#0a0a0a] rounded-[3rem] md:rounded-[4rem] border border-white/5 shadow-2xl overflow-hidden relative z-10 my-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
          
          <div className="p-8 md:p-16">
            <header className="mb-10 flex justify-between items-start">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-2">Configuration</div>
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter italic uppercase leading-none">
                  Snakes<br /><span className="text-emerald-500">Setup.</span>
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onBack}
                  className="p-3 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white transition-colors">
                  <ArrowLeft className="w-6 h-6" />
                </motion.button>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowHelp(true)}
                  className="p-3 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white transition-colors">
                  <HelpCircle className="w-6 h-6" />
                </motion.button>
              </div>
            </header>

            <div className="space-y-10">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-6 block">Number of Players</label>
                <div className="grid grid-cols-3 gap-3">
                  {[2, 3, 4].map(n => (
                    <button key={n} onClick={() => setActiveCount(n)}
                      className={`relative group p-6 rounded-3xl border transition-all duration-500 ${activeCount === n ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white/[0.02] border-white/5 text-white/40 hover:border-white/20'}`}>
                      <div className="text-2xl font-black italic tracking-tighter">{n}</div>
                      <div className="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-60">Players</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-6 block">Configure Participants</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tempSetup.slice(0, activeCount).map((p, i) => (
                    <div key={p.color} className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]" style={{ backgroundColor: p.color }} />
                        <span className="text-white font-black uppercase tracking-widest text-[10px]">{p.isAI ? 'CPU' : 'P'}{i+1}</span>
                      </div>
                      <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5">
                        <button onClick={() => {
                          const ns = [...tempSetup];
                          ns[i].isAI = false;
                          ns[i].name = i === 0 ? 'You' : `Player ${i+1}`;
                          setTempSetup(ns);
                        }} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${!p.isAI ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}>Human</button>
                        <button onClick={() => {
                          const ns = [...tempSetup];
                          ns[i].isAI = true;
                          ns[i].name = getRandomName();
                          setTempSetup(ns);
                        }} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${p.isAI ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}>AI</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => {
                setSetup({ players: tempSetup.slice(0, activeCount) });
                setGameStarted(true);
              }}
                className="w-full py-6 bg-emerald-600 hover:bg-emerald-400 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group">
                START SESSION
                <Play className="w-6 h-6 fill-current group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const getTileCoords = (index: number) => {
    const row = Math.floor(index / BOARD_SIZE);
    let col = index % BOARD_SIZE;
    
    // Zig-zag logic
    if (row % 2 !== 0) {
      col = BOARD_SIZE - 1 - col;
    }
    
    return {
      x: col * 10,
      y: (BOARD_SIZE - 1 - row) * 10
    };
  };

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const movePlayer = async (playerIndex: number, steps: number) => {
    setIsMoving(true);
    let currentPlayers = [...players];
    let currentPos = currentPlayers[playerIndex].position;

    // RULE: Exact roll to win
    if (currentPos + steps > TOTAL_TILES - 1) {
      setStatusMessage(`${currentPlayers[playerIndex].name} needs exact roll!`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStatusMessage(null);
      setCurrentPlayerIndex((playerIndex + 1) % players.length);
      setIsMoving(false);
      return;
    }

    
    // Move step by step for animation
    for (let i = 0; i < steps; i++) {
      currentPos++;
      currentPlayers[playerIndex] = { ...currentPlayers[playerIndex], position: currentPos };
      setPlayers([...currentPlayers]);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Check for snakes or ladders
    const finalPos = currentPos + 1; // Logic uses 1-based for snakes/ladders map
    let teleportedPos = finalPos;
    let eventType: 'SNAKE' | 'LADDER' | null = null;
    
    if (SNAKES[finalPos]) {
      teleportedPos = SNAKES[finalPos];
      eventType = 'SNAKE';
    } else if (LADDERS[finalPos]) {
      teleportedPos = LADDERS[finalPos];
      eventType = 'LADDER';
    }

    if (eventType) {
      setStatusMessage(eventType === 'SNAKE' ? "Oh no! A Snake! 🐍" : "Great! A Ladder! 🪜");
      await new Promise(resolve => setTimeout(resolve, 800));
      currentPlayers[playerIndex] = { ...currentPlayers[playerIndex], position: teleportedPos - 1 };
      setPlayers([...currentPlayers]);
      await new Promise(resolve => setTimeout(resolve, 500));
      setStatusMessage(null);
    }

    // Check win condition
    if (currentPlayers[playerIndex].position === TOTAL_TILES - 1) {
      setWinner(currentPlayers[playerIndex]);
      recordGameResult(GameMode.SNAKES_LADDERS, !currentPlayers[playerIndex].isAI);
    } else {
      setCurrentPlayerIndex((playerIndex + 1) % players.length);
    }
    
    setIsMoving(false);
  };

  const rollDice = () => {
    if (isRolling || isMoving || winner || !gameStarted) return;
    
    setIsRolling(true);
    setDiceValue(null);
    
    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setDiceValue(roll);
      setIsRolling(false);
      movePlayer(currentPlayerIndex, roll);
    }, 800);
  };

  // AI Turn
  useEffect(() => {
    if (gameStarted && !winner && players[currentPlayerIndex]?.isAI && !isMoving && !isRolling) {
      const timer = setTimeout(() => {
        rollDice();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentPlayerIndex, gameStarted, winner, isMoving, isRolling]);

  const resetGame = () => {
    setPlayers(players.map(p => ({ ...p, position: 0 })));
    setCurrentPlayerIndex(0);
    setWinner(null);
    setDiceValue(null);
    setGameStarted(false);
  };

  const renderBoard = () => {
    const tiles = [];
    for (let i = 0; i < TOTAL_TILES; i++) {
      const isSnakeHead = SNAKES[i + 1];
      const isLadderStart = LADDERS[i + 1];
      const { x, y } = getTileCoords(i);
      
      tiles.push(
        <div 
          key={i}
          className={`absolute w-[10%] h-[10%] border border-white/5 flex items-center justify-center text-[10px] font-bold transition-colors
            ${(Math.floor(i / 10) + i % 10) % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'}
          `}
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <span className="opacity-20">{i + 1}</span>
        </div>
      );
    }
    return tiles;
  };

  const connectionPaths = useMemo(() => {
    const paths: React.ReactNode[] = [];
    
    // Render Snakes
    Object.entries(SNAKES).forEach(([start, end]) => {
      const startCoord = getTileCoords(parseInt(start) - 1);
      const endCoord = getTileCoords(end - 1);
      const seed = parseInt(start);
      const midX = (startCoord.x + endCoord.x) / 2 + ((seed % 10) / 10 - 0.5) * 20;
      const midY = (startCoord.y + endCoord.y) / 2 + ((seed % 7) / 7 - 0.5) * 20;
      
      paths.push(
        <g key={`snake-group-${start}`}>
          <motion.path
            d={`M ${startCoord.x + 5} ${startCoord.y + 5} Q ${midX + 5} ${midY + 5} ${endCoord.x + 5} ${endCoord.y + 5}`}
            stroke="#ef4444"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.8 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          {/* Glow effect */}
          <motion.path
            d={`M ${startCoord.x + 5} ${startCoord.y + 5} Q ${midX + 5} ${midY + 5} ${endCoord.x + 5} ${endCoord.y + 5}`}
            stroke="#ef4444"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            style={{ filter: 'blur(4px)', opacity: 0.3 }}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
          />
        </g>
      );
    });

    // Render Ladders
    Object.entries(LADDERS).forEach(([start, end]) => {
      const startCoord = getTileCoords(parseInt(start) - 1);
      const endCoord = getTileCoords(end - 1);
      
      paths.push(
        <g key={`ladder-group-${start}`}>
          <motion.line
            x1={startCoord.x + 5}
            y1={startCoord.y + 5}
            x2={endCoord.x + 5}
            y2={endCoord.y + 5}
            stroke="#10b981"
            strokeWidth="4"
            strokeDasharray="1 2"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.9 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          {/* Outer rails for ladder look */}
          <motion.line
            x1={startCoord.x + 4}
            y1={startCoord.y + 5}
            x2={endCoord.x + 4}
            y2={endCoord.y + 5}
            stroke="#059669"
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
          />
          <motion.line
            x1={startCoord.x + 6}
            y1={startCoord.y + 5}
            x2={endCoord.x + 6}
            y2={endCoord.y + 5}
            stroke="#059669"
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
          />
        </g>
      );
    });

    return paths;
  }, []);

  const renderConnections = () => {
    return (
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none z-10" 
        viewBox="0 0 100 100" 
        style={{ overflow: 'visible' }}
      >
        {connectionPaths}
      </svg>
    );
  };

  return (
    <div className="w-full h-screen bg-[#080808] flex items-center justify-center p-4 relative overflow-hidden font-sans text-white">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[80%] h-[80%] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[80%] h-[80%] bg-green-500/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="absolute top-8 left-8 flex items-center gap-4 z-50 backdrop-blur-md">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowHelp(true)}
          className="p-3 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
        </motion.button>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between lg:justify-center gap-4 lg:gap-16 w-full max-w-7xl h-full py-4 lg:py-10">
        
        {/* Left Side: Info & Players */}
        <div className="w-full lg:w-80 flex flex-col gap-4 order-1 lg:h-auto">
          <div className="text-center lg:text-left mt-10 lg:mt-0">
            <h1 className="text-2xl md:text-3xl lg:text-6xl font-black italic tracking-tighter uppercase leading-tight">
              Snakes <span className="text-emerald-500">&</span> <span className="text-white/20">Ladders</span>
            </h1>
            <p className="hidden lg:block text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Digital Edition</p>
          </div>

          {/* Compact Player List for Mobile */}
          <div className="bg-white/5 border border-white/10 rounded-2xl lg:rounded-3xl p-3 lg:p-6 backdrop-blur-md overflow-hidden">
            <h3 className="hidden lg:block text-[10px] font-black uppercase tracking-widest text-white/40 mb-6">Active Players</h3>
            <div className="flex flex-row lg:flex-col gap-2 lg:gap-4 overflow-x-auto no-scrollbar lg:overflow-visible">
              {players.map((p, i) => (
                <div 
                  key={p.id}
                  className={`flex items-center gap-2 lg:gap-4 p-2 lg:p-3 rounded-xl lg:rounded-2xl transition-all duration-500 border min-w-[120px] lg:min-w-0
                    ${currentPlayerIndex === i && !winner ? 'bg-white/10 border-white/20 shadow-xl scale-105' : 'bg-transparent border-transparent opacity-40'}
                  `}
                >
                  <div 
                    className="w-6 h-6 lg:w-10 lg:h-10 rounded-full flex items-center justify-center shadow-lg flex-shrink-0"
                    style={{ backgroundColor: p.color, boxShadow: `0 0 10px ${p.color}44` }}
                  >
                    {p.isAI ? <Bot className="w-3 h-3 lg:w-5 lg:h-5 text-black" /> : <User className="w-3 h-3 lg:w-5 lg:h-5 text-black" />}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="text-[10px] lg:text-xs font-black uppercase tracking-tight truncate">{p.name}</div>
                    <div className="text-[8px] lg:text-[10px] font-bold text-white/40 italic">Tile {p.position + 1}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex flex-col gap-3">
            {!gameStarted ? (
              <button onClick={() => setGameStarted(true)} className="w-full py-4 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-3">
                <Play className="w-5 h-5 fill-current" /> Start Game
              </button>
            ) : (
              <button onClick={resetGame} className="w-full py-4 bg-white/5 text-white/50 font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-3 border border-white/5">
                <RotateCcw className="w-5 h-5" /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Center: The Board */}
        <div className="flex-1 flex items-center justify-center w-full max-h-[45vh] lg:max-h-none aspect-square relative order-2">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full h-full max-w-[min(45vh,400px)] lg:max-w-[min(80vh,800px)] bg-black/40 backdrop-blur-xl border border-white/10 rounded-[1.5rem] lg:rounded-[2.5rem] overflow-hidden shadow-2xl relative"
          >
            {renderBoard()}
            {renderConnections()}

            <AnimatePresence>
              {statusMessage && (
                <motion.div initial={{ opacity: 0, scale: 0.5, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.5, y: -20 }} className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                  <div className="bg-black/80 backdrop-blur-xl border border-white/20 px-4 lg:px-8 py-2 lg:py-4 rounded-xl lg:rounded-2xl shadow-2xl">
                    <span className="text-sm lg:text-3xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                      {statusMessage}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Players */}
            {players.map((p) => {
              const { x, y } = getTileCoords(p.position);
              return (
                <motion.div
                  key={p.id}
                  className="absolute w-[7%] h-[7%] rounded-full flex items-center justify-center z-20 shadow-2xl"
                  animate={{ left: `${x + 1.5}%`, top: `${y + 1.5}%` }}
                  transition={{ type: "spring", stiffness: 100, damping: 15 }}
                  style={{ backgroundColor: p.color, border: '2px solid rgba(255,255,255,0.2)', boxShadow: `0 0 10px ${p.color}88` }}
                >
                  <div className="w-0.5 h-0.5 bg-white rounded-full opacity-50" />
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Bottom/Right Side: Controls */}
        <div className="w-full lg:w-48 flex flex-row lg:flex-col items-center justify-center gap-4 lg:gap-8 order-3 py-2 lg:py-0">
          <div className="relative">
            <div className={`w-16 h-16 md:w-20 md:h-20 lg:w-32 lg:h-32 rounded-2xl lg:rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl lg:text-6xl font-black transition-all duration-300 backdrop-blur-md
              ${isRolling ? 'animate-bounce border-emerald-500/50 scale-105' : ''}
              ${!gameStarted || winner || (players[currentPlayerIndex]?.isAI) ? 'opacity-30' : 'cursor-pointer hover:bg-white/10 hover:border-emerald-500/30'}
            `}
            onClick={() => !players[currentPlayerIndex]?.isAI && rollDice()}
            >
              {isRolling ? (
                <div className="grid grid-cols-2 gap-1 opacity-20">
                  <div className="w-1 h-1 bg-white rounded-full" />
                  <div className="w-1 h-1 bg-white rounded-full" />
                  <div className="w-1 h-1 bg-white rounded-full" />
                  <div className="w-1 h-1 bg-white rounded-full" />
                </div>
              ) : (
                <span className={diceValue ? 'text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'text-white/10'}>
                  {diceValue || '?'}
                </span>
              )}
            </div>
            
            {!players[currentPlayerIndex]?.isAI && gameStarted && !winner && !isMoving && !isRolling && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="absolute -top-2 -right-2 lg:-top-4 lg:-right-4 bg-emerald-500 text-black px-2 py-0.5 lg:px-3 lg:py-1 rounded-full text-[8px] lg:text-[10px] font-black uppercase tracking-tighter shadow-lg">
                Your Turn
              </motion.div>
            )}
          </div>

          <div className="flex flex-row lg:flex-col gap-4">
            <button 
              disabled={isRolling || isMoving || winner || !gameStarted || (players[currentPlayerIndex]?.isAI)}
              onClick={rollDice}
              className={`w-16 h-16 md:w-20 md:h-20 lg:w-32 lg:h-12 lg:rounded-full rounded-2xl font-black uppercase tracking-[0.1em] lg:tracking-[0.2em] text-[10px] lg:text-xs transition-all flex items-center justify-center
                ${!gameStarted || winner || players[currentPlayerIndex]?.isAI ? 'bg-white/5 text-white/20' : 'bg-emerald-500 text-black shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95'}
              `}
            >
              Roll
            </button>
            {!gameStarted && (
              <button 
                onClick={() => setGameStarted(true)} 
                className="w-16 h-16 md:w-20 md:h-20 lg:w-32 lg:h-12 lg:rounded-full rounded-2xl bg-emerald-500 text-black font-black uppercase tracking-[0.1em] lg:tracking-[0.2em] text-[10px] shadow-lg flex items-center justify-center hover:scale-105 active:scale-95"
              >
                Play
              </button>
            )}
            {winner && (
              <button 
                onClick={resetGame} 
                className="w-16 h-16 md:w-20 md:h-20 lg:w-32 lg:h-12 lg:rounded-full rounded-2xl bg-white/10 text-white font-black uppercase tracking-[0.1em] lg:tracking-[0.2em] text-[10px] flex items-center justify-center hover:scale-105 active:scale-95"
              >
                Reset
              </button>
            )}
          </div>
        </div>
        {/* Win Modal */}
        <AnimatePresence>
          {winner && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                className="bg-[#111] border border-white/10 p-12 rounded-[3rem] shadow-2xl flex flex-col items-center max-w-md w-full relative overflow-hidden text-center"
              >
                <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: winner.color }} />
                <Trophy className="w-20 h-20 mb-8 text-emerald-500" />
                <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-4 text-white">
                  VICTORY<span className="text-emerald-500">!</span>
                </h2>
                <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-sm mb-10">
                  <span style={{ color: winner.color }}>{winner.name}</span> reached the summit
                </p>
                
                <button
                  onClick={resetGame}
                  className="w-full py-4 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20"
                >
                  <RotateCcw className="w-5 h-5" /> Play Again
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {showHelp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[#111] border border-white/10 p-8 md:p-12 rounded-[3rem] max-w-2xl w-full relative shadow-2xl">
              <button onClick={() => setShowHelp(false)} className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors">
                <X className="w-8 h-8" />
              </button>
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-8">How to Play <span className="text-emerald-500">Snakes & Ladders</span></h2>
              <div className="space-y-6 text-white/70 text-sm md:text-base leading-relaxed">
                <p><strong className="text-white uppercase tracking-widest text-xs block mb-1">Objective</strong> Be the first player to reach the final square (100) by rolling the dice and navigating the board.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <strong className="text-white uppercase tracking-widest text-xs block mb-2">Movement</strong>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Roll the dice and move your token forward that many squares.</li>
                      <li>You must roll the <span className="text-white">exact</span> number to land on 100 and win.</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-white uppercase tracking-widest text-xs block mb-2">Board Events</strong>
                    <ul className="list-disc list-inside space-y-1">
                      <li><span className="text-white">Ladders:</span> Land at the base to climb up to a higher square.</li>
                      <li><span className="text-white">Snakes:</span> Land on the head to slide down to a lower square.</li>
                    </ul>
                  </div>
                </div>
                <p className="bg-white/5 p-4 rounded-2xl border border-white/10 italic text-xs">Strategy: There's no blocking or capturing—just pure race logic. May the odds be in your favor!</p>
              </div>
              <button onClick={() => setShowHelp(false)} className="w-full mt-10 py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-lg">Got It</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

