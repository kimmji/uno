const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// Game state
let gameState = {
  players: [],
  currentPlayerId: '',
  topCard: null,
  direction: 'clockwise',
  deck: [],
  gameStatus: 'waiting',
  winner: null
};

// Create Express app
const app = express();
app.use(cors());

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join game event
  socket.on('join_game', ({ playerId, playerName }) => {
    console.log(`Player ${playerName} (${playerId}) joined the game`);
    
    // Add player to the game
    const newPlayer = {
      id: playerId,
      name: playerName,
      socketId: socket.id,
      cards: [],
      isCurrentPlayer: gameState.players.length === 0 // First player is current player
    };
    
    gameState.players.push(newPlayer);
    
    // Broadcast to all clients that a player has joined
    io.emit('player_joined', newPlayer);
    
    // Send the current game state to the new player
    socket.emit('game_update', gameState);
  });
  
  // Start game event
  socket.on('start_game', () => {
    console.log('Game started');
    
    if (gameState.players.length < 2) {
      socket.emit('error', { message: 'Need at least 2 players to start the game' });
      return;
    }
    
    // Create deck
    const deck = createDeck();
    const firstCard = deck.pop();
    
    // Ensure the first card is not a wild card (for simplicity)
    const topCard = firstCard.color === 'wild' ? deck.pop() : firstCard;
    
    // Deal cards to players
    const hands = dealCards(deck, gameState.players.length);
    
    // Update player hands
    gameState.players = gameState.players.map((player, index) => {
      return {
        ...player,
        cards: hands[index],
        isCurrentPlayer: index === 0
      };
    });
    
    // Update game state
    gameState = {
      ...gameState,
      currentPlayerId: gameState.players[0].id,
      topCard,
      deck: deck,
      gameStatus: 'playing'
    };
    
    // Broadcast game started event and updated state
    io.emit('game_started');
    broadcastGameState();
  });
  
  // Play card event
  socket.on('play_card', ({ cardId, playerId, chosenColor }) => {
    console.log(`Player ${playerId} played card ${cardId}`);
    
    // Find the player
    const playerIndex = gameState.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1 || gameState.players[playerIndex].id !== gameState.currentPlayerId) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }
    
    // Find the card
    const cardIndex = gameState.players[playerIndex].cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      socket.emit('error', { message: 'Card not found' });
      return;
    }
    
    const playedCard = gameState.players[playerIndex].cards[cardIndex];
    
    // Check if the card can be played
    if (!canPlayCard(playedCard, gameState.topCard)) {
      socket.emit('error', { message: 'Cannot play this card' });
      return;
    }
    
    // Remove the card from the player's hand
    const updatedCards = [
      ...gameState.players[playerIndex].cards.slice(0, cardIndex),
      ...gameState.players[playerIndex].cards.slice(cardIndex + 1)
    ];
    
    // Check if the player won
    if (updatedCards.length === 0) {
      gameState.winner = playerId;
      gameState.gameStatus = 'finished';
    }
    
    // Handle wild cards
    const updatedPlayedCard = playedCard.color === 'wild' 
      ? { ...playedCard, chosenColor } 
      : playedCard;
    
    // Determine the next player
    let nextPlayerIndex = playerIndex;
    if (gameState.direction === 'clockwise') {
      nextPlayerIndex = (playerIndex + 1) % gameState.players.length;
    } else {
      nextPlayerIndex = (playerIndex - 1 + gameState.players.length) % gameState.players.length;
    }
    
    // Handle special cards
    if (playedCard.value === 'skip') {
      console.log(`Skip card played - skipping player at index ${nextPlayerIndex}`);
      // Skip the next player
      if (gameState.direction === 'clockwise') {
        nextPlayerIndex = (nextPlayerIndex + 1) % gameState.players.length;
      } else {
        nextPlayerIndex = (nextPlayerIndex - 1 + gameState.players.length) % gameState.players.length;
      }
    } else if (playedCard.value === 'reverse') {
      console.log(`Reverse card played - changing direction from ${gameState.direction}`);
      // Reverse the direction
      gameState.direction = gameState.direction === 'clockwise' ? 'counterclockwise' : 'clockwise';
      console.log(`Direction is now ${gameState.direction}`);
    } else if (playedCard.value === 'draw2') {
      console.log(`Draw2 card played - player at index ${nextPlayerIndex} draws 2 cards and loses turn`);
      // Next player draws 2 cards and loses their turn
      const drawnCards = drawCards(gameState.deck, 2);
      gameState.players[nextPlayerIndex].cards = [...gameState.players[nextPlayerIndex].cards, ...drawnCards];
      console.log(`Player now has ${gameState.players[nextPlayerIndex].cards.length} cards`);
      
      // Skip the player who drew cards
      if (gameState.direction === 'clockwise') {
        nextPlayerIndex = (nextPlayerIndex + 1) % gameState.players.length;
      } else {
        nextPlayerIndex = (nextPlayerIndex - 1 + gameState.players.length) % gameState.players.length;
      }
    } else if (playedCard.value === 'wild_draw4') {
      console.log(`Wild Draw4 card played - player at index ${nextPlayerIndex} draws 4 cards and loses turn`);
      // Next player draws 4 cards and loses their turn
      const drawnCards = drawCards(gameState.deck, 4);
      gameState.players[nextPlayerIndex].cards = [...gameState.players[nextPlayerIndex].cards, ...drawnCards];
      console.log(`Player now has ${gameState.players[nextPlayerIndex].cards.length} cards`);
      
      // Skip the player who drew cards
      if (gameState.direction === 'clockwise') {
        nextPlayerIndex = (nextPlayerIndex + 1) % gameState.players.length;
      } else {
        nextPlayerIndex = (nextPlayerIndex - 1 + gameState.players.length) % gameState.players.length;
      }
    }
    
    // Update player's hand
    gameState.players[playerIndex].cards = updatedCards;
    console.log(`Player ${playerId} now has ${updatedCards.length} cards`);
    
    // Update current player
    gameState.players = gameState.players.map((p, idx) => {
      return {
        ...p,
        isCurrentPlayer: idx === nextPlayerIndex
      };
    });
    
    // Update game state
    gameState.currentPlayerId = gameState.players[nextPlayerIndex].id;
    gameState.topCard = updatedPlayedCard;
    console.log(`Next player: ${gameState.players[nextPlayerIndex].name} (index: ${nextPlayerIndex})`);
    
    // Broadcast the card played event and updated state
    io.emit('card_played', { cardId, playerId, chosenColor });
    broadcastGameState();
  });
  
  // Draw card event
  socket.on('draw_card', ({ playerId }) => {
    console.log(`Player ${playerId} drew a card`);
    
    // Check if it's the player's turn
    if (gameState.currentPlayerId !== playerId) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }
    
    // Draw a card from the deck
    const drawnCards = drawCards(gameState.deck, 1);
    
    // Find the player
    const playerIndex = gameState.players.findIndex(p => p.id === playerId);
    
    // Add the card to the player's hand
    gameState.players[playerIndex].cards = [...gameState.players[playerIndex].cards, ...drawnCards];
    
    // Determine the next player
    let nextPlayerIndex = playerIndex;
    if (gameState.direction === 'clockwise') {
      nextPlayerIndex = (playerIndex + 1) % gameState.players.length;
    } else {
      nextPlayerIndex = (playerIndex - 1 + gameState.players.length) % gameState.players.length;
    }
    
    // Update current player
    gameState.players = gameState.players.map((p, idx) => {
      return {
        ...p,
        isCurrentPlayer: idx === nextPlayerIndex
      };
    });
    
    // Update game state
    gameState.currentPlayerId = gameState.players[nextPlayerIndex].id;
    
    // Broadcast the card drawn event and updated state
    io.emit('card_drawn', { playerId });
    broadcastGameState();
  });
  
  // Say UNO event
  socket.on('say_uno', ({ playerId }) => {
    console.log(`Player ${playerId} said UNO!`);
    // Implement UNO logic here
    io.emit('player_said_uno', { playerId });
  });
  
  // Reset game event
  socket.on('reset_game', () => {
    console.log('Game reset requested');
    
    // Reset game state to initial values
    gameState = {
      players: gameState.players.map(player => ({
        ...player,
        cards: [],
        isCurrentPlayer: false
      })),
      currentPlayerId: '',
      topCard: null,
      direction: 'clockwise',
      deck: [],
      gameStatus: 'waiting',
      winner: null
    };
    
    console.log('Game has been reset');
    
    // Broadcast the reset state to all clients
    broadcastGameState();
  });
  
  // Disconnect event
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove player from the game
    const playerIndex = gameState.players.findIndex(p => p.socketId === socket.id);
    if (playerIndex !== -1) {
      const player = gameState.players[playerIndex];
      console.log(`Player ${player.name} (${player.id}) left the game`);
      
      // Remove the player
      gameState.players = gameState.players.filter(p => p.socketId !== socket.id);
      
      // If the game is in progress and there are not enough players, reset the game
      if (gameState.gameStatus === 'playing' && gameState.players.length < 2) {
        gameState.gameStatus = 'waiting';
        gameState.winner = null;
        gameState.topCard = null;
        gameState.deck = [];
        gameState.currentPlayerId = '';
        gameState.direction = 'clockwise';
      }
      
      // Broadcast the updated state
      broadcastGameState();
    }
  });
});

// Broadcast the current game state to all clients
function broadcastGameState() {
  // Create a safe copy of the game state to send to clients
  // We need to filter out sensitive information like other players' cards
  const players = gameState.players.map(player => {
    return {
      ...player,
      cards: player.cards.map(card => ({ ...card }))
    };
  });
  
  // Send the game state to each player
  gameState.players.forEach(player => {
    const playerSocket = io.sockets.sockets.get(player.socketId);
    if (playerSocket) {
      // For each player, hide other players' cards
      const playerView = {
        ...gameState,
        players: players.map(p => {
          if (p.id === player.id) {
            return p;
          } else {
            return {
              ...p,
              cards: p.cards.map(() => ({ id: 'hidden', color: 'hidden', value: 'hidden' }))
            };
          }
        })
      };
      
      playerSocket.emit('game_update', playerView);
    }
  });
}

// UNO card utilities
function createDeck() {
  const deck = [];
  const colors = ['red', 'yellow', 'green', 'blue'];
  const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const actions = ['skip', 'reverse', 'draw2'];
  const wilds = ['wild', 'wild_draw4'];
  
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
}

function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function dealCards(deck, playerCount) {
  const hands = Array(playerCount).fill().map(() => []);
  const deckCopy = [...deck];
  
  // Deal 7 cards to each player
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < playerCount; j++) {
      if (deckCopy.length > 0) {
        const card = deckCopy.pop();
        hands[j].push(card);
      }
    }
  }
  
  // Update the deck
  gameState.deck = deckCopy;
  
  return hands;
}

function drawCards(deck, count) {
  const cards = [];
  
  for (let i = 0; i < count && gameState.deck.length > 0; i++) {
    const card = gameState.deck.pop();
    cards.push(card);
  }
  
  // If the deck is empty, shuffle the discard pile and use it as the new deck
  if (gameState.deck.length === 0 && cards.length < count) {
    // In a real implementation, we would keep track of the discard pile
    // For simplicity, we'll just create a new deck
    const newDeck = createDeck();
    gameState.deck = newDeck;
    
    // Draw the remaining cards
    const remainingCount = count - cards.length;
    for (let i = 0; i < remainingCount && gameState.deck.length > 0; i++) {
      const card = gameState.deck.pop();
      cards.push(card);
    }
  }
  
  return cards;
}

function canPlayCard(card, topCard) {
  // Wild cards can always be played
  if (card.color === 'wild') return true;
  
  // If colors match, card can be played
  if (card.color === topCard.color) return true;
  
  // If values match, card can be played
  if (card.value === topCard.value) return true;

  // If top card is wild with a chosen color
  if (topCard.color === 'wild' && topCard.chosenColor) {
    return card.color === topCard.chosenColor;
  }
  
  return false;
}

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 