import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

function App() {
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    socket.on('update', setGameState);
  }, []);

  const join = () => {
    socket.emit('join', name);
    setJoined(true);
  };

  const placeBet = () => {
    socket.emit('placeBet', 10);
  };

  const submitAnswer = () => {
    socket.emit('submitAnswer', answer);
    setAnswer('');
  };

  if (!joined) {
    return (
      <div className="p-4">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
        <button onClick={join}>Beitreten</button>
      </div>
    );
  }

  if (!gameState) return <div className="p-4">Warten auf Spielstart...</div>;

  return (
    <div className="p-4 space-y-4">
      <h1>Quizpoker</h1>
      <h2>Phase: {gameState.stage}</h2>
      <ul>
        {gameState.players.map(p => (
          <li key={p.id}>{p.name} – {gameState.chips[p.id]} Chips</li>
        ))}
      </ul>

      {gameState.stage === 'lobby' && (
        <button onClick={() => socket.emit('startGame')}>Spiel starten</button>
      )}

      {gameState.stage === 'betting' && (
        <>
          <p>Frage: {gameState.question.text}</p>
          <button onClick={placeBet}>10 Chips setzen</button>
        </>
      )}

      {gameState.stage === 'betting' && Object.keys(gameState.bets).length === gameState.players.length && (
        <>
          <p>Antwortmöglichkeiten:</p>
          {gameState.question.options.map(opt => (
            <button key={opt} onClick={() => setAnswer(opt)}>{opt}</button>
          ))}
          <button onClick={submitAnswer}>Antwort absenden</button>
        </>
      )}
    </div>
  );
}

export default App;
