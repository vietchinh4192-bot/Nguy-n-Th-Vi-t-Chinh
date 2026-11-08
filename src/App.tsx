import { useState, useEffect } from 'react';
import { useGameState } from './hooks/useGameState';
import { TeacherView } from './components/TeacherView';
import { StudentView } from './components/StudentView';

function getInitialRole(): 'teacher' | 'student' {
  if (typeof window === 'undefined') return 'teacher';
  const params = new URLSearchParams(window.location.search);
  const role = params.get('role');
  const team = params.get('team');
  if (role === 'student' || team) return 'student';
  return 'teacher';
}

function getInitialTeam(): number {
  if (typeof window === 'undefined') return 1;
  const params = new URLSearchParams(window.location.search);
  const team = Number(params.get('team'));
  if ([1, 2, 3, 4].includes(team)) return team;
  return 1;
}

export default function App() {
  const [viewMode, setViewMode] = useState<'teacher' | 'student'>(getInitialRole);
  const [initialTeamId, setInitialTeamId] = useState<number>(getInitialTeam);
  const roomId = '10A6';

  const {
    gameState,
    questionSets,
    isConnected,
    submitAnswer,
    startTimer,
    pauseTimer,
    revealAnswers,
    nextQuestion,
    prevQuestion,
    resetQuestion,
    resetAllScores,
    updateTeamScore,
    setCurrentSet,
    saveQuestion,
    importSet,
    pingTeam,
  } = useGameState(viewMode, roomId);

  // Sync state if URL changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');
    const team = params.get('team');

    if (role === 'student' || team) {
      setViewMode('student');
    }
    if (team && [1, 2, 3, 4].includes(Number(team))) {
      setInitialTeamId(Number(team));
    }
  }, []);

  // Resilient fallback so app can never hang on static hosts like Netlify
  if (viewMode === 'student') {
    return (
      <StudentView
        gameState={gameState}
        questionSets={questionSets}
        initialTeamId={initialTeamId}
        onSubmitAnswer={submitAnswer}
        onPingTeam={pingTeam}
        onSwitchToHost={() => setViewMode('teacher')}
      />
    );
  }

  return (
    <TeacherView
      gameState={gameState}
      questionSets={questionSets}
      onStartTimer={startTimer}
      onPauseTimer={pauseTimer}
      onRevealAnswers={revealAnswers}
      onNextQuestion={nextQuestion}
      onPrevQuestion={prevQuestion}
      onResetQuestion={resetQuestion}
      onResetAllScores={resetAllScores}
      onUpdateScore={updateTeamScore}
      onSetCurrentSet={setCurrentSet}
      onSaveQuestion={saveQuestion}
      onImportSet={importSet}
      onSubmitAnswerForTeam={submitAnswer}
      onOpenStudentTab={() => {
        window.open(`${window.location.origin}/?role=student`, '_blank');
      }}
    />
  );
}
