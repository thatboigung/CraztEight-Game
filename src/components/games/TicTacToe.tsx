import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, HelpCircle, X } from 'lucide-react';
import { GameMode } from '../../types';
import { recordGameResult } from '../../utils/stats';
import { getRandomName } from '../../utils/names';

interface Props {
  onBack: () => void;
  playerCount?: number;
}

type Player = 'X' | 'O';
type CellValue = Player | null;

export const TicTacToe: React.FC<Props> = ({ onBack }) => {
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState<boolean>(true);
  const [winner, setWinner] = useState<Player | 'DRAW' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [isVsAI, setIsVsAI] = useState<boolean>(true);
  const [humanPlayer, setHumanPlayer] = useState<Player>('X');
  const [sessionScore, setSessionScore] = useState({ p1: 0, p2: 0, draws: 0 });
  
  // Initialize names on first load
  const [names, setNames] = useState({ p1: 'You', p2: getRandomName() });
  
  const isAITurn = isVsAI && !winner && ((xIsNext && humanPlayer === 'O') || (!xIsNext && humanPlayer === 'X'));

  const checkWinner = (squares: CellValue[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { player: squares[a], line: lines[i] };
      }
    }
    if (!squares.includes(null)) {
      return { player: 'DRAW', line: null };
    }
    return null;
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);

    const result = checkWinner(newBoard);
    if (result) {
      setWinner(result.player as Player | 'DRAW');
      setWinningLine(result.line);
      
      if (result.player === 'DRAW') {
        setSessionScore(s => ({ ...s, draws: s.draws + 1 }));
      } else {
        if (isVsAI) {
           if (result.player === humanPlayer) {
             setSessionScore(s => ({ ...s, p1: s.p1 + 1 }));
           } else {
             setSessionScore(s => ({ ...s, p2: s.p2 + 1 }));
           }
        } else {
           if (result.player === 'X') {
             setSessionScore(s => ({ ...s, p1: s.p1 + 1 }));
           } else {
             setSessionScore(s => ({ ...s, p2: s.p2 + 1 }));
           }
        }
      }

      // For stats tracking, assume X is the local main player tracking wins
      if (result.player === 'X') {
        recordGameResult(GameMode.TIC_TAC_TOE, true);
      } else if (result.player === 'O') {
        recordGameResult(GameMode.TIC_TAC_TOE, false);
      } else {
        recordGameResult(GameMode.TIC_TAC_TOE, false);
      }
    }
  };

  const getBestMove = (squares: CellValue[]): number => {
    // 1. Can O win?
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        const boardCopy = [...squares];
        boardCopy[i] = 'O';
        if (checkWinner(boardCopy)?.player === 'O') return i;
      }
    }
    // 2. Must block X?
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        const boardCopy = [...squares];
        boardCopy[i] = 'X';
        if (checkWinner(boardCopy)?.player === 'X') return i;
      }
    }
    // 3. Take center
    if (!squares[4]) return 4;
    // 4. Random available
    const available = squares.map((s, i) => s === null ? i : null).filter(i => i !== null) as number[];
    return available[Math.floor(Math.random() * available.length)];
  };

  useEffect(() => {
    if (isAITurn) {
      const timer = setTimeout(() => {
        const bestMove = getBestMove(board);
        if (bestMove !== undefined) {
          handleCellClick(bestMove);
        }
      }, 500); // Small delay to feel more natural
      return () => clearTimeout(timer);
    }
  }, [xIsNext, isAITurn, winner, board]);

  const resetGame = (isNextGame: boolean = false) => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setWinner(null);
    setWinningLine(null);
    if (isNextGame && isVsAI) {
      setHumanPlayer(prev => prev === 'X' ? 'O' : 'X');
    }
  };

  const changeMode = (vsAI: boolean) => {
    setIsVsAI(vsAI);
    setHumanPlayer('X');
    setSessionScore({ p1: 0, p2: 0, draws: 0 });
    if (vsAI) {
      setNames({ p1: 'You', p2: getRandomName() });
    } else {
      setNames({ p1: getRandomName(), p2: getRandomName() });
    }
    resetGame();
  };

  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="w-full h-screen bg-[#080808] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-[80%] h-[80%] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[80%] h-[80%] bg-purple-500/10 blur-[150px] rounded-full pointer-events-none" />
      
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

      <div className="flex flex-col items-center z-10 w-full max-w-lg">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-10 text-center">
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white uppercase drop-shadow-2xl">
            Tic-Tac-<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">Toe</span>
          </h1>
          
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => changeMode(true)}
              className={`px-4 py-2 rounded-l-full text-xs font-bold uppercase tracking-widest transition-all ${isVsAI ? 'bg-blue-500 text-black shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
            >
              VS Computer
            </button>
            <button
              onClick={() => changeMode(false)}
              className={`px-4 py-2 rounded-r-full text-xs font-bold uppercase tracking-widest transition-all ${!isVsAI ? 'bg-purple-500 text-black shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
            >
              VS Player
            </button>
          </div>

          {/* Scoreboard */}
          <div className="mt-6 flex items-center justify-between w-full bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-md">
            <div className="flex flex-col items-center flex-1">
              <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isVsAI ? 'text-blue-400' : 'text-emerald-400'}`}>
                {names.p1}
              </span>
              <span className="text-3xl md:text-4xl font-black text-white">{sessionScore.p1}</span>
            </div>
            <div className="flex flex-col items-center flex-1 border-x border-white/10">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Draws</span>
              <span className="text-xl md:text-2xl font-bold text-white/50">{sessionScore.draws}</span>
            </div>
            <div className="flex flex-col items-center flex-1">
              <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isVsAI ? 'text-purple-400' : 'text-rose-400'}`}>
                {names.p2}
              </span>
              <span className="text-3xl md:text-4xl font-black text-white">{sessionScore.p2}</span>
            </div>
          </div>

          {isVsAI && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => { setHumanPlayer('X'); resetGame(); }}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${humanPlayer === 'X' ? 'bg-white/20 text-white shadow-inner' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'}`}
              >
                Play as X (First)
              </button>
              <button
                onClick={() => { setHumanPlayer('O'); resetGame(); }}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${humanPlayer === 'O' ? 'bg-white/20 text-white shadow-inner' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'}`}
              >
                Play as O (Second)
              </button>
            </div>
          )}

          <div className="mt-6 text-sm md:text-base font-black tracking-[0.3em] uppercase flex items-center justify-center gap-6 bg-white/5 py-3 px-8 rounded-full border border-white/5 backdrop-blur-sm">
            <span className={`transition-all duration-300 ${xIsNext && !winner ? 'text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,1)] scale-110' : 'text-white/30'}`}>
              {isVsAI ? (humanPlayer === 'X' ? `${names.p1} (X)` : `${names.p2} (X)`) : `${names.p1} (X)`}
            </span>
            <span className="text-white/20 text-xs">VS</span>
            <span className={`transition-all duration-300 ${!xIsNext && !winner ? 'text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,1)] scale-110' : 'text-white/30'}`}>
              {isVsAI ? (humanPlayer === 'O' ? `${names.p1} (O)` : `${names.p2} (O)`) : `${names.p2} (O)`}
            </span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="grid grid-cols-3 gap-3 md:gap-4 p-4 md:p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] shadow-2xl relative"
        >
          {/* Subtle grid line effects */}
          <div className="absolute inset-0 pointer-events-none rounded-[2rem] border border-white/5" />
          
          {board.map((cell, index) => {
            const isWinningCell = winningLine?.includes(index);
            return (
              <motion.button
                key={index}
                whileHover={!cell && !winner && !isAITurn ? { scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' } : {}}
                whileTap={!cell && !winner && !isAITurn ? { scale: 0.95 } : {}}
                onClick={() => {
                  if (!isAITurn) handleCellClick(index);
                }}
                disabled={isAITurn}
                className={`w-24 h-24 md:w-32 md:h-32 flex items-center justify-center text-5xl md:text-7xl font-black rounded-2xl transition-all duration-300
                  ${!cell ? 'bg-black/20 border border-white/5 hover:border-white/20' : 'bg-black/40 border border-white/10'}
                  ${isWinningCell && cell === 'X' ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-[#080808] bg-blue-500/10 scale-105' : ''}
                  ${isWinningCell && cell === 'O' ? 'ring-2 ring-purple-500 ring-offset-4 ring-offset-[#080808] bg-purple-500/10 scale-105' : ''}
                  ${winner && !isWinningCell && cell ? 'opacity-30' : ''}
                `}
              >
                <AnimatePresence>
                  {cell === 'X' && (
                    <motion.span
                      initial={{ scale: 0, rotate: -45, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)] leading-none block font-sans"
                    >
                      X
                    </motion.span>
                  )}
                  {cell === 'O' && (
                    <motion.span
                      initial={{ scale: 0, rotate: 45, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)] leading-none block font-sans"
                    >
                      O
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </motion.div>

        <AnimatePresence>
          {winner && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-[#111] border border-white/10 p-8 md:p-12 rounded-[3rem] shadow-2xl flex flex-col items-center max-w-md w-full relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 pointer-events-none" />
                
                <div className="text-4xl md:text-5xl font-black italic uppercase tracking-widest mb-10 text-center drop-shadow-lg z-10">
                  {winner === 'DRAW' ? (
                    <span className="text-white/70">It's a Draw!</span>
                  ) : (
                    <span className="flex flex-col items-center justify-center gap-6">
                      <TrophyIcon className={winner === 'X' ? 'text-blue-400 w-20 h-20' : 'text-purple-400 w-20 h-20'} />
                      <span>
                        Player <span className={winner === 'X' ? 'text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,1)]' : 'text-purple-400 drop-shadow-[0_0_15px_rgba(192,132,252,1)]'}>{winner}</span><br/><span className="text-2xl text-white/50">Wins!</span>
                      </span>
                    </span>
                  )}
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => resetGame(true)}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black rounded-xl font-black tracking-widest uppercase flex items-center justify-center w-full gap-3 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] z-10"
                >
                  <RotateCcw className="w-5 h-5" /> Play Again
                </motion.button>
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
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-8">How to Play <span className="text-blue-500">Tic-Tac-Toe</span></h2>
              <div className="space-y-6 text-white/70 text-sm md:text-base leading-relaxed">
                <p><strong className="text-white uppercase tracking-widest text-xs block mb-1">Objective</strong> Be the first player to get three of your marks (X or O) in a row—vertically, horizontally, or diagonally.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <strong className="text-white uppercase tracking-widest text-xs block mb-2">Gameplay</strong>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Players take turns placing their mark in an empty square on a 3x3 grid.</li>
                      <li>X always goes first in the first round.</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-white uppercase tracking-widest text-xs block mb-2">Outcome</strong>
                    <ul className="list-disc list-inside space-y-1">
                      <li>If all 9 squares are filled and no one has three in a row, the game is a Draw.</li>
                    </ul>
                  </div>
                </div>
                <p className="bg-white/5 p-4 rounded-2xl border border-white/10 italic text-xs">Strategy: Focus on both building your own line and blocking your opponent from completing theirs!</p>
              </div>
              <button onClick={() => setShowHelp(false)} className="w-full mt-10 py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-lg">Got It</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Simple custom trophy icon just to spice up the win screen without a new lucide import just in case
const TrophyIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);
