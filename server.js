const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Samu12321';
const PLAYERS_FILE = path.join(__dirname, 'players.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// ====== Загрузка игроков ======
function loadPlayers() {
  if (!fs.existsSync(PLAYERS_FILE)) fs.writeFileSync(PLAYERS_FILE, '[]');
  return JSON.parse(fs.readFileSync(PLAYERS_FILE));
}

// ====== Сохранение игроков ======
function savePlayers(players) {
  fs.writeFileSync(PLAYERS_FILE, JSON.stringify(players, null, 2));
}

// ====== /login ======
app.post('/login', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Введите имя!' });

  const players = loadPlayers();
  let player = players.find(p => p.name === name);
  if (!player) {
    player = { name, diamonds: "0", ffDiamonds: "0", level: 1 };
    players.push(player);
    savePlayers(players);
  }
  res.json(player);
});

// ====== /collect ======
app.post('/collect', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Введите имя!' });

  const players = loadPlayers();
  const player = players.find(p => p.name === name);
  if (!player) return res.status(404).json({ error: 'Игрок не найден' });

  const gained = BigInt(Math.floor(Math.random() * 5) + 1);
  player.diamonds = (BigInt(player.diamonds) || 0n) + gained;
  player.diamonds = player.diamonds.toString();
  savePlayers(players);
  res.json({ diamonds: player.diamonds, gained: gained.toString() });
});

// ====== /leaderboard ======
app.get('/leaderboard', (req, res) => {
  const players = loadPlayers();
  res.json(players);
});

// ====== Админка ======
function adminAction(req, res, callback) {
  const { password, name } = req.body;
  if (password !== ADMIN_PASSWORD) return res.json({ error: 'Неверный пароль!' });

  const players = loadPlayers();
  const player = players.find(p => p.name === name);
  if (!player) return res.json({ error: 'Игрок не найден' });

  callback(player);
  savePlayers(players);
  res.json(player);
}

app.post('/admin/level', (req, res) =>
  adminAction(req, res, player => player.level += Number(req.body.level || 1000))
);
app.post('/admin/ff10', (req, res) =>
  adminAction(req, res, player => player.ffDiamonds = (BigInt(player.ffDiamonds) || 0n) + 10n + "")
);
app.post('/admin/ffTrill', (req, res) =>
  adminAction(req, res, player => player.ffDiamonds = (BigInt(player.ffDiamonds) || 0n) + 1000000000000n + "")
);
app.post('/admin/diamTrill', (req, res) =>
  adminAction(req, res, player => player.diamonds = (BigInt(player.diamonds) || 0n) + 1000000000000n + "")
);

// ====== Запуск сервера ======
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
