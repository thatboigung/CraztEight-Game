import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, User, Bot, HelpCircle, X } from 'lucide-react';
import { GameMode } from '../../types';
import { recordGameResult } from '../../utils/stats';
import { getRandomName } from '../../utils/names';

interface Props { onBack: () => void; playerCount?: number; }

// Piece encoding: uppercase=white, lowercase=black
type PieceChar = 'K'|'Q'|'R'|'B'|'N'|'P'|'k'|'q'|'r'|'b'|'n'|'p'|'';
type Board = PieceChar[][];

const PIECE_SYMBOLS: Record<string, string> = {
  K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙',
  k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟',
};

const PIECE_VALUES: Record<string, number> = { p:100,n:320,b:330,r:500,q:900,k:20000 };

// Piece-Square Tables (simplified, from white's perspective)
const PST_PAWN = [
  0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10,
  5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5,
  5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0
];
const PST_KNIGHT = [
  -50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40,
  -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30,
  -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30,
  -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50
];
const PST_BISHOP = [
  -20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10,
  -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10,
  -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10,
  -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20
];
const PST_ROOK = [
  0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5,
  -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5,
  -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0
];

const PST: Record<string, number[]> = { p:PST_PAWN, n:PST_KNIGHT, b:PST_BISHOP, r:PST_ROOK };

const isWhite = (p: PieceChar) => p !== '' && p === p.toUpperCase();
const isBlack = (p: PieceChar) => p !== '' && p === p.toLowerCase();
const isColor = (p: PieceChar, white: boolean) => white ? isWhite(p) : isBlack(p);

const initBoard = (): Board => {
  const b: Board = Array.from({length:8}, ()=> Array(8).fill(''));
  const back: PieceChar[] = ['R','N','B','Q','K','B','N','R'];
  for(let c=0;c<8;c++){
    b[0][c] = back[c].toLowerCase() as PieceChar;
    b[1][c] = 'p';
    b[6][c] = 'P';
    b[7][c] = back[c];
  }
  return b;
};

const clone = (b: Board): Board => b.map(r=>[...r]);

interface Move { fr:number; fc:number; tr:number; tc:number; promo?: PieceChar; }

const inBounds = (r:number,c:number) => r>=0&&r<8&&c>=0&&c<8;

const genPseudoMoves = (board: Board, white: boolean): Move[] => {
  const moves: Move[] = [];
  const add = (fr:number,fc:number,tr:number,tc:number) => {
    const target = board[tr][tc];
    if(target !== '' && isColor(target, white)) return;
    // Pawn promotion
    const piece = board[fr][fc].toLowerCase();
    if(piece === 'p' && (tr === 0 || tr === 7)){
      const promos: PieceChar[] = white ? ['Q','R','B','N'] : ['q','r','b','n'];
      for(const p of promos) moves.push({fr,fc,tr,tc,promo:p});
    } else {
      moves.push({fr,fc,tr,tc});
    }
  };

  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    const p = board[r][c];
    if(p==='' || isColor(p, !white)) continue;
    const pl = p.toLowerCase();
    const dir = white ? -1 : 1;

    if(pl==='p'){
      const nr = r+dir;
      if(inBounds(nr,c) && board[nr][c]==='') {
        add(r,c,nr,c);
        const startRow = white ? 6 : 1;
        if(r===startRow && board[r+2*dir][c]==='') add(r,c,r+2*dir,c);
      }
      for(const dc of [-1,1]){
        if(inBounds(nr,c+dc) && board[nr][c+dc]!=='' && isColor(board[nr][c+dc],!white))
          add(r,c,nr,c+dc);
      }
    } else if(pl==='n'){
      for(const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]){
        if(inBounds(r+dr,c+dc)) add(r,c,r+dr,c+dc);
      }
    } else if(pl==='b'||pl==='r'||pl==='q'||pl==='k'){
      const dirs: [number,number][] = [];
      if(pl==='b'||pl==='q') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
      if(pl==='r'||pl==='q') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
      if(pl==='k') dirs.push([-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]);
      const range = pl==='k' ? 1 : 8;
      for(const [dr,dc] of dirs){
        for(let i=1;i<=range;i++){
          const nr=r+i*dr, nc=c+i*dc;
          if(!inBounds(nr,nc)) break;
          add(r,c,nr,nc);
          if(board[nr][nc]!=='') break;
        }
      }
    }
  }
  return moves;
};

const findKing = (board: Board, white: boolean): [number,number] => {
  const k = white ? 'K' : 'k';
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(board[r][c]===k) return [r,c];
  return [-1,-1];
};

const isInCheck = (board: Board, white: boolean): boolean => {
  const [kr,kc] = findKing(board, white);
  if(kr===-1) return true;
  const opp = genPseudoMoves(board, !white);
  return opp.some(m => m.tr===kr && m.tc===kc);
};

const applyMove = (board: Board, m: Move): Board => {
  const b = clone(board);
  b[m.tr][m.tc] = m.promo || b[m.fr][m.fc];
  b[m.fr][m.fc] = '';
  return b;
};

const genLegalMoves = (board: Board, white: boolean): Move[] => {
  return genPseudoMoves(board, white).filter(m => {
    const nb = applyMove(board, m);
    return !isInCheck(nb, white);
  });
};

// --- AI ---
// --- AI Engine (Gravity Protocol) ---

const getPieceValue = (p: PieceChar): number => {
  const pl = p.toLowerCase();
  switch(pl) {
    case 'p': return 100;
    case 'n': return 320;
    case 'b': return 330;
    case 'r': return 500;
    case 'q': return 900;
    case 'k': return 20000;
    default: return 0;
  }
};

const getKingPosition = (board: Board, white: boolean): [number, number] => {
  const k = white ? 'K' : 'k';
  for(let r=0; r<8; r++) for(let c=0; c<8; c++) if(board[r][c] === k) return [r,c];
  return [-1, -1];
};

const evaluateBoard = (board: Board): number => {
  let score = 0;
  const whiteKing = getKingPosition(board, true);
  const blackKing = getKingPosition(board, false);

  for(let r=0; r<8; r++) {
    for(let c=0; c<8; c++) {
      const p = board[r][c];
      if(p === '') continue;
      
      const isW = isWhite(p);
      const pl = p.toLowerCase();
      const val = getPieceValue(p);
      
      // 1. Material
      let pieceScore = val;

      // 2. Positional - PST
      const pstIdx = isW ? (r*8+c) : ((7-r)*8+c);
      pieceScore += PST[pl] ? PST[pl][pstIdx] : 0;

      // 3. Center Control (e4, d4, e5, d5)
      if ((r === 3 || r === 4) && (c === 3 || c === 4)) {
        pieceScore += 30;
      }

      // 4. King Safety (Gravity)
      const oppKing = isW ? blackKing : whiteKing;
      const dist = Math.max(Math.abs(r - oppKing[0]), Math.abs(c - oppKing[1]));
      if (dist <= 2) {
        pieceScore += (3 - dist) * 20; // Bonus for being near enemy king
      }

      if (isW) score += pieceScore;
      else score -= pieceScore;
    }
  }
  return score;
};

const getMoveGravityScore = (board: Board, m: Move, white: boolean): number => {
  let score = 0;
  const target = board[m.tr][m.tc];
  const attacker = board[m.fr][m.fc].toLowerCase();
  
  // 1. Captures (MVV-LVA)
  if (target !== '') {
    score += (getPieceValue(target) * 10) - getPieceValue(board[m.fr][m.fc]);
  }

  // 2. Checks
  const nb = applyMove(board, m);
  if (isInCheck(nb, !white)) score += 500;

  // 3. Gravity: Attacks squares adjacent to enemy king
  const oppKing = getKingPosition(board, !white);
  const distToKing = Math.max(Math.abs(m.tr - oppKing[0]), Math.abs(m.tc - oppKing[1]));
  if (distToKing <= 1) score += 300;
  else if (distToKing <= 2) score += 100;

  // 4. Center Control
  if ((m.tr === 3 || m.tr === 4) && (m.tc === 3 || m.tc === 4)) score += 50;

  return score;
};

const quiescenceSearch = (board: Board, alpha: number, beta: number, white: boolean): number => {
  const standPat = evaluateBoard(board) * (white ? 1 : -1);
  if (standPat >= beta) return beta;
  if (alpha < standPat) alpha = standPat;

  const moves = genLegalMoves(board, white).filter(m => board[m.tr][m.tc] !== '');
  moves.sort((a, b) => getMoveGravityScore(board, b, white) - getMoveGravityScore(board, a, white));

  for (const m of moves) {
    const score = -quiescenceSearch(applyMove(board, m), -beta, -alpha, !white);
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
};

const negamax = (board: Board, depth: number, alpha: number, beta: number, white: boolean): number => {
  if (depth === 0) return quiescenceSearch(board, alpha, beta, white);

  const moves = genLegalMoves(board, white);
  if (moves.length === 0) {
    if (isInCheck(board, white)) return -50000 - depth; // Checkmate
    return 0; // Stalemate
  }

  moves.sort((a, b) => getMoveGravityScore(board, b, white) - getMoveGravityScore(board, a, white));

  for (const m of moves) {
    const score = -negamax(applyMove(board, m), depth - 1, -beta, -alpha, !white);
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
};

const getBestAIMove = (board: Board, white: boolean, difficulty: number): Move | null => {
  const moves = genLegalMoves(board, white);
  if (moves.length === 0) return null;

  // Depth tuning based on difficulty
  const depth = difficulty >= 5 ? 4 : difficulty >= 4 ? 3 : 2;
  
  moves.sort((a, b) => getMoveGravityScore(board, b, white) - getMoveGravityScore(board, a, white));

  let bestScore = -Infinity;
  let bestMoves: Move[] = [];

  for (const m of moves) {
    const score = -negamax(applyMove(board, m), depth - 1, -Infinity, Infinity, !white);
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [m];
    } else if (score === bestScore) {
      bestMoves.push(m);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
};

interface GameSetup {
  userColor: 'white' | 'black';
  difficulty: number;
  vsAI: boolean;
}

export const Chess: React.FC<Props> = ({ onBack }) => {
  const [setup, setSetup] = useState<GameSetup | null>(null);
  const [board, setBoard] = useState<Board>(initBoard);
  const [selected, setSelected] = useState<[number,number]|null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [isWhiteTurn, setIsWhiteTurn] = useState(true);
  const [winner, setWinner] = useState<string|null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [sessionScore, setSessionScore] = useState({player:0,ai:0,draws:0});
  const [lastMove, setLastMove] = useState<Move|null>(null);
  const [inCheck, setInCheck] = useState(false);
  const [aiName] = useState(()=>getRandomName());


  const getAIMoveFixed = useCallback((b: Board, white: boolean, difficulty: number): Move | null => {
    try {
      return getBestAIMove(b, white, difficulty);
    } catch (e) {
      console.error("AI Error:", e);
      const m = genLegalMoves(b, white);
      return m.length > 0 ? m[0] : null;
    }
  }, []);

  const checkEnd = useCallback((b:Board, whiteTurn:boolean) => {
    const moves = genLegalMoves(b, whiteTurn);
    if(moves.length===0){
      if(isInCheck(b, whiteTurn)){
        const isUserTurn = (setup?.userColor === 'white' && whiteTurn) || (setup?.userColor === 'black' && !whiteTurn);
        const w = isUserTurn ? aiName : 'You';
        setWinner(w);
        if(w==='You'){ setSessionScore(s=>({...s,player:s.player+1})); recordGameResult(GameMode.CHESS,true); }
        else { setSessionScore(s=>({...s,ai:s.ai+1})); recordGameResult(GameMode.CHESS,false); }
      } else {
        setWinner('Draw');
        setSessionScore(s=>({...s,draws:s.draws+1}));
        recordGameResult(GameMode.CHESS,false);
      }
      return true;
    }
    setInCheck(isInCheck(b, whiteTurn));
    return false;
  }, [aiName, setup]);

  const handleClick = useCallback((r:number,c:number)=>{
    if(!setup || winner || aiThinking) return;
    const isPlayerTurn = setup.vsAI 
      ? (setup.userColor === 'white' ? isWhiteTurn : !isWhiteTurn)
      : true;
    if(!isPlayerTurn) return;

    const p = board[r][c];
    const activeColorIsWhite = setup.vsAI ? (setup.userColor === 'white') : isWhiteTurn;

    if(isColor(p, activeColorIsWhite)){
      setSelected([r,c]);
      setLegalMoves(genLegalMoves(board, activeColorIsWhite).filter(m=>m.fr===r&&m.fc===c));
      return;
    }

    if(selected){
      const move = legalMoves.find(m=>m.tr===r&&m.tc===c);
      if(move){
        const finalMove = move.promo ? {...move, promo: isWhiteTurn ? 'Q' : 'q'} : move;
        const nb = applyMove(board, finalMove);
        setBoard(nb); setSelected(null); setLegalMoves([]); setLastMove(finalMove);
        const nextWhite = !isWhiteTurn;
        if(!checkEnd(nb, nextWhite)) setIsWhiteTurn(nextWhite);
      } else { setSelected(null); setLegalMoves([]); }
    }
  }, [board,selected,legalMoves,isWhiteTurn,winner,aiThinking,checkEnd,setup]);

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

  useEffect(()=>{
    if(!setup || !setup.vsAI || winner) return;
    const isAiTurn = (setup.userColor === 'white' && !isWhiteTurn) || (setup.userColor === 'black' && isWhiteTurn);
    if(!isAiTurn) return;

    setAiThinking(true);
    const t = setTimeout(()=>{
      const move = getAIMoveFixed(board, isWhiteTurn, setup.difficulty);
      if(!move){ 
        setWinner('You'); 
        setSessionScore(s=>({...s,player:s.player+1})); 
        recordGameResult(GameMode.CHESS,true); 
        setAiThinking(false); 
        return; 
      }
      const nb = applyMove(board, move);
      setBoard(nb); setLastMove(move); setAiThinking(false);
      const nextWhite = !isWhiteTurn;
      if(!checkEnd(nb, nextWhite)) setIsWhiteTurn(nextWhite);
    }, getThinkingTime(setup.difficulty));
    return ()=>clearTimeout(t);
  }, [isWhiteTurn,winner,board,checkEnd,setup,getAIMoveFixed]);

  const reset = () => { 
    setBoard(initBoard()); 
    setSelected(null); 
    setLegalMoves([]); 
    setIsWhiteTurn(true); 
    setWinner(null); 
    setLastMove(null); 
    setInCheck(false); 
    setAiThinking(false); 
    setSetup(null);
  };

  const targets = new Set(legalMoves.map(m=>`${m.tr},${m.tc}`));

  const [showHelp, setShowHelp] = useState(false);

  const [tempSetup, setTempSetup] = useState<GameSetup>({
    userColor: 'white',
    difficulty: 4,
    vsAI: true
  });

  if(!setup) {
    return (
      <div className="w-full h-screen bg-[#080808] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-indigo-500/5 blur-[150px] rounded-full pointer-events-none"/>
        <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-purple-500/5 blur-[150px] rounded-full pointer-events-none"/>
        
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

        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="z-10 bg-white/5 border border-white/10 p-8 md:p-12 rounded-[2.5rem] backdrop-blur-xl w-full max-w-lg shadow-2xl">
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-8 text-center">
            Chess <span className="text-indigo-400">Setup</span>
          </h1>

          <div className="space-y-6">
            <div>
              <label className="text-xs font-black uppercase tracking-[0.3em] text-white/30 block mb-4">Game Mode</label>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setTempSetup(s => ({...s, vsAI: true}))} 
                  className={`p-4 rounded-2xl font-black uppercase tracking-widest transition-all ${tempSetup.vsAI ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/5 text-white/40'}`}
                >
                  Vs AI
                </button>
                <button 
                  onClick={() => setTempSetup(s => ({...s, vsAI: false}))} 
                  className={`p-4 rounded-2xl font-black uppercase tracking-widest transition-all ${!tempSetup.vsAI ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/5 text-white/40'}`}
                >
                  Vs Human
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-[0.3em] text-white/30 block mb-4">Choose Your Side</label>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setTempSetup(s => ({...s, userColor:'white'}))} 
                  className={`p-6 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all ${tempSetup.userColor === 'white' ? 'bg-white text-black ring-4 ring-indigo-500/30' : 'bg-white/5 text-white/40'}`}
                >
                  White
                </button>
                <button 
                  onClick={() => setTempSetup(s => ({...s, userColor:'black'}))} 
                  className={`p-6 rounded-2xl font-black uppercase tracking-widest border border-white/10 hover:scale-105 transition-all ${tempSetup.userColor === 'black' ? 'bg-[#111] text-white ring-4 ring-indigo-500/30' : 'bg-white/5 text-white/40'}`}
                >
                  Black
                </button>
              </div>
            </div>

            <button 
              onClick={() => setSetup(tempSetup)}
              className="w-full py-5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
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
      <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-indigo-500/5 blur-[150px] rounded-full pointer-events-none"/>
      <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-purple-500/5 blur-[150px] rounded-full pointer-events-none"/>

      <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={onBack}
        className="absolute top-4 left-4 md:top-8 md:left-8 p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors z-50 flex items-center gap-2 backdrop-blur-md">
        <ArrowLeft className="w-5 h-5"/><span className="text-xs font-bold tracking-widest uppercase pr-1 hidden md:block">Menu</span>
      </motion.button>

      <motion.h1 initial={{y:-20,opacity:0}} animate={{y:0,opacity:1}}
        className="text-3xl md:text-5xl font-black italic tracking-tighter text-white uppercase mb-1 z-10">
        Ch<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">ess</span>
      </motion.h1>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-4 z-10">
        Grandmaster Edition
      </motion.div>

      <div className="flex items-center gap-4 mb-4 z-10">
        <div className={`flex flex-col items-center px-4 py-2 rounded-xl border transition-all ${(setup.userColor==='white'?isWhiteTurn:!isWhiteTurn)&&!winner?'bg-white/10 border-white/30 scale-105':'bg-white/5 border-white/5'}`}>
          <User className="w-4 h-4 text-white mb-1"/>
          <span className="text-[9px] font-black uppercase tracking-widest text-white/80">You ({setup.userColor})</span>
          <span className="text-xl font-black text-white">{sessionScore.player}</span>
        </div>
        <span className="text-white/20 text-xs font-black">VS</span>
        <div className={`flex flex-col items-center px-4 py-2 rounded-xl border transition-all ${(setup.userColor==='white'?!isWhiteTurn:isWhiteTurn)&&!winner?'bg-purple-500/10 border-purple-400/30 scale-105':'bg-white/5 border-white/5'}`}>
          <Bot className="w-4 h-4 text-purple-300 mb-1"/>
          <span className="text-[9px] font-black uppercase tracking-widest text-purple-300">{aiName} ({setup.userColor==='white'?'black':'white'})</span>
          <span className="text-xl font-black text-white">{sessionScore.ai}</span>
        </div>
      </div>

      <div className="z-10 rounded-2xl overflow-hidden shadow-2xl border border-white/10 p-2 bg-white/5 backdrop-blur-xl">
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(8, 1fr)',
          gridTemplateRows:'repeat(8, 1fr)',
          width:'min(88vw, 70vh, 520px)',
          aspectRatio: '1/1',
          border:'1px solid rgba(255,255,255,0.1)'
        }}>
          {Array.from({length:8},(_,ri)=> {
            const r = setup.userColor === 'white' ? ri : 7 - ri;
            return Array.from({length:8},(_, ci)=>{
              const c = setup.userColor === 'white' ? ci : 7 - ci;
              const isDark=(r+c)%2===1;
              const piece=board[r][c];
              const isSel=selected&&selected[0]===r&&selected[1]===c;
              const isTarget=targets.has(`${r},${c}`);
              const isCapTarget=isTarget&&board[r][c]!=='';

              let bg = isDark ? '#1e293b' : '#334155';
              if(isSel) bg = 'rgba(16, 185, 129, 0.4)';

              const isUserTurn = (setup.userColor === 'white' && isWhiteTurn) || (setup.userColor === 'black' && !isWhiteTurn);

              return (
                <div key={`${r}-${c}`} onClick={()=>handleClick(r,c)}
                  style={{
                    backgroundColor:bg, 
                    position:'relative', 
                    display:'flex', 
                    alignItems:'center', 
                    justifyContent:'center',
                    cursor:isUserTurn&&!winner?'pointer':'default',
                    transition:'background-color 0.2s ease'
                  }}>
                  {isTarget && !isCapTarget && (
                    <div style={{position:'absolute',width:'25%',height:'25%',borderRadius:'50%',backgroundColor:'rgba(16, 185, 129, 0.6)',boxShadow:'0 0 10px rgba(16, 185, 129, 0.4)',zIndex:5}}/>
                  )}
                  {isCapTarget && (
                    <div style={{position:'absolute',width:'85%',height:'85%',borderRadius:'50%',border:'3px solid rgba(239, 68, 68, 0.4)',zIndex:5}}/>
                  )}
                  {piece!=='' && (
                    <motion.div layout initial={{scale:0.8}} animate={{scale:isSel?1.15:1}} transition={{type:'spring',stiffness:300,damping:20}}
                      style={{
                        fontSize:'min(7vw, 50px)', 
                        lineHeight:1, 
                        zIndex:10, 
                        filter: isBlack(piece) ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
                        color: isBlack(piece) ? '#0f172a' : '#f8fafc',
                        WebkitTextStroke: isWhite(piece) ? '0.5px rgba(0,0,0,0.2)' : 'none',
                        cursor: isColor(piece, setup.userColor === 'white')&&isUserTurn&&!winner ? 'grab' : 'default',
                        userSelect:'none'
                      }}>
                      {PIECE_SYMBOLS[piece]}
                    </motion.div>
                  )}
                </div>
              );
            });
          })}
        </div>
      </div>

      <div className="mt-4 z-10 text-center min-h-[32px] flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {aiThinking ? (
            <motion.div key="thinking" initial={{opacity:0, y:5}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-5}}
              className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span className="text-[10px] font-black text-purple-300 tracking-[0.2em] uppercase">
                {aiName} is calculating...
              </span>
            </motion.div>
          ) : inCheck && ((setup.userColor==='white'&&isWhiteTurn) || (setup.userColor==='black'&&!isWhiteTurn)) && !winner ? (
            <motion.div key="check" initial={{scale:0.8, opacity:0}} animate={{scale:1, opacity:1}}
              className="text-sm font-black text-red-500 tracking-[0.3em] uppercase animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
              Check!
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {winner&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{scale:0.8,y:30}} animate={{scale:1,y:0}} exit={{scale:0.8,y:30}}
              className="bg-[#111] border border-white/10 p-8 md:p-12 rounded-[2rem] shadow-2xl flex flex-col items-center max-w-sm w-full relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 pointer-events-none" style={{background:`radial-gradient(circle, ${winner==='You'?'rgba(99,102,241,0.5)':'rgba(168,85,247,0.5)'}, transparent)`}}/>
              <div className="text-6xl mb-4 z-10">{winner==='Draw'?'🤝':'🏆'}</div>
              <div className="text-3xl md:text-4xl font-black uppercase tracking-widest text-center mb-2 z-10" style={{color:winner==='You'?'#818cf8':winner==='Draw'?'#9ca3af':'#c084fc'}}>{winner}</div>
              <div className="text-xl font-bold text-white/50 mb-8 z-10">{winner==='Draw'?'Stalemate!':'Wins the game!'}</div>
              <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={reset}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black rounded-xl font-black tracking-widest uppercase flex items-center justify-center w-full gap-3 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] z-10">
                <RotateCcw className="w-5 h-5"/> Play Again
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
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-8">How to Play <span className="text-indigo-500">Chess</span></h2>
              <div className="space-y-6 text-white/70 text-sm md:text-base leading-relaxed">
                <p><strong className="text-white uppercase tracking-widest text-xs block mb-1">Objective</strong> The goal is to checkmate your opponent's King, meaning the King is in a position to be captured and cannot escape.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <strong className="text-white uppercase tracking-widest text-xs block mb-2">Basic Moves</strong>
                    <ul className="list-disc list-inside space-y-1">
                      <li><span className="text-white">Pawns:</span> Move 1 square forward (2 on first move). Capture diagonally.</li>
                      <li><span className="text-white">Knights:</span> Move in an 'L' shape. Can jump over other pieces.</li>
                      <li><span className="text-white">Bishops:</span> Move any distance diagonally.</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-white uppercase tracking-widest text-xs block mb-2">Elite Moves</strong>
                    <ul className="list-disc list-inside space-y-1">
                      <li><span className="text-white">Rooks:</span> Move any distance horizontally or vertically.</li>
                      <li><span className="text-white">Queen:</span> Combines Rook and Bishop powers.</li>
                      <li><span className="text-white">King:</span> Moves 1 square in any direction.</li>
                    </ul>
                  </div>
                </div>
                <p className="bg-white/5 p-4 rounded-2xl border border-white/10 italic text-xs">Promotion: If a Pawn reaches the last row, it can be promoted to a Queen, Rook, Bishop, or Knight.</p>
              </div>
              <button onClick={() => setShowHelp(false)} className="w-full mt-10 py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-500 hover:text-white transition-all shadow-lg">Got It</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
