import React, { useState, useEffect } from 'react';
import { CardData, Rank, GameMode } from '../../types';
import { createDeck, shuffleDeck, getCardValue } from '../../utils/deck';
import { Card } from '../Card';
import { RulesModal } from '../RulesModal';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Pause, Play as PlayIcon, Home, Trophy, User } from 'lucide-react';
import { recordGameResult } from '../../utils/stats';

interface BlackjackProps {
  onBack: () => void;
  playerCount: number;
}

export const Blackjack: React.FC<BlackjackProps> = ({ onBack, playerCount }) => {
  const [deck, setDeck] = useState<CardData[]>([]);
  const [playerHand, setPlayerHand] = useState<CardData[]>([]);
  const [aiHands, setAiHands] = useState<CardData[][]>([]);
  const [dealerHand, setDealerHand] = useState<CardData[]>([]);
  const [gameState, setGameState] = useState<'BETTING' | 'PLAYING' | 'AI_TURN' | 'DEALER_TURN' | 'FINISHED'>('BETTING');
  const [activeAiIndex, setActiveAiIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [message, setMessage] = useState('');
  const [showRules, setShowRules] = useState(() => {
    return localStorage.getItem('show_rules_blackjack') !== 'false';
  });

  const calculateScore = (hand: CardData[]) => {
    if (!hand || hand.length === 0) return 0;
    let score = 0;
    let aces = 0;
    for (const card of hand) {
      if (card.rank === Rank.ACE) {
        aces += 1;
        score += 11;
      } else {
        score += getCardValue(card.rank);
      }
    }
    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }
    return score;
  };

  const startNewGame = () => {
    const newDeck = shuffleDeck(createDeck());
    const pHand = [newDeck.pop()!, newDeck.pop()!];
    
    const newAiHands = [];
    for (let i = 0; i < playerCount - 1; i++) {
      newAiHands.push([newDeck.pop()!, newDeck.pop()!]);
    }

    const dHand = [newDeck.pop()!, newDeck.pop()!];
    
    setDeck(newDeck);
    setPlayerHand(pHand);
    setAiHands(newAiHands);
    setDealerHand(dHand);
    setGameState('PLAYING');
    setMessage('');
    setActiveAiIndex(0);
  };

  const hit = () => {
    if (gameState !== 'PLAYING') return;
    const newDeck = [...deck];
    const newCard = newDeck.pop()!;
    const newHand = [...playerHand, newCard];
    
    setDeck(newDeck);
    setPlayerHand(newHand);
    
    if (calculateScore(newHand) > 21) {
      if (playerCount > 1) {
        setGameState('AI_TURN');
        setMessage('You Busted!');
      } else {
        setGameState('FINISHED');
        setMessage('BUST! Dealer Wins.');
        recordGameResult(GameMode.BLACKJACK, false);
      }
    }
  };

  const stand = () => {
    if (playerCount > 1) {
      setGameState('AI_TURN');
    } else {
      setGameState('DEALER_TURN');
    }
  };

  useEffect(() => {
    if (gameState === 'AI_TURN' && !isPaused) {
      if (activeAiIndex < aiHands.length) {
        const currentAiHand = aiHands[activeAiIndex];
        const currentAiScore = calculateScore(currentAiHand);

        if (currentAiScore < 17) {
          setTimeout(() => {
            const newDeck = [...deck];
            const newCard = newDeck.pop()!;
            const newAiHands = [...aiHands];
            newAiHands[activeAiIndex] = [...currentAiHand, newCard];
            
            setDeck(newDeck);
            setAiHands(newAiHands);
          }, 800);
        } else {
          setActiveAiIndex(prev => prev + 1);
        }
      } else {
        setGameState('DEALER_TURN');
      }
    }
  }, [gameState, aiHands, activeAiIndex, isPaused]);

  useEffect(() => {
    if (gameState === 'DEALER_TURN' && !isPaused) {
      const dealerScore = calculateScore(dealerHand);
      if (dealerScore < 17) {
        setTimeout(() => {
          const newDeck = [...deck];
          const newCard = newDeck.pop()!;
          setDeck(newDeck);
          setDealerHand([...dealerHand, newCard]);
        }, 1000);
      } else {
        const playerScore = calculateScore(playerHand);
        if (playerScore > 21) {
          setMessage('Dealer Wins.');
          recordGameResult(GameMode.BLACKJACK, false);
        } else if (dealerScore > 21) {
          setMessage('Dealer Busts! You Win!');
          recordGameResult(GameMode.BLACKJACK, true);
        } else if (dealerScore > playerScore) {
          setMessage('Dealer Wins.');
          recordGameResult(GameMode.BLACKJACK, false);
        } else if (dealerScore < playerScore) {
          setMessage('You Win!');
          recordGameResult(GameMode.BLACKJACK, true);
        } else {
          setMessage('Push (Tie).');
          recordGameResult(GameMode.BLACKJACK, false); 
        }
        setGameState('FINISHED');
      }
    }
  }, [gameState, dealerHand, isPaused]);

  const playerScore = calculateScore(playerHand);
  const dealerScore = gameState === 'PLAYING' || gameState === 'AI_TURN' ? '?' : calculateScore(dealerHand);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 relative overflow-y-auto">
      <AnimatePresence>
        {showRules && (
          <RulesModal 
            gameName="Blackjack"
            storageKey="show_rules_blackjack"
            onClose={() => setShowRules(false)}
            howToPlay={[
              "Place your bet and receive two cards.",
              "Choose to 'Hit' for another card or 'Stand' to keep your current total.",
              "The dealer will draw until they reach at least 17."
            ]}
            rules={[
              "Goal: Get closer to 21 than the dealer without going over (busting).",
              "Card Values: Face cards (J, Q, K) are worth 10. Aces are worth 1 or 11.",
              "Blackjack: An Ace and a 10-value card on the deal is an automatic win unless the dealer also has it.",
              "Dealer Rules: The dealer must hit on 16 and stand on all 17s.",
              "Push: If you and the dealer have the same total, it's a tie."
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
        <h2 className="text-lg md:text-2xl font-bold tracking-widest uppercase">Blackjack</h2>
        <button onClick={startNewGame} className="flex items-center gap-1 md:gap-2 text-emerald-200 hover:text-white transition-colors text-sm md:text-base">
          <RotateCcw className="w-4 h-4 md:w-5 h-5" /> <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-around items-center relative min-h-[400px]">
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
                <span className="text-xs md:text-sm font-black text-white">{playerScore}</span>
              </div>
              {aiHands.map((hand, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${gameState === 'AI_TURN' && activeAiIndex === i ? 'bg-yellow-500 animate-pulse' : 'bg-blue-500'}`} />
                    <span className="text-[10px] md:text-xs font-bold text-white/80">AI {i + 1}</span>
                  </div>
                  <span className="text-xs md:text-sm font-black text-white">{calculateScore(hand)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${gameState === 'DEALER_TURN' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-[10px] md:text-xs font-bold text-white/80">Dealer</span>
                </div>
                <span className="text-xs md:text-sm font-black text-white">{dealerScore}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dealer Area */}
        <div className="text-center w-full">
          <div className="text-emerald-200/60 text-[10px] md:text-xs font-bold uppercase mb-2 md:mb-4 tracking-widest">Dealer Hand ({dealerScore})</div>
          <div className="flex gap-2 md:gap-4 justify-center flex-wrap">
            {dealerHand.map((card, i) => (
              <Card key={card.id} card={card} isFaceUp={i === 0 || (gameState !== 'PLAYING' && gameState !== 'AI_TURN')} isSmall={false} />
            ))}
            {dealerHand.length === 0 && <div className="w-16 h-24 md:w-24 md:h-36 border-2 border-dashed border-white/10 rounded-lg" />}
          </div>
        </div>

        {/* AI Players Area */}
        {aiHands.length > 0 && (
          <div className="flex gap-8 justify-center w-full overflow-x-auto py-4 no-scrollbar">
            {aiHands.map((hand, i) => (
              <div key={i} className={`text-center transition-all ${gameState === 'AI_TURN' && activeAiIndex === i ? 'scale-110' : 'opacity-50 grayscale'}`}>
                <div className="flex gap-1 justify-center mb-2">
                  {hand.map((card) => (
                    <Card key={card.id} card={card} isSmall />
                  ))}
                </div>
                <div className="text-[8px] font-black uppercase tracking-widest text-white/60">AI {i + 1} ({calculateScore(hand)})</div>
              </div>
            ))}
          </div>
        )}

        {/* Message Area */}
        <AnimatePresence>
          {message && (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white text-emerald-900 px-4 py-2 md:px-8 md:py-4 rounded-full font-black text-lg md:text-2xl shadow-2xl z-10 my-4"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player Area */}
        <div className="text-center w-full">
          <div className="flex gap-2 md:gap-4 justify-center mb-2 md:mb-4 flex-wrap">
            {playerHand.map((card) => (
              <Card key={card.id} card={card} isSmall={false} />
            ))}
            {playerHand.length === 0 && <div className="w-16 h-24 md:w-24 md:h-36 border-2 border-dashed border-white/10 rounded-lg" />}
          </div>
          <div className="text-emerald-200/60 text-[10px] md:text-xs font-bold uppercase tracking-widest">Your Hand ({playerScore})</div>
        </div>
      </div>

      {/* Controls */}
      <div className="h-20 md:h-24 flex justify-center items-center gap-2 md:gap-4 mt-4">
        {gameState === 'BETTING' || gameState === 'FINISHED' ? (
          <div className="flex gap-2 md:gap-4">
            <button 
              onClick={startNewGame}
              className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold px-6 py-2 md:px-12 md:py-3 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 text-sm md:text-base"
            >
              DEAL CARDS
            </button>
            {gameState === 'FINISHED' && (
              <button 
                onClick={onBack}
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 md:px-8 md:py-3 rounded-xl transition-all text-sm md:text-base"
              >
                MENU
              </button>
            )}
          </div>
        ) : (
          <>
            <button 
              onClick={hit}
              disabled={gameState !== 'PLAYING'}
              className="bg-white hover:bg-slate-100 text-slate-900 font-bold px-6 py-2 md:px-8 md:py-3 rounded-xl transition-all shadow-lg disabled:opacity-50 text-sm md:text-base"
            >
              HIT
            </button>
            <button 
              onClick={stand}
              disabled={gameState !== 'PLAYING'}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2 md:px-8 md:py-3 rounded-xl transition-all shadow-lg disabled:opacity-50 text-sm md:text-base"
            >
              STAND
            </button>
          </>
        )}
      </div>

      {/* Pause Modal */}
      <AnimatePresence>
        {isPaused && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <div className="bg-slate-900 p-6 md:p-12 rounded-3xl md:rounded-[3rem] border border-white/10 text-center shadow-2xl max-w-md w-full max-h-screen overflow-y-auto">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 border border-emerald-500/30">
                <Pause className="w-8 h-8 md:w-10 md:h-10 text-emerald-500" />
              </div>
              <h3 className="text-2xl md:text-4xl font-black mb-2 text-white tracking-tight">GAME PAUSED</h3>
              <p className="text-emerald-400 text-xs md:text-sm mb-8 md:mb-12 font-bold uppercase tracking-widest">Dealer is waiting</p>
              
              <div className="flex flex-col gap-3 md:gap-4">
                <button 
                  onClick={() => setIsPaused(false)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black py-3 md:py-4 rounded-xl md:rounded-2xl text-lg md:text-xl transition-all flex items-center justify-center gap-2 md:gap-3"
                >
                  <PlayIcon className="w-4 h-4 md:w-5 md:h-5 fill-current" /> CONTINUE GAME
                </button>
                <button 
                  onClick={onBack}
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 md:py-4 rounded-xl md:rounded-2xl text-lg md:text-xl transition-all flex items-center justify-center gap-2 md:gap-3"
                >
                  <Home className="w-4 h-4 md:w-5 md:h-5" /> MAIN MENU
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
