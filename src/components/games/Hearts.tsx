import React, { useState, useEffect } from 'react';
import { CardData, Suit, Rank, GameMode } from '../../types';
import { createDeck, shuffleDeck, getCardValue } from '../../utils/deck';
import { Card } from '../Card';
import { RulesModal } from '../RulesModal';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Pause, Play as PlayIcon, Home, Trophy, Users } from 'lucide-react';
import { recordGameResult } from '../../utils/stats';

interface HeartsProps {
  onBack: () => void;
}

export const Hearts: React.FC<HeartsProps> = ({ onBack }) => {
  const [hands, setHands] = useState<CardData[][]>([[], [], [], []]); // 0 is player
  const [trick, setTrick] = useState<(CardData | null)[]>([]);
  const [scores, setScores] = useState([0, 0, 0, 0]);
  const [turn, setTurn] = useState(0);
  const [heartsBroken, setHeartsBroken] = useState(false);
  const [leadingSuit, setLeadingSuit] = useState<Suit | null>(null);
  const [roundWinner, setRoundWinner] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showRules, setShowRules] = useState(() => {
    return localStorage.getItem('show_rules_hearts') !== 'false';
  });

  const startNewGame = () => {
    const deck = shuffleDeck(createDeck());
    const newHands: CardData[][] = [[], [], [], []];
    for (let i = 0; i < 52; i++) {
      newHands[i % 4].push(deck[i]);
    }
    
    newHands.forEach(h => h.sort((a, b) => {
      if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
      return getCardValue(a.rank) - getCardValue(b.rank);
    }));

    setHands(newHands);
    setTrick([null, null, null, null]);
    setScores([0, 0, 0, 0]);
    setHeartsBroken(false);
    setLeadingSuit(null);
    setRoundWinner(null);

    const starter = newHands.findIndex(h => h.some(c => c.rank === Rank.TWO && c.suit === Suit.CLUBS));
    setTurn(starter !== -1 ? starter : 0);
  };

  useEffect(() => {
    startNewGame();
  }, []);

  const playCard = (playerIdx: number, card: CardData) => {
    if (turn !== playerIdx) return;
    
    if (trick.every(c => c === null)) {
      if (card.suit === Suit.HEARTS && !heartsBroken) {
        const onlyHearts = hands[playerIdx].every(c => c.suit === Suit.HEARTS);
        if (!onlyHearts) return;
      }
      setLeadingSuit(card.suit);
    } else {
      const hasSuit = hands[playerIdx].some(c => c.suit === leadingSuit);
      if (hasSuit && card.suit !== leadingSuit) return;
    }

    if (card.suit === Suit.HEARTS) setHeartsBroken(true);

    const newHands = [...hands];
    newHands[playerIdx] = newHands[playerIdx].filter(c => c.id !== card.id);
    setHands(newHands);

    const newTrick = [...trick];
    newTrick[playerIdx] = card;
    setTrick(newTrick);

    setTurn((playerIdx + 1) % 4);
  };

  useEffect(() => {
    if (turn !== 0 && !roundWinner && !trick.every(c => c !== null) && !isPaused) {
      const timer = setTimeout(() => {
        const aiHand = hands[turn];
        if (!aiHand.length) return;

        let playable = aiHand.filter(c => {
          if (trick.every(t => t === null)) {
            if (c.suit === Suit.HEARTS && !heartsBroken) {
               return aiHand.every(h => h.suit === Suit.HEARTS);
            }
            return true;
          }
          const hasSuit = aiHand.some(h => h.suit === leadingSuit);
          if (hasSuit) return c.suit === leadingSuit;
          return true;
        });

        if (playable.length === 0) playable = aiHand;
        playCard(turn, playable[0]);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [turn, hands, trick, leadingSuit, heartsBroken, roundWinner, isPaused]);

  useEffect(() => {
    if (trick.every(c => c !== null) && !isPaused) {
      const timer = setTimeout(() => {
        let winner = 0;
        let highestVal = -1;
        
        trick.forEach((card, i) => {
          if (card?.suit === leadingSuit) {
            const val = getCardValue(card.rank);
            if (val > highestVal) {
              highestVal = val;
              winner = i;
            }
          }
        });

        let points = 0;
        trick.forEach(c => {
          if (c?.suit === Suit.HEARTS) points += 1;
          if (c?.rank === Rank.QUEEN && c?.suit === Suit.SPADES) points += 13;
        });

        const newScores = [...scores];
        newScores[winner] += points;
        setScores(newScores);
        setRoundWinner(winner);
        
        setTimeout(() => {
          setTrick([null, null, null, null]);
          setTurn(winner);
          setLeadingSuit(null);
          setRoundWinner(null);

          // Check if game is over (no cards left)
          if (hands.every(h => h.length === 0)) {
            setGameOver(true);
            const playerWon = newScores[0] === Math.min(...newScores);
            recordGameResult(GameMode.HEARTS, playerWon);
          }
        }, 2000);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [trick, leadingSuit, isPaused]);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 relative overflow-y-auto">
      <AnimatePresence>
        {showRules && (
          <RulesModal 
            gameName="Hearts"
            storageKey="show_rules_hearts"
            onClose={() => setShowRules(false)}
            howToPlay={[
              "The game is played in rounds. Each player is dealt 13 cards.",
              "The player with the 2 of Clubs starts the first trick.",
              "You must follow suit if possible. If not, you can play any card.",
              "The highest card of the suit led wins the trick and leads the next one."
            ]}
            rules={[
              "Goal: Have the lowest score at the end of the game.",
              "Penalty Cards: Each Heart is worth 1 point. The Queen of Spades is worth 13 points.",
              "Hearts cannot be led until they have been 'broken' (played on a previous trick).",
              "Shooting the Moon: If you take all Hearts and the Queen of Spades, you get 0 points and everyone else gets 26 (not implemented in this version, but good to know!)."
            ]}
          />
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mb-2 md:mb-4">
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
        <h2 className="text-lg md:text-2xl font-bold tracking-widest uppercase">Hearts</h2>
        <button onClick={startNewGame} className="flex items-center gap-1 md:gap-2 text-emerald-200 hover:text-white transition-colors text-sm md:text-base">
          <RotateCcw className="w-4 h-4 md:w-5 h-5" /> <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      <div className="flex-1 grid grid-cols-3 grid-rows-3 gap-2 md:gap-4 relative min-h-[500px]">
        {/* In-Game Scoreboard */}
        <div className="absolute top-0 left-0 flex flex-col gap-2 z-10 scale-75 sm:scale-100 origin-top-left">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-3 md:p-4 min-w-[120px] md:min-w-[160px]">
            <div className="flex items-center gap-2 mb-2 md:mb-3 border-b border-white/5 pb-2">
              <Trophy className="w-3 h-3 md:w-4 h-4 text-yellow-500" />
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/60">Scoreboard</span>
            </div>
            <div className="space-y-1.5 md:space-y-2">
              {scores.map((s, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${i === 0 ? 'bg-emerald-500' : 'bg-white/20'}`} />
                    <span className="text-[10px] md:text-xs font-bold text-white/80">{i === 0 ? 'You' : `AI ${i}`}</span>
                  </div>
                  <span className="text-xs md:text-sm font-black text-white">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-start-2 row-start-1 flex flex-col items-center">
          <div className="text-[8px] md:text-xs font-bold text-emerald-200/40 mb-1 md:mb-2">AI 2 ({scores[2]})</div>
          <div className="flex -space-x-6 md:-space-x-10">
            {hands[2].map((_, i) => <Card key={i} isFaceUp={false} isSmall />)}
          </div>
        </div>

        <div className="col-start-1 row-start-2 flex items-center justify-center">
           <div className="rotate-90 flex -space-x-6 md:-space-x-10">
             {hands[1].map((_, i) => <Card key={i} isFaceUp={false} isSmall />)}
           </div>
           <div className="text-[8px] md:text-xs font-bold text-emerald-200/40 ml-2 md:ml-4">AI 1 ({scores[1]})</div>
        </div>

        <div className="col-start-2 row-start-2 relative flex items-center justify-center">
          <div className="absolute top-0"><Card card={trick[2] || undefined} isFaceUp={!!trick[2]} isSmall /></div>
          <div className="absolute left-0"><Card card={trick[1] || undefined} isFaceUp={!!trick[1]} isSmall /></div>
          <div className="absolute right-0"><Card card={trick[3] || undefined} isFaceUp={!!trick[3]} isSmall /></div>
          <div className="absolute bottom-0"><Card card={trick[0] || undefined} isFaceUp={!!trick[0]} isSmall /></div>
          
          {roundWinner !== null && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white/10 text-white px-2 py-1 md:px-4 md:py-2 rounded-full text-[8px] md:text-xs font-bold z-20"
            >
              Winner: {roundWinner === 0 ? 'You' : `AI ${roundWinner}`}
            </motion.div>
          )}
        </div>

        <div className="col-start-3 row-start-2 flex items-center justify-center">
           <div className="text-[8px] md:text-xs font-bold text-emerald-200/40 mr-2 md:ml-4">AI 3 ({scores[3]})</div>
           <div className="-rotate-90 flex -space-x-6 md:-space-x-10">
             {hands[3].map((_, i) => <Card key={i} isFaceUp={false} isSmall />)}
           </div>
        </div>

        <div className="col-start-1 col-span-3 row-start-3 flex flex-col items-center justify-end pb-4 w-full overflow-hidden">
          <div className="text-[8px] md:text-xs font-bold text-emerald-200/40 mb-1 md:mb-2">Your Hand ({scores[0]})</div>
          <div className="max-w-[100vw] w-full flex items-center justify-start md:justify-center overflow-x-auto custom-scrollbar gap-1 md:-space-x-6 md:hover:-space-x-2 px-4 transition-all duration-300 pb-6 pt-4 snap-x">
            {hands[0].map((card) => (
              <Card 
                key={card.id} 
                card={card} 
                isSmall={false}
                onClick={() => playCard(0, card)}
                className={`md:hover:-translate-y-4 transition-transform ${turn === 0 ? 'ring-2 ring-emerald-400' : 'opacity-80'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Win Modal */}
      <AnimatePresence>
        {gameOver && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <div className="bg-slate-900 p-6 md:p-12 rounded-3xl md:rounded-[3rem] border border-white/10 text-center shadow-2xl max-w-lg w-full max-h-screen overflow-y-auto">
              <h2 className="text-4xl md:text-6xl font-black mb-2 text-white tracking-tight italic">
                {scores[0] === Math.min(...scores) ? 'YOU WIN!' : 'GAME OVER'}
              </h2>
              <p className="text-emerald-400 text-xs md:text-sm mb-8 md:mb-12 font-bold uppercase tracking-widest">Final Scores</p>
              
              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-8 md:mb-12">
                {scores.map((s, i) => (
                  <div key={i} className="bg-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/10">
                    <div className="text-[8px] md:text-[10px] uppercase font-bold text-emerald-200/40">{i === 0 ? 'You' : `AI ${i}`}</div>
                    <div className="text-xl md:text-2xl font-black text-white">{s}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 md:gap-4">
                <button 
                  onClick={() => { setGameOver(false); startNewGame(); }}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black py-3 md:py-4 rounded-xl md:rounded-2xl text-lg md:text-xl transition-all shadow-lg hover:shadow-emerald-500/20"
                >
                  PLAY AGAIN
                </button>
                <button 
                  onClick={onBack}
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 md:py-4 rounded-xl md:rounded-2xl text-lg md:text-xl transition-all"
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
            className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <div className="bg-slate-900 p-6 md:p-12 rounded-3xl md:rounded-[3rem] border border-white/10 text-center shadow-2xl max-w-md w-full max-h-screen overflow-y-auto">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 border border-emerald-500/30">
                <Pause className="w-8 h-8 md:w-10 md:h-10 text-emerald-500" />
              </div>
              <h3 className="text-2xl md:text-4xl font-black mb-2 text-white tracking-tight">GAME PAUSED</h3>
              <p className="text-emerald-400 text-xs md:text-sm mb-8 md:mb-12 font-bold uppercase tracking-widest">Hearts are heavy</p>
              
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
