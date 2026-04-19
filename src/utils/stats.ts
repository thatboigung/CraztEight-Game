import { PlayerStats, GameMode } from '../types';

const STORAGE_KEY = 'card_suite_stats';

const initialStats: PlayerStats = {
  BLACKJACK: { wins: 0, losses: 0, gamesPlayed: 0, lastPlayed: '' },
  CRAZY_EIGHTS: { wins: 0, losses: 0, gamesPlayed: 0, lastPlayed: '' },
  HEARTS: { wins: 0, losses: 0, gamesPlayed: 0, lastPlayed: '' },
  SPEED: { wins: 0, losses: 0, gamesPlayed: 0, lastPlayed: '' },
  TIC_TAC_TOE: { wins: 0, losses: 0, gamesPlayed: 0, lastPlayed: '' },
  LUDO: { wins: 0, losses: 0, gamesPlayed: 0, lastPlayed: '' },
  SNAKES_LADDERS: { wins: 0, losses: 0, gamesPlayed: 0, lastPlayed: '' },
  MONOPOLY: { wins: 0, losses: 0, gamesPlayed: 0, lastPlayed: '' },
  CHESS: { wins: 0, losses: 0, gamesPlayed: 0, lastPlayed: '' },
  CHECKERS: { wins: 0, losses: 0, gamesPlayed: 0, lastPlayed: '' },
  totalWins: 0,
  totalGames: 0,
};

export const getStats = (): PlayerStats => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return initialStats;
  try {
    const parsed = JSON.parse(stored);
    // Merge with initialStats to ensure all keys exist
    return { ...initialStats, ...parsed };
  } catch (e) {
    return initialStats;
  }
};

export const recordGameResult = (mode: Exclude<GameMode, 'MENU'>, won: boolean) => {
  const stats = getStats();
  const gameStats = stats[mode];
  
  gameStats.gamesPlayed += 1;
  if (won) {
    gameStats.wins += 1;
    stats.totalWins += 1;
  } else {
    gameStats.losses += 1;
  }
  gameStats.lastPlayed = new Date().toISOString();
  stats.totalGames += 1;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
};

export const resetStats = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialStats));
};
