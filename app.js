import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

const secrets = ['💌', '🔐', '💍', '📱', '🎁', '💣', '🍷', '💤'];

const secretStories = {
  '💌': { name: 'Ava', story: 'Ava wrote a love letter but never sent it.' },
  '🔐': { name: 'Jayden', story: 'Jayden hides a key to his heart — literally.' },
  '💍': { name: 'Zoe', story: 'Zoe was once engaged, but the ring vanished.' },
  '📱': { name: 'Mason', story: 'Mason keeps a message from an ex he can’t delete.' },
  '🎁': { name: 'Liam', story: 'Liam buys gifts for someone who ghosted him.' },
  '💣': { name: 'Luna', story: 'Luna is explosive — emotionally and otherwise.' },
  '🍷': { name: 'Nate', story: 'Nate drinks to forget a forbidden love.' },
  '💤': { name: 'Mira', story: 'Mira dreams of someone she’s never met.' }
};

function shuffle(array) {
  let arr = array.slice();
  for (let i = arr.length -1; i >0; i--) {
    const j = Math.floor(Math.random() * (i +1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function App() {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const maxMistakes = 5;
  const [status, setStatus] = useState('');
  const [timer, setTimer] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [showStory, setShowStory] = useState(null);
  const [user, setUser] = useState(null); // { userId, username }
  const [loginMode, setLoginMode] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [leaderboard, setLeaderboard] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (user) startNewGame();
    // eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    if (flipped.length === 2 && !gameOver) {
      const [firstIdx, secondIdx] = flipped;
      if (cards[firstIdx] === cards[secondIdx]) {
        setMatched((prev) => [...prev, cards[firstIdx]]);
        setStatus(`Matched ${cards[firstIdx]}! 💖`);
        setShowStory(cards[firstIdx]);
        setFlipped([]);
      } else {
        setStatus(`Oops! Mismatch. 💔`);
        setMistakes((m) => {
          const newMistakes = m + 1;
          if (newMistakes >= maxMistakes) {
            setGameOver(true);
            setStatus('Too many heartbreaks! Game Over.');
            clearInterval(timerRef.current);
          }
          return newMistakes;
        });
        setTimeout(() => {
          setFlipped([]);
        }, 1000);
      }
    }
    // eslint-disable-next-line
  }, [flipped]);

  useEffect(() => {
    if (matched.length === secrets.length && !gameOver) {
      setStatus('🎉 You revealed all secrets! You win!');
      setGameOver(true);
      clearInterval(timerRef.current);
      saveScore();
    }
    // eslint-disable-next-line
  }, [matched]);

  useEffect(() => {
    if (timer <= 0 && !gameOver) {
      setGameOver(true);
      setStatus('⏱ Time’s up! Game Over.');
      clearInterval(timerRef.current);
    }
    // eslint-disable-next-line
  }, [timer]);

  useEffect(() => {
    if (!gameOver && user) {
      timerRef.current = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [gameOver, user]);

  useEffect(() => {
    if (user) fetchLeaderboard();
  }, [user]);

  const startNewGame = () => {
    const doubled = [...secrets, ...secrets];
    setCards(shuffle(doubled));
    setFlipped([]);
    setMatched([]);
    setMistakes(0);
    setStatus('Start matching!');
    setTimer(60);
    setGameOver(false);
    setShowStory(null);
  };

  const saveScore = async () => {
    try {
      await axios.post('http://localhost:4000/api/scores', {
        userId: user.userId,
        score: matched.length,
      });
      fetchLeaderboard();
    } catch (error) {
      console.error('Error saving score', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/scores/top');
      setLeaderboard(res.data);
    } catch (error) {
      console.error('Error fetching leaderboard', error);
    }
  };

  const handleCardClick = (idx) => {
    if (gameOver) return;
    if (flipped.includes(idx) || matched.includes(cards[idx])) return;
    if (flipped.length < 2) {
      setFlipped((f) => [...f, idx]);
    }
  };

  const handleInputChange = (e) => {
    setFormData((fd) => ({ ...fd, [e.target.name]: e.target.value }));
  };

  const handleLoginRegister = async () => {
    const url = loginMode
      ? 'http://localhost:4000/api/login'
      : 'http://localhost:4000/api/register';
    try {
      const res = await axios.post(url, formData);
      setUser({ userId: res.data.userId, username: formData.username });
      setFormData({ username: '', password: '' });
    } catch (error) {
      alert(
        error.response?.data?.error || 'Error during login/register'
      );
    }
  };

  const logout = () => {
    setUser(null);
    setGameOver(true);
  };

  return (
    <div className="App">
      {!user ? (
        <div className="auth-container">
          <h2>{loginMode ? 'Login' : 'Register'}</h2>
          <input
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleInputChange}
          />
          <input
            name="password"
            placeholder="Password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
          />
          <button onClick={handleLoginRegister}>
            {loginMode ? 'Login' : 'Register'}
          </button>
          <p
            className="toggle-auth"
            onClick={() => setLoginMode((lm) => !lm)}
          >
            {loginMode
              ? 'No account? Register here'
              : 'Have account? Login here'}
          </p>
        </div>
      ) : (
        <>
          <header>
            <h1>💘 MemoryMatch: Lovers & Secrets 💘</h1>
            <p>
              Logged in as: <b>{user.username}</b>{' '}
              <button onClick={logout}>Logout</button>
            </p>
          </header>
          <p>⏱ Time Left: {timer}s</p>
          <p>Mistakes: {mistakes} / {maxMistakes}</p>
          <p>{status}</p>
          <div className="board">
            {cards.map((secret, idx) => {
              const isFlipped = flipped.includes(idx) || matched.includes(secret);
              return (
                <div
                  key={idx}
                  className={`card ${isFlipped ? 'flipped' : ''} ${matched.includes(secret) ? 'matched' : ''}`}
                  onClick={() => handleCardClick(idx)}
                >
                  {isFlipped ? secret : ''}
                </div>
              );
            })}
          </div>

          {showStory && (
            <div className="modal">
              <div className="modal-content">
                <h2>{secretStories[showStory].name}</h2>
                <p>{secretStories[showStory].story}</p>
                <button onClick={() => setShowStory(null)}>Close</button>
              </div>
            </div>
          )}

          {gameOver && (
            <div className="modal">
              <div className="modal-content">
                <h2>{matched.length === secrets.length ? 'You Win! 🎉' : 'Game Over 💔'}</h2>
                <button onClick={startNewGame}>Play Again</button>
              </div>
            </div>
          )}

          <section className="leaderboard">
            <h2>🏆 Leaderboard</h2>
            {leaderboard.length === 0 && <p>No scores yet</p>}
            <ol>
              {leaderboard.map((entry, i) => (
                <li key={i}>
                  {entry.username} - {entry.score} pairs -{' '}
                  {new Date(entry.date_played).toLocaleDateString()}
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}
