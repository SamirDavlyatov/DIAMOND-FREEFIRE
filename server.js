const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // для index.html, admin.html и т.д.

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Samu12321";

// ====== Игроки ======
let players = {};
const PLAYERS_FILE = path.join(__dirname, 'players.json');

// Загружаем прогресс из файла
if (fs.existsSync(PLAYERS_FILE)) {
    const data = fs.readFileSync(PLAYERS_FILE, 'utf-8');
    players = JSON.parse(data);
}

// Сохраняем прогресс в файл
function savePlayers() {
    fs.writeFileSync(PLAYERS_FILE, JSON.stringify(players, null, 2));
}

// ====== Роуты ======

// Вход игрока
app.post('/login', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Введите имя" });
    if (!players[name]) {
        players[name] = { diamonds: 0n, ffDiamonds: 0n, level: 1 };
        savePlayers();
    }
    res.json({ success: true, player: players[name] });
});

// Сбор ресурсов
app.post('/collect', (req, res) => {
    const { name } = req.body;
    if (!name || !players[name]) return res.status(400).json({ error: "Игрок не найден" });

    const gain = BigInt(Math.floor(Math.random()*5) + 1);
    players[name].diamonds += gain;
    players[name].level += 1;
    savePlayers();
    res.json({ success: true, gain: gain.toString(), player: players[name] });
});

// Лидеры
app.get('/leaderboard', (req, res) => {
    const leaderboard = Object.entries(players)
        .map(([name, data]) => ({ name, diamonds: data.diamonds.toString(), ffDiamonds: data.ffDiamonds.toString(), level: data.level }))
        .sort((a,b) => b.diamonds - a.diamonds);
    res.json(leaderboard);
});

// ====== Админка ======
app.post('/admin', (req, res) => {
    const { password, action, playerName } = req.body;
    if (password !== ADMIN_PASSWORD) return res.status(403).json({ error: "Неверный пароль" });

    if (!players[playerName]) return res.status(400).json({ error: "Игрок не найден" });

    switch(action){
        case 'level':
            players[playerName].level += 1000;
            break;
        case 'ff10':
            players[playerName].ffDiamonds += 10n;
            break;
        case 'ffTrill':
            players[playerName].ffDiamonds += 1000000000000n;
            break;
        case 'diamTrill':
            players[playerName].diamonds += 1000000000000n;
            break;
        default:
            return res.status(400).json({ error: "Неизвестное действие" });
    }
    savePlayers();
    res.json({ success: true, player: players[playerName] });
});

// ====== Запуск сервера ======
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
