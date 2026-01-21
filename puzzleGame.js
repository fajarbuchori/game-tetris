const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const holdCanvas = document.getElementById('hold');
const holdCtx = holdCanvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const restartBtn = document.getElementById('restart');

const ROWS = 20, COLS = 10, BLOCK_SIZE = 20;
const COLORS = ['#f87171', '#facc15', '#4ade80', '#38bdf8', '#818cf8', '#f472b6', '#fb923c'];

let board = Array.from({ length: ROWS }, () => Array(COLS).fill(''));
let score = 0, gameOver = false;
const dropInterval = 500;

// Shapes
const SHAPES = {
  I: [[[1,1,1,1]], [[1],[1],[1],[1]]],
  O: [[[1,1],[1,1]]],
  T: [
    [[0,1,0],[1,1,1]],
    [[1,0],[1,1],[1,0]],
    [[1,1,1],[0,1,0]],
    [[0,1],[1,1],[0,1]]
  ],
  S: [[[0,1,1],[1,1,0]], [[1,0],[1,1],[0,1]]],
  Z: [[[1,1,0],[0,1,1]], [[0,1],[1,1],[1,0]]],
  J: [
    [[1,0,0],[1,1,1]],
    [[1,1],[1,0],[1,0]],
    [[1,1,1],[0,0,1]],
    [[0,1],[0,1],[1,1]]
  ],
  L: [
    [[0,0,1],[1,1,1]],
    [[1,0],[1,0],[1,1]],
    [[1,1,1],[1,0,0]],
    [[1,1],[0,1],[0,1]]
  ]
};

const TYPES = Object.keys(SHAPES);

function randomPiece() {
  const type = TYPES[Math.floor(Math.random() * TYPES.length)];
  return {
    type,
    shape: SHAPES[type][0],
    rotation: 0,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    x: 3,
    y: 0
  };
}

let piece = randomPiece();
let holdPiece = null;
let canHold = true;

// Drawing
function drawBlock(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  ctx.strokeStyle = '#0f172a';
  ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  board.forEach((row, y) =>
    row.forEach((cell, x) => cell && drawBlock(x, y, cell))
  );

  piece.shape.forEach((row, y) =>
    row.forEach((cell, x) => cell && drawBlock(piece.x + x, piece.y + y, piece.color))
  );
}

function drawHold() {
  holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
  if (!holdPiece) return;

  holdPiece.shape.forEach((row, y) =>
    row.forEach((cell, x) => {
      if (cell) {
        holdCtx.fillStyle = holdPiece.color;
        holdCtx.fillRect(x * 15 + 20, y * 15 + 20, 15, 15);
        holdCtx.strokeStyle = '#0f172a';
        holdCtx.strokeRect(x * 15 + 20, y * 15 + 20, 15, 15);
      }
    })
  );
}

// Game logic
function collision() {
  return piece.shape.some((row, y) =>
    row.some((cell, x) => {
      if (!cell) return false;
      const nx = piece.x + x, ny = piece.y + y;
      return nx < 0 || nx >= COLS || ny >= ROWS || (board[ny] && board[ny][nx]);
    })
  );
}

function merge() {
  piece.shape.forEach((row, y) =>
    row.forEach((cell, x) => {
      if (cell) board[piece.y + y][piece.x + x] = piece.color;
    })
  );
}

function clearLines() {
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(c => c)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(''));
      score += 100;
      scoreDisplay.textContent = `Skor: ${score}`;
      y++;
    }
  }
}

function moveDown() {
  piece.y++;
  if (collision()) {
    piece.y--;
    merge();
    clearLines();
    piece = randomPiece();
    canHold = true;
    if (collision()) {
      alert(`Game Over! Skor kamu: ${score}`);
      gameOver = true;
    }
  }
}

function rotate() {
  const rotations = SHAPES[piece.type];
  piece.rotation = (piece.rotation + 1) % rotations.length;
  const oldShape = piece.shape;
  piece.shape = rotations[piece.rotation];
  if (collision()) piece.shape = oldShape;
}

function hold() {
  if (!canHold) return;
  [holdPiece, piece] = holdPiece
    ? [ { ...piece }, { ...holdPiece, x: 3, y: 0 } ]
    : [ { ...piece }, randomPiece() ];
  canHold = false;
  drawHold();
}

// Controls
document.addEventListener('keydown', e => {
  if (gameOver) return;
  if (e.key === 'ArrowLeft') piece.x--, collision() && piece.x++;
  if (e.key === 'ArrowRight') piece.x++, collision() && piece.x--;
  if (e.key === 'ArrowDown') moveDown();
  if (e.key === 'ArrowUp') rotate();
  if (e.key.toLowerCase() === 'c') hold();
  drawBoard();
});

restartBtn.onclick = () => {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(''));
  score = 0;
  scoreDisplay.textContent = 'Skor: 0';
  piece = randomPiece();
  holdPiece = null;
  gameOver = false;
  drawHold();
};

setInterval(() => {
  if (!gameOver) {
    moveDown();
    drawBoard();
  }
}, dropInterval);

drawBoard();
drawHold();

// ===== SWIPE CONTROL (MOBILE) =====
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

const SWIPE_THRESHOLD = 30; // sensitif swipe

canvas.addEventListener('touchstart', e => {
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: true });

canvas.addEventListener('touchend', e => {
  if (gameOver) return;

  touchEndX = e.changedTouches[0].clientX;
  touchEndY = e.changedTouches[0].clientY;

  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy)) {
    // Swipe horizontal
    if (dx > SWIPE_THRESHOLD) {
      // Kanan
      piece.x++;
      if (collision()) piece.x--;
    } else if (dx < -SWIPE_THRESHOLD) {
      // Kiri
      piece.x--;
      if (collision()) piece.x++;
    }
  } else {
    // Swipe vertical
    if (dy > SWIPE_THRESHOLD) {
      // Bawah
      moveDown();
    } else if (dy < -SWIPE_THRESHOLD) {
      // Atas (Rotate)
      rotate();
    }
  }

  drawBoard();
}, { passive: true });