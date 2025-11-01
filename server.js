const express = require('express');
const fs = require('fs-extra');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const PLAYERS_FILE = 'players.json';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Samu12321';

// ====== Загрузка игроков ======
let players = [];
if (fs.existsSync(PLAYERS_FILE)) {
  players = fs.readJsonSync(PLAYERS_FILE);
}

// ====== Сохранение игроков ======
function savePlayers() {
  fs.writeJsonSync(PLAYERS_FILE, players, { spaces: 2 });
}

// ====== Маршруты ======
// Вход игрока
app.post('/login', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Введите имя!' });

  let player = players.find(p => p.name === name);
  if (!player) {
    player = { name, diamonds: 0, ffDiamonds: 0, level: 1, dailyCollected: 0, lastDate: new Date().toDateString() };
    players.push(player);
    savePlayers();
  }
  res.json(player);
});

// Сбор ресурсов
app.post('/collect', (req, res) => {
  const { name } = req.body;
  const player = players.find(p => p.name === name);
  if (!player) return res.status(404).json({ error: 'Игрок не найден' });

  const today = new Date().toDateString();
  if (player.lastDate !== today) {
    player.dailyCollected = 0;
    player.lastDate = today;
  }

  const dailyLimit = 20000;
  if (player.dailyCollected >= dailyLimit) return res.status(400).json({ error: 'Лимит достигнут!' });

  const gain = Math.floor(Math.random() * 5) + 1;
  player.diamonds += gain;
  player.dailyCollected += gain;

  savePlayers();
  res.json(player);
});

// Таблица лидеров
app.get('/leaderboard', (req, res) => {
  const sorted = [...players].sort((a, b) => b.diamonds + b.ffDiamonds - (a.diamonds + a.ffDiamonds));
  res.json(sorted);
});

// ====== Админ-панель ======
app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(403).json({ error: 'Неверный пароль!' });
  res.json({ success: true });
});

// Установка точного количества алмазов и FF алмазов
app.post('/admin/set', (req, res) => {
  const { name, diamonds, ffDiamonds } = req.body;
  const player = players.find(p => p.name === name);
  if (!player) return res.status(404).json({ error: 'Игрок не найден' });

  if(!isNaN(diamonds)) player.diamonds = diamonds;
  if(!isNaN(ffDiamonds)) player.ffDiamonds = ffDiamonds;

  savePlayers();
  res.json(player);
});

// ====== Запуск сервера ======
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
