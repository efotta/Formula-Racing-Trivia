
import { Prisma } from '@prisma/client';

type questions = {
  id: string;
  level: number;
  levelName: string;
  question: string;
  correctAnswer: string;
  wrongAnswers: string[];
  createdAt: Date;
  updatedAt: Date;
  questionType: string;
};

export interface GameState {
  currentLevel: number;
  levelName: string;
  questions: questions[];
  currentQuestionIndex: number;
  correctAnswers: number;
  wrongAnswers: number;
  startTime: number;
  levelStartTime: number;
  penalties: number;
  penaltyTime: number;
  totalTime: number;
  levelTime: number; // Time spent on current level only
  isGameOver: boolean;
  isLevelComplete: boolean;
  isDNF: boolean;
  attempt: number;
  isPaused: boolean;
  pausedTime: number;
  accumulatedTime: number;
}

export interface GameAnswer {
  questionId: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeToAnswer: number;
}

export interface LevelConfig {
  level: number;
  name: string;
  questionsToSelect: number;
  maxWrongAnswers: number;
  hasPenalties: boolean;
  penaltyPerWrong: number;
}

export const LEVEL_CONFIGS: LevelConfig[] = [
  { level: 1, name: 'Rookie', questionsToSelect: 25, maxWrongAnswers: 3, hasPenalties: false, penaltyPerWrong: 0 },
  { level: 2, name: 'Midfielder', questionsToSelect: 25, maxWrongAnswers: 3, hasPenalties: false, penaltyPerWrong: 0 },
  { level: 3, name: 'Front Runner', questionsToSelect: 25, maxWrongAnswers: 3, hasPenalties: true, penaltyPerWrong: 1 },
  { level: 4, name: 'World Champion', questionsToSelect: 25, maxWrongAnswers: 3, hasPenalties: true, penaltyPerWrong: 1 },
  { level: 5, name: 'Formula Legend', questionsToSelect: 25, maxWrongAnswers: 3, hasPenalties: true, penaltyPerWrong: 1 }
];

export class GameEngine {
  private state: GameState;
  private answers: GameAnswer[] = [];

  constructor(level: number, questions: questions[], accumulatedTime: number = 0) {
    console.log(`🎮 ENGINE: Creating GameEngine for level ${level} with accumulated time: ${accumulatedTime}s`);
    
    const config = LEVEL_CONFIGS.find(c => c.level === level);
    if (!config) throw new Error(`Invalid level: ${level}`);

    // Shuffle questions and select required number
    const shuffledQuestions = this.shuffleArray([...questions]);
    const selectedQuestions = shuffledQuestions.slice(0, config.questionsToSelect);

    // For level continuation, start paused so auto-resume can work
    const shouldStartPaused = accumulatedTime > 0;
    const currentTime = Date.now();
    
    // For level continuation, set startTime to current time
    // We'll store the accumulated time separately and add it in getCurrentTime()
    const startTime = currentTime;
    
    console.log(`🎮 ENGINE: Time calculations:`, {
      accumulatedTime,
      shouldStartPaused,
      currentTime,
      startTime,
      isLevelContinuation: accumulatedTime > 0
    });
    
    this.state = {
      currentLevel: level,
      levelName: config.name,
      questions: selectedQuestions,
      currentQuestionIndex: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      startTime: startTime,
      levelStartTime: currentTime,
      penalties: 0,
      penaltyTime: 0,
      totalTime: 0,
      levelTime: 0, // Initialize level time to 0
      isGameOver: false,
      isLevelComplete: false,
      isDNF: false,
      attempt: 1,
      isPaused: shouldStartPaused,
      pausedTime: shouldStartPaused ? currentTime : 0,
      accumulatedTime: accumulatedTime
    };
    
    console.log(`🎮 ENGINE: GameEngine created for level ${level}:`, {
      accumulatedTime: this.state.accumulatedTime,
      isPaused: this.state.isPaused,
      startTime: this.state.startTime,
      currentTimeAtCreation: this.getCurrentTime()
    });
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getCurrentQuestion(): questions | null {
    // Don't provide questions if the game is over
    if (this.state.isGameOver || this.state.isLevelComplete) {
      return null;
    }
    
    if (this.state.currentQuestionIndex >= this.state.questions.length) {
      return null;
    }
    return this.state.questions[this.state.currentQuestionIndex];
  }

  getShuffledAnswers(): string[] {
    const question = this.getCurrentQuestion();
    if (!question) return [];

    const allAnswers = [question.correctAnswer, ...question.wrongAnswers];
    return this.shuffleArray(allAnswers);
  }

  submitAnswer(selectedAnswer: string): GameAnswer {
    console.log('GameEngine: submitAnswer called with:', selectedAnswer);
    
    const question = this.getCurrentQuestion();
    if (!question) {
      console.error('GameEngine: No current question available');
      throw new Error('No current question available');
    }

    const isCorrect = selectedAnswer === question.correctAnswer;
    const timeToAnswer = (Date.now() - this.state.levelStartTime) / 1000;

    const answer: GameAnswer = {
      questionId: question.id,
      selectedAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      timeToAnswer
    };

    this.answers.push(answer);

    console.log('GameEngine: Answer processed:', {
      isCorrect,
      currentQuestionIndex: this.state.currentQuestionIndex,
      totalQuestions: this.state.questions.length,
      wrongAnswers: this.state.wrongAnswers,
      correctAnswers: this.state.correctAnswers
    });

    if (isCorrect) {
      this.state.correctAnswers++;
      this.state.currentQuestionIndex++;
      
      // Check if all questions are answered
      if (this.state.currentQuestionIndex >= this.state.questions.length) {
        console.log('GameEngine: All questions answered, calculating final status');
        this.pauseTimer(); // Pause timer when level completes
        this.calculateFinalTime();
        this.state.isLevelComplete = true;
        
        console.log('GameEngine: Level completion times:', {
          levelTime: this.state.levelTime,
          penaltyTime: this.state.penaltyTime,
          levelFinalTime: this.getLevelFinalTime(),
          totalRunTime: this.getFinalTime()
        });
        
        // Set DNF if there are any wrong answers - perfect runs are required for progression
        if (this.state.wrongAnswers > 0) {
          console.log('GameEngine: Level completed with wrong answers - marking as DNF');
          this.state.isDNF = true;
        } else {
          console.log('GameEngine: Perfect level completion - no wrong answers');
        }
      }
    } else {
      this.state.wrongAnswers++;
      
      console.log('GameEngine: Wrong answer, new counts:', {
        wrongAnswers: this.state.wrongAnswers,
        currentQuestionIndex: this.state.currentQuestionIndex,
        totalQuestions: this.state.questions.length
      });
      
      // Apply penalty for wrong answer BEFORE checking if game is over
      console.log('GameEngine: Processing wrong answer consequences');
      this.handleWrongAnswer();
      
      // Check if lives are exhausted (3 wrong answers = game over)
      const config = LEVEL_CONFIGS.find(c => c.level === this.state.currentLevel);
      if (config && this.state.wrongAnswers >= config.maxWrongAnswers) {
        console.log('GameEngine: Lives exhausted - Game Over!');
        this.calculateFinalTime();
        this.state.isGameOver = true;
        this.state.isDNF = true;
        return answer;
      }
      
      this.state.currentQuestionIndex++;
      
      // Check if all questions are answered
      if (this.state.currentQuestionIndex >= this.state.questions.length) {
        console.log('GameEngine: All questions answered, calculating final status');
        this.pauseTimer(); // Pause timer when level completes
        this.calculateFinalTime();
        this.state.isLevelComplete = true;
        
        console.log('GameEngine: Level completion times:', {
          levelTime: this.state.levelTime,
          penaltyTime: this.state.penaltyTime,
          levelFinalTime: this.getLevelFinalTime(),
          totalRunTime: this.getFinalTime()
        });
        
        // Set DNF if there are any wrong answers - perfect runs are required for progression
        if (this.state.wrongAnswers > 0) {
          console.log('GameEngine: Level completed with wrong answers - marking as DNF');
          this.state.isDNF = true;
        }
      }
    }

    console.log('GameEngine: Final state after answer submission:', {
      isLevelComplete: this.state.isLevelComplete,
      isGameOver: this.state.isGameOver,
      isDNF: this.state.isDNF,
      currentQuestionIndex: this.state.currentQuestionIndex,
      wrongAnswers: this.state.wrongAnswers,
      correctAnswers: this.state.correctAnswers
    });

    return answer;
  }

  private handleWrongAnswer(): void {
    const config = LEVEL_CONFIGS.find(c => c.level === this.state.currentLevel);
    if (!config) return;

    // Apply penalties for levels 3, 4, 5
    if (config.hasPenalties) {
      this.state.penalties++;
      
      // Base penalty: 1 second per wrong answer for levels 3, 4, 5
      this.state.penaltyTime += config.penaltyPerWrong;
      
      // Additional penalties based on level (applied only once on first wrong answer)
      if (this.state.penalties === 1) {
        if (this.state.currentLevel === 4) {
          // Grid Drop penalty: 5 seconds (one-time)
          this.state.penaltyTime += 5;
        } else if (this.state.currentLevel === 5) {
          // Loss of Sponsorship penalty: 10 seconds (one-time)
          this.state.penaltyTime += 10;
        }
      }
    }
  }

  private calculateFinalTime(): void {
    const currentLevelTime = (Date.now() - this.state.levelStartTime) / 1000;
    
    // Calculate level time (time spent on current level only)
    this.state.levelTime = currentLevelTime;
    
    if (this.state.isPaused) {
      // When paused, accumulatedTime already includes all time up to the pause
      this.state.totalTime = this.state.accumulatedTime;
    } else {
      // When not paused, add current level time to accumulated time
      this.state.totalTime = this.state.accumulatedTime + (Date.now() - this.state.startTime) / 1000;
    }
    
    console.log('GameEngine: Final time calculated:', {
      levelTime: this.state.levelTime,
      totalTime: this.state.totalTime,
      accumulatedTime: this.state.accumulatedTime,
      isPaused: this.state.isPaused
    });
  }

  pauseTimer(): void {
    if (!this.state.isPaused) {
      this.state.isPaused = true;
      this.state.pausedTime = Date.now();
      this.state.accumulatedTime += (this.state.pausedTime - this.state.startTime) / 1000;
      console.log('GameEngine: Timer paused at', this.state.accumulatedTime, 'seconds');
    }
  }

  resumeTimer(): void {
    if (this.state.isPaused) {
      const resumeTime = Date.now();
      this.state.isPaused = false;
      
      // Set new startTime to current time for fresh level timing
      // The accumulated time from previous levels is maintained separately
      this.state.startTime = resumeTime;
      this.state.levelStartTime = resumeTime;
      
      console.log('GameEngine: Timer resumed from', this.state.accumulatedTime, 'seconds at', new Date(resumeTime).toISOString());
      console.log('GameEngine: Current time after resume:', this.getCurrentTime(), 'seconds');
      console.log('GameEngine: startTime set to resume time for level continuation');
    } else {
      console.log('GameEngine: Timer was not paused, no need to resume');
    }
  }

  getCurrentTime(): number {
    if (this.state.isPaused) {
      return this.state.accumulatedTime;
    } else {
      return this.state.accumulatedTime + (Date.now() - this.state.startTime) / 1000;
    }
  }

  getState(): GameState {
    return { ...this.state };
  }

  getAnswers(): GameAnswer[] {
    return [...this.answers];
  }

  getProgress(): { current: number; total: number; percentage: number } {
    const current = this.state.currentQuestionIndex + 1;
    const total = this.state.questions.length;
    const percentage = (current / total) * 100;
    return { current, total, percentage };
  }

  getTimeElapsed(): number {
    return this.getCurrentTime();
  }

  getFinalTime(): number {
    return this.state.totalTime + this.state.penaltyTime;
  }

  // Get final time for the current level only (level time + penalties)
  getLevelFinalTime(): number {
    return this.state.levelTime + this.state.penaltyTime;
  }

  getFormattedTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toFixed(3).padStart(6, '0')}`;
  }

  resetLevel(): void {
    this.state.currentQuestionIndex = 0;
    this.state.correctAnswers = 0;
    this.state.wrongAnswers = 0;
    this.state.penalties = 0;
    this.state.penaltyTime = 0;
    this.state.totalTime = 0;
    this.state.levelTime = 0;
    this.state.isGameOver = false;
    this.state.isLevelComplete = false;
    this.state.isDNF = false;
    this.state.isPaused = false;
    this.state.pausedTime = 0;
    this.state.accumulatedTime = 0;
    this.state.startTime = Date.now();
    this.state.levelStartTime = Date.now();
    this.state.attempt++;
    this.answers = [];
  }
}

export default GameEngine;
