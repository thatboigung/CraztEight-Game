export enum Suit {
  HEARTS = 'HEARTS',
  DIAMONDS = 'DIAMONDS',
  CLUBS = 'CLUBS',
  SPADES = 'SPADES',
  JOKER = 'JOKER',
}

export enum Rank {
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  TEN = '10',
  JACK = 'J',
  QUEEN = 'Q',
  KING = 'K',
  ACE = 'A',
  JOKER = 'JOKER',
}

export interface CardData {
  suit: Suit;
  rank: Rank;
  id: string;
}

export enum GameMode {
  CRAZY_EIGHTS = 'CRAZY_EIGHTS',
  BLACKJACK = 'BLACKJACK',
  HEARTS = 'HEARTS',
  SPEED = 'SPEED',
  TIC_TAC_TOE = 'TIC_TAC_TOE',
  LUDO = 'LUDO',
  SNAKES_LADDERS = 'SNAKES_LADDERS',
  MONOPOLY = 'MONOPOLY',
  CHESS = 'CHESS',
  CHECKERS = 'CHECKERS',
  MENU = 'MENU',
}

export interface GameStats {
  wins: number;
  losses: number;
  gamesPlayed: number;
  lastPlayed: string;
}

export interface PlayerStats {
  BLACKJACK: GameStats;
  CRAZY_EIGHTS: GameStats;
  HEARTS: GameStats;
  SPEED: GameStats;
  TIC_TAC_TOE: GameStats;
  LUDO: GameStats;
  SNAKES_LADDERS: GameStats;
  MONOPOLY: GameStats;
  CHESS: GameStats;
  CHECKERS: GameStats;
  totalWins: number;
  totalGames: number;
}
