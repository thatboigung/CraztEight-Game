import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, User, Bot, Star, HelpCircle, X } from 'lucide-react';
import { GameMode } from '../../types';
import { recordGameResult } from '../../utils/stats';
import { getRandomName } from '../../utils/names';

interface Props {
  onBack: () => void;
  playerCount?: number;
}

type ColorName = 'red' | 'blue' | 'yellow' | 'green';

const PLAYER_COLORS: ColorName[] = ['red', 'blue', 'yellow', 'green'];

const COLOR_CONFIG = {
  red:    { bg: '#ef4444', light: '#fca5a5', dark: '#991b1b', glow: 'rgba(239,68,68,0.5)' },
  blue:   { bg: '#3b82f6', light: '#93c5fd', dark: '#1e3a8a', glow: 'rgba(59,130,246,0.5)' },
  yellow: { bg: '#eab308', light: '#fde047', dark: '#854d0e', glow: 'rgba(234,179,8,0.5)' },
  green:  { bg: '#22c55e', light: '#86efac', dark: '#166534', glow: 'rgba(34,197,94,0.5)' },
};

// 52-cell main track as [row, col] on a 15x15 grid
const MAIN_TRACK: [number, number][] = [
  [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],
  [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
  [0,7],[0,8],
  [1,8],[2,8],[3,8],[4,8],[5,8],
  [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
  [7,14],[8,14],
  [8,13],[8,12],[8,11],[8,10],[8,9],
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
  [14,7],[14,6],
  [13,6],[12,6],[11,6],[10,6],[9,6],
  [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
  [7,0],
];

const PLAYER_START_INDEX = [1, 14, 27, 40]; // track index where each player enters
const SAFE_INDICES = new Set([1, 8, 14, 21, 27, 34, 40, 47]);

const HOME_COLUMNS: Record<number, [number, number][]> = {
  0: [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],   // red
  1: [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],   // blue
  2: [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],// yellow
  3: [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],// green
};

const HOME_BASES: Record<number, [number, number][]> = {
  0: [[2,2],[2,3],[3,2],[3,3]],
  1: [[2,11],[2,12],[3,11],[3,12]],
  2: [[11,11],[11,12],[12,11],[12,12]],
  3: [[11,2],[11,3],[12,2],[12,3]],
};

// Token state: 0=home, 1-51=steps on main track, 52-57=home column, 58=finished
interface GameState {
  tokens: number[][]; // tokens[playerIndex][tokenIndex] = steps
  currentPlayer: number;
  dieValue: number | null;
  dieRolled: boolean;
  rolling: boolean;
  winner: number | null;
  extraTurn: boolean;
  message: string;
  animating: boolean;
}

const getTrackPosition = (playerIndex: number, steps: number): [number, number] | null => {
  if (steps <= 0) return null;
  if (steps >= 1 && steps <= 51) {
    const trackIdx = (PLAYER_START_INDEX[playerIndex] + steps - 1) % 52;
    return MAIN_TRACK[trackIdx];
  }
  if (steps >= 52 && steps <= 57) {
    return HOME_COLUMNS[playerIndex][steps - 52];
  }
  return null; // finished
};

const canCapture = (playerIndex: number, steps: number): boolean => {
  if (steps < 1 || steps > 51) return false;
  const trackIdx = (PLAYER_START_INDEX[playerIndex] + steps - 1) % 52;
  return !SAFE_INDICES.has(trackIdx);
};

// Build the board cell map
const buildBoardMap = () => {
  const map: Record<string, { type: string; color?: ColorName; trackIdx?: number; homeCol?: [number, number]; homeSlot?: [number, number]; isSafe?: boolean }> = {};

  // Path cells
  MAIN_TRACK.forEach((pos, idx) => {
    const key = `${pos[0]},${pos[1]}`;
    let color: ColorName | undefined;
    if (SAFE_INDICES.has(idx)) {
      // Determine color for start squares
      const startPlayerIdx = PLAYER_START_INDEX.indexOf(idx);
      if (startPlayerIdx >= 0) color = PLAYER_COLORS[startPlayerIdx];
    }
    map[key] = { type: 'path', trackIdx: idx, color, isSafe: SAFE_INDICES.has(idx) };
  });

  // Home columns
  for (let p = 0; p < 4; p++) {
    HOME_COLUMNS[p].forEach((pos) => {
      const key = `${pos[0]},${pos[1]}`;
      map[key] = { type: 'homeColumn', color: PLAYER_COLORS[p] };
    });
  }

  // Home bases
  for (let p = 0; p < 4; p++) {
    HOME_BASES[p].forEach((pos) => {
      const key = `${pos[0]},${pos[1]}`;
      map[key] = { type: 'homeBase', color: PLAYER_COLORS[p] };
    });
  }

  // Center
  map['7,7'] = { type: 'center' };

  return map;
};

const BOARD_MAP = buildBoardMap();

const isHomeArea = (r: number, c: number): ColorName | null => {
  if (r < 6 && c < 6) return 'red';
  if (r < 6 && c > 8) return 'blue';
  if (r > 8 && c > 8) return 'yellow';
  if (r > 8 && c < 6) return 'green';
  return null;
};

const DieIcon: React.FC<{ value: number; size?: number }> = ({ value, size = 40 }) => {
  const props = { width: size, height: size, strokeWidth: 1.5 };
  switch (value) {
    case 1: return <Dice1 {...props} />;
    case 2: return <Dice2 {...props} />;
    case 3: return <Dice3 {...props} />;
    case 4: return <Dice4 {...props} />;
    case 5: return <Dice5 {...props} />;
    case 6: return <Dice6 {...props} />;
    default: return <Dice1 {...props} />;
  }
};

interface PlayerConfig {
  name: string;
  isAI: boolean;
  color: ColorName;
}

interface GameSetup {
  players: PlayerConfig[];
}

export const Ludo: React.FC<Props> = ({ onBack }) => {
  const [showHelp, setShowHelp] = useState(false);
  const [setup, setSetup] = useState<GameSetup | null>(null);
  const [tempSetup, setTempSetup] = useState<PlayerConfig[]>([
    { name: 'You', isAI: false, color: 'red' },
    { name: getRandomName(), isAI: true, color: 'blue' },
    { name: getRandomName(), isAI: true, color: 'yellow' },
    { name: getRandomName(), isAI: true, color: 'green' },
  ]);
  const [activeCount, setActiveCount] = useState(2);

  if (!setup) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto">
        <div className="absolute inset-0 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} 
          className="w-full max-w-2xl bg-[#0a0a0a] rounded-[3rem] md:rounded-[4rem] border border-white/5 shadow-2xl overflow-hidden relative z-10 my-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
          
          <div className="p-8 md:p-16">
            <header className="mb-10 flex justify-between items-start">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mb-2">Configuration</div>
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter italic uppercase leading-none">
                  Ludo<br /><span className="text-blue-500">Setup.</span>
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
                      className={`relative group p-6 rounded-3xl border transition-all duration-500 ${activeCount === n ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white/[0.02] border-white/5 text-white/40 hover:border-white/20'}`}>
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
                        <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]" style={{ backgroundColor: COLOR_CONFIG[p.color].bg }} />
                        <span className="text-white font-black uppercase tracking-widest text-[10px]">{p.isAI ? 'CPU' : 'P'}{i+1}</span>
                      </div>
                      <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5">
                        <button onClick={() => {
                          const ns = [...tempSetup];
                          ns[i].isAI = false;
                          setTempSetup(ns);
                        }} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${!p.isAI ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}>Human</button>
                        <button onClick={() => {
                          const ns = [...tempSetup];
                          ns[i].isAI = true;
                          setTempSetup(ns);
                        }} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${p.isAI ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}>AI</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => setSetup({ players: tempSetup.slice(0, activeCount) })}
                className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group">
                START SESSION
                <Play className="w-6 h-6 fill-current group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const numPlayers = setup.players.length;
  const names = setup.players.map(p => p.name);
  const activePlayers = setup.players.map(p => p.color);

  const [sessionScore, setSessionScore] = useState<number[]>(() => setup.players.map(() => 0));

  const initGameState = useCallback((): GameState => ({
    tokens: setup.players.map(() => [0, 0, 0, 0]),
    currentPlayer: 0,
    dieValue: null,
    dieRolled: false,
    rolling: false,
    winner: null,
    extraTurn: false,
    message: `${names[0]}'s turn. Roll the die!`,
    animating: false,
  }), [setup.players, names]);

  const [game, setGame] = useState<GameState>(initGameState);

  const rollDie = useCallback(() => {
    if (game.dieRolled || game.rolling || game.winner !== null) return;
    setGame(g => ({ ...g, rolling: true, message: 'Rolling...' }));
    setTimeout(() => {
      const value = Math.floor(Math.random() * 6) + 1;
      setGame(g => {
        const validMoves = getValidMoves(g.tokens[g.currentPlayer], g.currentPlayer, value);
        let msg = `${names[g.currentPlayer]} rolled a ${value}!`;
        if (validMoves.length === 0) {
          msg += ' No valid moves.';
        }
        return { ...g, dieValue: value, dieRolled: true, rolling: false, message: msg };
      });
    }, 600);
  }, [game.dieRolled, game.rolling, game.winner, game.currentPlayer, game.tokens, names]);

  const getValidMoves = (playerTokens: number[], playerIdx: number, die: number): number[] => {
    const moves: number[] = [];
    for (let t = 0; t < 4; t++) {
      const pos = playerTokens[t];
      if (pos === 0 && die === 6) { moves.push(t); continue; }
      if (pos === 0 || pos >= 58) continue;
      const newPos = pos + die;
      if (newPos <= 58) moves.push(t);
    }
    return moves;
  };

  const getNextPlayer = (current: number): number => {
    return (current + 1) % numPlayers;
  };

  const checkGameOver = useCallback((b: number[][], player: number) => {
    const finished = b[player].every(t => t >= 58);
    if (finished) {
      return true;
    }
    return false;
  }, []);

  const moveToken = useCallback((tokenIdx: number) => {
    if (!game.dieRolled || game.winner !== null || game.dieValue === null || game.animating) return;
    const cp = game.currentPlayer;
    const startPos = game.tokens[cp][tokenIdx];
    const die = game.dieValue;

    if (startPos === 0 && die !== 6) return;
    if (startPos >= 58) return;
    const targetPos = startPos === 0 ? 1 : startPos + die;
    if (targetPos > 58) return;

    setGame(g => ({ ...g, animating: true }));

    let currentPos = startPos;
    const step = () => {
      if (currentPos === 0) currentPos = 1;
      else currentPos++;

      setGame(g => {
        const newTokens = g.tokens.map(arr => [...arr]);
        newTokens[cp][tokenIdx] = currentPos;
        return { ...g, tokens: newTokens };
      });

      if (currentPos < targetPos) {
        setTimeout(step, 200);
      } else {
        setTimeout(() => {
          setGame(g => {
            const newTokens = g.tokens.map(arr => [...arr]);
            let msg = '';
            let captured = false;

            if (targetPos >= 1 && targetPos <= 51 && canCapture(cp, targetPos)) {
              const targetCoords = getTrackPosition(cp, targetPos);
              if (targetCoords) {
                for (let p = 0; p < numPlayers; p++) {
                  if (p === cp) continue;
                  for (let t = 0; t < 4; t++) {
                    if (newTokens[p][t] >= 1 && newTokens[p][t] <= 51) {
                      const otherCoords = getTrackPosition(p, newTokens[p][t]);
                      if (otherCoords && otherCoords[0] === targetCoords[0] && otherCoords[1] === targetCoords[1]) {
                        newTokens[p][t] = 0;
                        captured = true;
                        msg = `${names[cp]} captured ${names[p]}'s token! `;
                      }
                    }
                  }
                }
              }
            }

            if (checkGameOver(newTokens, cp)) {
              msg += `${names[cp]} wins!`;
              recordGameResult(GameMode.LUDO, !setup.players[cp].isAI);
              return { ...g, tokens: newTokens, winner: cp, message: msg, dieRolled: false, animating: false };
            }

            const extra = die === 6 || captured;
            if (extra) msg += `${names[cp]} gets another turn!`;

            const nextPlayer = extra ? cp : getNextPlayer(cp);
            return {
              ...g,
              tokens: newTokens,
              currentPlayer: nextPlayer,
              dieValue: null,
              dieRolled: false,
              extraTurn: extra,
              animating: false,
              message: msg || `${names[nextPlayer]}'s turn.`,
            };
          });
        }, 300);
      }
    };
    step();
  }, [game, names, numPlayers, checkGameOver, getNextPlayer, setup.players]);

  const getNextPlayer = (current: number): number => {
    return (current + 1) % numPlayers;
  };

  // AI turn
  useEffect(() => {
    if (!setup.players[game.currentPlayer].isAI || game.winner !== null || game.animating) return;
    if (!game.dieRolled && !game.rolling) {
      const t = setTimeout(() => rollDie(), 800);
      return () => clearTimeout(t);
    }
    if (game.dieRolled && game.dieValue !== null) {
      const t = setTimeout(() => {
        const cp = game.currentPlayer;
        const valid = getValidMoves(game.tokens[cp], cp, game.dieValue!);
        if (valid.length === 0) {
          // Pass
          setGame(g => {
            const next = getNextPlayer(g.currentPlayer);
            return { ...g, currentPlayer: next, dieValue: null, dieRolled: false, message: `${names[next]}'s turn.` };
          });
          return;
        }
        // Very smart AI heuristic
        let best = valid[0];
        let bestScore = -Infinity;

        for (const t of valid) {
          let score = 0;
          const pos = game.tokens[cp][t];
          const newPos = pos === 0 ? 1 : pos + game.dieValue!;
          
          // Base progress
          score += newPos;

          // 1. Getting out of base
          if (pos === 0) score += 40;

          // 2. Finishing is a high priority
          if (newPos === 58) score += 500;

          // 3. Capturing an opponent
          let capturedValue = 0;
          if (newPos >= 1 && newPos <= 51 && canCapture(cp, newPos)) {
            const targetPos = getTrackPosition(cp, newPos);
            if (targetPos) {
              for (let p = 0; p < numPlayers; p++) {
                if (p === cp) continue;
                for (let ti = 0; ti < 4; ti++) {
                  const oppPos = game.tokens[p][ti];
                  if (oppPos >= 1 && oppPos <= 51) {
                    const op = getTrackPosition(p, oppPos);
                    if (op && op[0] === targetPos[0] && op[1] === targetPos[1]) {
                      capturedValue = Math.max(capturedValue, oppPos);
                    }
                  }
                }
              }
            }
          }
          if (capturedValue > 0) {
            score += 200 + (capturedValue * 2);
          }

          // 4. Safety analysis
          const checkDanger = (testPos: number) => {
            if (testPos < 1 || testPos > 51) return 0;
            const myTrackIdx = (PLAYER_START_INDEX[cp] + testPos - 1) % 52;
            if (SAFE_INDICES.has(myTrackIdx)) return 0;
            let maxDanger = 0;
            for (let p = 0; p < numPlayers; p++) {
              if (p === cp) continue;
              for (let ti = 0; ti < 4; ti++) {
                const oppPos = game.tokens[p][ti];
                if (oppPos >= 1 && oppPos <= 51) {
                  const oppTrackIdx = (PLAYER_START_INDEX[p] + oppPos - 1) % 52;
                  const dist = (myTrackIdx - oppTrackIdx + 52) % 52;
                  if (dist >= 1 && dist <= 6 && oppPos + dist <= 51) {
                    maxDanger = Math.max(maxDanger, testPos);
                  }
                }
              }
            }
            return maxDanger;
          };

          const currentDanger = pos > 0 ? checkDanger(pos) : 0;
          const newDanger = checkDanger(newPos);

          if (currentDanger > 0) score += 150 + currentDanger * 2;
          if (newDanger > 0) score -= 150 + newDanger * 2;

          // 5. Landing on a safe square
          if (newPos >= 1 && newPos <= 51) {
            const myTrackIdx = (PLAYER_START_INDEX[cp] + newPos - 1) % 52;
            if (SAFE_INDICES.has(myTrackIdx)) {
              score += 20;
            }
          }

          // 6. Entering home stretch
          if (pos <= 51 && newPos >= 52 && newPos <= 57) {
            score += 40;
          }

          if (score > bestScore) {
            bestScore = score;
            best = t;
          }
        }
        moveToken(best);
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [game.currentPlayer, game.dieRolled, game.rolling, game.winner, game.dieValue, game.animating]);

  // Auto-pass when no valid moves for human
  useEffect(() => {
    const cp = game.currentPlayer;
    if (setup.players[cp].isAI || !game.dieRolled || game.dieValue === null || game.winner !== null || game.animating) return;
    const valid = getValidMoves(game.tokens[cp], cp, game.dieValue);
    if (valid.length === 0) {
      const t = setTimeout(() => {
        setGame(g => {
          const next = getNextPlayer(cp);
          return { ...g, currentPlayer: next, dieValue: null, dieRolled: false, message: `No moves. ${names[next]}'s turn.` };
        });
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [game.dieRolled, game.dieValue, game.currentPlayer, game.winner, game.tokens, game.animating, names, setup.players, getNextPlayer]);

  const resetGame = () => {
    if (game.winner !== null) {
      setSessionScore(s => {
        const ns = [...s];
        ns[game.winner!]++;
        return ns;
      });
    }
    setGame(initGameState());
  };

  // Build token position map for rendering
  const tokenPositions: Record<string, { player: number; token: number; color: ColorName }[]> = {};
  for (let p = 0; p < numPlayers; p++) {
    for (let t = 0; t < 4; t++) {
      const steps = game.tokens[p][t];
      let key: string | null = null;
      if (steps === 0) {
        const base = HOME_BASES[p][t];
        key = `${base[0]},${base[1]}`;
      } else if (steps >= 58) {
        key = '7,7'; // center
      } else {
        const pos = getTrackPosition(p, steps);
        if (pos) key = `${pos[0]},${pos[1]}`;
      }
      if (key) {
        if (!tokenPositions[key]) tokenPositions[key] = [];
        tokenPositions[key].push({ player: p, token: t, color: PLAYER_COLORS[p] });
      }
    }
  }

  const isClickableToken = (p: number, t: number) => {
    if (setup.players[p].isAI || p !== game.currentPlayer || !game.dieRolled || game.winner !== null || game.dieValue === null || game.animating) return false;
    const pos = game.tokens[p][t];
    if (pos === 0 && game.dieValue !== 6) return false;
    if (pos >= 58) return false;
    const newPos = pos === 0 ? 1 : pos + game.dieValue;
    return newPos <= 58;
  };

  const renderCell = (row: number, col: number) => {
    const key = `${row},${col}`;
    const info = BOARD_MAP[key];
    const home = isHomeArea(row, col);
    const tokens = tokenPositions[key] || [];
    const isCenter = row >= 6 && row <= 8 && col >= 6 && col <= 8;

    let bgColor = '#1a1a2e';
    let border = '1px solid rgba(255,255,255,0.05)';
    let borderRadius = '2px';

    if (info?.type === 'path') {
      bgColor = '#f0f0f0';
      if (info.color) bgColor = COLOR_CONFIG[info.color].light;
      border = '1px solid rgba(0,0,0,0.15)';
    } else if (info?.type === 'homeColumn') {
      bgColor = info.color ? COLOR_CONFIG[info.color].light : '#f0f0f0';
      border = `1px solid ${info.color ? COLOR_CONFIG[info.color].bg : '#ccc'}`;
    } else if (info?.type === 'homeBase') {
      bgColor = 'rgba(0,0,0,0.2)';
      border = `2px solid ${info.color ? COLOR_CONFIG[info.color].bg : '#333'}60`;
      borderRadius = '50%';
    } else if (isCenter) {
      bgColor = '#333';
      border = '1px solid rgba(255,255,255,0.1)';
      if (row === 7 && col === 7) { bgColor = '#555'; borderRadius = '50%'; }
    } else if (home) {
      bgColor = 'transparent';
      border = 'none';
    }

    return (
      <div
        key={key}
        style={{
          backgroundColor: bgColor,
          border,
          borderRadius,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        }}
      >
        {info?.isSafe && (
          <Star className="absolute w-5 h-5 text-black/10 md:w-6 md:h-6" fill="currentColor" />
        )}
        {tokens.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1px', position: 'absolute', zIndex: 10 }}>
            {tokens.map((tk, i) => {
              const clickable = isClickableToken(tk.player, tk.token);
              return (
                <motion.div
                  layout
                  layoutId={`token-${tk.player}-${tk.token}`}
                  key={`${tk.player}-${tk.token}`}
                  initial={{ y: 0 }}
                  animate={{ 
                    y: [0, -15, 0],
                    scale: clickable ? [1, 1.2, 1] : 1 
                  }}
                  transition={{
                    layout: { type: 'spring', bounce: 0, duration: 0.25 },
                    y: { duration: 0.25, ease: "easeInOut" },
                    ...(clickable ? { scale: { repeat: Infinity, duration: 0.8 } } : {})
                  }}
                  onClick={() => clickable && moveToken(tk.token)}
                  style={{
                    width: tokens.length > 1 ? '10px' : '18px',
                    height: tokens.length > 1 ? '10px' : '18px',
                    borderRadius: '50%',
                    backgroundColor: COLOR_CONFIG[tk.color].bg,
                    border: `2px solid ${clickable ? '#fff' : 'rgba(255,255,255,0.5)'}`,
                    cursor: clickable ? 'pointer' : 'default',
                    boxShadow: clickable ? `0 0 8px ${COLOR_CONFIG[tk.color].glow}` : 'none',
                    zIndex: clickable ? 20 : 10,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const currentColor = PLAYER_COLORS[game.currentPlayer];

  return (
    <div className="w-full h-screen bg-[#080808] flex flex-col items-center justify-center p-2 md:p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-yellow-500/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-red-500/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-4 z-50 backdrop-blur-md">
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

      {/* Scoreboard */}
      <div className="flex items-center gap-3 mb-3 z-10">
        {activePlayers.map((color, i) => (
          <div
            key={color}
            className={`flex flex-col items-center px-3 py-1.5 rounded-xl border transition-all ${
              game.currentPlayer === i ? 'bg-white/10 border-white/30 scale-105' : 'bg-white/5 border-white/5'
            }`}
          >
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: COLOR_CONFIG[color].bg }}>
              {names[i]}
            </span>
            <span className="text-lg font-black text-white">{sessionScore[i]}</span>
          </div>
        ))}
      </div>

      {/* Board */}
      <div
        className="z-10 rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(15, 1fr)',
          gridTemplateRows: 'repeat(15, 1fr)',
          width: 'min(85vw, 85vh, 520px)',
          height: 'min(85vw, 85vh, 520px)',
          gap: '0px',
          backgroundColor: '#1a1a2e',
        }}
      >
        {/* Apartment Backgrounds */}
        {PLAYER_COLORS.map((color) => {
          let positionClasses = '';
          if (color === 'red') positionClasses = 'top-0 left-0 border-r border-b rounded-tl-2xl';
          if (color === 'blue') positionClasses = 'top-0 right-0 border-l border-b rounded-tr-2xl';
          if (color === 'yellow') positionClasses = 'bottom-0 right-0 border-l border-t rounded-br-2xl';
          if (color === 'green') positionClasses = 'bottom-0 left-0 border-r border-t rounded-bl-2xl';

          return (
            <div
              key={`apt-bg-${color}`}
              className={`absolute w-[40%] h-[40%] ${positionClasses} pointer-events-none z-0`}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderColor: 'rgba(255, 255, 255, 0.05)',
              }}
            >
              <div 
                className="absolute inset-0 opacity-10"
                style={{ background: `radial-gradient(circle at center, ${COLOR_CONFIG[color].bg}, transparent 70%)` }}
              />
            </div>
          );
        })}

        {/* Grid Cells */}
        {Array.from({ length: 15 }, (_, row) =>
          Array.from({ length: 15 }, (_, col) => renderCell(row, col))
        )}

        {/* Player Icons in Corners */}
        {activePlayers.map((color, i) => {
          const isMe = i === 0;
          const Icon = isMe ? User : Bot;
          
          let positionClasses = '';
          if (color === 'red') positionClasses = 'top-3 left-3 md:top-4 md:left-4';
          if (color === 'blue') positionClasses = 'top-3 right-3 md:top-4 md:right-4';
          if (color === 'yellow') positionClasses = 'bottom-3 right-3 md:bottom-4 md:right-4';
          if (color === 'green') positionClasses = 'bottom-3 left-3 md:bottom-4 md:left-4';

          return (
            <div
              key={`icon-${color}`}
              className={`absolute ${positionClasses} flex flex-col items-center justify-center pointer-events-none z-20`}
            >
              <div
                className="p-1.5 md:p-2 rounded-full transition-all duration-300"
                style={{
                   backgroundColor: 'rgba(0,0,0,0.5)',
                   border: `2px solid ${COLOR_CONFIG[color].bg}`,
                   boxShadow: game.currentPlayer === i ? `0 0 20px ${COLOR_CONFIG[color].glow}` : 'none',
                   transform: game.currentPlayer === i ? 'scale(1.1)' : 'scale(1)'
                }}
              >
                <Icon className="w-5 h-5 md:w-6 md:h-6" style={{ color: COLOR_CONFIG[color].bg }} />
              </div>
              <span 
                className="mt-1 text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm"
                style={{ color: COLOR_CONFIG[color].light }}
              >
                {names[i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-3 mt-4 z-10 min-h-[100px]">
        <div className="text-xs font-bold text-white/50 tracking-wide max-w-[200px] text-center h-4">
          {game.message}
        </div>

        <div className="flex items-center justify-center gap-6 h-16 w-full relative">
          {/* Always show dice */}
          <div
            className="flex items-center justify-center p-3 rounded-xl border transition-all"
            style={{
              borderColor: COLOR_CONFIG[currentColor].bg,
              color: COLOR_CONFIG[currentColor].bg,
              boxShadow: game.rolling || (game.dieRolled && game.currentPlayer === 0) 
                ? `0 0 15px ${COLOR_CONFIG[currentColor].glow}` 
                : 'none',
              backgroundColor: 'rgba(0,0,0,0.3)',
            }}
          >
            {game.rolling ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.3 }}>
                <DieIcon value={1} size={32} />
              </motion.div>
            ) : (
              <DieIcon value={game.dieValue || 6} size={32} />
            )}
          </div>

          {/* Roll Button */}
          {!setup.players[game.currentPlayer].isAI && !game.dieRolled && game.winner === null && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={rollDie}
              disabled={game.rolling}
              className="px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-sm transition-all"
              style={{
                backgroundColor: COLOR_CONFIG[currentColor].bg,
                color: '#000',
                boxShadow: `0 0 20px ${COLOR_CONFIG[currentColor].glow}`,
              }}
            >
              Roll
            </motion.button>
          )}
        </div>
      </div>

      {/* Win Popup */}
      <AnimatePresence>
        {game.winner !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              className="bg-[#111] border border-white/10 p-8 md:p-12 rounded-[2rem] shadow-2xl flex flex-col items-center max-w-sm w-full relative overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ background: `radial-gradient(circle, ${COLOR_CONFIG[PLAYER_COLORS[game.winner]].glow}, transparent)` }}
              />
              <div className="text-6xl mb-4 z-10">🏆</div>
              <div className="text-3xl md:text-4xl font-black uppercase tracking-widest text-center mb-2 z-10" style={{ color: COLOR_CONFIG[PLAYER_COLORS[game.winner]].bg }}>
                {names[game.winner]}
              </div>
              <div className="text-xl font-bold text-white/50 mb-8 z-10">Wins the game!</div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetGame}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black rounded-xl font-black tracking-widest uppercase flex items-center justify-center w-full gap-3 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] z-10"
              >
                <RotateCcw className="w-5 h-5" /> Play Again
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showHelp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[#111] border border-white/10 p-8 md:p-12 rounded-[3rem] max-w-2xl w-full relative shadow-2xl">
              <button onClick={() => setShowHelp(false)} className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors">
                <X className="w-8 h-8" />
              </button>
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-8">How to Play <span className="text-blue-500">Ludo</span></h2>
              <div className="space-y-6 text-white/70 text-sm md:text-base leading-relaxed">
                <p><strong className="text-white uppercase tracking-widest text-xs block mb-1">Objective</strong> Be the first player to move all 4 of your tokens into the home triangle (center) of the board.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <strong className="text-white uppercase tracking-widest text-xs block mb-2">Starting</strong>
                    <ul className="list-disc list-inside space-y-1">
                      <li>You must roll a <span className="text-white">6</span> to move a token from your base to the start.</li>
                      <li>Rolling a 6 grants you an extra turn.</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-white uppercase tracking-widest text-xs block mb-2">Gameplay</strong>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Move tokens clockwise around the main track.</li>
                      <li>Capture enemy tokens by landing on the same square (except safe squares).</li>
                      <li>Captured tokens return to their base.</li>
                    </ul>
                  </div>
                </div>
                <p className="bg-white/5 p-4 rounded-2xl border border-white/10 italic text-xs">Safe Squares: Squares marked with a Star are safe zones. Tokens on these squares cannot be captured.</p>
              </div>
              <button onClick={() => setShowHelp(false)} className="w-full mt-10 py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-lg">Got It</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
