import React, { useEffect } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';
import { connectToServer, disconnectFromServer } from './services/socket';
import './App.css';

const GameContainer: React.FC = () => {
  const { state } = useGame();
  const { gameStatus } = state;
  
  useEffect(() => {
    // Connect to the socket server when component mounts
    connectToServer();
    
    // Disconnect from the socket server when component unmounts
    return () => {
      disconnectFromServer();
    };
  }, []);
  
  return (
    <div className="App">
      {gameStatus === 'waiting' ? <Lobby /> : <GameBoard />}
    </div>
  );
};

function App() {
  return (
    <GameProvider>
      <GameContainer />
    </GameProvider>
  );
}

export default App;
