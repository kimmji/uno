import React, { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { socket } from '../services/socket';
import { GameAction, GameState, Player } from '../types';
import { createDeck, drawCards } from '../utils/gameUtils';

// Initial game state
const initialState: GameState = {
  players: [],
  currentPlayerId: '',
  topCard: null,
  direction: 'clockwise',
  deck: [],
  gameStatus: 'waiting',
  winner: null
};

// Game reducer
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'JOIN_GAME':
      const { playerId, playerName } = action.payload;
      const newPlayer: Player = {
        id: playerId,
        name: playerName,
        cards: [],
        isCurrentPlayer: false
      };
      return {
        ...state,
        players: [...state.players, newPlayer]
      };
      
    case 'START_GAME':
      const deck = createDeck();
      const firstCard = deck.pop();
      // Ensure the first card is not a wild card (for simplicity)
      const topCard = firstCard?.color === 'wild' ? deck.pop() : firstCard;
      
      // Deal cards to players
      const updatedPlayers = state.players.map((player, index) => {
        const { cards } = drawCards(deck, 7);
        return {
          ...player,
          cards,
          isCurrentPlayer: index === 0 // First player starts
        };
      });
      
      return {
        ...state,
        players: updatedPlayers,
        currentPlayerId: updatedPlayers[0].id,
        topCard: topCard || null,
        deck,
        gameStatus: 'playing'
      };
      
    case 'PLAY_CARD':
      const { cardId, playerId: playerIdToPlay, chosenColor } = action.payload;
      
      // Find the player who played the card
      const playerIndex = state.players.findIndex(p => p.id === playerIdToPlay);
      if (playerIndex === -1 || state.players[playerIndex].id !== state.currentPlayerId) {
        return state; // Not the player's turn
      }
      
      // Find the card in the player's hand
      const cardIndex = state.players[playerIndex].cards.findIndex(c => c.id === cardId);
      if (cardIndex === -1) {
        return state; // Card not found
      }
      
      const playedCard = state.players[playerIndex].cards[cardIndex];
      
      // Create a copy of the player's cards without the played card
      const updatedCards = [
        ...state.players[playerIndex].cards.slice(0, cardIndex),
        ...state.players[playerIndex].cards.slice(cardIndex + 1)
      ];
      
      // Check if the player won
      const isWinner = updatedCards.length === 0;
      
      // Update the played card if it's wild
      const updatedPlayedCard = playedCard.color === 'wild' 
        ? { ...playedCard, chosenColor } 
        : playedCard;
      
      // Determine the next player
      let nextPlayerIndex = playerIndex;
      if (state.direction === 'clockwise') {
        nextPlayerIndex = (playerIndex + 1) % state.players.length;
      } else {
        nextPlayerIndex = (playerIndex - 1 + state.players.length) % state.players.length;
      }
      
      // Handle special cards
      if (playedCard.value === 'skip') {
        if (state.direction === 'clockwise') {
          nextPlayerIndex = (nextPlayerIndex + 1) % state.players.length;
        } else {
          nextPlayerIndex = (nextPlayerIndex - 1 + state.players.length) % state.players.length;
        }
      } else if (playedCard.value === 'reverse') {
        const newDirection = state.direction === 'clockwise' ? 'counterclockwise' : 'clockwise';
        return {
          ...state,
          direction: newDirection,
          topCard: updatedPlayedCard,
          players: state.players.map((p, idx) => {
            if (idx === playerIndex) {
              return {
                ...p,
                cards: updatedCards,
                isCurrentPlayer: false
              };
            } else if (idx === nextPlayerIndex) {
              return {
                ...p,
                isCurrentPlayer: true
              };
            }
            return p;
          }),
          currentPlayerId: state.players[nextPlayerIndex].id,
          gameStatus: isWinner ? 'finished' : 'playing',
          winner: isWinner ? playerIdToPlay : null
        };
      } else if (playedCard.value === 'draw2') {
        const nextPlayer = state.players[nextPlayerIndex];
        const { cards: drawnCards, updatedDeck } = drawCards(state.deck, 2);
        
        return {
          ...state,
          deck: updatedDeck,
          topCard: updatedPlayedCard,
          players: state.players.map((p, idx) => {
            if (idx === playerIndex) {
              return {
                ...p,
                cards: updatedCards,
                isCurrentPlayer: false
              };
            } else if (idx === nextPlayerIndex) {
              return {
                ...p,
                cards: [...p.cards, ...drawnCards],
                isCurrentPlayer: true
              };
            }
            return p;
          }),
          currentPlayerId: nextPlayer.id,
          gameStatus: isWinner ? 'finished' : 'playing',
          winner: isWinner ? playerIdToPlay : null
        };
      } else if (playedCard.value === 'wild_draw4') {
        const nextPlayer = state.players[nextPlayerIndex];
        const { cards: drawnCards, updatedDeck } = drawCards(state.deck, 4);
        
        return {
          ...state,
          deck: updatedDeck,
          topCard: updatedPlayedCard,
          players: state.players.map((p, idx) => {
            if (idx === playerIndex) {
              return {
                ...p,
                cards: updatedCards,
                isCurrentPlayer: false
              };
            } else if (idx === nextPlayerIndex) {
              return {
                ...p,
                cards: [...p.cards, ...drawnCards],
                isCurrentPlayer: true
              };
            }
            return p;
          }),
          currentPlayerId: nextPlayer.id,
          gameStatus: isWinner ? 'finished' : 'playing',
          winner: isWinner ? playerIdToPlay : null
        };
      }
      
      // Regular card or wild
      return {
        ...state,
        topCard: updatedPlayedCard,
        players: state.players.map((p, idx) => {
          if (idx === playerIndex) {
            return {
              ...p,
              cards: updatedCards,
              isCurrentPlayer: false
            };
          } else if (idx === nextPlayerIndex) {
            return {
              ...p,
              isCurrentPlayer: true
            };
          }
          return p;
        }),
        currentPlayerId: state.players[nextPlayerIndex].id,
        gameStatus: isWinner ? 'finished' : 'playing',
        winner: isWinner ? playerIdToPlay : null
      };
      
    case 'DRAW_CARD':
      const { playerToDraw } = action.payload;
      
      // Check if it's the player's turn
      if (state.currentPlayerId !== playerToDraw) {
        return state;
      }
      
      // Draw a card from the deck
      const { cards: newCards, updatedDeck: newDeck } = drawCards(state.deck, 1);
      
      // Find the player
      const drawingPlayerIndex = state.players.findIndex(p => p.id === playerToDraw);
      
      // Determine the next player
      let nextPlayerIdxAfterDraw = drawingPlayerIndex;
      if (state.direction === 'clockwise') {
        nextPlayerIdxAfterDraw = (drawingPlayerIndex + 1) % state.players.length;
      } else {
        nextPlayerIdxAfterDraw = (drawingPlayerIndex - 1 + state.players.length) % state.players.length;
      }
      
      return {
        ...state,
        deck: newDeck,
        players: state.players.map((p, idx) => {
          if (idx === drawingPlayerIndex) {
            return {
              ...p,
              cards: [...p.cards, ...newCards],
              isCurrentPlayer: false
            };
          } else if (idx === nextPlayerIdxAfterDraw) {
            return {
              ...p,
              isCurrentPlayer: true
            };
          }
          return p;
        }),
        currentPlayerId: state.players[nextPlayerIdxAfterDraw].id
      };
      
    case 'SAY_UNO':
      // Implement UNO call logic here
      return state;
    
    case 'UPDATE_GAME':
      const { key, value } = action.payload;
      return {
        ...state,
        [key]: value
      };
      
    default:
      return state;
  }
};

// Create the game context
interface GameContextProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  joinGame: (playerName: string) => void;
  startGame: () => void;
  playCard: (cardId: string, chosenColor?: string) => void;
  drawCard: () => void;
  sayUno: () => void;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

// Provider component
interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const currentPlayerId = React.useMemo(() => uuidv4(), []);
  
  useEffect(() => {
    // Set up socket event listeners
    socket.on('game_update', (gameState: GameState) => {
      console.log('Received game_update:', gameState);
      // Update local game state with server state
      Object.entries(gameState).forEach(([key, value]) => {
        dispatch({
          type: 'UPDATE_GAME',
          payload: { key, value }
        });
      });
    });
    
    socket.on('player_joined', (player: Player) => {
      dispatch({
        type: 'JOIN_GAME',
        payload: { playerId: player.id, playerName: player.name }
      });
    });
    
    socket.on('game_started', () => {
      dispatch({
        type: 'START_GAME',
        payload: {}
      });
    });
    
    return () => {
      socket.off('game_update');
      socket.off('player_joined');
      socket.off('game_started');
    };
  }, []);
  
  // Game actions
  const joinGame = (playerName: string) => {
    // Store current player ID in localStorage for identification
    localStorage.setItem('currentPlayerId', currentPlayerId);
    
    socket.emit('join_game', { playerId: currentPlayerId, playerName });
    dispatch({
      type: 'JOIN_GAME',
      payload: { playerId: currentPlayerId, playerName }
    });
  };
  
  const startGame = () => {
    socket.emit('start_game');
    dispatch({
      type: 'START_GAME',
      payload: {}
    });
  };
  
  const playCard = (cardId: string, chosenColor?: string) => {
    // Only send to server, don't update local state
    // Server will broadcast the updated state
    socket.emit('play_card', { cardId, playerId: currentPlayerId, chosenColor });
  };
  
  const drawCard = () => {
    // Only send to server, don't update local state
    // Server will broadcast the updated state
    socket.emit('draw_card', { playerId: currentPlayerId });
  };
  
  const sayUno = () => {
    socket.emit('say_uno', { playerId: currentPlayerId });
    dispatch({
      type: 'SAY_UNO',
      payload: { playerId: currentPlayerId }
    });
  };
  
  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        joinGame,
        startGame,
        playCard,
        drawCard,
        sayUno
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

// Custom hook to use the game context
export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}; 