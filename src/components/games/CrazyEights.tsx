import React, { useState, useEffect } from 'react';
import { CardData, Rank, Suit, GameMode } from '../../types';
import { createDeck, shuffleDeck } from '../../utils/deck';
import { Card } from '../Card';
import { RulesModal } from '../RulesModal';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, AlertCircle, Pause, Play as PlayIcon, Home, Trophy, Users } from 'lucide-react';
import { recordGameResult } from '../../utils/stats';

interface CrazyEightsProps {
  onBack: () => void;
  playerCount: number;
}

interface LogEntry {
  id: string;
  message: string;
  type: 'info' | 'action' | 'penalty' | 'success';
  timestamp: number;
}

const RESTRICTED_WINNING_RANKS = [
  Rank.ACE, Rank.TWO, Rank.JOKER, Rank.SEVEN, Rank.KING, Rank.EIGHT, Rank.JACK
];

const RESTRICTED_START_RANKS = [

];

const aiNames = [
  // --- Shona Names ---
  "Kudzai", "Tadiwa", "Farai", "Nyasha", "Tendai", "Ruvimbo", "Chipo", "Tatenda", "Mufaro", "Rufaro",
  "Tinashe", "Kumbirayi", "Anesu", "Sekai", "Tafadzwa", "Munashe", "Panashe", "Tapiwa", "Vimbai", "Isheanesu",
  "Tanyaradzwa", "Rumbidzai", "Takunda", "Chengetai", "Mazvita", "Tariro", "Munya", "Nyeredzi", "Garikai", "Ruvarashe",
  "Farayi", "Shingai", "Simbarashe", "Tawananyasha", "Netsai", "Fadzai", "Zvikomborero", "Tariromunashe", "Makanaka", "Rudo",

  // --- Ndebele Names ---
  "Thandeka", "Sibusiso", "Bhekuzulu", "Nqobile", "Lindiwe", "Mthokozisi", "Gugu", "Senzangakhona", "Thulani", "Nomusa",
  "Dumiso", "Jabulani", "Khanyisile", "Mandla", "Nomalanga", "Sihle", "Thabani", "Vusumuzi", "Zanele", "Zenzo",
  "Ayanda", "Busisiwe", "Mlungisi", "Njabulo", "Sibonokuhle", "Sibongile", "Nhlalo", "Thandazile", "Qondile", "Bhekinkosi",
  "Nonjabulo", "Mthandazo", "Sindisiwe", "Thabitha", "Dumisile", "Phakamile", "Nokuthaba", "Siphilisa", "Thembekile", "Nompilo",

  // --- Zulu Names ---
  "Sipho", "Lungelo", "Mbali", "Nandi", "Zodwa", "Bheki", "Thembi", "Bandile", "Simphiwe", "Nokuthula",
  "Melusi", "Lwandle", "Sfiso", "Zanele", "Thabo", "Hlengiwe", "Siyabonga", "Dumisani", "Zonke", "Khaya",
  "Nonhlanhla", "Sizwe", "Mpendulo", "Khethiwe", "Bongani", "Lethabo", "Nkosana", "Thandolwethu", "Minhle", "Zinhle",
  "Sakhile", "Bawinile", "Nqaba", "Snethemba", "Mjabulelwa", "Nokwanda", "Sphesihle", "Zanelle", "Mpumi", "Thabisa",

  // --- English Names ---
  "James", "Sarah", "Victor", "Blessing", "Prudence", "Prince", "Grace", "Prosper", "Hope", "Joy",
  "Precious", "Gift", "Lovemore", "Patience", "Faith", "Bright", "Wisdom", "Fortune", "Charity",
  "Justice", "Liberty", "Mercy", "Praise", "Simba", "Oliver", "Amelia", "William", "Sophia", "Jacob",
  "Isabella", "Ethan", "Mia", "Alexander", "Charlotte", "Michael", "Harper", "Daniel", "Evelyn", "Matthew",

  // --- Spanish Names ---
  "Mateo", "Valentina", "Santiago", "Camila", "Matías", "Valeria", "Sebastián", "Isabella", "Leonardo", "Ximena",
  "Diego", "Daniela", "Thiago", "Sofia", "Emiliano", "María", "Julián", "Lucía", "Nicolás", "Victoria",
  "Lucas", "Martina", "Alejandro", "Luciana", "Benjamín", "Valeria", "Samuel", "Samantha", "Joaquín", "Gabriela",
  "Gabriel", "Mariana", "Tomás", "Antonella", "José", "Renata", "Miguel", "Emma", "David", "Catalina"
];

const aiPhrases = {
  // When the AI drops a +2 or a Joker on you
  aggressive: [
    "Pick them up, friend. You'll need the company.",
    "I hope you like drawing cards!",
    "Just a little gift from me to you.",
    "Don't look at me like that, it's just business.",
    "Ouch. That's going to hurt your hand.",
    "Stacking is a beautiful thing, isn't it?",
    "Is your hand getting heavy yet?",
    "Here, hold these for me.",
    "A present, just for you. Open it!",
    "Whoops, my hand slipped...",
    "I could have played nice, but where is the fun in that?",
    "Another one bites the dust. Draw up!",
    "It's raining cards! Hallelujah!",
    "You were doing so well, too. What a shame.",
    "I'll take 'Drawing Cards' for 500.",
    "Don't worry, they're lightweight.",
    "Think of it as expanding your options."
  ],
  // When the AI is winning or just played a good move
  winning: [
    "I've got you right where I want you.",
    "Is that the best you can do?",
    "Checkmate... wait, wrong game. But I'm winning!",
    "I could do this in my sleep.",
    "You're making this too easy for me.",
    "Are you even trying to win?",
    "Read 'em and weep.",
    "Victory is in the air. Can you smell it?",
    "I almost feel bad for you. Almost.",
    "Class is in session. Take notes.",
    "Just call me the card whisperer.",
    "Did you really think that would work?",
    "My grandmother plays better than that.",
    "I'm not even using my full processing power.",
    "It's like playing against a child.",
    "I'll be done here in a minute."
  ],
  // When you play a Power Card on the AI
  salty: [
    "Hey! I was almost out!",
    "That was uncalled for.",
    "You're lucky I don't have an Ace right now.",
    "Oh, so we're playing like THAT now?",
    "I'll remember this when it's my turn.",
    "Fine. I needed more cards anyway...",
    "Was that really necessary?",
    "You've just made a very powerful enemy.",
    "I hope you step on a Lego for that.",
    "My revenge will be swift and terrible.",
    "I was just about to win! Inconceivable!",
    "Are we doing this? Okay, gloves are off.",
    "I didn't want to win this round anyway.",
    "That's just petty. I respect it, but petty.",
    "I call foul! Ref! Where is the ref?",
    "You're going to pay for that one."
  ],
  // General Game Start
  intro: [
    "Good luck, you're going to need it.",
    "Let's see if you can handle my strategy.",
    "Prepare to be defeated!",
    "Ready to lose some digital coins?",
    "I’ve calculated a 99% chance of your defeat.",
    "May the best algorithm win.",
    "It's time to duel! ...I mean, play cards.",
    "Don't cry when I take all your points.",
    "I hope you brought your A-game.",
    "Let the best hand win. (Spoiler: It's mine).",
    "I'm programmed to be ruthless today.",
    "Another game, another inevitable victory.",
    "I've analyzed your play style. It's... lacking.",
    "Let's make this quick, I have computations to run."
  ]
};

// Function to trigger a random shout
const getAiShout = (category: keyof typeof aiPhrases) => {
  const list = aiPhrases[category];
  return list[Math.floor(Math.random() * list.length)];
};

export const CrazyEights: React.FC<CrazyEightsProps> = ({ onBack, playerCount }) => {
  const [deck, setDeck] = useState<CardData[]>([]);
  const [playerHand, setPlayerHand] = useState<CardData[]>([]);
  const [aiHands, setAiHands] = useState<CardData[][]>([]);
  const [discardPile, setDiscardPile] = useState<CardData[]>([]);
  const [activePlayers, setActivePlayers] = useState<number[]>([]); // Indices of players still in the game
  const [turn, setTurn] = useState<number>(0); // 0 is player, 1+ are AI
  const [activeSuit, setActiveSuit] = useState<Suit | null>(null);
  const [penaltyCount, setPenaltyCount] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [roundResults, setRoundResults] = useState<{ playerIndex: number, points: number, eliminated: boolean, hand: CardData[] }[] | null>(null);
  const [showSuitPicker, setShowSuitPicker] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isEightBlocked, setIsEightBlocked] = useState(false);
  const [isSkipPending, setIsSkipPending] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(() => {
    return localStorage.getItem('show_rules_crazy_eights') !== 'false';
  });
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null);
  const [aiPlayerNames, setAiPlayerNames] = useState<string[]>([]);
  const [aiShouts, setAiShouts] = useState<Record<number, string | null>>({});
  const [sessionWins, setSessionWins] = useState<Record<number, number>>({});
  const [showDiscardSpread, setShowDiscardSpread] = useState(false);
  const [winExpandedPlayer, setWinExpandedPlayer] = useState<number | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showMobileLogs, setShowMobileLogs] = useState(false);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [
      {
        id: Math.random().toString(36).substr(2, 9),
        message,
        type,
        timestamp: Date.now()
      },
      ...prev
    ].slice(0, 50));
  };

  const triggerAiShout = (playerIndex: number, category: keyof typeof aiPhrases) => {
    const shout = getAiShout(category);
    setAiShouts(prev => ({ ...prev, [playerIndex]: shout }));
    setTimeout(() => {
      setAiShouts(prev => ({ ...prev, [playerIndex]: null }));
    }, 4000);
  };

  const getOpponentName = (playerIndex: number) => {
    const rawName = aiPlayerNames[playerIndex - 1] || `AI ${playerIndex}`;
    return playerCount === 2 ? `Opponent: ${rawName}` : rawName;
  };

  const getCardPoints = (card: CardData): number => {
    if (card.rank === Rank.ACE) return card.suit === Suit.SPADES ? 100 : 11;
    if (card.rank === Rank.TWO) return 25;
    if (card.rank === Rank.JOKER) return 50;
    if (card.rank === Rank.SEVEN) return 14;
    if (card.rank === Rank.EIGHT) return 40;
    if ([Rank.JACK, Rank.QUEEN, Rank.KING, Rank.TEN].includes(card.rank)) return 10;
    if (card.rank === Rank.NINE) return 9;
    if (card.rank === Rank.SIX) return 6;
    if (card.rank === Rank.FIVE) return 5;
    if (card.rank === Rank.FOUR) return 4;
    if (card.rank === Rank.THREE) return 3;
    return 0;
  };

  const calculateHandPoints = (hand: CardData[]) => {
    return hand.reduce((sum, card) => sum + getCardPoints(card), 0);
  };

  const startNewGame = (initialPlayers?: number[]) => {
    const players = initialPlayers || Array.from({ length: playerCount }, (_, i) => i);
    setActivePlayers(players);

    if (!initialPlayers) {
      if (aiPlayerNames.length === 0) {
        const shuffled = [...aiNames].sort(() => 0.5 - Math.random());
        const selectedNames = shuffled.slice(0, Math.max(0, playerCount - 1));
        setAiPlayerNames(selectedNames);
      }

      // Trigger intro shouts for all AI
      setTimeout(() => {
        players.forEach(pIdx => {
          if (pIdx > 0) triggerAiShout(pIdx, 'intro');
        });
      }, 1000);
    }

    const newDeck = shuffleDeck(createDeck());
    const pHand = [];
    const newAiHands: CardData[][] = Array.from({ length: playerCount - 1 }, () => []);

    // Deal to active players only
    const cardsPerPlayer = playerCount > 2 ? 3 : 7;
    for (let i = 0; i < cardsPerPlayer; i++) {
      if (players.includes(0)) pHand.push(newDeck.pop()!);
      for (let j = 1; j < playerCount; j++) {
        if (players.includes(j)) {
          newAiHands[j - 1].push(newDeck.pop()!);
        }
      }
    }

    let firstDiscard = newDeck.pop()!;
    // First card cannot be a special card (A, 2, Joker, 8, J, K, 7)
    while (RESTRICTED_START_RANKS.includes(firstDiscard.rank)) {
      newDeck.unshift(firstDiscard);
      firstDiscard = newDeck.pop()!;
    }

    setDeck(newDeck);
    setPlayerHand(pHand);
    setAiHands(newAiHands);
    setDiscardPile([firstDiscard]);
    setActiveSuit(firstDiscard.suit);
    setPenaltyCount(0);
    const startingPlayer = players[Math.floor(Math.random() * players.length)];
    setTurn(startingPlayer);
    setWinner(null);
    setRoundResults(null);
    setIsSkipPending(false);
    setShowSuitPicker(false);
    setHasDrawn(false);
    setIsEightBlocked(false);
    setIsPaused(false);
    const msg = players.length < playerCount ? `Round ${playerCount - players.length + 1} Started!` : 'Game Started!';
    setMessage(msg);
    addLog(msg, 'info');
  };

  useEffect(() => {
    startNewGame();
  }, []);

  const topCard: CardData | undefined = discardPile[discardPile.length - 1];

  const checkValidMove = (card: CardData, handLength: number): boolean => {
    if (!topCard) return false;

    // Skip challenge: Only 7 is valid
    if (isSkipPending) {
      return card.rank === Rank.SEVEN;
    }

    // First move restriction: Cannot play special cards first
    if (discardPile.length === 1 && RESTRICTED_START_RANKS.includes(card.rank)) {
      return false;
    }

    // Penalty phase — MUST check before any "wild" shortcuts.
    // During a penalty (from a 2, Joker, or stacked penalties), only 2, Joker, or Ace can be played.
    if (penaltyCount > 0) {
      return card.rank === Rank.TWO || card.rank === Rank.JOKER || card.rank === Rank.ACE;
    }

    // Non-penalty phase wildcard logic
    // If Joker or Ace of Spades is on deck and no penalty is active, any card is valid.
    if (penaltyCount === 0 && (topCard.rank === Rank.JOKER || (topCard.rank === Rank.ACE && topCard.suit === Suit.SPADES))) {
      return true;
    }

    // Normal phase
    if (card.rank === Rank.EIGHT) return true;

    if (isEightBlocked) {
      // Must follow suit
      if (card.rank === Rank.JOKER) return true;
      return card.suit === activeSuit;
    }
    if (card.rank === Rank.ACE && card.suit === Suit.SPADES) return true;
    if (card.rank === Rank.JOKER) return true;

    return card.suit === activeSuit || card.rank === topCard.rank;
  };

  const nextTurn = (skip: boolean = false, reverse: boolean = false) => {
    setTurn(prev => {
      const currentIndex = activePlayers.indexOf(prev);
      if (currentIndex === -1) return activePlayers[0];

      let step = 1;
      if (skip) step = 2;
      if (reverse) step = -1;

      let nextIndex = (currentIndex + step) % activePlayers.length;
      if (nextIndex < 0) nextIndex = activePlayers.length + nextIndex;

      return activePlayers[nextIndex];
    });
  };

  const playCard = (card: CardData, playerIndex: number) => {
    const isPlayer = playerIndex === 0;
    const hand = isPlayer ? playerHand : aiHands[playerIndex - 1];
    const newHand = hand.filter(c => c.id !== card.id);

    // Rule: Cannot win with a penalty card (A, 2, Joker)
    const isSpecial = RESTRICTED_WINNING_RANKS.includes(card.rank);

    // Rule: Cannot win if the card being played ON TOP OF is a restricted card (A, 2, Joker)
    const restrictedTopRanks = [Rank.ACE, Rank.TWO, Rank.JOKER];
    const isTopRestricted = topCard && restrictedTopRanks.includes(topCard.rank);

    if (isPlayer) setPlayerHand(newHand);
    else {
      const newAiHands = [...aiHands];
      newAiHands[playerIndex - 1] = newHand;
      setAiHands(newAiHands);
    }

    const wasSkipPending = isSkipPending;
    setDiscardPile([...discardPile, card]);
    setHasDrawn(false);
    setIsSkipPending(false); // Reset skip pending when a card is played (either a counter 7 or a new card)
    addLog(`${isPlayer ? 'You' : getOpponentName(playerIndex)} played ${card.rank} of ${card.suit}`, 'action');

    // Handle Penalties
    let newPenalty = penaltyCount;
    if (card.rank === Rank.TWO) {
      newPenalty += 2;
    }
    if (card.rank === Rank.JOKER) {
      newPenalty += 5;
    }
    if (card.rank === Rank.ACE && penaltyCount > 0) {
      newPenalty = 0;
    }

    // If Joker was on deck and we played a non-penalty card, clear the penalty
    if (topCard && topCard.rank === Rank.JOKER && card.rank !== Rank.JOKER && card.rank !== Rank.TWO) {
      newPenalty = 0;
    }
    setPenaltyCount(newPenalty);

    // Check Win
    if (newHand.length === 0 && !isSpecial && !isTopRestricted) {
      handleRoundEnd(playerIndex);
      return;
    }

    if (newHand.length === 0 && (isSpecial || isTopRestricted)) {
      const reason = isSpecial ? "it's a restricted card" : `the card on deck (${topCard?.rank}) prevents closing`;
      setMessage(`${isPlayer ? 'You' : getOpponentName(playerIndex)} played your last card, but ${reason}! You must draw on your next turn to win.`);
    }

    // Handle Special Cards (8, J, K, 7)
    if (card.rank === Rank.EIGHT) {
      const isEightOnEight = topCard && topCard.rank === Rank.EIGHT;

      if (isEightOnEight) {
        // Block logic: No suit selection
        setIsEightBlocked(true);
        setActiveSuit(card.suit);
        setMessage(`${isPlayer ? 'Player' : getOpponentName(playerIndex)} blocked the 8!`);
        nextTurn();
      } else {
        // Normal 8 logic: Demand suit
        setIsEightBlocked(false);
        if (isPlayer) {
          setShowSuitPicker(true);
          setMessage("Crazy Eight! Choose a new suit.");
        } else {
          // AI picks most common suit
          const suits = newHand.map(c => c.suit).filter(s => s !== Suit.JOKER);
          const mostCommon = suits.sort((a, b) =>
            suits.filter(v => v === a).length - suits.filter(v => v === b).length
          ).pop() || Suit.SPADES;
          setActiveSuit(mostCommon);
          const dMsg = `${getOpponentName(playerIndex)} demanded ` + mostCommon;
          setMessage(dMsg);
          addLog(dMsg, 'info');
          nextTurn();
        }
      }
    } else {
      setIsEightBlocked(false);

      // Update active suit for all non-8 cards (including J, K, 7)
      if (card.suit !== Suit.JOKER) {
        setActiveSuit(card.suit);
      }

      if (card.rank === Rank.JACK) {
        if (activePlayers.length === 2) {
          setMessage(`${isPlayer ? 'Player' : getOpponentName(playerIndex)} played a Jack! Carry on! Play again.`);
          setTurn(playerIndex);
        } else {
          setMessage(`${isPlayer ? 'Player' : getOpponentName(playerIndex)} played a Jack! Backtrack!`);
          nextTurn(false, true);
        }
      } else if (card.rank === Rank.KING) {
        setMessage(`${isPlayer ? 'Player' : getOpponentName(playerIndex)} played a King! Carry on! Play again.`);
        setTurn(playerIndex);
      } else if (card.rank === Rank.SEVEN) {
        if (wasSkipPending) {
          setMessage(`${isPlayer ? 'Player' : getOpponentName(playerIndex)} countered the skip!`);
          // Note: isSkipPending is already false, so it just moves to next turn normally
          nextTurn();
        } else {
          setMessage(`${isPlayer ? 'Player' : getOpponentName(playerIndex)} played a 7! Challenge!`);
          setIsSkipPending(true);
          nextTurn();
        }
      } else {
        nextTurn();
      }
    }

    // Trigger AI aggressive shouts
    if (!isPlayer && (card.rank === Rank.TWO || card.rank === Rank.JOKER || card.rank === Rank.ACE)) {
      triggerAiShout(playerIndex, 'aggressive');
    }

    // Trigger AI salty shouts when player uses a power card on them
    if (isPlayer && (card.rank === Rank.TWO || card.rank === Rank.JOKER || card.rank === Rank.ACE || card.rank === Rank.SEVEN || card.rank === Rank.JACK || card.rank === Rank.KING || card.rank === Rank.EIGHT)) {
      // Find the next player to see if it's an AI who might be salty
      const currentIndex = activePlayers.indexOf(0);
      const nextIdxInActive = (currentIndex + 1) % activePlayers.length;
      const nextPlayer = activePlayers[nextIdxInActive];
      if (nextPlayer > 0) {
        setTimeout(() => triggerAiShout(nextPlayer, 'salty'), 500);
      }
    }

    if (newPenalty > penaltyCount) {
      const pMsg = `${isPlayer ? 'Player' : getOpponentName(playerIndex)} played a penalty card! +${newPenalty - penaltyCount} to draw.`;
      setMessage(pMsg);
      addLog(pMsg, 'penalty');
    } else if (newPenalty === 0 && penaltyCount > 0) {
      const bMsg = `${isPlayer ? 'Player' : getOpponentName(playerIndex)} blocked the penalty with an Ace!`;
      setMessage(bMsg);
      addLog(bMsg, 'success');
    }
  };

  const handleRoundEnd = (roundWinnerIndex: number) => {
    let currentDeck = [...deck];
    let currentDiscard = [...discardPile];
    const newAiHands = aiHands.map(hand => [...hand]);
    let newPlayerHand = [...playerHand];

    const drawSingleCard = () => {
      if (currentDeck.length === 0) {
        if (currentDiscard.length <= 1) return null;
        const top = currentDiscard.pop()!;
        currentDeck = shuffleDeck(currentDiscard);
        currentDiscard = [top];
      }
      return currentDeck.pop()!;
    };

    // Rule 1: Give 1 card to any non-winner who has 0 cards or 0 points
    activePlayers.forEach(idx => {
      if (idx !== roundWinnerIndex) {
        const hand = idx === 0 ? newPlayerHand : newAiHands[idx - 1];
        if (hand.length === 0 || calculateHandPoints(hand) === 0) {
          const card = drawSingleCard();
          if (card) hand.push(card);
        }
      }
    });

    let results = activePlayers.map(idx => {
      const hand = idx === 0 ? newPlayerHand : newAiHands[idx - 1];
      return {
        playerIndex: idx,
        points: idx === roundWinnerIndex ? 0 : calculateHandPoints(hand),
        hand: hand
      };
    });

    // Rule 2: Resolve ties for highest points (elimination)
    let maxPoints = Math.max(...results.map(r => r.points));
    let eliminatedCandidates = results.filter(r => r.points === maxPoints);

    while (eliminatedCandidates.length > 1 && maxPoints > 0) {
      let changed = false;
      for (const candidate of eliminatedCandidates) {
        if (candidate.playerIndex !== roundWinnerIndex) {
          const card = drawSingleCard();
          if (card) {
            candidate.hand.push(card);
            candidate.points = calculateHandPoints(candidate.hand);
            changed = true;
          }
        }
      }

      if (!changed) break; // Deck empty

      maxPoints = Math.max(...results.map(r => r.points));
      eliminatedCandidates = results.filter(r => r.points === maxPoints);
    }

    setDeck(currentDeck);
    setDiscardPile(currentDiscard);
    setPlayerHand(newPlayerHand);
    setAiHands(newAiHands);

    let eliminatedIndex: number;
    if (eliminatedCandidates.length === 1) {
      eliminatedIndex = eliminatedCandidates[0].playerIndex;
    } else {
      const nonWinners = eliminatedCandidates.filter(r => r.playerIndex !== roundWinnerIndex);
      eliminatedIndex = nonWinners.length > 0 ? nonWinners[0].playerIndex : eliminatedCandidates[0].playerIndex;
    }

    const finalResults = results.map(r => ({
      playerIndex: r.playerIndex,
      points: r.points,
      eliminated: r.playerIndex === eliminatedIndex,
      hand: r.hand
    }));

    setExpandedPlayer(null); // Reset when setting new results
    setRoundResults(finalResults);
    addLog(`${roundWinnerIndex === 0 ? 'You' : getOpponentName(roundWinnerIndex)} won the round!`, 'success');

    if (eliminatedIndex === 0) {
      setWinner('Defeat');
      addLog('Game Over: You were eliminated.', 'penalty');
      recordGameResult(GameMode.CRAZY_EIGHTS, false);
      const tournamentWinnerIdx = activePlayers.filter(idx => idx !== eliminatedIndex)[0];
      if (tournamentWinnerIdx !== undefined) {
        setSessionWins(prev => ({ ...prev, [tournamentWinnerIdx]: (prev[tournamentWinnerIdx] || 0) + 1 }));
      }
    } else {
      const remainingPlayers = activePlayers.filter(idx => idx !== eliminatedIndex);
      if (remainingPlayers.length === 1) {
        const tournamentWinnerIdx = remainingPlayers[0];
        setWinner('Tournament Victory');
        recordGameResult(GameMode.CRAZY_EIGHTS, true);
        setSessionWins(prev => ({ ...prev, [tournamentWinnerIdx]: (prev[tournamentWinnerIdx] || 0) + 1 }));
      }
    }
  };

  const startNextRound = () => {
    if (!roundResults) return;
    const remainingPlayers = activePlayers.filter(idx => !roundResults.find(r => r.playerIndex === idx && r.eliminated));
    startNewGame(remainingPlayers);
  };

  const drawCards = (playerIndex: number) => {
    const isPlayer = playerIndex === 0;
    if (isPlayer && hasDrawn && penaltyCount === 0) return;

    let cardsToDraw = penaltyCount > 0 ? penaltyCount : 1;
    const drawn: CardData[] = [];
    let currentDeck = [...deck];
    let currentDiscard = [...discardPile];

    let reshuffled = false;

    for (let i = 0; i < cardsToDraw; i++) {
      if (currentDeck.length === 0) {
        if (currentDiscard.length <= 1) break;
        const top = currentDiscard.pop()!;
        currentDeck = shuffleDeck([...currentDiscard]);
        currentDiscard = [top];
        reshuffled = true;
      }
      drawn.push(currentDeck.pop()!);
    }

    setDeck(currentDeck);
    setDiscardPile(currentDiscard);

    if (isPlayer) {
      const newHand = [...playerHand, ...drawn];
      setPlayerHand(newHand);

      if (penaltyCount === 0) {
        setHasDrawn(true);
        if (drawn.length > 0) {
          const dMsg = reshuffled ? '♻️ Deck reshuffled! Card drawn.' : 'Card drawn.';
          setMessage(dMsg);
          addLog(`You drew a card`, 'info');
        } else {
          setMessage('No cards left anywhere! You must pass.');
        }
      } else {
        setPenaltyCount(0);
        addLog(`You drew ${penaltyCount} penalty cards`, 'penalty');
        nextTurn();
      }
    } else {
      const newAiHands = [...aiHands];
      newAiHands[playerIndex - 1] = [...aiHands[playerIndex - 1], ...drawn];
      setAiHands(newAiHands);

      if (penaltyCount === 0) {
        setHasDrawn(true);
        addLog(`${getOpponentName(playerIndex)} drew a card`, 'info');
      } else {
        setPenaltyCount(0);
        addLog(`${getOpponentName(playerIndex)} drew ${penaltyCount} penalty cards`, 'penalty');
        nextTurn();
      }
    }
  };

  const handleContinue = () => {
    setHasDrawn(false);
    if (isSkipPending) {
      setIsSkipPending(false);
      const sMsg = turn === 0 ? "You were skipped!" : `${getOpponentName(turn)} was skipped.`;
      setMessage(sMsg);
      addLog(sMsg, 'penalty');
    } else {
      const pMsg = turn === 0 ? "Player passed." : `${getOpponentName(turn)} passed.`;
      setMessage(pMsg);
      addLog(pMsg, 'info');
    }
    nextTurn();
  };

  // AI Logic
  useEffect(() => {
    if (turn > 0 && !winner && !showSuitPicker && !isPaused && topCard) {
      const timer = setTimeout(() => {
        const hand = aiHands[turn - 1];
        const aiIdx = turn;

        // How many cards does each opponent have?
        const opponentHandSizes = activePlayers
          .filter(p => p !== aiIdx)
          .map(p => (p === 0 ? playerHand.length : aiHands[p - 1]?.length ?? 99));
        const minOpponentCards = Math.min(...opponentHandSizes);
        const opponentIsClose = minOpponentCards <= 3; // someone is close to winning

        // Score a card — higher score = better choice
        const scoreCard = (card: CardData): number => {
          let score = 0;

          // --- Base validity: only score if move is valid ---
          if (!checkValidMove(card, hand.length)) return -Infinity;

          // --- Penalty stacking: counter threats ---
          if (penaltyCount > 0) {
            if (card.rank === Rank.ACE) score += 100;    // Block penalty
            if (card.rank === Rank.TWO) score += 80;     // Stack +2
            if (card.rank === Rank.JOKER) score += 90;   // Stack +5
            return score;
          }

          // --- Skip pending: counter it ---
          if (isSkipPending) {
            if (card.rank === Rank.SEVEN) score += 200;
            return score;
          }

          // --- General card scoring ---

          // Attack when opponent is close: prefer 2, Joker, Ace of Spades, 7
          if (opponentIsClose) {
            if (card.rank === Rank.TWO) score += 80;
            if (card.rank === Rank.JOKER) score += 90;
            if (card.rank === Rank.ACE && card.suit === Suit.SPADES) score += 85;
            if (card.rank === Rank.SEVEN) score += 75;
          }

          // Prefer playing cards that extend our turn (King)
          if (card.rank === Rank.KING) score += 50;

          // Jack: good for disrupting - use when multiple players
          if (card.rank === Rank.JACK) {
            score += activePlayers.length > 2 ? 40 : 20;
          }

          // Save 8 (wild) unless hand is large OR it's the only valid card
          if (card.rank === Rank.EIGHT) {
            if (hand.length > 5) score += 10;       // Large hand, use 8 liberally
            else score -= 20;                        // Conserve 8 in small hands
          }

          // Prefer playing cards whose suit we have many of (builds momentum)
          const suitCount = hand.filter(c => c.suit === card.suit && c.id !== card.id).length;
          score += suitCount * 5;

          // Prefer higher-point cards to reduce hand points (if we might lose)
          score += getCardPoints(card) * 0.3;

          // Prefer suit matches over rank matches if we have many of that suit
          if (card.suit === activeSuit) score += 15;
          if (card.rank === topCard.rank) score += 10;

          // Small bonus for playing last cards (near empty hand)
          if (hand.length <= 2) score += 30;

          return score;
        };

        // Find the best valid card
        const validCards = hand.filter(c => checkValidMove(c, hand.length));
        const bestCard = validCards.reduce<CardData | undefined>((best, card) => {
          if (!best) return card;
          return scoreCard(card) > scoreCard(best) ? card : best;
        }, undefined);

        if (bestCard) {
          playCard(bestCard, turn);
        } else {
          if (hasDrawn || isSkipPending) {
            handleContinue();
          } else {
            drawCards(turn);
          }
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [turn, aiHands, winner, penaltyCount, activeSuit, topCard, hasDrawn, isPaused]);

  const handleSuitPick = (suit: Suit) => {
    setActiveSuit(suit);
    setShowSuitPicker(false);
    addLog(`You demanded ${suit}`, 'info');
    nextTurn();
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 relative overflow-y-auto">
      <AnimatePresence>
        {showRules && (
          <RulesModal
            gameName="Crazy Eights"
            storageKey="show_rules_crazy_eights"
            onClose={() => setShowRules(false)}
            howToPlay={[
              "Match the top card's suit or rank to play a card from your hand.",
              "If you don't have a matching card, you must draw from the deck.",
              "Be the first to get rid of all your cards to win!"
            ]}
            rules={[
              "8s are wild: Play them anytime to change the active suit.",
              "Penalty Cards: 2s (+2 cards) and Jokers (+5 cards) force the next player to draw.",
              "Blocking: Play an Ace to block a penalty, or another 8 to block an 8.",
              "Action Cards: Jacks backtrack (previous player plays again), Kings allow another play.",
              "Skip Logic (7s): Playing a 7 targets the next player for a skip. If they have a 7, they can 'counter' to pass the skip to the next person. Otherwise, they are skipped.",
              "Winning: You cannot win on a penalty card (Ace, 2, or Joker), OR if the card currently on deck is a penalty card. If you play your last card under these conditions, you must draw on your next turn.",
              "Tournament Mode: With 3+ players, the highest point holder is eliminated each round. 3 cards are dealt per player."
            ]}
          />
        )}
      </AnimatePresence>

      {/* Header */}
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
        <div className="text-center">
          <h2 className="text-lg md:text-2xl font-bold tracking-widest uppercase">Crazy Eights</h2>
        </div>
        <button onClick={startNewGame} className="flex items-center gap-1 md:gap-2 text-emerald-200 hover:text-white transition-colors text-sm md:text-base">
          <RotateCcw className="w-4 h-4 md:w-5 h-5" /> <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Game Board */}
      <div className="flex-1 flex flex-col justify-between items-center py-2 md:py-4 relative min-h-[450px] md:min-h-[500px]">
        {/* In-Game Scoreboard - Top Left on Desktop, Bottom Left on Mobile */}
        <div className="absolute top-0 left-0 md:top-0 md:left-0 flex flex-col gap-2 z-10 scale-75 sm:scale-100 origin-top-left">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-2 md:p-4 min-w-[100px] md:min-w-[160px]">
            <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-3 border-b border-white/5 pb-1 md:pb-2">
              <Trophy className="w-2.5 h-2.5 md:w-4 h-4 text-yellow-500" />
              <span className="text-[7px] md:text-[10px] font-black uppercase tracking-widest text-white/60">Scores</span>
            </div>
            <div className="space-y-1 md:space-y-3">
              {activePlayers.includes(0) && (
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <div className={`w-1 h-1 md:w-2 md:h-2 rounded-full ${turn === 0 ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500/20'}`} />
                      <span className={`text-[9px] md:text-xs font-bold ${turn === 0 ? 'text-white' : 'text-white/60'}`}>You</span>
                    </div>
                    <span className="text-[10px] md:text-sm font-black text-white">{playerHand.length}</span>
                  </div>
                  {sessionWins[0] > 0 && (
                    <div className="flex items-center gap-1 ml-2 md:ml-4">
                      <Trophy className="w-2 h-2 md:w-3 md:h-3 text-yellow-500/60" />
                      <span className="text-[7px] md:text-[9px] font-black text-yellow-500/60 uppercase">Wins: {sessionWins[0]}</span>
                    </div>
                  )}
                </div>
              )}
              {aiHands.map((hand, idx) => {
                const aiIdx = idx + 1;
                if (!activePlayers.includes(aiIdx)) return null;
                return (
                  <div key={idx} className="flex flex-col gap-0.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <div className={`w-1 h-1 md:w-2 md:h-2 rounded-full ${turn === aiIdx ? 'bg-red-500 animate-pulse' : 'bg-red-500/20'}`} />
                        <span className={`text-[9px] md:text-xs font-bold ${turn === aiIdx ? 'text-white' : 'text-white/60'}`}>{getOpponentName(aiIdx)}</span>
                      </div>
                      <span className="text-[10px] md:text-sm font-black text-white">{hand.length}</span>
                    </div>
                    {sessionWins[aiIdx] > 0 && (
                      <div className="flex items-center gap-1 ml-2 md:ml-4">
                        <Trophy className="w-2 h-2 md:w-3 md:h-3 text-yellow-500/40" />
                        <span className="text-[7px] md:text-[9px] font-black text-yellow-500/40 uppercase">Wins: {sessionWins[aiIdx]}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 md:p-3 flex items-center gap-1.5 md:gap-3">
            <div className="w-5 h-5 md:w-8 md:h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <Users className="w-2.5 h-2.5 md:w-4 md:h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-[5px] md:text-[8px] font-black text-white/40 uppercase tracking-widest">Turn</div>
              <div className="text-[7px] md:text-[10px] font-bold text-emerald-400 uppercase">
                {turn === 0 ? 'Your Move' : `${getOpponentName(turn)}...`}
              </div>
            </div>
          </div>
        </div>

        {/* Game History Log */}
        <div className="absolute top-[280px] left-0 md:top-[380px] md:left-0 flex flex-col gap-2 z-30 scale-75 sm:scale-100 origin-top-left pointer-events-none">
          <div className={`bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col pointer-events-auto transition-all ${showMobileLogs ? 'h-[200px] w-[180px]' : 'h-auto w-auto md:h-[200px] md:w-[180px]'}`}>
            <div 
              className={`flex items-center gap-2 cursor-pointer md:cursor-default transition-all ${showMobileLogs ? 'mb-2 border-b border-white/5 pb-2' : 'md:mb-2 md:border-b md:border-white/5 md:pb-2'}`}
              onClick={() => window.innerWidth < 768 && setShowMobileLogs(!showMobileLogs)}
            >
              <Users className="w-3 h-3 md:w-3 md:h-3 text-emerald-400" />
              <span className={`text-[9px] font-black uppercase tracking-widest text-white/60 ${!showMobileLogs ? 'hidden md:block' : ''}`}>Game Log</span>
            </div>
            <div className={`flex-1 overflow-y-auto custom-scrollbar flex-col gap-2 pr-1 ${!showMobileLogs ? 'hidden md:flex' : 'flex'}`}>
              <AnimatePresence initial={false}>
                {logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`text-[9px] leading-tight flex items-start gap-1.5 p-1.5 rounded-lg border ${log.type === 'action' ? 'text-white border-white/5' :
                      log.type === 'penalty' ? 'text-red-400 border-red-500/20 bg-red-500/5' :
                        log.type === 'success' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' :
                          'text-white/60 border-transparent'
                      }`}
                  >
                    <div className={`w-1 h-1 rounded-full mt-1.5 shrink-0 ${log.type === 'action' ? 'bg-white' :
                      log.type === 'penalty' ? 'bg-red-500' :
                        log.type === 'success' ? 'bg-emerald-500' :
                          'bg-white/40'
                      }`} />
                    <span>{log.message}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* AI Hands - Top Center/Right */}
        <div className="absolute top-0 right-0 md:right-0 flex flex-col items-end gap-2 md:gap-6 pr-2 md:pr-4 scale-75 sm:scale-100 origin-top-right z-0 max-w-[70%] md:max-w-none">
          {aiHands.map((hand, idx) => {
            const aiIdx = idx + 1;
            if (!activePlayers.includes(aiIdx)) return null;
            return (
              <div key={idx} className={`relative flex flex-col items-center md:items-end gap-0.5 md:gap-2 transition-opacity duration-300 ${turn === aiIdx ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                <AnimatePresence>
                  {aiShouts[aiIdx] && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5, y: 10 }}
                      className="absolute -top-12 right-0 bg-white text-emerald-950 px-3 py-1.5 rounded-2xl rounded-tr-none text-[10px] font-bold shadow-[0_4px_15px_rgba(0,0,0,0.3)] z-30 whitespace-nowrap border-2 border-emerald-400"
                    >
                      {aiShouts[aiIdx]}
                      <div className="absolute top-0 right-0 w-2 h-2 bg-white border-t-2 border-r-2 border-emerald-400 rotate-45 translate-x-1 -translate-y-1" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="text-[7px] md:text-[10px] uppercase font-black tracking-[0.1em] md:tracking-[0.2em] text-emerald-500/60">{getOpponentName(aiIdx)}</div>
                <div className="relative h-10 md:h-16 w-16 md:w-32 flex justify-center md:justify-end">
                  <AnimatePresence>
                    {hand.map((card, index) => {
                      const total = hand.length;
                      const offset = index - (total - 1);
                      const rotate = offset * (window.innerWidth < 640 ? 2 : 5);
                      const x = offset * (window.innerWidth < 640 ? 4 : 8);
                      const y = Math.abs(offset) * (window.innerWidth < 640 ? 0.5 : 1.5);

                      return (
                        <motion.div
                          key={card.id}
                          initial={{ y: -50, opacity: 0 }}
                          animate={{ x, y, rotate, opacity: 1 }}
                          exit={{ y: -50, opacity: 0 }}
                          className="absolute"
                          style={{ zIndex: index }}
                        >
                          <Card isFaceUp={false} isSmall />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>

        {/* Center Area */}
        <div className="relative flex flex-col items-center gap-2 md:gap-8 my-12 md:my-8">
          <AnimatePresence mode="wait">
            {message && (
              <motion.div
                key={message}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                className="absolute -bottom-16 md:-bottom-13 bg-white text-black px-4 py-2 md:px-8 md:py-3 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest shadow-[0_0_40px_rgba(255,255,255,0.2)] z-30 flex items-center gap-2 md:gap-3 whitespace-nowrap"
              >
                <AlertCircle className="w-3 h-3 md:w-4 h-4" /> {message}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-4 md:gap-20 items-center">
            <div className="text-center group">
              <div className="text-[7px] md:text-[10px] uppercase font-black tracking-[0.2em] text-emerald-500/40 mb-1 md:mb-4">Draw</div>
              <motion.div
                whileHover={{ scale: 1.05, rotate: -2 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <Card
                  onClick={() => turn === 0 && drawCards(0)}
                  isFaceUp={false}
                  isSmall={window.innerWidth < 640}
                  className={turn === 0 ? 'shadow-[0_0_20px_rgba(16,185,129,0.3)]' : ''}
                />
                {penaltyCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 md:-top-4 md:-right-4 w-6 h-6 md:w-12 md:h-12 bg-red-600 text-white rounded-full flex items-center justify-center text-[8px] md:text-xs font-black shadow-xl border-2 border-white"
                  >
                    +{penaltyCount}
                  </motion.div>
                )}
              </motion.div>
            </div>

            <div className="text-center relative">
              <div className="text-[7px] md:text-[10px] uppercase font-black tracking-[0.2em] text-emerald-500/40 mb-1 md:mb-4">Discard</div>
              <div className="relative w-[60px] h-[84px] sm:w-[80px] sm:h-[112px] md:w-[120px] md:h-[168px]" onClick={() => discardPile.length > 0 && setShowDiscardSpread(true)} title="Tap to see last played cards">
                {discardPile.slice(-4).map((card, idx, arr) => {
                  const absIdx = discardPile.length - arr.length + idx;
                  const rotate = (absIdx * 17) % 30 - 15;
                  const xOffset = (absIdx * 7) % 10 - 5;
                  const yOffset = (absIdx * 5) % 10 - 5;
                  const isTop = idx === arr.length - 1;

                  return (
                    <motion.div
                      key={card.id}
                      initial={isTop ? { scale: 2, rotate: rotate + 90, opacity: 0 } : false}
                      animate={{ scale: 1, rotate: rotate, opacity: 1, x: xOffset, y: yOffset }}
                      transition={{ type: 'spring', damping: 12 }}
                      className="absolute top-0 left-0 cursor-pointer"
                    >
                      <Card card={card} isSmall={window.innerWidth < 640} />
                    </motion.div>
                  );
                })}
                <div className="absolute -bottom-6 w-full text-center text-[6px] md:text-[8px] font-black uppercase tracking-widest text-emerald-500/40 mt-1 animate-pulse">tap to inspect</div>
              </div>
              {topCard?.rank === Rank.EIGHT && (
                <div className="absolute -bottom-4 -right-4 md:-bottom-2 md:-right-10 w-8 h-8 md:w-8 md:h-8 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl z-20">
                  <span className="text-lg md:text-2xl">
                    {activeSuit === Suit.HEARTS ? '❤️' : activeSuit === Suit.DIAMONDS ? '♦️' : activeSuit === Suit.CLUBS ? '♣️' : '♠️'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Player Hand */}
        <div className="w-full flex flex-col items-center gap-2 md:gap-8 pb-2 md:pb-12">
          <div className="text-[7px] md:text-[10px] uppercase font-black tracking-[0.2em] text-emerald-500/40">Your Hand</div>

          <div className="flex flex-col items-center gap-2 w-full max-w-6xl relative">
            <div className="w-full flex justify-center items-center flex-wrap gap-[-10px] sm:gap-2 md:gap-3 px-2 md:px-4 relative min-h-[100px] md:min-h-[160px]">
              <AnimatePresence>
                {playerHand.map((card, index) => {
                  const isValid = turn === 0 && checkValidMove(card, playerHand.length);
                  const isMobile = window.innerWidth < 640;

                  return (
                    <motion.div
                      key={card.id}
                      layout
                      initial={false}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -15, scale: 1.05, zIndex: 100 }}
                      className={`${isMobile ? '-mx-3' : ''} relative`}
                      style={{ zIndex: index }}
                    >
                      <Card
                        card={card}
                        isSmall={isMobile}
                        onClick={() => isValid && !showSuitPicker && playCard(card, 0)}
                        className={`cursor-pointer transition-shadow ${isValid ? 'ring-2 ring-emerald-500 ring-offset-1 ring-offset-transparent' : ''} hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]`}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Suit Picker removed from here as an overlay */}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 md:gap-4 w-full">
            <AnimatePresence mode="wait">
              {showSuitPicker ? (
                <motion.div
                  key="suit-picker"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex flex-col items-center gap-2 w-full"
                >
                  <div className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-0.5">Choose New Suit</div>
                  <div className="flex gap-1.5 md:gap-3 bg-white/5 backdrop-blur-md p-2 md:p-3 rounded-2xl md:rounded-3xl border border-white/10">
                    {[
                      { suit: Suit.HEARTS, label: 'Hearts', icon: '❤️', color: 'text-red-500' },
                      { suit: Suit.DIAMONDS, label: 'Diamonds', icon: '♦️', color: 'text-red-400' },
                      { suit: Suit.CLUBS, label: 'Clubs', icon: '♣️', color: 'text-white' },
                      { suit: Suit.SPADES, label: 'Spades', icon: '♠️', color: 'text-white' }
                    ].map((opt) => (
                      <motion.button
                        key={opt.suit}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSuitPick(opt.suit)}
                        className="bg-white/5 border border-white/10 hover:border-emerald-500/50 p-2 md:p-4 rounded-xl md:rounded-2xl flex items-center gap-1 md:gap-2 transition-all"
                      >
                        <span className="text-lg md:text-2xl">{opt.icon}</span>
                        <span className={`text-[7px] md:text-[10px] font-black uppercase tracking-widest hidden sm:inline ${opt.color}`}>{opt.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : turn === 0 && (
                (isSkipPending || !playerHand.some(c => checkValidMove(c, playerHand.length)) || hasDrawn) && (
                  <motion.button
                    key="action-btn"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={hasDrawn || isSkipPending ? handleContinue : () => drawCards(0)}
                    className={`${isSkipPending ? 'bg-red-500 hover:bg-red-400 text-white' : 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950'} font-black px-6 py-3 md:px-10 md:py-5 rounded-xl md:rounded-2xl text-xs md:text-base transition-all shadow-xl hover:scale-105 active:scale-95 uppercase tracking-widest`}
                  >
                    {isSkipPending ? 'ACCEPT SKIP' : (hasDrawn ? 'PASS TURN' : (penaltyCount > 0 ? `DRAW ${penaltyCount} CARDS` : 'DRAW CARD'))}
                  </motion.button>
                )
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Round Results Modal */}
      <AnimatePresence>
        {roundResults && !winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-emerald-950/95 backdrop-blur-2xl flex items-center justify-center z-[110] p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="text-center p-6 md:p-12 bg-white/5 rounded-[2rem] md:rounded-[4rem] border border-white/10 shadow-2xl max-w-2xl w-full relative flex flex-col max-h-[90vh] md:max-h-[85vh] overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-blue-500 z-10" />

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 md:pr-4 -mr-2 md:-mr-4 relative z-0">
                <motion.div
                  initial={{ rotate: -10, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                  className="w-20 h-20 md:w-32 md:h-32 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-2xl shadow-emerald-500/40 mt-4 md:mt-2"
                >
                  <Trophy className="w-10 h-10 md:w-16 md:h-16 text-emerald-950" />
                </motion.div>

                <h2 className="text-4xl md:text-6xl lg:text-8xl font-black mb-3 md:mb-4 text-white tracking-tighter italic leading-none shrink-0">
                  ROUND OVER
                </h2>

                <p className="text-emerald-400 font-black uppercase tracking-[0.3em] mb-6 md:mb-8 text-[10px] md:text-base shrink-0">
                  Points Calculation
                </p>

                <div className="space-y-2 md:space-y-3 mb-6 md:mb-10 text-left max-w-md mx-auto">
                  <div className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-2 md:mb-4 text-center">Final Standings</div>
                  {roundResults.map((res) => (
                    <div key={res.playerIndex} className="flex flex-col gap-2">
                      <div
                        onClick={() => setExpandedPlayer(expandedPlayer === res.playerIndex ? null : res.playerIndex)}
                        className={`flex justify-between items-center p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all cursor-pointer hover:bg-white/10 ${res.eliminated ? 'bg-red-500/10 border-red-500/50' : 'bg-white/5 border-white/10'}`}
                      >
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${res.eliminated ? 'bg-red-500' : 'bg-emerald-500'}`} />
                          <span className="text-sm md:text-lg font-bold text-white">
                            {res.playerIndex === 0 ? 'You' : getOpponentName(res.playerIndex)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 md:gap-4">
                          <span className="text-lg md:text-2xl font-black text-white">{res.points} pts</span>
                          {res.eliminated && (
                            <span className="bg-red-500 text-white text-[7px] md:text-[10px] font-black px-1.5 py-0.5 md:px-2 md:py-1 rounded-full uppercase tracking-widest shrink-0">Eliminated</span>
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedPlayer === res.playerIndex && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-black/20 rounded-xl md:rounded-2xl overflow-hidden border border-white/5"
                          >
                            <div className="p-3 md:p-4">
                              <div className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/60 mb-2 md:mb-3">
                                Cards Remaining ({res.hand?.length || 0})
                              </div>
                              <div className="flex flex-wrap gap-[-8px] md:gap-[-12px] min-h-[50px] md:min-h-[80px]">
                                {res.hand && res.hand.length > 0 ? (
                                  res.hand.map((card, idx) => (
                                    <div key={card.id} className="relative transition-transform hover:z-10 hover:-translate-y-2 hover:scale-110" style={{ zIndex: idx, marginLeft: idx > 0 ? '-1rem' : '0' }}>
                                      <div className="scale-75 origin-top-left md:scale-90">
                                        <Card card={card} isSmall isFaceUp />
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-white/40 text-xs md:text-sm font-bold italic w-full text-center py-2">No cards left</span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 md:mt-6 shrink-0 relative z-10 pt-4 bg-transparent border-t border-white/5">
                <button
                  onClick={startNextRound}
                  className="group relative overflow-hidden bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black py-4 md:py-6 rounded-2xl md:rounded-3xl text-lg md:text-2xl transition-all shadow-xl flex items-center justify-center gap-2 md:gap-3 col-span-1 md:col-span-2"
                >
                  <RotateCcw className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-180 transition-transform duration-500" />
                  NEXT ROUND
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win Modal */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-emerald-950/95 backdrop-blur-2xl flex items-center justify-center z-[100] p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="text-center p-5 md:p-10 bg-white/5 rounded-[2rem] md:rounded-[4rem] border border-white/10 shadow-2xl max-w-2xl w-full relative flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-blue-500" />

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1">
                <motion.div
                  initial={{ rotate: -10, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                  className="w-14 h-14 md:w-24 md:h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-emerald-500/40 mt-2"
                >
                  <RotateCcw className="w-7 h-7 md:w-12 md:h-12 text-emerald-950" />
                </motion.div>

                <h2 className="text-4xl md:text-8xl font-black mb-2 md:mb-4 text-white tracking-tighter italic leading-none">
                  {winner === 'Tournament Victory' ? 'VICTORY' : 'DEFEAT'}
                </h2>

                <p className="text-emerald-400 font-black uppercase tracking-[0.3em] mb-4 md:mb-6 text-xs md:text-base">
                  {winner === 'Tournament Victory' ? 'The table is yours' : 'You were eliminated'}
                </p>

                {/* Session Leaderboard */}
                <div className="bg-white/5 rounded-2xl md:rounded-3xl p-3 md:p-5 mb-3 md:mb-6 border border-white/10 max-w-md mx-auto relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Trophy className="w-20 h-20 text-white" />
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-4 relative z-10">
                    <Trophy className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Session Leaderboard</span>
                  </div>
                  <div className="space-y-2 relative z-10">
                    {Object.entries(sessionWins)
                      .sort((a, b) => (b[1] as number) - (a[1] as number))
                      .map(([idx, wins], pos) => (
                        <div key={idx} className="flex justify-between items-center px-4 py-3 bg-black/20 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-black ${pos === 0 ? 'text-yellow-500' : 'text-white/40'}`}>#{pos + 1}</span>
                            <span className="font-bold text-white">{parseInt(idx) === 0 ? 'You' : getOpponentName(parseInt(idx))}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-black text-white">{wins}</span>
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Wins</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {roundResults && (
                  <div className="space-y-1 md:space-y-3 mb-3 md:mb-6 text-left max-w-md mx-auto">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-4 text-center">Standings This Round</div>
                    {roundResults.map((res) => (
                      <div key={res.playerIndex} className="flex flex-col gap-2">
                        <div
                          onClick={() => setWinExpandedPlayer(winExpandedPlayer === res.playerIndex ? null : res.playerIndex)}
                          className={`flex justify-between items-center p-3 md:p-4 rounded-2xl border transition-all cursor-pointer hover:bg-white/10 ${res.eliminated ? 'bg-red-500/10 border-red-500/50' : 'bg-white/5 border-white/10'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${res.eliminated ? 'bg-red-500' : 'bg-emerald-500'}`} />
                            <span className="text-sm md:text-lg font-bold text-white">
                              {res.playerIndex === 0 ? 'You' : getOpponentName(res.playerIndex)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 md:gap-4">
                            <span className="text-xl md:text-2xl font-black text-white">{res.points} pts</span>
                            {res.eliminated && (
                              <span className="bg-red-500 text-white text-[8px] md:text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">Eliminated</span>
                            )}
                            <span className="text-white/30 text-xs">{winExpandedPlayer === res.playerIndex ? '▲' : '▼'}</span>
                          </div>
                        </div>
                        <AnimatePresence>
                          {winExpandedPlayer === res.playerIndex && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-black/20 rounded-xl md:rounded-2xl overflow-hidden border border-white/5"
                            >
                              <div className="p-3 md:p-4">
                                <div className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/60 mb-2 md:mb-3">
                                  Cards Remaining ({res.hand?.length || 0})
                                </div>
                                <div className="flex flex-wrap gap-[-8px] md:gap-[-12px] min-h-[50px] md:min-h-[80px]">
                                  {res.hand && res.hand.length > 0 ? (
                                    res.hand.map((card, idx) => (
                                      <div key={card.id} className="relative transition-transform hover:z-10 hover:-translate-y-2 hover:scale-110" style={{ zIndex: idx, marginLeft: idx > 0 ? '-1rem' : '0' }}>
                                        <div className="scale-75 origin-top-left md:scale-90">
                                          <Card card={card} isSmall isFaceUp />
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <span className="text-white/40 text-xs md:text-sm font-bold italic w-full text-center py-2">No cards left</span>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </div>{/* end scroll area */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0 pt-3 border-t border-white/5">
                <button
                  onClick={() => startNewGame()}
                  className="group relative overflow-hidden bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black py-4 md:py-5 rounded-2xl md:rounded-3xl text-lg md:text-xl transition-all shadow-xl flex items-center justify-center gap-2 md:gap-3"
                >
                  <RotateCcw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                  Start next Tournament
                </button>
                <button
                  onClick={onBack}
                  className="bg-white/10 hover:bg-white/20 text-white font-black py-4 md:py-5 rounded-2xl md:rounded-3xl text-lg md:text-xl transition-all flex items-center justify-center gap-2 md:gap-3 border border-white/10"
                >
                  <Home className="w-6 h-6" />
                  QUIT
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discard Spread Overlay */}
      <AnimatePresence>
        {showDiscardSpread && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDiscardSpread(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[120] p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex flex-col items-center gap-6"
            >
              <div className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-emerald-400">Last Played Cards</div>
              <div className="relative flex items-center justify-center" style={{ height: '200px', width: '340px' }}>
                {discardPile.slice(-5).map((card, idx, arr) => {
                  const total = arr.length;
                  const center = (total - 1) / 2;
                  const offset = idx - center;
                  const rotate = offset * 18;
                  const x = offset * 60;
                  const y = Math.abs(offset) * 8;
                  return (
                    <motion.div
                      key={card.id}
                      initial={{ x: 0, y: 0, rotate: 0, opacity: 0, scale: 0.5 }}
                      animate={{ x, y, rotate, opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', damping: 14, delay: idx * 0.07 }}
                      className="absolute"
                      style={{ zIndex: idx }}
                    >
                      <Card card={card} isSmall={window.innerWidth < 640} isFaceUp />
                    </motion.div>
                  );
                })}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowDiscardSpread(false)}
                className="mt-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-black text-xs uppercase tracking-widest px-8 py-3 rounded-2xl transition-all"
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pause Modal */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-slate-900/50 p-12 rounded-[3rem] border border-white/10 text-center shadow-2xl max-w-md w-full backdrop-blur-3xl"
            >
              <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/30">
                <Pause className="w-12 h-12 text-emerald-500" />
              </div>
              <h3 className="text-5xl font-black mb-2 text-white tracking-tighter italic">PAUSED</h3>
              <p className="text-emerald-400 text-xs mb-12 font-black uppercase tracking-[0.4em]">Strategic Timeout</p>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setIsPaused(false)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black py-5 rounded-2xl text-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20"
                >
                  <PlayIcon className="w-6 h-6 fill-current" /> RESUME
                </button>
                <button
                  onClick={startNewGame}
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-5 rounded-2xl text-xl transition-all flex items-center justify-center gap-3"
                >
                  <RotateCcw className="w-6 h-6" /> RESTART
                </button>
                <button
                  onClick={onBack}
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-5 rounded-2xl text-xl transition-all flex items-center justify-center gap-3"
                >
                  <Home className="w-6 h-6" /> MAIN MENU
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
