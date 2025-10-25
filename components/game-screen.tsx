
'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/components/providers';
import { useGameStore } from '@/lib/game-store';
import GameHeader from './game-header';
import QuestionCard from './question-card';
import GameModals from './game-modals';
import PerfectCompletionCelebration from './perfect-completion-celebration';
import GameAudioManager from './game-audio-manager';

interface GameScreenProps {
  level: number;
  onReturnHome: () => void;
}

export default function GameScreen({ level: initialLevel, onReturnHome }: GameScreenProps) {
  const { user, isLoading } = useAuth();
  const { 
    initializeGame, 
    gameState, 
    gameEngine, 
    setUsername, 
    setUserId, 
    completeLevel,
    showPerfectCelebration,
    setShowPerfectCelebration,
    checkPerfectCompletion,
    resumeTimer,
    perfectRunSessionId,
    startPerfectRun,
    cancelPerfectRun
  } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLevel, setCurrentLevel] = useState(initialLevel);
  const [initialized, setInitialized] = useState(false);
  const [accumulatedTimeForNextLevel, setAccumulatedTimeForNextLevel] = useState<number>(0);
  const scoreSavedRef = useRef(false);

  // Simplified initialization effect - consolidated logic
  useEffect(() => {
    const initializeGameLevel = async () => {
      // Prevent re-initialization if already initialized for this level
      if (initialized && currentLevel === initialLevel) {
        setLoading(false);
        return;
      }
      
      // Reset accumulated time if going back to the initial level (fresh start)
      if (currentLevel === initialLevel) {
        console.log(`🔄 LEVEL INIT: Resetting accumulated time for initial level ${initialLevel}`);
        setAccumulatedTimeForNextLevel(0);
      }
      
      try {
        setLoading(true);
        setError(null);
        scoreSavedRef.current = false;

        // Handle authentication states
        if (isLoading) {
          return; // Keep loading, don't proceed yet
        }
        
        if (!user) {
          setError('Please sign in to play the game');
          setLoading(false);
          return;
        }

        // Set user data from auth context
        setUserId(user.id);
        setUsername(user.username);

        // Get questions for this level with retry logic
        console.log(`🎮 FETCH: Fetching questions for level ${currentLevel}`);
        
        let questions;
        let lastError;
        const maxRetries = 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`📡 FETCH: Attempt ${attempt}/${maxRetries} to fetch questions`);
            
            const questionsResponse = await fetch(`/api/questions?level=${currentLevel}`, {
              headers: {
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/json'
              },
              cache: 'no-store'
            });
            
            console.log(`📡 FETCH: Response status:`, questionsResponse.status);
            console.log(`📡 FETCH: Response headers:`, Object.fromEntries(questionsResponse.headers));
            
            if (!questionsResponse.ok) {
              const errorText = await questionsResponse.text();
              console.error(`❌ FETCH: Request failed on attempt ${attempt}:`, {
                status: questionsResponse.status,
                statusText: questionsResponse.statusText,
                body: errorText
              });
              lastError = new Error(`Failed to fetch questions (${questionsResponse.status}): ${errorText}`);
              
              // Retry for server errors (5xx) and some client errors
              if (attempt < maxRetries && (questionsResponse.status >= 500 || questionsResponse.status === 404)) {
                console.log(`🔄 FETCH: Retrying after ${attempt * 1000}ms delay...`);
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                continue;
              } else {
                throw lastError;
              }
            }

            questions = await questionsResponse.json();
            console.log(`✅ FETCH: Successfully fetched ${questions.length} questions for level ${currentLevel} on attempt ${attempt}`);
            break; // Success, exit retry loop
            
          } catch (error) {
            console.error(`❌ FETCH: Network error on attempt ${attempt}:`, error);
            lastError = error instanceof Error ? error : new Error('Network error fetching questions');
            
            if (attempt < maxRetries) {
              console.log(`🔄 FETCH: Retrying after ${attempt * 1000}ms delay...`);
              await new Promise(resolve => setTimeout(resolve, attempt * 1000));
              continue;
            } else {
              throw lastError;
            }
          }
        }
        
        if (questions.length === 0) {
          console.error(`❌ FETCH: No questions returned for level ${currentLevel}`);
          throw new Error(`No questions available for level ${currentLevel}`);
        }

        // Start a perfect run session if starting level 1 fresh (no accumulated time)
        if (currentLevel === 1 && accumulatedTimeForNextLevel === 0 && !perfectRunSessionId) {
          console.log('🏁 Starting perfect run session for level 1');
          await startPerfectRun();
        }

        // Initialize game - pass accumulated time for level continuation
        console.log(`🔄 LEVEL INIT: Initializing level ${currentLevel} with local accumulated time: ${accumulatedTimeForNextLevel}s`);
        initializeGame(currentLevel, questions, accumulatedTimeForNextLevel);
        
        // Check if this is a level continuation by checking the new game state
        setTimeout(() => {
          const store = useGameStore.getState();
          const newGameState = store.gameState;
          const newGameEngine = store.gameEngine;
          
          console.log(`⏰ INIT: Checking level continuation for level ${currentLevel}:`, {
            hasGameState: !!newGameState,
            hasGameEngine: !!newGameEngine,
            accumulatedTime: newGameState?.accumulatedTime,
            isPaused: newGameState?.isPaused,
            currentTime: newGameEngine?.getCurrentTime()
          });
          
          if (newGameState && newGameState.accumulatedTime > 0 && newGameState.isPaused) {
            console.log(`⏰ INIT: Auto-resuming timer for level continuation (accumulated: ${newGameState.accumulatedTime}s)`);
            resumeTimer();
            
            // Verify the timer was resumed correctly
            setTimeout(() => {
              const verifyState = useGameStore.getState().gameState;
              const verifyEngine = useGameStore.getState().gameEngine;
              console.log(`⏰ VERIFY: Timer resume verification:`, {
                isPaused: verifyState?.isPaused,
                accumulatedTime: verifyState?.accumulatedTime,
                currentTime: verifyEngine?.getCurrentTime()
              });
            }, 50);
          } else {
            console.log(`⏰ INIT: Starting fresh timer for level ${currentLevel} (no accumulated time or not paused)`);
          }
        }, 100); // Small delay to ensure state has updated
        
        setInitialized(true);
        setLoading(false);
      } catch (error) {
        console.error('Error initializing game:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize game');
        setLoading(false);
      }
    };

    initializeGameLevel();
  }, [currentLevel, isLoading, user?.id, initialized, initialLevel, initializeGame, setUserId, setUsername]);

  // Handle level restart
  const handleRestartLevel = () => {
    // Cancel perfect run session if restarting (perfect runs require continuous completion)
    if (perfectRunSessionId) {
      console.log('🚫 Cancelling perfect run due to level restart');
      cancelPerfectRun();
    }
    
    setInitialized(false);
    scoreSavedRef.current = false;
    // Reset accumulated time when restarting a level
    setAccumulatedTimeForNextLevel(0);
  };

  // Handle level advancement - ONLY for perfect runs
  const handleNextLevel = () => {
    console.log(`🚀 ADVANCE: handleNextLevel called`);
    console.log(`🚀 ADVANCE: Current game state:`, {
      gameStateLevel: gameState?.currentLevel,
      localCurrentLevel: currentLevel,
      wrongAnswers: gameState?.wrongAnswers,
      isLevelComplete: gameState?.isLevelComplete,
      isPaused: gameState?.isPaused,
      accumulatedTime: gameState?.accumulatedTime,
      gameStateExists: !!gameState,
      gameEngineExists: !!gameEngine
    });
    
    if (gameState && gameEngine) {
      const currentAccumulatedTime = gameEngine.getCurrentTime();
      console.log(`🚀 ADVANCE: Engine current time before completion:`, currentAccumulatedTime);
      
      // Only allow progression for perfect runs (0 wrong answers)
      if (gameState.wrongAnswers > 0) {
        console.log(`🚫 ADVANCE: Level advancement blocked: ${gameState.wrongAnswers} wrong answers detected`);
        return;
      }
      
      // CAPTURE THE ACCUMULATED TIME BEFORE DOING ANYTHING ELSE
      console.log(`💾 ADVANCE: Storing accumulated time for next level: ${currentAccumulatedTime}s`);
      setAccumulatedTimeForNextLevel(currentAccumulatedTime);
      
      // Mark current level as completed with wrong answers count
      // DO NOT resume timer yet - let the new level initialize with accumulated time first
      completeLevel(currentLevel, gameEngine.getFinalTime(), gameState.wrongAnswers);
      console.log(`🏆 ADVANCE: Level ${currentLevel} marked as perfectly completed`);
      console.log(`⏸️ ADVANCE: Timer state after completion:`, {
        isPaused: gameEngine.getState().isPaused,
        isLevelComplete: gameEngine.getState().isLevelComplete,
        currentTime: gameEngine.getCurrentTime(),
        accumulatedTime: gameEngine.getState().accumulatedTime,
        storedForNextLevel: currentAccumulatedTime
      });
    } else {
      console.log(`🚫 ADVANCE: Cannot advance - missing gameState or gameEngine`);
      return;
    }
    
    // Use gameState.currentLevel for consistency, but fall back to currentLevel
    const levelToCheck = gameState?.currentLevel || currentLevel;
    console.log(`🔍 ADVANCE: Checking if level ${levelToCheck} < 5 for advancement`);
    
    if (levelToCheck < 5) {
      const nextLevel = levelToCheck + 1;
      console.log(`➡️ ADVANCE: Advancing from level ${levelToCheck} to level ${nextLevel}`);
      console.log(`➡️ ADVANCE: About to trigger level change - current accumulated time: ${gameEngine?.getCurrentTime()}s`);
      
      setCurrentLevel(nextLevel);
      setInitialized(false);
      scoreSavedRef.current = false;
      
      console.log(`➡️ ADVANCE: State change triggered for level ${nextLevel}`);
    } else {
      console.log(`🏁 ADVANCE: Cannot advance past level 5 (current level: ${levelToCheck})`);
    }
  };

  // Score saving logic
  const saveScore = async () => {
    if (!gameState || !gameEngine || scoreSavedRef.current) return;

    try {
      scoreSavedRef.current = true;
      const scoreData = {
        userId: useGameStore.getState().userId,
        username: useGameStore.getState().username,
        level: gameState.currentLevel,
        levelName: gameState.levelName,
        questionsCorrect: gameState.correctAnswers,
        totalQuestions: gameState.questions.length,
        timeInSeconds: gameState.levelTime, // Level time only (for individual level records)
        penalties: gameState.penalties,
        penaltyTime: gameState.penaltyTime,
        finalTime: gameEngine.getLevelFinalTime(), // Level final time (level time + penalties)
        completed: gameState.isLevelComplete,
        attempt: gameState.attempt,
        // Include perfect run session ID if this is part of a perfect run
        ...(perfectRunSessionId && gameState.wrongAnswers === 0 && { 
          perfectRunSessionId: perfectRunSessionId 
        })
      };

      const isPerfect = gameState.correctAnswers === gameState.questions.length && gameState.wrongAnswers === 0;
      console.log('💾 SAVE: Saving score to database:', {
        level: scoreData.level,
        questionsCorrect: scoreData.questionsCorrect,
        totalQuestions: scoreData.totalQuestions,
        completed: scoreData.completed,
        isPerfect: isPerfect,
        wrongAnswers: gameState.wrongAnswers
      });

      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoreData)
      });

      if (response.ok) {
        console.log('✅ SAVE: Score saved successfully');
      } else {
        console.error('❌ SAVE: Failed to save score, status:', response.status);
      }
    } catch (error) {
      console.error('❌ SAVE: Error saving score:', error);
      scoreSavedRef.current = false;
    }
  };

  // Save score when game ends
  useEffect(() => {
    if (gameState && (gameState.isLevelComplete || gameState.isGameOver || gameState.isDNF) && !scoreSavedRef.current) {
      saveScore();
    }
  }, [gameState?.isLevelComplete, gameState?.isGameOver, gameState?.isDNF]);

  // Cancel perfect run session if user makes a mistake
  useEffect(() => {
    if (gameState && perfectRunSessionId && gameState.wrongAnswers > 0) {
      console.log('🚫 Cancelling perfect run due to wrong answer');
      cancelPerfectRun();
    }
  }, [gameState?.wrongAnswers, perfectRunSessionId, cancelPerfectRun]);

  // Check for perfect level 5 completion and trigger celebration
  useEffect(() => {
    if (gameState && gameState.isLevelComplete && gameState.currentLevel === 5 && gameState.wrongAnswers === 0) {
      console.log(`Perfect level 5 completion detected - triggering celebration:`, {
        isLevelComplete: gameState.isLevelComplete,
        currentLevel: gameState.currentLevel,
        wrongAnswers: gameState.wrongAnswers,
        localCurrentLevel: currentLevel
      });
      
      // Mark level as completed first
      if (gameEngine) {
        completeLevel(currentLevel, gameEngine.getFinalTime(), gameState.wrongAnswers);
      }
      // Show celebration for perfect level 5 completion
      setShowPerfectCelebration(true);
    }
  }, [gameState?.isLevelComplete, gameState?.wrongAnswers, gameState?.currentLevel, currentLevel, gameEngine, completeLevel, setShowPerfectCelebration]);

  // Handle celebration completion
  const handleCelebrationComplete = () => {
    setShowPerfectCelebration(false);
    onReturnHome(); // Navigate back to home screen (level selection)
  };



  if (loading) {
    const loadingMessage = isLoading 
      ? 'Checking authentication...' 
      : 'Loading game...';
        
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isAuthError = error.includes('sign in') || error.includes('Authentication');
    
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-xl mb-4">Game Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            {isAuthError && (
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                }}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Retry
              </button>
            )}
            <button
              onClick={onReturnHome}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState || !gameEngine) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg">Initializing game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="f1-viewport-container bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Global Audio Manager - Never unmounts, persists across all state changes */}
      <GameAudioManager />
      
      <GameHeader />
      
      <div className="f1-scrollable-content f1-mobile-optimized">
        {gameState.isLevelComplete || gameState.isGameOver || gameState.isDNF ? (
          <div className="flex items-center justify-center min-h-full">
            <div className="text-center f1-container">
              <div className="text-4xl sm:text-5xl md:text-6xl mb-4">
                {gameState.isLevelComplete ? '🏆' : '💀'}
              </div>
              <h2 className="f1-modal-title text-white mb-4 f1-readable">
                {gameState.isLevelComplete ? 'Level Complete!' : 'Game Over'}
              </h2>
              <p className="f1-modal-text text-gray-400 mb-2 f1-readable max-w-2xl mx-auto">
                {gameState.isLevelComplete 
                  ? `Great job! You completed all ${gameState.questions.length} questions.`
                  : gameState.isGameOver && gameState.wrongAnswers >= 3
                  ? `You've used all your lives! You got ${gameState.wrongAnswers} wrong answers.`
                  : 'Better luck next time!'
                }
              </p>
              {gameState.isLevelComplete && (
                <div className="f1-modal-text text-gray-300">
                  {gameState.wrongAnswers === 0 ? (
                    <span className="text-yellow-400 f1-readable">⭐ Perfect! No wrong answers!</span>
                  ) : (
                    <span className="f1-readable">Final Score: {gameState.correctAnswers}/{gameState.questions.length} correct</span>
                  )}
                </div>
              )}
              {gameState.isGameOver && gameState.wrongAnswers >= 3 && (
                <div className="text-red-400 f1-modal-text mt-2">
                  <span className="f1-readable">❌ Lives Exhausted - You answered {gameState.correctAnswers} questions correctly before running out of lives.</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <QuestionCard />
            
            {/* Exit Button - Visible during active gameplay */}
            <div className="flex justify-center mt-2 pb-2">
              <button
                onClick={onReturnHome}
                className="flex items-center gap-2 f1-spacing-sm bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-gray-500 text-white f1-nav-text rounded-lg transition-all duration-200 min-h-[2.5rem]"
              >
                <svg 
                  className="w-3 h-3 sm:w-4 sm:h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="f1-readable">Exit to Level Selection</span>
              </button>
            </div>
          </>
        )}
      </div>

      <GameModals
        onRestartLevel={handleRestartLevel}
        onNextLevel={handleNextLevel}
        onReturnHome={onReturnHome}
      />

      {/* Perfect Completion Celebration */}
      <PerfectCompletionCelebration
        isVisible={showPerfectCelebration}
        onComplete={handleCelebrationComplete}
      />
    </div>
  );
}
