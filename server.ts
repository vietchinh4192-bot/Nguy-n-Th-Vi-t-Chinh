import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_QUESTION_SETS } from './src/data/defaultQuestions.js';
import { GameState, TeamState, Question, QuestionSet } from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

// Initial Question Sets
let questionSets: QuestionSet[] = JSON.parse(JSON.stringify(DEFAULT_QUESTION_SETS));

const initialTeams: Record<number, TeamState> = {
  1: {
    id: 1,
    name: 'Nhóm 1',
    color: '#ef4444',
    accentColor: '#f87171',
    score: 0,
    choice: null,
    choiceTime: null,
    isLocked: false,
    isConnected: false,
    lastActive: Date.now(),
  },
  2: {
    id: 2,
    name: 'Nhóm 2',
    color: '#3b82f6',
    accentColor: '#60a5fa',
    score: 0,
    choice: null,
    choiceTime: null,
    isLocked: false,
    isConnected: false,
    lastActive: Date.now(),
  },
  3: {
    id: 3,
    name: 'Nhóm 3',
    color: '#f59e0b',
    accentColor: '#fbbf24',
    score: 0,
    choice: null,
    choiceTime: null,
    isLocked: false,
    isConnected: false,
    lastActive: Date.now(),
  },
  4: {
    id: 4,
    name: 'Nhóm 4',
    color: '#10b981',
    accentColor: '#34d399',
    score: 0,
    choice: null,
    choiceTime: null,
    isLocked: false,
    isConnected: false,
    lastActive: Date.now(),
  },
};

// Server-authoritative Game State
const gameState: GameState = {
  currentSetId: questionSets[0].id,
  currentQuestionIdx: 0,
  timerDuration: 30,
  timerSecondsRemaining: 30,
  isTimerRunning: false,
  timerStartTime: null,
  isRevealed: false,
  teacherName: 'Nguyễn Thị Việt Chinh',
  teams: JSON.parse(JSON.stringify(initialTeams)),
};

// Timer interval reference
let timerInterval: NodeJS.Timeout | null = null;

function getCurrentQuestion(): Question | null {
  const currentSet = questionSets.find((s) => s.id === gameState.currentSetId) || questionSets[0];
  if (!currentSet || !currentSet.questions.length) return null;
  return currentSet.questions[gameState.currentQuestionIdx] || currentSet.questions[0];
}

function broadcastState() {
  const payload = JSON.stringify({
    type: 'STATE_UPDATE',
    state: gameState,
    questionSets,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (err) {
        console.error('Error broadcasting to client:', err);
      }
    }
  });
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  gameState.isTimerRunning = false;
  gameState.timerStartTime = null;
}

function revealAnswersAutomatically() {
  stopTimer();
  gameState.isRevealed = true;
  gameState.timerSecondsRemaining = 0;

  const currentQ = getCurrentQuestion();
  if (currentQ) {
    // Award 100 points for correct answer to teams that answered correctly
    for (const teamId of [1, 2, 3, 4]) {
      const team = gameState.teams[teamId];
      if (team && team.choice === currentQ.correct) {
        team.score += 100;
      }
    }
  }

  broadcastState();
}

function startTimer(duration?: number) {
  stopTimer();

  const currentQ = getCurrentQuestion();
  const dur = duration || (currentQ?.duration ?? gameState.timerDuration ?? 30);
  gameState.timerDuration = dur;
  gameState.timerSecondsRemaining = dur;
  gameState.isTimerRunning = true;
  gameState.timerStartTime = Date.now();
  gameState.isRevealed = false;

  // Reset team choices for this question if starting fresh
  // (or preserve if teacher paused & resumed)

  timerInterval = setInterval(() => {
    gameState.timerSecondsRemaining--;

    if (gameState.timerSecondsRemaining <= 0) {
      // Automatic reveal when time runs out!
      revealAnswersAutomatically();
    } else {
      broadcastState();
    }
  }, 1000);

  broadcastState();
}

function resetCurrentQuestion() {
  stopTimer();
  gameState.isRevealed = false;
  const currentQ = getCurrentQuestion();
  gameState.timerDuration = currentQ?.duration || 30;
  gameState.timerSecondsRemaining = gameState.timerDuration;

  // Clear choices for 4 teams
  for (const teamId of [1, 2, 3, 4]) {
    if (gameState.teams[teamId]) {
      gameState.teams[teamId].choice = null;
      gameState.teams[teamId].choiceTime = null;
      gameState.teams[teamId].isLocked = false;
    }
  }

  broadcastState();
}

// REST API endpoints for seamless resilience
app.get('/api/state', (req, res) => {
  res.json({
    state: gameState,
    questionSets,
  });
});

app.post('/api/state', (req, res) => {
  const { state: incomingState, questionSets: incomingSets } = req.body;
  if (incomingState && incomingState.teams) {
    // Preserve any existing locked choices if incoming state didn't have them
    for (const tId of [1, 2, 3, 4]) {
      const serverTeam = gameState.teams[tId];
      const incTeam = incomingState.teams[tId];
      if (serverTeam?.isLocked && !incTeam?.isLocked && (serverTeam.lastActive || 0) > (incTeam?.lastActive || 0)) {
        incomingState.teams[tId] = serverTeam;
      }
    }
    Object.assign(gameState, incomingState);
  }
  if (incomingSets && Array.isArray(incomingSets) && incomingSets.length > 0) {
    questionSets = incomingSets;
  }
  broadcastState();
  res.json({ success: true, state: gameState, questionSets });
});

app.post('/api/team/answer', (req, res) => {
  const { teamId, choice, choiceTime } = req.body;
  const numTeamId = Number(teamId);
  if (![1, 2, 3, 4].includes(numTeamId)) {
    return res.status(400).json({ error: 'Invalid team ID' });
  }

  const team = gameState.teams[numTeamId];
  if (team) {
    let elapsed = Number(choiceTime) || 0;
    if (!elapsed) {
      if (gameState.isTimerRunning && gameState.timerStartTime) {
        elapsed = Math.round(((Date.now() - gameState.timerStartTime) / 1000) * 10) / 10;
      } else {
        elapsed = Math.round((gameState.timerDuration - gameState.timerSecondsRemaining) * 10) / 10;
      }
    }

    team.choice = choice;
    team.choiceTime = Math.max(0.1, elapsed || 1.0);
    team.isLocked = true;
    team.lastActive = Date.now();
    team.isConnected = true;

    console.log(`[SERVER] Nhóm ${numTeamId} đã chốt đáp án: [${choice}] (${team.choiceTime}s)`);
    broadcastState();
    return res.json({ success: true, team, state: gameState });
  }

  res.status(404).json({ error: 'Team not found' });
});

app.post('/api/team/join', (req, res) => {
  const { teamId } = req.body;
  if ([1, 2, 3, 4].includes(Number(teamId))) {
    const team = gameState.teams[teamId];
    if (team) {
      team.isConnected = true;
      team.lastActive = Date.now();
      broadcastState();
      return res.json({ success: true, team });
    }
  }
  res.status(400).json({ error: 'Invalid team ID' });
});

app.post('/api/teacher/start-timer', (req, res) => {
  const { duration } = req.body;
  startTimer(duration);
  res.json({ success: true, state: gameState });
});

app.post('/api/teacher/pause-timer', (req, res) => {
  stopTimer();
  broadcastState();
  res.json({ success: true, state: gameState });
});

app.post('/api/teacher/reveal', (req, res) => {
  revealAnswersAutomatically();
  res.json({ success: true, state: gameState });
});

app.post('/api/teacher/reset-question', (req, res) => {
  resetCurrentQuestion();
  res.json({ success: true, state: gameState });
});

app.post('/api/teacher/next-question', (req, res) => {
  const curSet = questionSets.find((s) => s.id === gameState.currentSetId) || questionSets[0];
  if (gameState.currentQuestionIdx < curSet.questions.length - 1) {
    gameState.currentQuestionIdx++;
    resetCurrentQuestion();
  }
  res.json({ success: true, state: gameState });
});

app.post('/api/teacher/prev-question', (req, res) => {
  if (gameState.currentQuestionIdx > 0) {
    gameState.currentQuestionIdx--;
    resetCurrentQuestion();
  }
  res.json({ success: true, state: gameState });
});

app.post('/api/teacher/set-question-idx', (req, res) => {
  const { index } = req.body;
  const curSet = questionSets.find((s) => s.id === gameState.currentSetId) || questionSets[0];
  if (index >= 0 && index < curSet.questions.length) {
    gameState.currentQuestionIdx = index;
    resetCurrentQuestion();
  }
  res.json({ success: true, state: gameState });
});

app.post('/api/teacher/set-set-id', (req, res) => {
  const { setId } = req.body;
  const targetSet = questionSets.find((s) => s.id === setId);
  if (targetSet) {
    gameState.currentSetId = setId;
    gameState.currentQuestionIdx = 0;
    resetCurrentQuestion();
  }
  res.json({ success: true, state: gameState });
});

app.post('/api/teacher/reset-scores', (req, res) => {
  for (const teamId of [1, 2, 3, 4]) {
    if (gameState.teams[teamId]) {
      gameState.teams[teamId].score = 0;
    }
  }
  resetCurrentQuestion();
  res.json({ success: true, state: gameState });
});

app.post('/api/teacher/update-score', (req, res) => {
  const { teamId, delta } = req.body;
  const team = gameState.teams[teamId];
  if (team) {
    team.score = Math.max(0, team.score + Number(delta || 0));
    broadcastState();
    return res.json({ success: true, team });
  }
  res.status(404).json({ error: 'Team not found' });
});

app.post('/api/teacher/save-question', (req, res) => {
  const { question } = req.body;
  const curSet = questionSets.find((s) => s.id === gameState.currentSetId);
  if (curSet && question) {
    const idx = curSet.questions.findIndex((q) => q.id === question.id);
    if (idx !== -1) {
      curSet.questions[idx] = question;
      if (gameState.currentQuestionIdx === idx) {
        gameState.timerDuration = question.duration || gameState.timerDuration;
        gameState.timerSecondsRemaining = gameState.timerDuration;
      }
      broadcastState();
      return res.json({ success: true });
    }
  }
  res.status(400).json({ error: 'Could not update question' });
});

app.post('/api/teacher/import-set', (req, res) => {
  const { set } = req.body;
  if (set && set.title && Array.isArray(set.questions) && set.questions.length > 0) {
    const newId = 'set-' + Date.now();
    const newSet: QuestionSet = {
      id: newId,
      title: set.title,
      questions: set.questions,
    };
    questionSets.push(newSet);
    gameState.currentSetId = newId;
    gameState.currentQuestionIdx = 0;
    resetCurrentQuestion();
    return res.json({ success: true, setId: newId });
  }
  res.status(400).json({ error: 'Invalid question set' });
});

// WebSocket Connections
wss.on('connection', (ws: WebSocket) => {
  // Send initial state upon connection
  ws.send(
    JSON.stringify({
      type: 'INIT_STATE',
      state: gameState,
      questionSets,
    })
  );

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'TEAM_PING' || data.type === 'JOIN') {
        const teamId = Number(data.teamId);
        if ([1, 2, 3, 4].includes(teamId)) {
          const team = gameState.teams[teamId];
          if (team) {
            team.isConnected = true;
            team.lastActive = Date.now();
            broadcastState();
          }
        }
      } else if (data.type === 'SUBMIT_ANSWER') {
        const teamId = Number(data.teamId);
        if ([1, 2, 3, 4].includes(teamId)) {
          const team = gameState.teams[teamId];
          if (team) {
            let elapsed = Number(data.choiceTime) || 0;
            if (!elapsed) {
              if (gameState.isTimerRunning && gameState.timerStartTime) {
                elapsed = Math.round(((Date.now() - gameState.timerStartTime) / 1000) * 10) / 10;
              } else {
                elapsed = Math.round((gameState.timerDuration - gameState.timerSecondsRemaining) * 10) / 10;
              }
            }

            team.choice = data.choice;
            team.choiceTime = Math.max(0.1, elapsed || 1.0);
            team.isLocked = true;
            team.lastActive = Date.now();
            team.isConnected = true;
            console.log(`[WS] Nhóm ${teamId} chốt đáp án: [${data.choice}]`);
            broadcastState();
          }
        }
      } else if (data.type === 'STATE_UPDATE' || data.type === 'SYNC_STATE') {
        if (data.state && data.state.teams) {
          for (const tId of [1, 2, 3, 4]) {
            const serverTeam = gameState.teams[tId];
            const incTeam = data.state.teams[tId];
            if (serverTeam?.isLocked && !incTeam?.isLocked && (serverTeam.lastActive || 0) > (incTeam?.lastActive || 0)) {
              data.state.teams[tId] = serverTeam;
            }
          }
          Object.assign(gameState, data.state);
        }
        if (data.questionSets) {
          questionSets = data.questionSets;
        }
        broadcastState();
      } else if (data.type === 'START_TIMER') {
        startTimer(data.duration);
      } else if (data.type === 'PAUSE_TIMER') {
        stopTimer();
        broadcastState();
      } else if (data.type === 'REVEAL_ANSWERS') {
        revealAnswersAutomatically();
      } else if (data.type === 'RESET_QUESTION') {
        resetCurrentQuestion();
      } else if (data.type === 'NEXT_QUESTION') {
        const curSet = questionSets.find((s) => s.id === gameState.currentSetId) || questionSets[0];
        if (gameState.currentQuestionIdx < curSet.questions.length - 1) {
          gameState.currentQuestionIdx++;
          resetCurrentQuestion();
        }
      } else if (data.type === 'PREV_QUESTION') {
        if (gameState.currentQuestionIdx > 0) {
          gameState.currentQuestionIdx--;
          resetCurrentQuestion();
        }
      } else if (data.type === 'UPDATE_TEAM_SCORE') {
        const team = gameState.teams[data.teamId];
        if (team) {
          team.score = Math.max(0, team.score + Number(data.delta || 0));
          broadcastState();
        }
      } else if (data.type === 'RESET_ALL_SCORES') {
        for (const tId of [1, 2, 3, 4]) {
          if (gameState.teams[tId]) {
            gameState.teams[tId].score = 0;
          }
        }
        resetCurrentQuestion();
      }
    } catch (e) {
      console.error('Error handling WS message:', e);
    }
  });

  ws.on('close', () => {
    // Client disconnected
  });
});

// Periodic ping to verify team connectivity
setInterval(() => {
  const now = Date.now();
  let changed = false;
  for (const teamId of [1, 2, 3, 4]) {
    const team = gameState.teams[teamId];
    // If not active in 45 seconds, mark disconnected
    if (team && team.isConnected && now - team.lastActive > 45000) {
      team.isConnected = false;
      changed = true;
    }
  }
  if (changed) {
    broadcastState();
  }
}, 15000);

async function startApp() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Server listening on port ${port} (mode: ${isProduction ? 'production' : 'development'})`);
  });
}

startApp().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
