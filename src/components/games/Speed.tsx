import React, { useState, useEffect } from 'react';
import { CardData, Rank, GameMode } from '../../types';
import { createDeck, shuffleDeck, getCardValue } from '../../utils/deck';
import { Card } from '../Card';
import { RulesModal } from '../RulesModal';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Pause, Play as PlayIcon, Home, Trophy, Zap } from 'lucide-react';
import { recordGameResult } from '../../utils/stats';

interface SpeedProps {
  onBack: () => void;
}

export const Speed: React.FC<SpeedProps> = ({ onBack }) => {
  const [playerHand, setPlayerHand] = useState<CardData[]>([]);
  const [aiHand, setAiHand] = useState<CardData[]>([]);
  const [playerDeck, setPlayerDeck] = useState<CardData[]>([]);
  const [aiDeck, setAiDeck] = useState<CardData[]>([]);
  const [centerPiles, setCenterPiles] = useState<[CardData, CardData] | null>(null);
  const [sidePiles, setSidePiles] = useState<[CardData[], CardData[]]>([[], []]);
  const [winner, setWinner] = useState<string | null>(null);
  const [isStuck, setIsStuck] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showRules, setShowRules] = useState(() => {
    return localStorage.getItem('show_rules_speed') !== 'false';
  });

  const startNewGame = () => {
    const deck = shuffleDeck(createDeck());
    
    const pDeck = deck.splice(0, 20);
    const aDeck = deck.splice(0, 20);
    const sPile1 = deck.splice(0, 5);
    const sPile2 = deck.splice(0, 5);
    const cPile1 = deck.pop()!;
    const cPile2 = deck.pop()!;

    setPlayerDeck(pDeck.slice(5));
    setPlayerHand(pDeck.slice(0, 5));
    setAiDeck(aDeck.slice(5));
    setAiHand(aDeck.slice(0, 5));
    setSidePiles([sPile1, sPile2]);
    setCenterPiles([cPile1, cPile2]);
    setWinner(null);
    setIsStuck(false);
  };

  useEffect(() => {
    startNewGame();
  }, []);

  const canPlayOn = (card: CardData, target: CardData) => {
    const val1 = getCardValue(card.rank);
    const val2 = getCardValue(target.rank);
    
    // Handle Ace (1 or 14)
    if (card.rank === Rank.ACE) {
      return val2 === 2 || val2 === 13;
    }
    if (target.rank === Rank.ACE) {
      return val1 === 2 || val1 === 13;
    }
    
    return Math.abs(val1 - val2) === 1 || Math.abs(val1 - val2) === 12;
  };

  const playCard = (card: CardData, pileIdx: number, isPlayer: boolean) => {
    if (!centerPiles) return;
    if (!canPlayOn(card, centerPiles[pileIdx])) return;

    const newCenter = [...centerPiles] as [CardData, CardData];
    newCenter[pileIdx] = card;
    setCenterPiles(newCenter);

    if (isPlayer) {
      const newHand = playerHand.filter(c => c.id !== card.id);
      if (playerDeck.length > 0) {
        const newDeck = [...playerDeck];
        newHand.push(newDeck.pop()!);
        setPlayerDeck(newDeck);
      }
      setPlayerHand(newHand);
      if (newHand.length === 0) {
        setWinner('Player');
        recordGameResult(GameMode.SPEED, true);
      }
    } else {
      const newHand = aiHand.filter(c => c.id !== card.id);
      if (aiDeck.length > 0) {
        const newDeck = [...aiDeck];
        newHand.push(newDeck.pop()!);
        setAiDeck(newDeck);
      }
      setAiHand(newHand);
      if (newHand.length === 0) {
        setWinner('AI');
        recordGameResult(GameMode.SPEED, false);
      }
    }
  };

  const handleStuck = () => {
    if (!sidePiles[0].length || !sidePiles[1].length) {
      return;
    }
    const newSide = [...sidePiles] as [CardData[], CardData[]];
    const newCenter = [newSide[0].pop()!, newSide[1].pop()!] as [CardData, CardData];
    setSidePiles(newSide);
    setCenterPiles(newCenter);
  };

  // AI Logic
  useEffect(() => {
    if (!winner && centerPiles && !isPaused) {
      const timer = setInterval(() => {
        const playable = aiHand.find(c => canPlayOn(c, centerPiles[0]) || canPlayOn(c, centerPiles[1]));
        if (playable) {
          const pileIdx = canPlayOn(playable, centerPiles[0]) ? 0 : 1;
          playCard(playable, pileIdx, false);
        }
      }, 2000); // AI plays every 2 seconds
      return () => clearInterval(timer);
    }
  }, [aiHand, centerPiles, winner, isPaused]);

  if (!centerPiles) return null;

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 relative overflow-y-auto">
      <AnimatePresence>
        {showRules && (
          <RulesModal 
            gameName="Speed"
            storageKey="show_rules_speed"
            onClose={() => setShowRules(false)}
            howToPlay={[
              "Each player starts with a hand of 5 cards and a deck of 15.",
              "Play cards from your hand onto either of the two center piles.",
              "Your hand is automatically refilled from your deck.",
              "If neither player can move, click the side piles to flip new cards."
            ]}
            rules={[
              "Goal: Be the first to get rid of all cards in your hand and deck.",
              "Valid Moves: You can play a card that is exactly one rank higher or lower than the top card of a center pile.",
              "Aces are high and low: You can play a 2 or a King on an Ace.",
              "No turns: Both players play simultaneously as fast as they can!"
            ]}
          />
        )}
      </AnimatePresence>
       <div className="flex justify-between items-center mb-4 md:mb-8">
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={onBack} className="flex items-center gap-1 md:gap-2 text-emerald-200 hover:text-white transition-colors text-sm md:text-base">
            <ArrowLeft className="w-4 h-4 md:w-5 h-5" /> <span className="hidden sm:inline">Back</span>
          </button>
          <button 
            onClick={() => setIsPaused(true)} 
            className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center text-emerald-200 hover:bg-white/10 hover:text-white transition-all"
          >
            <Pause className="w-4 h-4 md:w-5 h-5" />
          </button>
        </div>
        <h2 className="text-lg md:text-2xl font-bold tracking-widest uppercase">Speed</h2>
        <button onClick={startNewGame} className="flex items-center gap-1 md:gap-2 text-emerald-200 hover:text-white transition-colors text-sm md:text-base">
          <RotateCcw className="w-4 h-4 md:w-5 h-5" /> <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-between items-center relative min-h-[500px]">
        {/* In-Game Scoreboard */}
        <div className="absolute top-0 left-0 flex flex-col gap-2 z-10 scale-75 sm:scale-100 origin-top-left">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-3 md:p-4 min-w-[120px] md:min-w-[160px]">
            <div className="flex items-center gap-2 mb-2 md:mb-3 border-b border-white/5 pb-2">
              <Trophy className="w-3 h-3 md:w-4 h-4 text-yellow-500" />
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/60">Scoreboard</span>
            </div>
            <div className="space-y-2 md:space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] md:text-xs font-bold text-white/80">You</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] md:text-sm font-black text-white">{playerHand.length + playerDeck.length} left</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-500" />
                  <span className="text-[10px] md:text-xs font-bold text-white/80">AI</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] md:text-sm font-black text-white">{aiHand.length + aiDeck.length} left</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-2 md:p-3 flex items-center gap-2 md:gap-3">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <Zap className="w-3 h-3 md:w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <div className="text-[6px] md:text-[8px] font-black text-white/40 uppercase tracking-widest">Status</div>
              <div className="text-[8px] md:text-[10px] font-bold text-yellow-400 uppercase">Race!</div>
            </div>
          </div>
        </div>

        {/* AI Area */}
        <div className="flex flex-col items-center">
          <div className="text-[8px] md:text-xs font-bold text-emerald-200/40 mb-1 md:mb-2">AI Hand ({aiDeck.length} in deck)</div>
          <div className="flex gap-1 md:gap-2">
            {aiHand.map((c) => <Card key={c.id} isFaceUp={false} isSmall />)}
          </div>
        </div>

        {/* Center Area */}
        <div className="flex items-center gap-4 md:gap-8 flex-wrap justify-center">
          <div className="text-center">
            <div className="text-[8px] md:text-[10px] uppercase font-bold text-emerald-200/40 mb-1 md:mb-2">Side</div>
            <Card isFaceUp={false} onClick={handleStuck} className="opacity-50" isSmall={window.innerWidth < 640} />
          </div>
          
          <div className="flex gap-2 md:gap-4">
            <Card card={centerPiles[0]} isSmall={window.innerWidth < 640} />
            <Card card={centerPiles[1]} isSmall={window.innerWidth < 640} />
          </div>

          <div className="text-center">
            <div className="text-[8px] md:text-[10px] uppercase font-bold text-emerald-200/40 mb-1 md:mb-2">Side</div>
            <Card isFaceUp={false} onClick={handleStuck} className="opacity-50" isSmall={window.innerWidth < 640} />
          </div>
        </div>

        {/* Player Area */}
        <div className="flex flex-col items-center pb-4 md:pb-8">
          <div className="flex flex-wrap justify-center gap-1 md:gap-2 mb-2">
            {playerHand.map((card) => (
              <div key={card.id} className="flex flex-col gap-1">
                <Card 
                  card={card} 
                  isSmall={window.innerWidth < 640}
                  onClick={() => {
                    if (canPlayOn(card, centerPiles[0])) playCard(card, 0, true);
                    else if (canPlayOn(card, centerPiles[1])) playCard(card, 1, true);
                  }}
                  className={canPlayOn(card, centerPiles[0]) || canPlayOn(card, centerPiles[1]) ? 'ring-2 md:ring-4 ring-emerald-400' : ''}
                />
              </div>
            ))}
          </div>
          <div className="text-[8px] md:text-xs font-bold text-emerald-200/40">Your Hand ({playerDeck.length} in deck)</div>
        </div>
      </div>

      {/* Win Modal */}
      <AnimatePresence>
        {winner && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-6"
          >
            <div className="bg-slate-900 p-12 rounded-[3rem] border border-white/10 text-center shadow-2xl max-w-lg w-full">
              <h2 className="text-6xl font-black mb-2 text-white tracking-tight italic">
                {winner === 'Player' ? 'YOU WIN!' : 'AI WINS!'}
              </h2>
              <p className="text-emerald-400 text-sm mb-12 font-bold uppercase tracking-widest">Game Over</p>
              
              <div className="flex flex-col gap-4">
                <button 
                  onClick={startNewGame}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black py-4 rounded-2xl text-xl transition-all shadow-lg hover:shadow-emerald-500/20"
                >
                  PLAY AGAIN
                </button>
                <button 
                  onClick={onBack}
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl text-xl transition-all"
                >
                  MAIN MENU
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pause Modal */}
      <AnimatePresence>
        {isPaused && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50"
          >
            <div className="bg-slate-900 p-12 rounded-[3rem] border border-white/10 text-center shadow-2xl max-w-md w-full">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                <Pause className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-4xl font-black mb-2 text-white tracking-tight">GAME PAUSED</h3>
              <p className="text-emerald-400 text-sm mb-12 font-bold uppercase tracking-widest">Take a breather</p>
              
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => setIsPaused(false)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black py-4 rounded-2xl text-xl transition-all flex items-center justify-center gap-3"
                >
                  <PlayIcon className="w-5 h-5 fill-current" /> CONTINUE GAME
                </button>
                <button 
                  onClick={onBack}
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl text-xl transition-all flex items-center justify-center gap-3"
                >
                  <Home className="w-5 h-5" /> MAIN MENU
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
