const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Для админ-пароля через Environment Variable
const adminPassword = process.env.ADMIN_PASSWORD || 'Samu12321';

// Отдаём папку public как статическую
app.use(express.static(path.join(__dirname, 'public')));

// Простейший API для проверки сервера
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'Сервер онлайн!' });
});

// Логика админки
app.get('/admin', (req, res) => {
  const pass = req.query.pass;
  if (pass === adminPassword) {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  } else {
    res.send('Неверный пароль!');
  }
});

// Простейший API для лидеров и статистики
app.get('/api/leaderboard', (req, res) => {
  const data = fs.existsSync('players.json') ? JSON.parse(fs.readFileSync('players.json')) : [];
  res.json(data);
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
