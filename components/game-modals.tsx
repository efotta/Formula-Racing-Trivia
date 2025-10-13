
'use client';

import { useGameStore } from '@/lib/game-store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trophy, XCircle, Clock, AlertTriangle, Star } from 'lucide-react';
import { useState, useEffect } from 'react';


interface GameModalsProps {
  onRestartLevel: () => void;
  onNextLevel: () => void;
  onReturnHome: () => void;
}

export default function GameModals({ onRestartLevel, onNextLevel, onReturnHome }: GameModalsProps) {
  const { gameState, gameEngine, userId } = useGameStore();
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showDNF, setShowDNF] = useState(false);
  const [personalBestTime, setPersonalBestTime] = useState<number | null>(null);
  const [isNewPersonalBest, setIsNewPersonalBest] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);


  if (!gameState || !gameEngine) return null;

  // Show modals based on game state changes (moved to useEffect to prevent infinite re-renders)
  useEffect(() => {
    if (gameState?.isLevelComplete && gameState.wrongAnswers === 0 && !showLevelComplete) {
      // Only show level complete modal for perfect runs
      setShowLevelComplete(true);
    }
  }, [gameState?.isLevelComplete, gameState?.wrongAnswers, showLevelComplete]);

  useEffect(() => {
    if (gameState?.isDNF && !showDNF) {
      setShowDNF(true);
    }
  }, [gameState?.isDNF, showDNF]);

  useEffect(() => {
    if (gameState?.isGameOver && !showGameOver) {
      setShowGameOver(true);
    }
  }, [gameState?.isGameOver, showGameOver]);



  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toFixed(3).padStart(6, '0')}`;
  };

  // Function to fetch personal best time for current level
  const fetchPersonalBestTime = async (level: number, userIdParam: string) => {
    try {
      const response = await fetch(`/api/scores/personal-best?userId=${userIdParam}&level=${level}`);
      if (response.ok) {
        const data = await response.json();
        return data.personalBestTime || null;
      }
    } catch (error) {
      console.error('Error fetching personal best time:', error);
    }
    return null;
  };

  const finalTime = gameEngine.getFinalTime();
  const levelFinalTime = gameEngine.getLevelFinalTime();

  // Check for personal best when level completes
  useEffect(() => {
    if (gameState?.isLevelComplete && gameState.wrongAnswers === 0 && userId) {
      const checkPersonalBest = async () => {
        const bestTime = await fetchPersonalBestTime(gameState.currentLevel, userId);
        setPersonalBestTime(bestTime);
        
        // Determine if current time is a new personal best (compare level times)
        const currentLevelFinalTime = gameEngine.getLevelFinalTime();
        const isNewBest = bestTime === null || currentLevelFinalTime < bestTime;
        setIsNewPersonalBest(isNewBest);
        
        if (isNewBest) {
          setShowCongratulations(true);
          // Hide congratulations message after 3 seconds
          setTimeout(() => {
            setShowCongratulations(false);
          }, 3000);
        }
      };
      
      checkPersonalBest();
    }
  }, [gameState?.isLevelComplete, gameState?.wrongAnswers, gameState?.currentLevel, userId]);

  return (
    <>
      {/* Level Complete Modal */}
      <Dialog open={showLevelComplete} onOpenChange={setShowLevelComplete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Level Complete!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">
                🏎️ {gameState.levelName} Complete!
              </h3>
              {gameState.wrongAnswers === 0 && (
                <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-4">
                  <p className="text-green-800 font-medium">Perfect Run! 🎉</p>
                  <p className="text-green-600 text-sm">
                    All questions answered correctly with no mistakes!
                  </p>
                </div>
              )}
              {/* New Personal Best Congratulations Message */}
              {showCongratulations && (
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white f1-spacing-sm rounded-lg mb-4 animate-pulse">
                  <div className="flex items-center justify-center gap-2">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="font-bold f1-modal-text f1-readable">Congratulations on a new personal best!</span>
                    <Star className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
              )}
              
              <div className="bg-gray-100 rounded-lg f1-spacing-md space-y-2">
                <div className="flex justify-between items-center">
                  <span className="f1-modal-text f1-readable">Latest Level {gameState.currentLevel} Time:</span>
                  <span className="f1-timer">{formatTime(levelFinalTime)}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="f1-modal-text f1-readable">Personal Best Level {gameState.currentLevel} Time:</span>
                  <span className="f1-timer">
                    {personalBestTime !== null 
                      ? formatTime(isNewPersonalBest ? levelFinalTime : personalBestTime)
                      : formatTime(levelFinalTime)
                    }
                    {isNewPersonalBest && (
                      <span className="ml-2 text-yellow-600">
                        <Star className="w-4 h-4 inline" />
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <div className="mt-4 f1-nav-text text-gray-600 f1-readable">
                ⏸️ Game timer paused - choose your next action
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowLevelComplete(false);
                    onReturnHome();
                  }}
                  className="w-full"
                >
                  Return to Level Selection
                </Button>
                {gameState.currentLevel < 5 && gameState.wrongAnswers === 0 && (
                  <Button
                    onClick={() => {
                      setShowLevelComplete(false);
                      onNextLevel();
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    Continue to Next Level (Keep Playing)
                  </Button>
                )}
                {gameState.currentLevel === 5 && gameState.wrongAnswers === 0 && (
                  <Button
                    onClick={() => {
                      setShowLevelComplete(false);
                      onReturnHome();
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    🏆 Game Complete - Return Home
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DNF Modal - For completed levels with wrong answers */}
      <Dialog open={showDNF} onOpenChange={setShowDNF}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-6 h-6 text-red-500" />
              DNF - Did Not Finish
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="mb-4">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-2" />
                <h3 className="text-lg font-medium mb-2">
                  Level Requirements Not Met
                </h3>
                <p className="text-gray-600">
                  You must answer all 25 questions correctly with 0 wrong answers to advance to the next level.
                </p>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span>Questions Correct:</span>
                  <span className="font-semibold">{gameState.correctAnswers}/25</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Wrong Answers:</span>
                  <span className="font-semibold">{gameState.wrongAnswers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span className="font-mono">{formatTime(gameState.totalTime)}</span>
                </div>
                {gameState.penaltyTime > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Penalties:</span>
                    <span className="font-mono">+{formatTime(gameState.penaltyTime)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Final Time:</span>
                  <span className="font-mono">{formatTime(finalTime)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDNF(false);
                  onReturnHome();
                }}
                className="flex-1"
              >
                Return to Level Selection
              </Button>
              <Button
                onClick={() => {
                  setShowDNF(false);
                  onRestartLevel();
                }}
                className="flex-1"
              >
                Restart Level
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Game Over Modal */}
      <Dialog open={showGameOver} onOpenChange={setShowGameOver}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-6 h-6 text-red-500" />
              DNF - Did Not Finish
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="mb-4">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-2" />
                <h3 className="text-lg font-medium mb-2">
                  Race Over!
                </h3>
                <p className="text-gray-600">
                  You made {gameState.wrongAnswers} mistakes and must restart this level.
                </p>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span>Questions Correct:</span>
                  <span>{gameState.correctAnswers}/25</span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span className="font-mono">{formatTime(gameState.totalTime)}</span>
                </div>
                {gameState.penaltyTime > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Penalties:</span>
                    <span className="font-mono">+{formatTime(gameState.penaltyTime)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowGameOver(false);
                  onReturnHome();
                }}
                className="flex-1"
              >
                Return to Level Selection
              </Button>
              <Button
                onClick={() => {
                  setShowGameOver(false);
                  onRestartLevel();
                }}
                className="flex-1"
              >
                Restart Level
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
