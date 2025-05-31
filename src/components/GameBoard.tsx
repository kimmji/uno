import React, { useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { Card as CardType } from '../types';
import Card from './Card';
import PlayerHand from './PlayerHand';

const GameBoard: React.FC = () => {
  const { state, playCard, drawCard, sayUno, resetGame } = useGame();
  const { players, currentPlayerId, topCard, gameStatus, winner, direction } = state;
  
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const currentPlayerIndex = players.findIndex(p => p.id === currentPlayerId);
  
  // Get current client's player ID (stored in GameContext)
  const currentClientPlayerId = useMemo(() => {
    // This should come from GameContext, but for now we'll find it differently
    // We need to store the client's player ID when joining the game
    return localStorage.getItem('currentPlayerId') || '';
  }, []);
  
  // Get your player from the players array using the stored player ID
  const yourPlayer = players.find(p => p.id === currentClientPlayerId);
  
  // Get other players
  const otherPlayers = players.filter(p => p.id !== currentClientPlayerId);
  
  const handlePlayCard = (card: CardType, chosenColor?: string) => {
    playCard(card.id, chosenColor);
  };
  
  const handleDrawCard = () => {
    drawCard();
  };
  
  const handleSayUno = () => {
    sayUno();
  };
  
  if (gameStatus === 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-800">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Waiting for players...</h2>
          <p className="mb-4">Current players: {players.length}</p>
        </div>
      </div>
    );
  }
  
  if (gameStatus === 'finished' && winner) {
    const winnerPlayer = players.find(p => p.id === winner);
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-800">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
          <p className="text-xl mb-6">
            {winnerPlayer?.name || 'Someone'} wins!
          </p>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={() => resetGame()}
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-green-800 p-4 text-white">
      <div className="flex justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">UNO Game</h2>
          <p>Direction: {direction === 'clockwise' ? '⟳' : '⟲'}</p>
        </div>
        <div>
          <p>Current Player: {currentPlayer?.name || 'Unknown'}</p>
          <p>Cards in Deck: {state.deck.length}</p>
        </div>
      </div>
      
      {/* Other players */}
      <div className="my-6">
        <h3 className="text-lg mb-2">Other Players:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {otherPlayers.map(player => (
            <div 
              key={player.id} 
              className={`p-4 rounded-lg shadow ${
                player.id === currentPlayerId ? 'bg-yellow-600' : 'bg-gray-700'
              }`}
            >
              <h4 className="font-bold">{player.name}</h4>
              <p>{player.cards.length} cards</p>
              <div className="flex flex-wrap mt-2">
                {player.cards.map((_, index) => (
                  <div 
                    key={index} 
                    className="w-6 h-8 bg-red-500 rounded-sm border border-white m-1"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Middle section with discard pile and draw pile */}
      <div className="flex justify-center items-center my-8 space-x-8">
        <div className="text-center">
          <p className="mb-2">Draw Pile</p>
          <div 
            className="w-20 h-32 bg-red-500 rounded-lg border-2 border-white cursor-pointer transform hover:scale-105 transition-transform"
            onClick={handleDrawCard}
          >
            <div className="h-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">UNO</span>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <p className="mb-2">Discard Pile</p>
          {topCard && (
            <Card card={topCard} className="shadow-xl" />
          )}
        </div>
      </div>
      
      {/* Your hand */}
      {yourPlayer && (
        <div className="mt-4">
          <div className="flex justify-between mb-2">
            <h3 className="text-lg font-bold">
              {yourPlayer.name} {yourPlayer.cards.length === 1 && (
                <button 
                  className="ml-2 px-3 py-1 bg-red-600 text-white rounded-lg"
                  onClick={handleSayUno}
                >
                  UNO!
                </button>
              )}
            </h3>
            
            {currentClientPlayerId === currentPlayerId && (
              <button 
                className="px-3 py-1 bg-blue-600 text-white rounded-lg"
                onClick={handleDrawCard}
              >
                Draw Card
              </button>
            )}
          </div>
          
          <PlayerHand 
            cards={yourPlayer.cards}
            isCurrentPlayer={currentClientPlayerId === currentPlayerId}
            topCard={topCard}
            onPlayCard={handlePlayCard}
          />
        </div>
      )}
    </div>
  );
};

export default GameBoard; 