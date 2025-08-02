// Multiplayer Ludo frontend
const socket = io();

// Görselleri yükle
const boardImg = new Image();
boardImg.src = 'assets/board.png'; // ![image1](image1)
const diceImg = new Image();
diceImg.src = 'assets/dice.png'; // ![image3](image3)
const winImg = new Image();
winImg.src = 'assets/win.png'; // ![image4](image4)

const canvas = document.getElementById('ludo-canvas');
const ctx = canvas.getContext('2d');

const rollDiceBtn = document.getElementById('rollDiceBtn');
const diceDiv = document.getElementById('dice');
const playerInfoDiv = document.getElementById('player-info');
const winBanner = document.getElementById('win-banner');

let playerId = null;
let roomId = 'default';
let playerName = prompt("Adınızı girin:");
let gameState = null;
let diceValue = 1;

// Odaya katıl
socket.emit('joinRoom', { roomId, playerName });

socket.on('playersUpdate', (players) => {
  playerInfoDiv.textContent = players.map(p => p.name).join(' | ');
});

socket.on('gameStart', (state) => {
  gameState = state;
  drawBoard();
});

socket.on('diceRolled', ({ playerId: pid, diceValue: val }) => {
  diceValue = val;
  showDice(val);
  if (pid === socket.id) rollDiceBtn.disabled = true;
});

socket.on('pieceMoved', ({ playerId: pid, pieceIndex, toPosition }) => {
  // Basit hareket: taş pozisyonunu güncelle
  if (gameState && gameState.pieces[pid]) {
    gameState.pieces[pid][pieceIndex] = toPosition;
    drawBoard();
  }
});

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(boardImg, 0, 0, canvas.width, canvas.height);

  // Her oyuncunun taşlarını çiz
  if (gameState) {
    let colors = ['red', 'green', 'yellow', 'blue'];
    Object.keys(gameState.pieces).forEach((pid, idx) => {
      gameState.pieces[pid].forEach((pos, pidx) => {
        drawPiece(idx, pos, pidx);
      });
    });
  }
}

function drawPiece(colorIdx, position, pieceIdx) {
  // Basit örnek: taşlar board üzerinde renkli daireler olarak gösterilir
  let startX = 80 + colorIdx * 150; // Her bölgeye göre başlangıç
  let startY = 80 + pieceIdx * 30;
  let x = startX + (position * 20) % 600;
  let y = startY + Math.floor(position / 30) * 20;
  ctx.beginPath();
  ctx.arc(x, y, 16, 0, 2 * Math.PI);
  ctx.fillStyle = ['#e74c3c', '#27ae60', '#f4d03f', '#3498db'][colorIdx];
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function showDice(val) {
  // Dice sprite'ta her yüz 56px yüksekliğinde
  diceDiv.style.backgroundPosition = `0px ${-56 * (val - 1)}px`;
}

// Zar atma
rollDiceBtn.onclick = () => {
  socket.emit('rollDice', { roomId });
};

// Kazananı gösterme (örnek)
function showWin() {
  winBanner.style.display = 'block';
  setTimeout(() => winBanner.style.display = 'none', 5000);
}

// Oyunu başlatınca board görseli yüklenince çiz
boardImg.onload = drawBoard;
