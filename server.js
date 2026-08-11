const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: true }
});

(async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS players (
            login TEXT PRIMARY KEY,
            password TEXT NOT NULL,
            bananas INTEGER DEFAULT 0,
            upgrade_level INTEGER DEFAULT 0
        );
    `);
})();

app.post('/auth', async (req, res) => {
    const { login, password } = req.body;
    if (!login || !password) {
        return res.status(400).json({ error: 'Введи логин и пароль!' });
    }

    const result = await pool.query('SELECT * FROM players WHERE login = $1', [login]);
    if (result.rows.length === 0) {
        await pool.query(
            'INSERT INTO players (login, password, bananas, upgrade_level) VALUES ($1, $2, 0, 0)',
            [login, password]
        );
        return res.json({ success: true, data: { login, bananas: 0, upgrade_level: 0 } });
    }

    if (result.rows[0].password === password) {
        return res.json({
            success: true,
            data: {
                login: result.rows[0].login,
                bananas: result.rows[0].bananas,
                upgrade_level: result.rows[0].upgrade_level
            }
        });
    } else {
        return res.status(401).json({ error: 'Неверный пароль!' });
    }
});

app.post('/player', async (req, res) => {
    const { login } = req.body;
    const result = await pool.query('SELECT * FROM players WHERE login = $1', [login]);
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Игрок не найден' });
    }
    res.json({
        login: result.rows[0].login,
        bananas: result.rows[0].bananas,
        upgrade_level: result.rows[0].upgrade_level
    });
});

app.post('/save', async (req, res) => {
    const { login, bananas, upgrade_level } = req.body;
    await pool.query(
        'UPDATE players SET bananas = $1, upgrade_level = $2 WHERE login = $3',
        [bananas, upgrade_level, login]
    );
    res.json({ success: true });
});

app.listen(3000, () => console.log('✅ Сервер запущен!'));
