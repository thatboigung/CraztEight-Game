import { Suit, Rank, CardData } from '../types';

export const createDeck = (): CardData[] => {
  const deck: CardData[] = [];
  const suits = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];
  const ranks = [
    Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX, Rank.SEVEN,
    Rank.EIGHT, Rank.NINE, Rank.TEN, Rank.JACK, Rank.QUEEN, Rank.KING, Rank.ACE
  ];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        suit,
        rank,
        id: `${rank}-${suit}`,
      });
    }
  }

  // Add 2 Jokers
  deck.push({ suit: Suit.JOKER, rank: Rank.JOKER, id: 'joker-1' });
  deck.push({ suit: Suit.JOKER, rank: Rank.JOKER, id: 'joker-2' });

  return deck;
};

export const shuffleDeck = (deck: CardData[]): CardData[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const getCardValue = (rank: Rank): number => {
  if ([Rank.JACK, Rank.QUEEN, Rank.KING].includes(rank)) return 10;
  if (rank === Rank.ACE) return 11;
  return parseInt(rank);
};
