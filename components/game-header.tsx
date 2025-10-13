
'use client';

import { useGameStore } from '@/lib/game-store';
import { Timer, Flag, AlertTriangle, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import PenaltyRules from './penalty-rules';

export default function GameHeader() {
  const { gameState, gameEngine } = useGameStore();
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showPenaltyRules, setShowPenaltyRules] = useState(false);

  useEffect(() => {
    if (!gameEngine || !gameState || gameState.isGameOver || (gameState.isLevelComplete && gameState.isPaused)) {
      return;
    }

    const interval = setInterval(() => {
      setTimeElapsed(gameEngine.getTimeElapsed());
    }, 10);

    return () => clearInterval(interval);
  }, [gameEngine, gameState]);

  if (!gameState) return null;

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toFixed(3).padStart(6, '0')}`;
  };

  return (
    <>
      <div className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="f1-container f1-mobile-optimized">
          <div className="flex items-center justify-between">
            {/* Level Info */}
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              <span className="text-white font-medium f1-header-text f1-readable">
                Level {gameState.currentLevel}: {gameState.levelName}
              </span>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              <span className="text-white f1-timer">
                {formatTime(timeElapsed)}
              </span>
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Penalty Rules Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPenaltyRules(true)}
                className="flex items-center gap-1 sm:gap-2 text-white border border-gray-600 hover:bg-gray-800 hover:text-white bg-transparent f1-nav-text min-h-[2rem] px-2 sm:px-3"
              >
                <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Rules</span>
              </Button>

              {/* DNF Status */}
              <div className="flex items-center gap-1 sm:gap-2">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                        i <= gameState.wrongAnswers
                          ? 'bg-red-500'
                          : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-white f1-nav-text hidden sm:inline">
                  {3 - gameState.wrongAnswers} lives left
                </span>
                <span className="text-white f1-nav-text sm:hidden">
                  {3 - gameState.wrongAnswers}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Penalty Rules Modal */}
      <PenaltyRules
        open={showPenaltyRules}
        onClose={() => setShowPenaltyRules(false)}
      />
    </>
  );
}
