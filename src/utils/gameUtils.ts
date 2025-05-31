import { v4 as uuidv4 } from 'uuid';
import { Card, CardColor, CardValue } from '../types';

// Create a complete UNO deck
export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  const colors: CardColor[] = ['red', 'yellow', 'green', 'blue'];
  const numbers: CardValue[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const actions: CardValue[] = ['skip', 'reverse', 'draw2'];
  const wilds: CardValue[] = ['wild', 'wild_draw4'];

  // Add number cards (0-9)
  colors.forEach(color => {
    // Add one '0' card for each color
    deck.push({ id: uuidv4(), color, value: '0' });
    
    // Add two of each 1-9 for each color
    numbers.slice(1).forEach(num => {
      deck.push({ id: uuidv4(), color, value: num });
      deck.push({ id: uuidv4(), color, value: num });
    });
  });

  // Add action cards (Skip, Reverse, Draw Two)
  colors.forEach(color => {
    actions.forEach(action => {
      deck.push({ id: uuidv4(), color, value: action });
      deck.push({ id: uuidv4(), color, value: action });
    });
  });

  // Add wild cards (Wild, Wild Draw Four)
  wilds.forEach(wild => {
    for (let i = 0; i < 4; i++) {
      deck.push({ id: uuidv4(), color: 'wild', value: wild });
    }
  });

  return shuffleDeck(deck);
};

// Shuffle the deck using Fisher-Yates algorithm
export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Check if a card can be played on top of the current top card
export const canPlayCard = (card: Card, topCard: Card): boolean => {
  // Wild cards can always be played
  if (card.color === 'wild') return true;
  
  // If colors match, card can be played
  if (card.color === topCard.color) return true;
  
  // If values match, card can be played
  if (card.value === topCard.value) return true;

  // If top card is wild, check current selected color
  if (topCard.color === 'wild') {
    // In a real implementation, we would check against the currently selected color
    // For simplicity, we'll assume wild cards can be played on any card
    return true;
  }
  
  return false;
};

// Deal initial cards to players
export const dealCards = (deck: Card[], playerCount: number): { hands: Card[][], remainingDeck: Card[] } => {
  const hands: Card[][] = Array(playerCount).fill(null).map(() => []);
  const remainingDeck = [...deck];
  
  // Deal 7 cards to each player
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < playerCount; j++) {
      if (remainingDeck.length > 0) {
        const card = remainingDeck.pop();
        if (card) hands[j].push(card);
      }
    }
  }
  
  return { hands, remainingDeck };
};

// Draw cards from the deck
export const drawCards = (deck: Card[], count: number): { cards: Card[], updatedDeck: Card[] } => {
  const updatedDeck = [...deck];
  const cards: Card[] = [];
  
  for (let i = 0; i < count && updatedDeck.length > 0; i++) {
    const card = updatedDeck.pop();
    if (card) cards.push(card);
  }
  
  return { cards, updatedDeck };
}; 