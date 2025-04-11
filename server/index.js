const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

let gameState = {
  players: [],
  stage: 'lobby',
  question: null,
  currentAnswers: {},
  bets: {},
  chips: {},
};

const sampleQuestions = [
  {
    text: 'Welche Farbe hat der Himmel?',
    options: ['Blau', 'Grün', 'Rot', 'Gelb'],
    correct: 'Blau'
  },
  {
    text: 'Wie viele Beine hat eine Spinne?',
    options: ['6', '8', '10', '12'],
    correct: '8'
  }
];
let currentQuestionIndex = 0;

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('join', (name) => {
    gameState.players.push({ id: socket.id, name });
    gameState.chips[socket.id] = 100;
    io.emit('update', gameState);
  });

  socket.on('startGame', () => {
    gameState.stage = 'betting';
    gameState.question = sampleQuestions[currentQuestionIndex];
    gameState.bets = {};
    gameState.currentAnswers = {};
    io.emit('update', gameState);
  });

  socket.on('placeBet', (amount) => {
    gameState.bets[socket.id] = amount;
    io.emit('update', gameState);
  });

  socket.on('submitAnswer', (answer) => {
    gameState.currentAnswers[socket.id] = answer;
    if (Object.keys(gameState.currentAnswers).length === gameState.players.length) {
      const correct = gameState.question.correct;
      const winners = gameState.players.filter(p => gameState.currentAnswers[p.id] === correct);
      const pot = Object.values(gameState.bets).reduce((a, b) => a + b, 0);
      const winAmount = winners.length > 0 ? Math.floor(pot / winners.length) : 0;

      winners.forEach(p => {
        gameState.chips[p.id] += winAmount;
      });

      gameState.players.forEach(p => {
        if (!winners.find(w => w.id === p.id)) {
          gameState.chips[p.id] -= gameState.bets[p.id] || 0;
        }
      });

      currentQuestionIndex = (currentQuestionIndex + 1) % sampleQuestions.length;
      gameState.stage = 'lobby';
      gameState.bets = {};
      gameState.currentAnswers = {};
    }
    io.emit('update', gameState);
  });

  socket.on('disconnect', () => {
    gameState.players = gameState.players.filter(p => p.id !== socket.id);
    delete gameState.chips[socket.id];
    delete gameState.bets[socket.id];
    delete gameState.currentAnswers[socket.id];
    io.emit('update', gameState);
  });
});

server.listen(3001, () => console.log('Server running on http://localhost:3001'));
