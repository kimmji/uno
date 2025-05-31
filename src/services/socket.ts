import { io } from 'socket.io-client';

// In a real production app, this would be an environment variable
const SOCKET_URL = 'http://localhost:3001';

// Create a socket instance
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Connect to the server
export const connectToServer = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

// Disconnect from the server
export const disconnectFromServer = () => {
  if (socket.connected) {
    socket.disconnect();
  }
}; 