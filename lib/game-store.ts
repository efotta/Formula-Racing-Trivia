
import { create } from 'zustand';
import { GameEngine, GameState } from './game-engine';

interface GameStore {
  gameEngine: GameEngine | null;
  gameState: GameState | null;
  username: string | null;
  userId: string | null;
  completedLevels: number[];
  perfectLevels: number[];
  totalGameTime: number;
  showPerfectCelebration: boolean;
  perfectRunSessionId: string | null; // Track active perfect run session
  
  setUsername: (username: string) => void;
  setUserId: (userId: string) => void;
  setCompletedLevels: (levels: number[]) => void;
  setPerfectLevels: (levels: number[]) => void;
  setShowPerfectCelebration: (show: boolean) => void;
  setPerfectRunSessionId: (sessionId: string | null) => void;
  startPerfectRun: () => Promise<string | null>;
  cancelPerfectRun: () => Promise<void>;
  initializeGame: (level: number, questions: any[], accumulatedTime?: number) => void;
  submitAnswer: (answer: string) => void;
  resetLevel: () => void;
  completeLevel: (level: number, time: number, wrongAnswers: number) => void;
  resetGame: () => void;
  updateGameState: () => void;
  checkPerfectCompletion: () => boolean;
  getAccessibleLevels: () => number[];
  isLevelAccessible: (level: number) => boolean;
  pauseTimer: () => void;
  resumeTimer: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameEngine: null,
  gameState: null,
  username: null,
  userId: null,
  completedLevels: [],
  perfectLevels: [],
  totalGameTime: 0,
  showPerfectCelebration: false,
  perfectRunSessionId: null,

  setUsername: (username: string) => {
    set({ username });
  },

  setUserId: (userId: string) => {
    set({ userId });
  },

  setCompletedLevels: (levels: number[]) => {
    set({ completedLevels: levels });
  },

  setPerfectLevels: (levels: number[]) => {
    set({ perfectLevels: levels });
  },

  setShowPerfectCelebration: (show: boolean) => {
    set({ showPerfectCelebration: show });
  },

  setPerfectRunSessionId: (sessionId: string | null) => {
    set({ perfectRunSessionId: sessionId });
  },

  startPerfectRun: async () => {
    const { userId, username } = get();
    if (!userId || !username) {
      console.error('Cannot start perfect run: missing user data');
      return null;
    }

    try {
      console.log('🏁 Starting perfect run session for user:', username);
      const response = await fetch('/api/perfect-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, username })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Perfect run session started:', data.sessionId);
        set({ perfectRunSessionId: data.sessionId });
        return data.sessionId;
      } else {
        console.error('Failed to start perfect run session:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error starting perfect run session:', error);
      return null;
    }
  },

  cancelPerfectRun: async () => {
    const { perfectRunSessionId, userId } = get();
    if (!perfectRunSessionId || !userId) return;

    try {
      console.log('🚫 Cancelling perfect run session:', perfectRunSessionId);
      await fetch(`/api/perfect-run?sessionId=${perfectRunSessionId}&userId=${userId}`, {
        method: 'DELETE'
      });
      console.log('✅ Perfect run session cancelled');
    } catch (error) {
      console.error('Error cancelling perfect run session:', error);
    } finally {
      set({ perfectRunSessionId: null });
    }
  },

  initializeGame: (level: number, questions: any[], passedAccumulatedTime?: number) => {
    const { gameEngine: currentEngine } = get();
    let accumulatedTime = 0;
    
    console.log('🔄 INIT: Starting initializeGame for level', level);
    console.log('🔄 INIT: Passed accumulated time:', passedAccumulatedTime);
    console.log('🔄 INIT: Current engine exists:', !!currentEngine);
    
    // Use passed accumulated time if provided, otherwise try to get from current engine
    if (typeof passedAccumulatedTime === 'number' && passedAccumulatedTime > 0) {
      accumulatedTime = passedAccumulatedTime;
      console.log('✅ INIT: Using passed accumulated time:', accumulatedTime, 'seconds');
    } else if (currentEngine) {
      const currentState = currentEngine.getState();
      const currentTime = currentEngine.getCurrentTime();
      
      console.log('🔄 INIT: Current engine state:', {
        level: currentState.currentLevel,
        isPaused: currentState.isPaused,
        isLevelComplete: currentState.isLevelComplete,
        accumulatedTime: currentState.accumulatedTime,
        totalTime: currentState.totalTime,
        currentTime: currentTime
      });
      
      // If there's a current game engine and the level was completed,
      // carry over the accumulated time for continuous gameplay
      if (currentState.isLevelComplete) {
        accumulatedTime = currentTime;
        console.log('✅ INIT: Carrying over accumulated time from engine:', accumulatedTime, 'seconds from completed level');
      } else {
        console.log('❌ INIT: Not carrying over time - level not complete');
      }
    } else {
      console.log('❌ INIT: No current engine and no passed time - starting fresh');
    }
    
    console.log(`🎮 INIT: Creating GameEngine for level ${level} with final accumulated time: ${accumulatedTime}s`);
    const gameEngine = new GameEngine(level, questions, accumulatedTime);
    const newState = gameEngine.getState();
    
    console.log(`🎮 INIT: New game state created:`, {
      level: newState.currentLevel,
      accumulatedTime: newState.accumulatedTime,
      isPaused: newState.isPaused,
      startTime: newState.startTime,
      currentTime: gameEngine.getCurrentTime()
    });
    
    set({ 
      gameEngine, 
      gameState: newState
    });
    
    console.log('✅ INIT: Game initialization complete');
  },

  submitAnswer: (answer: string) => {
    const { gameEngine } = get();
    if (!gameEngine) {
      console.error('GameStore: No game engine available for answer submission');
      return;
    }

    try {
      console.log('GameStore: Submitting answer:', answer);
      gameEngine.submitAnswer(answer);
      const newState = gameEngine.getState();
      console.log('GameStore: New game state after answer submission:', newState);
      set({ gameState: newState });
    } catch (error) {
      console.error('GameStore: Error submitting answer:', error);
    }
  },

  resetLevel: () => {
    const { gameEngine } = get();
    if (!gameEngine) return;

    gameEngine.resetLevel();
    set({ gameState: gameEngine.getState() });
  },

  completeLevel: (level: number, time: number, wrongAnswers: number) => {
    const { completedLevels, perfectLevels, totalGameTime } = get();
    
    // Add to completed levels if not already there
    if (!completedLevels.includes(level)) {
      const newCompletedLevels = [...completedLevels, level];
      set({ 
        completedLevels: newCompletedLevels,
        totalGameTime: totalGameTime + time
      });
    }
    
    // Add to perfect levels if no wrong answers
    if (wrongAnswers === 0 && !perfectLevels.includes(level)) {
      const newPerfectLevels = [...perfectLevels, level];
      set({ perfectLevels: newPerfectLevels });
    }
  },

  resetGame: () => {
    const { perfectRunSessionId, userId, cancelPerfectRun } = get();
    
    // Cancel any active perfect run session
    if (perfectRunSessionId && userId) {
      cancelPerfectRun();
    }
    
    set({
      gameEngine: null,
      gameState: null,
      completedLevels: [],
      perfectLevels: [],
      totalGameTime: 0,
      showPerfectCelebration: false,
      perfectRunSessionId: null
    });
  },

  updateGameState: () => {
    const { gameEngine } = get();
    if (!gameEngine) return;
    
    set({ gameState: gameEngine.getState() });
  },

  checkPerfectCompletion: () => {
    const { perfectLevels } = get();
    
    // Check if all 5 levels (1-5) are completed perfectly
    const allLevels = [1, 2, 3, 4, 5];
    const isPerfectCompletion = allLevels.every(level => perfectLevels.includes(level));
    
    return isPerfectCompletion;
  },

  getAccessibleLevels: () => {
    const { completedLevels } = get();
    
    // Always accessible: Level 1
    const accessible = [1];
    
    // Add all completed levels (for replay)
    completedLevels.forEach(level => {
      if (level > 1 && level <= 5 && !accessible.includes(level)) {
        accessible.push(level);
      }
    });
    
    // Add the next highest uncompleted level (for progression)
    if (completedLevels.length > 0) {
      const highestCompleted = Math.max(...completedLevels);
      const nextLevel = highestCompleted + 1;
      if (nextLevel <= 5 && !accessible.includes(nextLevel)) {
        accessible.push(nextLevel);
      }
    } else {
      // If no levels completed, only level 1 is accessible (already added above)
    }
    
    return accessible.sort((a, b) => a - b);
  },

  isLevelAccessible: (level: number) => {
    const { getAccessibleLevels } = get();
    return getAccessibleLevels().includes(level);
  },

  pauseTimer: () => {
    const { gameEngine } = get();
    if (!gameEngine) return;
    
    gameEngine.pauseTimer();
    set({ gameState: gameEngine.getState() });
  },

  resumeTimer: () => {
    const { gameEngine } = get();
    if (!gameEngine) return;
    
    gameEngine.resumeTimer();
    set({ gameState: gameEngine.getState() });
  }
}));
