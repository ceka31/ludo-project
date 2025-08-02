const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

let rooms = {}; // { roomId: { players: [], gameState: {} } }

app.get('/', (req, res) => {
  res.send("Multiplayer Ludo server çalışıyor!");
});

io.on('connection', (socket) => {
  console.log(`Yeni bağlantı: ${socket.id}`);

  // Odaya katılmak
  socket.on('joinRoom', ({ roomId, playerName }) => {
    if (!rooms[roomId]) {
      rooms[roomId] = { players: [], gameState: {} };
    }
    if (rooms[roomId].players.length >= 4) {
      socket.emit('roomFull');
      return;
    }
    socket.join(roomId);
    rooms[roomId].players.push({ id: socket.id, name: playerName });
    io.to(roomId).emit('playersUpdate', rooms[roomId].players);

    // Oyun başlatma
    if (rooms[roomId].players.length === 4) {
      rooms[roomId].gameState = initializeLudoState(roomId);
      io.to(roomId).emit('gameStart', rooms[roomId].gameState);
    }
  });

  // Zar atma işlemi
  socket.on('rollDice', ({ roomId }) => {
    let diceValue = Math.floor(Math.random() * 6) + 1;
    io.to(roomId).emit('diceRolled', { playerId: socket.id, diceValue });
  });

  // Taş hareketi
  socket.on('movePiece', ({ roomId, pieceIndex, toPosition }) => {
    // Basit bir örnek, taşın hareketini sadece iletir.
    io.to(roomId).emit('pieceMoved', { playerId: socket.id, pieceIndex, toPosition });
  });

  // Bağlantı koparsa
  socket.on('disconnect', () => {
    for (let roomId in rooms) {
      rooms[roomId].players = rooms[roomId].players.filter(p => p.id !== socket.id);
      io.to(roomId).emit('playersUpdate', rooms[roomId].players);
      // Oda boşsa sil
      if (rooms[roomId].players.length === 0) {
        delete rooms[roomId];
      }
    }
    console.log(`Bağlantı ayrıldı: ${socket.id}`);
  });
});

// Ludo oyun durumu başlatıcı (örnek)
function initializeLudoState(roomId) {
  const colors = ['red', 'green', 'yellow', 'blue'];
  let state = {
    turn: 0,
    pieces: {},
  };
  rooms[roomId].players.forEach((player, idx) => {
    state.pieces[player.id] = Array(4).fill(0); // Her oyuncunun 4 taşı başta evde
    state.colors = colors;
  });
  return state;
}

server.listen(PORT, () => {
  console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});
