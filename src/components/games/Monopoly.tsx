import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, RotateCcw, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, 
  User, Bot, Building, Building2, Train, Zap, Droplets, Gavel, 
  Skull, AlertCircle, Coins, Home, Landmark, Check, HelpCircle, X
} from 'lucide-react';
import { GameMode } from '../../types';
import { recordGameResult } from '../../utils/stats';
import { getRandomName } from '../../utils/names';

interface Props {
  onBack: () => void;
  playerCount?: number;
}

// --- Constants & Types ---

type SpaceType = 'PROPERTY' | 'RAILROAD' | 'UTILITY' | 'TAX' | 'CHANCE' | 'COMMUNITY_CHEST' | 'GO' | 'JAIL' | 'FREE_PARKING' | 'GO_TO_JAIL';

interface BoardSpace {
  name: string;
  type: SpaceType;
  group?: string;
  price?: number;
  rent?: number[]; // [base, 1h, 2h, 3h, 4h, hotel] or specific for RR/Utility
  housePrice?: number;
  mortgage?: number;
}

const BOARD_DATA: BoardSpace[] = [
  { name: 'GO', type: 'GO' },
  { name: 'Mediterranean Avenue', type: 'PROPERTY', group: 'brown', price: 60, rent: [2, 10, 30, 90, 160, 250], housePrice: 50, mortgage: 30 },
  { name: 'Community Chest', type: 'COMMUNITY_CHEST' },
  { name: 'Baltic Avenue', type: 'PROPERTY', group: 'brown', price: 60, rent: [4, 20, 60, 180, 320, 450], housePrice: 50, mortgage: 30 },
  { name: 'Income Tax', type: 'TAX', price: 200 },
  { name: 'Reading Railroad', type: 'RAILROAD', price: 200, rent: [25, 50, 100, 200], mortgage: 100 },
  { name: 'Oriental Avenue', type: 'PROPERTY', group: 'light-blue', price: 100, rent: [6, 30, 90, 270, 400, 550], housePrice: 50, mortgage: 50 },
  { name: 'Chance', type: 'CHANCE' },
  { name: 'Vermont Avenue', type: 'PROPERTY', group: 'light-blue', price: 100, rent: [6, 30, 90, 270, 400, 550], housePrice: 50, mortgage: 50 },
  { name: 'Connecticut Avenue', type: 'PROPERTY', group: 'light-blue', price: 120, rent: [8, 40, 100, 300, 450, 600], housePrice: 50, mortgage: 60 },
  { name: 'Jail', type: 'JAIL' },
  { name: 'St. Charles Place', type: 'PROPERTY', group: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], housePrice: 100, mortgage: 70 },
  { name: 'Electric Company', type: 'UTILITY', price: 150, mortgage: 75 },
  { name: 'States Avenue', type: 'PROPERTY', group: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], housePrice: 100, mortgage: 70 },
  { name: 'Virginia Avenue', type: 'PROPERTY', group: 'pink', price: 160, rent: [12, 60, 180, 500, 700, 900], housePrice: 100, mortgage: 80 },
  { name: 'Pennsylvania Railroad', type: 'RAILROAD', price: 200, rent: [25, 50, 100, 200], mortgage: 100 },
  { name: 'St. James Place', type: 'PROPERTY', group: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], housePrice: 100, mortgage: 90 },
  { name: 'Community Chest', type: 'COMMUNITY_CHEST' },
  { name: 'Tennessee Avenue', type: 'PROPERTY', group: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], housePrice: 100, mortgage: 90 },
  { name: 'New York Avenue', type: 'PROPERTY', group: 'orange', price: 200, rent: [16, 80, 220, 600, 800, 1000], housePrice: 100, mortgage: 100 },
  { name: 'Free Parking', type: 'FREE_PARKING' },
  { name: 'Kentucky Avenue', type: 'PROPERTY', group: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], housePrice: 150, mortgage: 110 },
  { name: 'Chance', type: 'CHANCE' },
  { name: 'Indiana Avenue', type: 'PROPERTY', group: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], housePrice: 150, mortgage: 110 },
  { name: 'Illinois Avenue', type: 'PROPERTY', group: 'red', price: 240, rent: [20, 100, 300, 750, 925, 1100], housePrice: 150, mortgage: 120 },
  { name: 'B. & O. Railroad', type: 'RAILROAD', price: 200, rent: [25, 50, 100, 200], mortgage: 100 },
  { name: 'Atlantic Avenue', type: 'PROPERTY', group: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], housePrice: 150, mortgage: 130 },
  { name: 'Ventnor Avenue', type: 'PROPERTY', group: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], housePrice: 150, mortgage: 130 },
  { name: 'Water Works', type: 'UTILITY', price: 150, mortgage: 75 },
  { name: 'Marvin Gardens', type: 'PROPERTY', group: 'yellow', price: 280, rent: [24, 120, 360, 850, 1025, 1200], housePrice: 150, mortgage: 140 },
  { name: 'Go To Jail', type: 'GO_TO_JAIL' },
  { name: 'Pacific Avenue', type: 'PROPERTY', group: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], housePrice: 200, mortgage: 150 },
  { name: 'North Carolina Avenue', type: 'PROPERTY', group: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], housePrice: 200, mortgage: 150 },
  { name: 'Community Chest', type: 'COMMUNITY_CHEST' },
  { name: 'Pennsylvania Avenue', type: 'PROPERTY', group: 'green', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], housePrice: 200, mortgage: 160 },
  { name: 'Short Line', type: 'RAILROAD', price: 200, rent: [25, 50, 100, 200], mortgage: 100 },
  { name: 'Chance', type: 'CHANCE' },
  { name: 'Park Place', type: 'PROPERTY', group: 'dark-blue', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], housePrice: 200, mortgage: 175 },
  { name: 'Luxury Tax', type: 'TAX', price: 100 },
  { name: 'Boardwalk', type: 'PROPERTY', group: 'dark-blue', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], housePrice: 200, mortgage: 200 },
];

const GROUP_COLORS: Record<string, string> = {
  'brown': '#795548',
  'light-blue': '#81d4fa',
  'pink': '#f06292',
  'orange': '#ff9800',
  'red': '#f44336',
  'yellow': '#ffeb3b',
  'green': '#4caf50',
  'dark-blue': '#3f51b5',
};

interface Player {
  id: number;
  name: string;
  balance: number;
  position: number;
  properties: number[]; // indices in BOARD_DATA
  isBankrupt: boolean;
  inJail: boolean;
  jailTurns: number;
  isAI: boolean;
  color: string;
}

const PLAYER_COLORS = ['#ef4444', '#3b82f6', '#eab308', '#22c55e', '#a855f7', '#f97316'];

// --- Main Component ---

export const Monopoly: React.FC<Props> = ({ onBack, playerCount = 2 }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [isRolling, setIsRolling] = useState(false);
  const [gameLog, setGameLog] = useState<string[]>(['Game started! Welcome to Monopoly.']);
  const [modalType, setModalType] = useState<'BUY' | 'RENT' | 'TAX' | 'CARD' | 'BANKRUPT' | 'NONE'>('NONE');
  const [activeSpace, setActiveSpace] = useState<BoardSpace | null>(null);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [animatingToken, setAnimatingToken] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const numPlayers = Math.min(Math.max(playerCount, 2), 6);
    const initialPlayers: Player[] = Array.from({ length: numPlayers }, (_, i) => ({
      id: i,
      name: i === 0 ? 'You' : getRandomName(),
      balance: 1500,
      position: 0,
      properties: [],
      isBankrupt: false,
      inJail: false,
      jailTurns: 0,
      isAI: i > 0,
      color: PLAYER_COLORS[i],
    }));
    setPlayers(initialPlayers);
  }, [playerCount]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [gameLog]);

  const addLog = (msg: string) => {
    setGameLog(prev => [...prev.slice(-49), msg]);
  };

  const nextTurn = () => {
    let next = (currentPlayer + 1) % players.length;
    while (players[next].isBankrupt) {
      next = (next + 1) % players.length;
    }
    setCurrentPlayer(next);
  };

  const handleRoll = async () => {
    if (isRolling || modalType !== 'NONE' || players[currentPlayer].isBankrupt) return;

    setIsRolling(true);
    addLog(`${players[currentPlayer].name} is rolling...`);
    
    // Dice animation
    for (let i = 0; i < 10; i++) {
      setDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
      await new Promise(r => setTimeout(r, 50));
    }

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    setDice([d1, d2]);
    setIsRolling(false);

    const player = players[currentPlayer];
    const total = d1 + d2;
    const isDouble = d1 === d2;

    if (player.inJail) {
      if (isDouble) {
        addLog(`Doubles! ${player.name} is free from jail!`);
        updatePlayer(currentPlayer, { inJail: false, jailTurns: 0 });
      } else if (player.jailTurns >= 2) {
        addLog(`${player.name} must pay $50 to leave jail after 3 turns.`);
        updatePlayer(currentPlayer, { balance: player.balance - 50, inJail: false, jailTurns: 0 });
      } else {
        addLog(`${player.name} stays in jail.`);
        updatePlayer(currentPlayer, { jailTurns: player.jailTurns + 1 });
        nextTurn();
        return;
      }
    }

    // Move player
    await movePlayer(currentPlayer, total);
  };

  const movePlayer = async (pIdx: number, steps: number) => {
    setAnimatingToken(pIdx);
    let currentPos = players[pIdx].position;
    
    for (let i = 0; i < steps; i++) {
      currentPos = (currentPos + 1) % 40;
      if (currentPos === 0) {
        addLog(`${players[pIdx].name} passed GO and collected $200!`);
        updatePlayer(pIdx, { balance: players[pIdx].balance + 200 });
      }
      
      setPlayers(prev => {
        const next = [...prev];
        next[pIdx] = { ...next[pIdx], position: currentPos };
        return next;
      });
      await new Promise(r => setTimeout(r, 150));
    }
    
    setAnimatingToken(null);
    handleLanding(pIdx, currentPos);
  };

  const handleLanding = (pIdx: number, pos: number) => {
    const space = BOARD_DATA[pos];
    const player = players[pIdx];
    setActiveSpace(space);

    switch (space.type) {
      case 'PROPERTY':
      case 'RAILROAD':
      case 'UTILITY':
        const owner = players.find(p => p.properties.includes(pos));
        if (owner) {
          if (owner.id !== player.id) {
            setModalType('RENT');
            if (player.isAI) setTimeout(() => payRent(pIdx, owner.id, pos), 1000);
          } else {
            addLog(`${player.name} landed on their own property: ${space.name}`);
            if (player.isAI) setTimeout(nextTurn, 1000);
          }
        } else {
          setModalType('BUY');
          if (player.isAI) {
            setTimeout(() => {
              if (player.balance >= (space.price || 0)) buyProperty(pIdx, pos);
              else {
                addLog(`${player.name} couldn't afford ${space.name}`);
                setModalType('NONE');
                nextTurn();
              }
            }, 1000);
          }
        }
        break;
      case 'TAX':
        setModalType('TAX');
        if (player.isAI) setTimeout(() => payTax(pIdx, space.price || 0), 1000);
        break;
      case 'CHANCE':
      case 'COMMUNITY_CHEST':
        handleCard(pIdx, space.type);
        break;
      case 'GO_TO_JAIL':
        addLog(`Busted! ${player.name} is sent to jail!`);
        updatePlayer(pIdx, { position: 10, inJail: true, jailTurns: 0 });
        if (player.isAI) setTimeout(nextTurn, 1000);
        else nextTurn();
        break;
      default:
        addLog(`${player.name} landed on ${space.name}`);
        if (player.isAI) setTimeout(nextTurn, 1000);
        break;
    }
  };

  const updatePlayer = (pIdx: number, updates: Partial<Player>) => {
    setPlayers(prev => {
      const next = [...prev];
      next[pIdx] = { ...next[pIdx], ...updates };
      return next;
    });
  };

  const buyProperty = (pIdx: number, pos: number) => {
    const player = players[pIdx];
    const space = BOARD_DATA[pos];
    if (player.balance >= (space.price || 0)) {
      addLog(`${player.name} bought ${space.name} for $${space.price}`);
      updatePlayer(pIdx, { 
        balance: player.balance - (space.price || 0),
        properties: [...player.properties, pos]
      });
      setModalType('NONE');
      nextTurn();
    }
  };

  const payRent = (pIdx: number, ownerIdx: number, pos: number) => {
    const space = BOARD_DATA[pos];
    const player = players[pIdx];
    const owner = players[ownerIdx];
    
    let rentAmount = space.rent ? space.rent[0] : 0;
    
    // Railroad logic
    if (space.type === 'RAILROAD') {
      const rrOwned = owner.properties.filter(p => BOARD_DATA[p].type === 'RAILROAD').length;
      rentAmount = [25, 50, 100, 200][rrOwned - 1];
    }
    // Utility logic
    if (space.type === 'UTILITY') {
      const utilsOwned = owner.properties.filter(p => BOARD_DATA[p].type === 'UTILITY').length;
      const roll = dice[0] + dice[1];
      rentAmount = utilsOwned === 1 ? roll * 4 : roll * 10;
    }
    // Property set logic
    if (space.type === 'PROPERTY' && space.group) {
      const groupSpaces = BOARD_DATA.filter(s => s.group === space.group).length;
      const ownedInGroup = owner.properties.filter(p => BOARD_DATA[p].group === space.group).length;
      if (ownedInGroup === groupSpaces) rentAmount *= 2;
    }

    addLog(`${player.name} paid $${rentAmount} rent to ${owner.name}`);
    
    if (player.balance < rentAmount) {
      addLog(`${player.name} has gone bankrupt!`);
      updatePlayer(pIdx, { balance: 0, isBankrupt: true });
      setModalType('BANKRUPT');
    } else {
      updatePlayer(pIdx, { balance: player.balance - rentAmount });
      updatePlayer(ownerIdx, { balance: owner.balance + rentAmount });
      setModalType('NONE');
      nextTurn();
    }
  };

  const payTax = (pIdx: number, amount: number) => {
    const player = players[pIdx];
    addLog(`${player.name} paid $${amount} in taxes.`);
    if (player.balance < amount) {
      updatePlayer(pIdx, { balance: 0, isBankrupt: true });
      setModalType('BANKRUPT');
    } else {
      updatePlayer(pIdx, { balance: player.balance - amount });
      setModalType('NONE');
      nextTurn();
    }
  };

  const handleCard = (pIdx: number, type: 'CHANCE' | 'COMMUNITY_CHEST') => {
    const cards = [
      { text: "Advance to GO (Collect $200)", action: () => { updatePlayer(pIdx, { position: 0, balance: players[pIdx].balance + 200 }); nextTurn(); } },
      { text: "Bank error in your favor. Collect $200", action: () => { updatePlayer(pIdx, { balance: players[pIdx].balance + 200 }); nextTurn(); } },
      { text: "Doctor's fee. Pay $50", action: () => { updatePlayer(pIdx, { balance: players[pIdx].balance - 50 }); nextTurn(); } },
      { text: "Go to Jail. Go directly to jail.", action: () => { updatePlayer(pIdx, { position: 10, inJail: true, jailTurns: 0 }); nextTurn(); } },
      { text: "It is your birthday. Collect $10 from every player", action: () => { 
        let collected = 0;
        players.forEach((p, i) => { if (i !== pIdx && !p.isBankrupt) { updatePlayer(i, { balance: p.balance - 10 }); collected += 10; } });
        updatePlayer(pIdx, { balance: players[pIdx].balance + collected });
        nextTurn();
      } },
      { text: "Pay school fees of $150", action: () => { updatePlayer(pIdx, { balance: players[pIdx].balance - 150 }); nextTurn(); } },
    ];
    const card = cards[Math.floor(Math.random() * cards.length)];
    setActiveCard(card.text);
    setModalType('CARD');
    addLog(`${type}: ${card.text}`);
    
    const timeout = players[pIdx].isAI ? 2000 : 4000;
    setTimeout(() => {
      setModalType('NONE');
      setActiveCard(null);
      card.action();
    }, timeout);
  };

  // AI turn trigger
  useEffect(() => {
    const player = players[currentPlayer];
    if (!player || !player.isAI || player.isBankrupt || modalType !== 'NONE' || isRolling || animatingToken !== null) return;

    const timer = setTimeout(() => {
      handleRoll();
    }, 1500);

    return () => clearTimeout(timer);
  }, [currentPlayer, modalType, isRolling, animatingToken, players]);

  // --- Render Helpers ---

  const renderDice = () => (
    <div className="flex gap-4">
      {[dice[0], dice[1]].map((v, i) => (
        <motion.div
          key={i}
          animate={isRolling ? { rotate: 360 } : { rotate: 0 }}
          transition={isRolling ? { repeat: Infinity, duration: 0.2 } : {}}
          className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-xl flex items-center justify-center text-black shadow-lg shadow-white/10"
        >
          {v === 1 && <Dice1 className="w-8 h-8 md:w-10 md:h-10" />}
          {v === 2 && <Dice2 className="w-8 h-8 md:w-10 md:h-10" />}
          {v === 3 && <Dice3 className="w-8 h-8 md:w-10 md:h-10" />}
          {v === 4 && <Dice4 className="w-8 h-8 md:w-10 md:h-10" />}
          {v === 5 && <Dice5 className="w-8 h-8 md:w-10 md:h-10" />}
          {v === 6 && <Dice6 className="w-8 h-8 md:w-10 md:h-10" />}
        </motion.div>
      ))}
    </div>
  );

  const getSpaceCoords = (idx: number): { row: number; col: number } => {
    if (idx >= 0 && idx <= 10) return { row: 11, col: 11 - idx }; // Bottom
    if (idx > 10 && idx <= 20) return { row: 11 - (idx - 10), col: 1 }; // Left
    if (idx > 20 && idx <= 30) return { row: 1, col: 1 + (idx - 20) }; // Top
    return { row: 1 + (idx - 30), col: 11 }; // Right
  };

  const renderBoard = () => (
    <div 
      className="grid gap-0.5 md:gap-1 bg-white/5 p-1 md:p-2 rounded-xl relative"
      style={{ 
        gridTemplateColumns: 'repeat(11, 1fr)', 
        gridTemplateRows: 'repeat(11, 1fr)',
        aspectRatio: '1/1',
        width: 'min(90vw, 70vh, 600px)'
      }}
    >
      {/* Center Area */}
      <div className="col-start-2 col-end-11 row-start-2 row-end-11 flex flex-col items-center justify-center p-4 text-center z-0 bg-black/20 rounded-lg">
        <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-white/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 pointer-events-none">
          MONOPOLY
        </h1>
        
        {players.length > 0 && !players[currentPlayer].isAI && modalType === 'NONE' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRoll}
            disabled={isRolling}
            className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black tracking-widest uppercase shadow-xl shadow-red-600/20 z-10"
          >
            Roll Dice
          </motion.button>
        )}

        <div className="mt-4">{renderDice()}</div>
        
        <div 
          ref={logRef}
          className="mt-6 w-full max-w-xs h-32 md:h-40 overflow-y-auto bg-black/40 rounded-lg p-3 text-[10px] md:text-xs text-white/50 font-mono text-left scroll-smooth border border-white/5"
        >
          {gameLog.map((log, i) => (
            <div key={i} className="mb-1 border-l-2 border-red-600/30 pl-2">{log}</div>
          ))}
        </div>
      </div>

      {/* Spaces */}
      {BOARD_DATA.map((space, i) => {
        const { row, col } = getSpaceCoords(i);
        const owner = players.find(p => p.properties.includes(i));
        const playersHere = players.filter(p => p.position === i && !p.isBankrupt);
        
        return (
          <div 
            key={i}
            className="relative flex flex-col bg-[#111] border border-white/5 overflow-hidden"
            style={{ gridRow: row, gridColumn: col }}
          >
            {space.group && (
              <div className="h-1.5 md:h-3 w-full" style={{ backgroundColor: GROUP_COLORS[space.group] }} />
            )}
            <div className="flex-1 flex flex-col items-center justify-center p-0.5 md:p-1 text-center">
              <span className="text-[6px] md:text-[8px] font-black uppercase tracking-tighter leading-none text-white/60 mb-1">
                {space.name}
              </span>
              {space.price && (
                <span className="text-[5px] md:text-[7px] font-bold text-white/30">${space.price}</span>
              )}
              {space.type === 'RAILROAD' && <Train className="w-2.5 h-2.5 md:w-4 md:h-4 text-white/20 mt-1" />}
              {space.type === 'UTILITY' && (space.name === 'Electric Company' ? <Zap className="w-2.5 h-2.5 md:w-4 md:h-4 text-white/20 mt-1" /> : <Droplets className="w-2.5 h-2.5 md:w-4 md:h-4 text-white/20 mt-1" />)}
              {space.type === 'TAX' && <Coins className="w-2.5 h-2.5 md:w-4 md:h-4 text-red-500/30 mt-1" />}
            </div>

            {owner && (
              <div className="absolute top-0 right-0 p-0.5">
                <Landmark className="w-2 h-2 md:w-3 md:h-3" style={{ color: owner.color }} />
              </div>
            )}

            {/* Tokens */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex flex-wrap items-center justify-center gap-0.5">
                {playersHere.map(p => (
                  <motion.div
                    key={p.id}
                    layoutId={`token-${p.id}`}
                    initial={false}
                    animate={{ scale: animatingToken === p.id ? 1.5 : 1 }}
                    className="w-2 h-2 md:w-4 md:h-4 rounded-full border border-white/50 shadow-lg"
                    style={{ backgroundColor: p.color, zIndex: 50 + p.id }}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="w-full h-screen bg-[#080808] flex flex-col items-center justify-center p-2 md:p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-red-600/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-orange-500/5 blur-[150px] rounded-full pointer-events-none" />
      
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

      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 w-full max-w-7xl h-full mt-8 lg:mt-0">
        
        {/* Left Side: Player Info */}
        <div className="hidden lg:flex flex-col gap-4 w-64">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/20 mb-2">Players</h2>
          {players.map((p, i) => (
            <div 
              key={p.id} 
              className={`p-4 rounded-2xl border transition-all ${currentPlayer === i && !p.isBankrupt ? 'bg-white/10 border-white/30 scale-105' : 'bg-white/5 border-white/5'} ${p.isBankrupt ? 'opacity-30 grayscale' : ''}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-sm font-black text-white">{p.name}</span>
                {p.isAI && <Bot className="w-3 h-3 text-white/30" />}
                {p.inJail && <AlertCircle className="w-3 h-3 text-red-500" />}
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-white/40">Balance</span>
                <span className="text-lg font-black text-emerald-500">${p.balance}</span>
              </div>
              <div className="mt-2 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                {p.properties.length} Properties
              </div>
            </div>
          ))}
        </div>

        {/* Center: Board */}
        {renderBoard()}

        {/* Right Side: Stats / Action Log Mobile */}
        <div className="lg:hidden flex flex-wrap justify-center gap-2 w-full">
          {players.map((p, i) => (
            <div 
              key={p.id} 
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${currentPlayer === i ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/5'}`}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-[10px] font-black text-white">${p.balance}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modalType !== 'NONE' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl overflow-hidden relative"
            >
              {activeSpace?.group && (
                <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: GROUP_COLORS[activeSpace.group] }} />
              )}

              <div className="text-center">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-2">
                  {modalType === 'BUY' ? 'Purchase?' : 
                   modalType === 'RENT' ? 'Pay Rent' : 
                   modalType === 'TAX' ? 'Tax Office' : 
                   modalType === 'CARD' ? (activeSpace?.type === 'CHANCE' ? 'Chance' : 'Comm. Chest') :
                   'Bankrupt!'}
                </h3>
                
                <p className="text-white/50 text-sm mb-6">
                  {modalType === 'BUY' && `Would you like to buy ${activeSpace?.name} for $${activeSpace?.price}?`}
                  {modalType === 'RENT' && `Landlord ${players.find(p => p.properties.includes(players[currentPlayer].position))?.name} demands rent for ${activeSpace?.name}!`}
                  {modalType === 'TAX' && `Uncle Sam wants his cut. Pay $${activeSpace?.price} for ${activeSpace?.name}.`}
                  {modalType === 'CARD' && activeCard}
                  {modalType === 'BANKRUPT' && `It's all over for ${players[currentPlayer].name}.`}
                </p>

                {modalType === 'BUY' && !players[currentPlayer].isAI && (
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => buyProperty(currentPlayer, players[currentPlayer].position)}
                      className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-xs"
                    >
                      Buy ($${activeSpace?.price})
                    </button>
                    <button 
                      onClick={() => { setModalType('NONE'); nextTurn(); }}
                      className="py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black uppercase tracking-widest text-xs"
                    >
                      Skip
                    </button>
                  </div>
                )}

                {modalType === 'RENT' && !players[currentPlayer].isAI && (
                  <button 
                    onClick={() => payRent(currentPlayer, players.find(p => p.properties.includes(players[currentPlayer].position))!.id, players[currentPlayer].position)}
                    className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black uppercase tracking-widest text-sm"
                  >
                    Pay Rent
                  </button>
                )}

                {modalType === 'TAX' && !players[currentPlayer].isAI && (
                  <button 
                    onClick={() => payTax(currentPlayer, activeSpace?.price || 0)}
                    className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black uppercase tracking-widest text-sm"
                  >
                    Pay Tax
                  </button>
                )}

                {modalType === 'BANKRUPT' && (
                  <button 
                    onClick={() => { setModalType('NONE'); nextTurn(); }}
                    className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black uppercase tracking-widest text-sm"
                  >
                    End Turn
                  </button>
                )}
              </div>
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
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-8">How to Play <span className="text-red-500">Monopoly</span></h2>
              <div className="space-y-6 text-white/70 text-sm md:text-base leading-relaxed overflow-y-auto max-h-[60vh] pr-4 custom-scrollbar">
                <p><strong className="text-white uppercase tracking-widest text-xs block mb-1">Objective</strong> Buy and trade properties to build houses and hotels, and be the last player with money left after others go bankrupt.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <strong className="text-white uppercase tracking-widest text-xs block mb-2">Gameplay</strong>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Roll dice to move around the board.</li>
                      <li>Buy unowned properties you land on.</li>
                      <li>Collect rent from others who land on your properties.</li>
                      <li>Pass GO to collect $200.</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-white uppercase tracking-widest text-xs block mb-2">Special Rules</strong>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Landing on Chance/Community Chest gives you a random card.</li>
                      <li>Go to Jail stops your movement until you roll doubles or pay.</li>
                    </ul>
                  </div>
                </div>
                <p className="bg-white/5 p-4 rounded-2xl border border-white/10 italic text-xs">Strategy: Focus on completing color sets to double your rent and start building houses!</p>
              </div>
              <button onClick={() => setShowHelp(false)} className="w-full mt-10 py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-lg">Got It</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
