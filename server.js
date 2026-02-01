const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const rooms = {}; // roomId → { players: [{id, name, connected}], ... }

app.get('/', (req, res) => res.send('<h1>Imposter Server Running</h1>'));

io.on('connection', socket => {
  console.log('Connected:', socket.id);

  socket.on('createRoom', ({ name }) => {
    const roomId = uuidv4().slice(0, 6).toUpperCase();
    rooms[roomId] = { players: [{ id: socket.id, name, connected: true }] };
    socket.join(roomId);
    socket.emit('roomCreated', { roomId });
    io.to(roomId).emit('playerList', rooms[roomId].players);
  });

  socket.on('joinRoom', ({ roomId, name }) => {
    roomId = roomId.toUpperCase();
    if (!rooms[roomId]) return socket.emit('error', 'Room not found');

    rooms[roomId].players.push({ id: socket.id, name, connected: true });
    socket.join(roomId);
    socket.emit('roomJoined', { roomId });
    io.to(roomId).emit('playerList', rooms[roomId].players);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
    // optional: mark as disconnected
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Listening on ${PORT}`));
