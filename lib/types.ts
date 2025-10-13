
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
    } & DefaultSession['user'];
  }

  interface User {
    username: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    username: string;
  }
}

// Game types
export interface Level {
  number: number;
  name: string;
  description: string;
  color: string;
}

export interface GameStats {
  totalGames: number;
  bestTime: number | null;
  allLevelsTime?: number | null; // Sum of best individual level times
  perfectRunTime?: number | null; // Single continuous run time
  hasPerfectRun?: boolean;
  timeSource?: 'perfectRun' | 'allLevels'; // Indicates which time is being displayed
  averageTime: number;
  completedLevels: number[];
  perfectLevels?: number[];
  allLevelsCompleted: boolean;
  bestTimesByLevel?: Record<number, number>;
  perfectTimesByLevel?: Record<number, number>;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  stats: GameStats;
  recentScores: GameScore[];
}

export interface GameScore {
  id: string;
  level: number;
  levelName: string;
  questionsCorrect: number;
  totalQuestions: number;
  timeInSeconds: number;
  penalties: number;
  penaltyTime: number;
  finalTime: number;
  completed: boolean;
  attempt: number;
  createdAt: Date;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  totalTime: number;
  completedDate: Date;
  allLevelsCompleted: boolean;
  noMistakes: boolean;
  // New fields for different accomplishment types
  allLevelsTime?: number | null;  // Sum of best individual level times
  perfectRunTime?: number | null; // Single continuous run time
  hasPerfectRun: boolean;
  perfectRunDate?: Date | null;
  rank?: number;
}

export interface PerfectRunSession {
  id: string;
  userId: string;
  username: string;
  sessionId: string;
  startedAt: Date;
  completedAt?: Date | null;
  currentLevel: number;
  totalTime?: number | null;
  completed: boolean;
}
