import React from 'react';
import { Card as CardType } from '../types';
import { canPlayCard } from '../utils/gameUtils';

interface CardProps {
  card: CardType;
  isPlayable?: boolean;
  topCard?: CardType | null;
  onClick?: (card: CardType) => void;
  className?: string;
}

const Card: React.FC<CardProps> = ({ 
  card, 
  isPlayable = false, 
  topCard = null, 
  onClick, 
  className = '' 
}) => {
  const canPlay = topCard ? canPlayCard(card, topCard) : false;
  
  // Map colors to Tailwind classes
  const colorClasses = {
    red: 'bg-red-600',
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-500',
    wild: 'bg-gradient-to-r from-black to-gray-800'
  };
  
  const handleClick = () => {
    if (isPlayable && canPlay && onClick) {
      onClick(card);
    }
  };
  
  return (
    <div 
      className={`
        ${colorClasses[card.color]} 
        relative rounded-lg shadow-lg p-4 w-20 h-32 
        flex items-center justify-center m-1 
        ${isPlayable && canPlay ? 'cursor-pointer transform hover:scale-110 transition-transform' : 'cursor-not-allowed opacity-80'} 
        ${className}
      `}
      onClick={handleClick}
    >
      <div className="absolute top-1 left-1 text-white font-bold text-lg">
        {card.value === 'wild' ? '★' : 
         card.value === 'wild_draw4' ? '+4' : 
         card.value === 'draw2' ? '+2' : 
         card.value === 'skip' ? '⊘' : 
         card.value === 'reverse' ? '↺' : 
         card.value}
      </div>
      
      <div className="absolute bottom-1 right-1 text-white font-bold text-lg transform rotate-180">
        {card.value === 'wild' ? '★' : 
         card.value === 'wild_draw4' ? '+4' : 
         card.value === 'draw2' ? '+2' : 
         card.value === 'skip' ? '⊘' : 
         card.value === 'reverse' ? '↺' : 
         card.value}
      </div>
      
      <div className="text-white font-bold text-4xl">
        {card.value === 'wild' ? '★' : 
         card.value === 'wild_draw4' ? '+4' : 
         card.value === 'draw2' ? '+2' : 
         card.value === 'skip' ? '⊘' : 
         card.value === 'reverse' ? '↺' : 
         card.value}
      </div>
      
      {card.color === 'wild' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <div className="w-5 h-5 bg-red-600 float-left"></div>
            <div className="w-5 h-5 bg-blue-600 float-left"></div>
            <div className="w-5 h-5 bg-yellow-500 float-left"></div>
            <div className="w-5 h-5 bg-green-600 float-left"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Card; 