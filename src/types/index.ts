export type CardColor = 'red' | 'yellow' | 'green' | 'blue' | 'wild';
export type CardValue = 
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' 
  | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild_draw4';

export interface Card {
  id: string;
  color: CardColor;
  value: CardValue;
}

export interface Player {
  id: string;
  name: string;
  cards: Card[];
  isCurrentPlayer: boolean;
}

export interface GameState {
  players: Player[];
  currentPlayerId: string;
  topCard: Card | null;
  direction: 'clockwise' | 'counterclockwise';
  deck: Card[];
  gameStatus: 'waiting' | 'playing' | 'finished';
  winner: string | null;
}

export interface GameAction {
  type: 'PLAY_CARD' | 'DRAW_CARD' | 'SAY_UNO' | 'JOIN_GAME' | 'START_GAME' | 'UPDATE_GAME';
  payload: any;
}

export interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
} 