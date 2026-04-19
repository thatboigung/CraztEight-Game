import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, HelpCircle, X, Crown, User, Bot } from 'lucide-react';
import { GameMode } from '../../types';
import { recordGameResult } from '../../utils/stats';
import { getRandomName } from '../../utils/names';

interface Props {
  onBack: () => void;
  playerCount?: number;
}

// 0 = empty, 1 = red, 2 = black, 3 = red king, 4 = black king
type Piece = 0 | 1 | 2 | 3 | 4;
type Board = Piece[][];

interface Move {
  from: [number, number];
  to: [number, number];
  captures: [number, number][];
  isJump: boolean;
}

const BOARD_SIZE = 8;

const isRed = (p: Piece) => p === 1 || p === 3;
const isBlack = (p: Piece) => p === 2 || p === 4;
const isKing = (p: Piece) => p === 3 || p === 4;
const isPlayerPiece = (p: Piece, player: number) => player === 1 ? isRed(p) : isBlack(p);

const createInitialBoard = (): Board => {
  const board: Board = Array.from({ length: 8 }, () => Array(8).fill(0));
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) board[r][c] = 2; // black on top
    }
  }
  for (let r = 5; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) board[r][c] = 1; // red on bottom
    }
  }
  return board;
};

const cloneBoard = (b: Board): Board => b.map(row => [...row]);

const getJumps = (board: Board, r: number, c: number, piece: Piece): Move[] => {
  const moves: Move[] = [];
  const dirs: [number, number][] = [];
  if (isRed(piece) || isKing(piece)) dirs.push([-1, -1], [-1, 1]); // up
  if (isBlack(piece) || isKing(piece)) dirs.push([1, -1], [1, 1]); // down

  for (const [dr, dc] of dirs) {
    const mr = r + dr, mc = c + dc;
    const lr = r + 2 * dr, lc = c + 2 * dc;
    if (lr < 0 || lr >= 8 || lc < 0 || lc >= 8) continue;
    const mid = board[mr][mc];
    if (mid === 0) continue;
    if ((isRed(piece) && isBlack(mid)) || (isBlack(piece) && isRed(mid))) {
      if (board[lr][lc] === 0) {
        moves.push({ from: [r, c], to: [lr, lc], captures: [[mr, mc]], isJump: true });
      }
    }
  }
  return moves;
};

const getMultiJumps = (board: Board, r: number, c: number, piece: Piece): Move[] => {
  const results: Move[] = [];

  const dfs = (b: Board, row: number, col: number, p: Piece, capturesSoFar: [number, number][]) => {
    const jumps = getJumps(b, row, col, p);
    if (jumps.length === 0 && capturesSoFar.length > 0) {
      results.push({ from: [r, c], to: [row, col], captures: [...capturesSoFar], isJump: true });
      return;
    }
    for (const j of jumps) {
      const nb = cloneBoard(b);
      nb[row][col] = 0;
      nb[j.captures[0][0]][j.captures[0][1]] = 0;
      let np = p;
      if (isRed(p) && j.to[0] === 0) np = 3;
      if (isBlack(p) && j.to[0] === 7) np = 4;
      nb[j.to[0]][j.to[1]] = np;
      dfs(nb, j.to[0], j.to[1], np, [...capturesSoFar, ...j.captures]);
    }
  };

  dfs(board, r, c, piece, []);
  return results;
};

const getSimpleMoves = (board: Board, r: number, c: number, piece: Piece): Move[] => {
  const moves: Move[] = [];
  const dirs: [number, number][] = [];
  if (isRed(piece) || isKing(piece)) dirs.push([-1, -1], [-1, 1]);
  if (isBlack(piece) || isKing(piece)) dirs.push([1, -1], [1, 1]);

  for (const [dr, dc] of dirs) {
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) continue;
    if (board[nr][nc] === 0) {
      moves.push({ from: [r, c], to: [nr, nc], captures: [], isJump: false });
    }
  }
  return moves;
};

const getAllMoves = (board: Board, player: number): Move[] => {
  let allJumps: Move[] = [];
  let allSimple: Move[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!isPlayerPiece(p, player)) continue;
      const jumps = getMultiJumps(board, r, c, p);
      allJumps.push(...jumps);
      const simple = getSimpleMoves(board, r, c, p);
      allSimple.push(...simple);
    }
  }

  // Forced capture: if jumps exist, must jump
  if (allJumps.length > 0) return allJumps;
  return allSimple;
};

const applyMove = (board: Board, move: Move, player: number): Board => {
  const nb = cloneBoard(board);
  let piece = nb[move.from[0]][move.from[1]];
  nb[move.from[0]][move.from[1]] = 0;
  for (const [cr, cc] of move.captures) {
    nb[cr][cc] = 0;
  }
  // King promotion
  if (isRed(piece) && move.to[0] === 0) piece = 3;
  if (isBlack(piece) && move.to[0] === 7) piece = 4;
  nb[move.to[0]][move.to[1]] = piece;
  return nb;
};

// --- AI Evaluation ---
const evaluateBoard = (board: Board): number => {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p === 0) continue;

      // Material
      if (p === 1) score -= 100;
      if (p === 3) score -= 180;
      if (p === 2) score += 100;
      if (p === 4) score += 180;

      // Positional: center control
      const centerBonus = (3.5 - Math.abs(c - 3.5)) * 3;
      if (isBlack(p)) score += centerBonus;
      else score -= centerBonus;

      // Advancement (non-kings)
      if (p === 2) score += r * 5; // black advances down
      if (p === 1) score += (7 - r) * 5; // red advances up

      // Back row defense bonus
      if (p === 2 && r === 0) score += 8;
      if (p === 1 && r === 7) score -= 8;

      // King mobility
      if (isKing(p)) {
        const moves = getSimpleMoves(board, r, c, p);
        const jumps = getJumps(board, r, c, p);
        const mobility = moves.length + jumps.length * 2;
        if (isBlack(p)) score += mobility * 3;
        else score -= mobility * 3;
      }
    }
  }
  return score;
};

const minimax = (board: Board, depth: number, alpha: number, beta: number, maximizing: boolean): number => {
  const player = maximizing ? 2 : 1;
  const moves = getAllMoves(board, player);

  if (moves.length === 0) {
    return maximizing ? -10000 : 10000;
  }
  if (depth === 0) {
    return evaluateBoard(board);
  }

  if (maximizing) {
    let best = -Infinity;
    for (const m of moves) {
      const nb = applyMove(board, m, player);
      const val = minimax(nb, depth - 1, alpha, beta, false);
      best = Math.max(best, val);
      alpha = Math.max(alpha, val);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      const nb = applyMove(board, m, player);
      const val = minimax(nb, depth - 1, alpha, beta, true);
      best = Math.min(best, val);
      beta = Math.min(beta, val);
      if (beta <= alpha) break;
    }
    return best;
  }
};

interface GameSetup {
  userColor: 1 | 2; // 1=red, 2=black
  difficulty: number;
  vsAI: boolean;
}

export const Checkers: React.FC<Props> = ({ onBack }) => {
  const [setup, setSetup] = useState<GameSetup | null>(null);
  const [board, setBoard] = useState<Board>(createInitialBoard);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1); // 1 = red, 2 = black
  const [winner, setWinner] = useState<string | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [sessionScore, setSessionScore] = useState({ player: 0, ai: 0 });
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [aiName] = useState(() => getRandomName());

  const getDifficultyDepth = (level: number) => {
    switch(level) {
      case 1: return 2;
      case 2: return 3;
      case 3: return 4;
      case 4: return 5;
      case 5: return 6;
      default: return 4;
    }
  };

  const getThinkingTime = (level: number) => {
    switch(level) {
      case 1: return 1500;
      case 2: return 2500;
      case 3: return 4000;
      case 4: return 6000;
      case 5: return 8000;
      default: return 3000;
    }
  };

  const getDifficultyName = (level: number) => {
    switch(level) {
      case 1: return 'Amateur';
      case 2: return 'Beginner';
      case 3: return 'Pro';
      case 4: return 'Legendary';
      case 5: return 'Worldclass';
      default: return 'Pro';
    }
  };

  const countPieces = (b: Board) => {
    let red = 0, black = 0;
    for (const row of b) for (const p of row) {
      if (isRed(p)) red++;
      if (isBlack(p)) black++;
    }
    return { red, black };
  };

  const checkGameOver = useCallback((b: Board, player: number) => {
    const moves = getAllMoves(b, player);
    if (moves.length === 0) {
      const { red, black } = countPieces(b);
      if (red === 0 || player === 1) {
        setWinner(aiName);
        setSessionScore(s => ({ ...s, ai: s.ai + 1 }));
        recordGameResult(GameMode.CHECKERS, false);
      } else if (black === 0 || player === 2) {
        setWinner('You');
        setSessionScore(s => ({ ...s, player: s.player + 1 }));
        recordGameResult(GameMode.CHECKERS, true);
      }
      return true;
    }
    return false;
  }, [aiName]);

  const handleCellClick = useCallback((r: number, c: number) => {
    if (!setup || winner || aiThinking) return;
    const isPlayerTurn = setup.vsAI ? (currentPlayer === setup.userColor) : true;
    if (!isPlayerTurn) return;

    const piece = board[r][c];
    const activePlayer = setup.vsAI ? setup.userColor : currentPlayer;
    const allPlayerMoves = getAllMoves(board, activePlayer);

    if (isPlayerPiece(piece, activePlayer)) {
      const pieceMoves = allPlayerMoves.filter(m => m.from[0] === r && m.from[1] === c);
      if (pieceMoves.length > 0) {
        setSelected([r, c]);
        setValidMoves(pieceMoves);
      }
      return;
    }

    if (selected) {
      const move = validMoves.find(m => m.to[0] === r && m.to[1] === c);
      if (move) {
        const newBoard = applyMove(board, move, setup.userColor);
        setBoard(newBoard);
        setSelected(null);
        setValidMoves([]);
        setLastMove(move);
        const nextPlayer = setup.userColor === 1 ? 2 : 1;
        if (!checkGameOver(newBoard, nextPlayer)) {
          setCurrentPlayer(nextPlayer);
        }
      } else {
        setSelected(null);
        setValidMoves([]);
      }
    }
  }, [board, selected, validMoves, currentPlayer, winner, aiThinking, checkGameOver, setup]);

  useEffect(() => {
    if (!setup || !setup.vsAI || winner) return;
    const isAiTurn = currentPlayer !== setup.userColor;
    if (!isAiTurn) return;
    
    setAiThinking(true);
    const timer = setTimeout(() => {
      const moves = getAllMoves(board, currentPlayer);
      if (moves.length === 0) {
        setWinner('You');
        setSessionScore(s => ({ ...s, player: s.player + 1 }));
        recordGameResult(GameMode.CHECKERS, true);
        setAiThinking(false);
        return;
      }

      const depth = getDifficultyDepth(setup.difficulty);
      let bestScore = currentPlayer === 2 ? -Infinity : Infinity;
      let bestMoves: Move[] = [];

      for (const m of moves) {
        const nb = applyMove(board, m, currentPlayer);
        const score = minimax(nb, depth, -Infinity, Infinity, currentPlayer === 1);
        if (currentPlayer === 2) {
          if (score > bestScore) { bestScore = score; bestMoves = [m]; }
          else if (score === bestScore) bestMoves.push(m);
        } else {
          if (score < bestScore) { bestScore = score; bestMoves = [m]; }
          else if (score === bestScore) bestMoves.push(m);
        }
      }
      const move = bestMoves[Math.floor(Math.random() * bestMoves.length)];

      const newBoard = applyMove(board, move, currentPlayer);
      setBoard(newBoard);
      setLastMove(move);
      setAiThinking(false);

      const nextPlayer = currentPlayer === 1 ? 2 : 1;
      if (!checkGameOver(newBoard, nextPlayer)) {
        setCurrentPlayer(nextPlayer);
      }
    }, getThinkingTime(setup.difficulty));

    return () => clearTimeout(timer);
  }, [currentPlayer, winner, board, checkGameOver, setup]);

  const resetGame = () => {
    setBoard(createInitialBoard());
    setSelected(null);
    setValidMoves([]);
    setCurrentPlayer(1);
    setWinner(null);
    setLastMove(null);
    setAiThinking(false);
    setSetup(null);
  };

  const [showHelp, setShowHelp] = useState(false);
  const { red: redCount, black: blackCount } = countPieces(board);
  const validTargets = new Set(validMoves.map(m => `${m.to[0]},${m.to[1]}`));

  const [tempSetup, setTempSetup] = useState<GameSetup>({
    userColor: 1,
    difficulty: 4,
    vsAI: true
  });

  if (!setup) {
    return (
      <div className="w-full h-screen bg-[#080808] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-red-500/5 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-amber-500/5 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="absolute top-8 left-8 flex items-center gap-4 z-50">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onBack}
            className="p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors backdrop-blur-md">
            <ArrowLeft className="w-6 h-6" />
          </motion.button>
        </div>

        <div className="absolute top-8 right-8 z-50">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowHelp(true)}
            className="p-3 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white transition-colors backdrop-blur-md">
            <HelpCircle className="w-6 h-6" />
          </motion.button>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="z-10 bg-white/5 border border-white/10 p-8 md:p-12 rounded-[2.5rem] backdrop-blur-xl w-full max-w-lg shadow-2xl">
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-8 text-center">
            Checkers <span className="text-red-500">Setup</span>
          </h1>

          <div className="space-y-6">
            <div>
              <label className="text-xs font-black uppercase tracking-[0.3em] text-white/30 block mb-4">Game Mode</label>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setTempSetup(s => ({...s, vsAI: true}))} 
                  className={`p-4 rounded-2xl font-black uppercase tracking-widest transition-all ${tempSetup.vsAI ? 'bg-red-600 text-white shadow-lg' : 'bg-white/5 text-white/40'}`}
                >
                  Vs AI
                </button>
                <button 
                  onClick={() => setTempSetup(s => ({...s, vsAI: false}))} 
                  className={`p-4 rounded-2xl font-black uppercase tracking-widest transition-all ${!tempSetup.vsAI ? 'bg-red-600 text-white shadow-lg' : 'bg-white/5 text-white/40'}`}
                >
                  Vs Human
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-[0.3em] text-white/30 block mb-4">Choose Your Team</label>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setTempSetup(s => ({...s, userColor: 1}))} 
                  className={`p-6 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all ${tempSetup.userColor === 1 ? 'bg-red-600 text-white ring-4 ring-red-500/30' : 'bg-white/5 text-white/40'}`}
                >
                  Red
                </button>
                <button 
                  onClick={() => setTempSetup(s => ({...s, userColor: 2}))} 
                  className={`p-6 rounded-2xl font-black uppercase tracking-widest border border-white/10 hover:scale-105 transition-all ${tempSetup.userColor === 2 ? 'bg-[#111] text-white ring-4 ring-red-500/30' : 'bg-white/5 text-white/40'}`}
                >
                  Black
                </button>
              </div>
            </div>

            <button 
              onClick={() => setSetup(tempSetup)}
              className="w-full py-5 bg-gradient-to-r from-red-600 to-amber-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-red-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
            >
              Start Game
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-[#080808] flex flex-col items-center justify-center p-2 md:p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-amber-500/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-red-500/5 blur-[150px] rounded-full pointer-events-none" />

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onBack}
        className="absolute top-4 left-4 md:top-8 md:left-8 p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors z-50 flex items-center gap-2 backdrop-blur-md"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-xs font-bold tracking-widest uppercase pr-1 hidden md:block">Menu</span>
      </motion.button>

      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-3xl md:text-5xl font-black italic tracking-tighter text-white uppercase mb-1 z-10"
      >
        Check<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">ers</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-4 z-10">
        Grandmaster Edition
      </motion.div>

      <div className="flex items-center gap-4 mb-4 z-10">
        <div className={`flex flex-col items-center px-4 py-2 rounded-xl border transition-all ${currentPlayer === setup.userColor && !winner ? 'bg-red-500/10 border-red-500/30 scale-105' : 'bg-white/5 border-white/5'}`}>
          <User className="w-4 h-4 text-red-400 mb-1" />
          <span className="text-[9px] font-black uppercase tracking-widest text-red-400">You</span>
          <span className="text-xl font-black text-white">{sessionScore.player}</span>
          <span className="text-[8px] text-white/30">{currentPlayer === 1 ? redCount : blackCount} pcs</span>
        </div>
        <span className="text-white/20 text-xs font-black">VS</span>
        <div className={`flex flex-col items-center px-4 py-2 rounded-xl border transition-all ${currentPlayer !== setup.userColor && !winner ? 'bg-gray-500/10 border-gray-400/30 scale-105' : 'bg-white/5 border-white/5'}`}>
          <Bot className="w-4 h-4 text-gray-300 mb-1" />
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">{aiName}</span>
          <span className="text-xl font-black text-white">{sessionScore.ai}</span>
          <span className="text-[8px] text-white/30">{currentPlayer === 1 ? blackCount : redCount} pcs</span>
        </div>
      </div>

      <div
        className="z-10 rounded-2xl overflow-hidden shadow-2xl border border-white/10 p-2 bg-white/5 backdrop-blur-xl"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gridTemplateRows: 'repeat(8, 1fr)',
          width: 'min(88vw, 70vh, 520px)',
          aspectRatio: '1/1',
        }}
      >
        {Array.from({ length: 8 }, (_, ri) => {
          const r = setup.userColor === 1 ? ri : 7 - ri;
          return Array.from({ length: 8 }, (_, ci) => {
            const c = setup.userColor === 1 ? ci : 7 - ci;
            const isDark = (r + c) % 2 === 1;
            const piece = board[r][c];
            const isSelected = selected && selected[0] === r && selected[1] === c;
            const isValidTarget = validTargets.has(`${r},${c}`);
            const isCapture = lastMove?.captures.some(([cr, cc]) => cr === r && cc === c);

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                style={{
                  backgroundColor: isDark
                    ? (isSelected ? '#6b4423' : '#1e1b18')
                    : '#2c2a27',
                  cursor: currentPlayer === setup.userColor && !winner && isDark ? 'pointer' : 'default',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s ease',
                  border: '0.5px solid rgba(255,255,255,0.02)'
                }}
              >
                {isValidTarget && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    style={{
                      position: 'absolute',
                      width: '30%',
                      height: '30%',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(16, 185, 129, 0.6)',
                      boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)',
                      zIndex: 5,
                    }}
                  />
                )}

                {isCapture && (
                  <motion.div
                    initial={{ scale: 1.5, opacity: 0.8 }}
                    animate={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                      position: 'absolute',
                      width: '80%',
                      height: '80%',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(239, 68, 68, 0.4)',
                      zIndex: 4,
                    }}
                  />
                )}

                {piece !== 0 && (
                  <motion.div
                    layout
                    layoutId={`piece-${r}-${c}`}
                    initial={{ scale: 0 }}
                    animate={{
                      scale: isSelected ? 1.15 : 1,
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20, layout: { duration: 0.3 } }}
                    style={{
                      width: '75%',
                      height: '75%',
                      borderRadius: '50%',
                      background: isRed(piece)
                        ? 'radial-gradient(circle at 35% 35%, #ff6b6b, #c0392b, #8b1a1a)'
                        : 'radial-gradient(circle at 35% 35%, #666, #333, #111)',
                      border: isSelected
                        ? '3px solid #10b981'
                        : `2px solid ${isRed(piece) ? 'rgba(255,200,200,0.4)' : 'rgba(200,200,200,0.3)'}`,
                      boxShadow: isSelected
                        ? '0 0 15px rgba(16, 185, 129, 0.5), 0 4px 8px rgba(0,0,0,0.5)'
                        : '0 3px 6px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isPlayerPiece(piece, setup.userColor) && currentPlayer === setup.userColor && !winner ? 'pointer' : 'default',
                      zIndex: 10,
                      position: 'relative',
                    }}
                  >
                    {isKing(piece) && (
                      <Crown
                        className="absolute"
                        style={{
                          width: '50%',
                          height: '50%',
                          color: '#ffd700',
                          filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))',
                        }}
                        fill="currentColor"
                      />
                    )}
                  </motion.div>
                )}
              </div>
            );
          });
        })}
      </div>

      <div className="mt-4 z-10 text-center min-h-[32px] flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {aiThinking ? (
            <motion.div key="thinking" initial={{opacity:0, y:5}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-5}}
              className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
              <span className="text-[10px] font-black text-red-300 tracking-[0.2em] uppercase">
                {aiName} is calculating...
              </span>
            </motion.div>
          ) : !winner && currentPlayer === setup.userColor ? (
            <motion.div key="turn" initial={{opacity:0}} animate={{opacity:1}}
              className="text-xs font-bold text-red-400/70 tracking-widest uppercase">
              Your turn — {getAllMoves(board, setup.userColor).some(m => m.isJump) ? 'You must jump!' : 'Select a piece'}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {winner !== null && (
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
                style={{ background: `radial-gradient(circle, ${winner === 'You' ? 'rgba(239,68,68,0.5)' : 'rgba(150,150,150,0.5)'}, transparent)` }}
              />
              <div className="text-6xl mb-4 z-10">🏆</div>
              <div className="text-3xl md:text-4xl font-black uppercase tracking-widest text-center mb-2 z-10" style={{ color: winner === 'You' ? '#ef4444' : '#9ca3af' }}>
                {winner}
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
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-8">How to Play <span className="text-red-500">Checkers</span></h2>
              <div className="space-y-6 text-white/70 text-sm md:text-base leading-relaxed">
                <p><strong className="text-white uppercase tracking-widest text-xs block mb-1">Objective</strong> Capture all of your opponent's pieces or block them so they cannot make any moves.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <strong className="text-white uppercase tracking-widest text-xs block mb-2">Movement</strong>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Normal pieces move 1 square diagonally forward.</li>
                      <li>Pieces can only move on dark squares.</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-white uppercase tracking-widest text-xs block mb-2">Capturing</strong>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Jump over an enemy piece to a vacant square behind it to capture it.</li>
                      <li>Captures are mandatory if a jump is available.</li>
                    </ul>
                  </div>
                </div>
                <p className="bg-white/5 p-4 rounded-2xl border border-white/10 italic text-xs">Kings: Reach the opponent's last row to become a King. Kings can move and jump both forward and backward.</p>
              </div>
              <button onClick={() => setShowHelp(false)} className="w-full mt-10 py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-lg">Got It</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
