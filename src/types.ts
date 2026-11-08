export type OptionKey = 'A' | 'B' | 'C' | 'D';

export interface Question {
  id: number;
  title: string;
  image?: string | null;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct: OptionKey;
  explanation?: string;
  duration?: number; // seconds
}

export interface QuestionSet {
  id: string;
  title: string;
  questions: Question[];
}

export interface TeamState {
  id: 1 | 2 | 3 | 4;
  name: string;
  color: string;
  accentColor: string;
  score: number;
  choice: OptionKey | null;
  choiceTime: number | null; // seconds elapsed from timer start
  isLocked: boolean;
  isConnected: boolean;
  lastActive: number;
}

export interface GameState {
  currentSetId: string;
  currentQuestionIdx: number;
  timerDuration: number;
  timerSecondsRemaining: number;
  isTimerRunning: boolean;
  timerStartTime: number | null;
  isRevealed: boolean;
  teacherName: string;
  teams: Record<number, TeamState>;
}

export type WSMessage =
  | { type: 'INIT_STATE'; state: GameState }
  | { type: 'STATE_UPDATE'; state: GameState }
  | { type: 'SUBMIT_ANSWER'; teamId: number; choice: OptionKey; choiceTime?: number }
  | { type: 'TEAM_PING'; teamId: number }
  | { type: 'START_TIMER'; duration?: number }
  | { type: 'PAUSE_TIMER' }
  | { type: 'REVEAL_ANSWERS' }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREV_QUESTION' }
  | { type: 'RESET_QUESTION' }
  | { type: 'RESET_ALL_SCORES' }
  | { type: 'UPDATE_TEAM_SCORE'; teamId: number; delta: number }
  | { type: 'SET_CURRENT_QUESTION'; index: number }
  | { type: 'SET_CURRENT_SET'; setId: string }
  | { type: 'UPDATE_QUESTION'; question: Question }
  | { type: 'ADD_SET'; set: QuestionSet };
