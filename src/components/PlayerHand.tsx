import React, { useState } from 'react';
import { Card as CardType } from '../types';
import Card from './Card';

interface PlayerHandProps {
  cards: CardType[];
  isCurrentPlayer: boolean;
  topCard: CardType | null;
  onPlayCard: (card: CardType, chosenColor?: string) => void;
}

const PlayerHand: React.FC<PlayerHandProps> = ({ 
  cards, 
  isCurrentPlayer, 
  topCard, 
  onPlayCard 
}) => {
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [showColorSelector, setShowColorSelector] = useState(false);
  
  const handleCardClick = (card: CardType) => {
    if (!isCurrentPlayer) return;
    
    if (card.color === 'wild') {
      setSelectedCard(card);
      setShowColorSelector(true);
    } else {
      onPlayCard(card);
    }
  };
  
  const handleColorSelect = (color: 'red' | 'blue' | 'green' | 'yellow') => {
    if (selectedCard) {
      onPlayCard(selectedCard, color);
      setSelectedCard(null);
      setShowColorSelector(false);
    }
  };
  
  return (
    <div className="py-4">
      <h3 className="text-lg mb-2 font-semibold">
        {isCurrentPlayer ? 'Your Turn' : 'Your Hand'}
      </h3>
      
      <div className="flex flex-wrap justify-center">
        {cards.map(card => (
          <Card 
            key={card.id} 
            card={card} 
            isPlayable={isCurrentPlayer} 
            topCard={topCard}
            onClick={handleCardClick}
          />
        ))}
      </div>
      
      {showColorSelector && (
        <div className="mt-4 p-4 bg-white rounded-lg shadow-lg">
          <h4 className="text-center font-bold mb-2">Select a color:</h4>
          <div className="flex justify-center space-x-4">
            <button 
              className="w-10 h-10 bg-red-600 rounded-full"
              onClick={() => handleColorSelect('red')}
            />
            <button 
              className="w-10 h-10 bg-blue-600 rounded-full"
              onClick={() => handleColorSelect('blue')}
            />
            <button 
              className="w-10 h-10 bg-green-600 rounded-full"
              onClick={() => handleColorSelect('green')}
            />
            <button 
              className="w-10 h-10 bg-yellow-500 rounded-full"
              onClick={() => handleColorSelect('yellow')}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerHand; 