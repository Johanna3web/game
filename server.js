const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database('./memorymatch.db');

// Create tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      score INTEGER,
      date_played TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
});

// Register
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });

  const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
  stmt.run(username, password, function (err) {
    if (err) return res.status(400).json({ error: 'Username taken' });
    res.json({ userId: this.lastID, message: 'Registered successfully' });
  });
  stmt.finalize();
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT id FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ userId: row.id, message: 'Login successful' });
  });
});

// Save Score
app.post('/api/scores', (req, res) => {
  const { userId, score } = req.body;
  if (!userId || score == null) return res.status(400).json({ error: 'Missing userId or score' });

  const datePlayed = new Date().toISOString();
  const stmt = db.prepare('INSERT INTO scores (user_id, score, date_played) VALUES (?, ?, ?)');
  stmt.run(userId, score, datePlayed, function (err) {
    if (err) return res.status(500).json({ error: 'Failed to save score' });
    res.json({ message: 'Score saved' });
  });
  stmt.finalize();
});

// Get top scores
app.get('/api/scores/top', (req, res) => {
  db.all(`
    SELECT users.username, scores.score, scores.date_played
    FROM scores JOIN users ON scores.user_id = users.id
    ORDER BY scores.score DESC LIMIT 10
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

const path = require('path');

// Serve React build files
app.use(express.static(path.join(__dirname, 'client')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});
