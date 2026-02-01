const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const rooms = {};  // Simple in-memory storage (fine for small games)

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('createRoom', () => {
    const roomId = uuidv4().slice(0, 6).toUpperCase();
    rooms[roomId] = { players: [], gameState: null };
    socket.join(roomId);
    socket.emit('roomCreated', { roomId });
    io.to(roomId).emit('playerList', rooms[roomId].players);
  });

  socket.on('joinRoom', (roomId) => {
    roomId = roomId.toUpperCase();
    if (rooms[roomId]) {
      socket.join(roomId);
      const player = { id: socket.id, name: `Player ${rooms[roomId].players.length + 1}`, connected: true };
      rooms[roomId].players.push(player);
      socket.emit('roomJoined', { roomId, playerId: socket.id });
      io.to(roomId).emit('playerList', rooms[roomId].players);
    } else {
      socket.emit('error', 'Room not found');
    }
  });

  // TODO: Add full game events (startGame, playerReady, vote, disconnect handling)
  // For now this handles room creation/joining – expand as needed

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    // Optional: remove from rooms
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
