import React from 'react';
import { Suit, Rank, CardData } from '../types';
import { motion } from 'motion/react';

interface CardProps {
  card?: CardData;
  isFaceUp?: boolean;
  onClick?: () => void;
  className?: string;
  isSmall?: boolean;
}

const getSuitIcon = (suit: Suit) => {
  switch (suit) {
    case Suit.HEARTS: return '❤️';
    case Suit.DIAMONDS: return '♦️';
    case Suit.CLUBS: return '♣️';
    case Suit.SPADES: return '♠️';
  }
};

const getSuitColor = (suit: Suit) => {
  return (suit === Suit.HEARTS || suit === Suit.DIAMONDS) ? 'text-red-600' : 'text-slate-900';
};

export const Card: React.FC<CardProps> = ({ card, isFaceUp = true, onClick, className = '', isSmall = false }) => {
  const baseClasses = `relative rounded-lg border-2 shadow-md flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105 ${isSmall ? 'w-12 h-18 text-xs' : 'w-24 h-36 text-xl'} ${className}`;
  
  if (!isFaceUp || !card) {
    return (
      <motion.div 
        layout
        onClick={onClick}
        className={`${baseClasses} bg-blue-800 border-blue-900`}
      >
        <div className="w-full h-full rounded-md border border-blue-700/50 flex items-center justify-center overflow-hidden">
           <div className="w-full h-full opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
        </div>
      </motion.div>
    );
  }

  const suitIcon = getSuitIcon(card.suit);
  const suitColor = getSuitColor(card.suit);

  return (
    <motion.div 
      layout
      onClick={onClick}
      className={`${baseClasses} bg-white border-slate-200 ${suitColor}`}
    >
      <div className="absolute top-1 left-1 font-bold leading-none">
        {card.rank}
        <div className="text-[10px]">{suitIcon}</div>
      </div>
      
      <div className={`${isSmall ? 'text-lg' : 'text-4xl'}`}>
        {suitIcon}
      </div>

      <div className="absolute bottom-1 right-1 font-bold leading-none rotate-180">
        {card.rank}
        <div className="text-[10px]">{suitIcon}</div>
      </div>
    </motion.div>
  );
};
