import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

const Lobby: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const { joinGame, startGame, state } = useGame();
  const { players, gameStatus } = state;
  
  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      joinGame(playerName.trim());
    }
  };
  
  const handleStartGame = () => {
    if (players.length >= 2) {
      startGame();
    }
  };
  
  const isJoined = players.length > 0;
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-800">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-6">UNO Game Lobby</h1>
        
        {!isJoined ? (
          <form onSubmit={handleJoinGame} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Join Game
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-100 p-4 rounded-lg">
              <h2 className="text-lg font-medium mb-2">Players ({players.length})</h2>
              <ul className="space-y-2">
                {players.map(player => (
                  <li key={player.id} className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    <span>{player.name}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="text-center">
              <p className="mb-2 text-sm text-gray-500">
                {players.length < 2 
                  ? 'Need at least 2 players to start' 
                  : 'Ready to start the game!'}
              </p>
              <button
                onClick={handleStartGame}
                disabled={players.length < 2}
                className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  players.length < 2 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                }`}
              >
                Start Game
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby; 