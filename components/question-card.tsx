
'use client';

import { useGameStore } from '@/lib/game-store';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function QuestionCard() {
  const { gameEngine, gameState, submitAnswer } = useGameStore();
  
  // ULTRA-SIMPLE state - only what's absolutely necessary
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answerIsCorrect, setAnswerIsCorrect] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string>('');
  
  // Audio ref for wrong answer feedback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef<boolean>(false);
  
  // Initialize audio with iOS Safari compatibility - OPTIMIZED FOR INSTANT PLAYBACK
  useEffect(() => {
    try {
      audioRef.current = new Audio('/audio/trivia_wrong_answer_ding.mp3');
      audioRef.current.volume = 1.0; // Full volume for louder sound
      audioRef.current.preload = 'auto'; // Pre-load for instant playback
      
      // Force load the audio immediately for zero-lag playback
      audioRef.current.load();
      
      // iOS Safari requires user interaction to unlock audio
      // We'll unlock it on first touch/click anywhere on the page
      const unlockAudio = () => {
        if (!audioUnlockedRef.current && audioRef.current) {
          // Play and immediately pause to unlock audio on iOS
          audioRef.current.play().then(() => {
            audioRef.current!.pause();
            audioRef.current!.currentTime = 0;
            audioUnlockedRef.current = true;
            console.log('✅ Audio unlocked and ready for instant playback');
          }).catch(() => {
            // Silent fail - will try again on next interaction
          });
        }
      };
      
      // Listen for first user interaction to unlock audio
      document.addEventListener('touchstart', unlockAudio, { once: true });
      document.addEventListener('click', unlockAudio, { once: true });
      
      return () => {
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('click', unlockAudio);
      };
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }, []);
  
  // Function to play wrong answer audio - OPTIMIZED FOR INSTANT PLAYBACK (NO LAG)
  // Returns a promise that resolves when audio starts playing (for iOS compatibility)
  const playWrongAnswerSound = (): Promise<void> => {
    return new Promise((resolve) => {
      try {
        if (audioRef.current) {
          // Reset to beginning for instant replay
          audioRef.current.currentTime = 0;
          
          // Play IMMEDIATELY - no pause, no load, just play
          const playPromise = audioRef.current.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('🔊 Wrong answer sound played instantly');
                // Small delay to ensure audio starts on iOS before any state changes
                setTimeout(resolve, 100);
              })
              .catch(error => {
                console.error('🔇 Audio playback failed:', error);
                // If still fails on iOS, try to unlock again
                if (!audioUnlockedRef.current) {
                  console.warn('🔇 Audio still locked on iOS, attempting to unlock...');
                  audioRef.current?.play().catch(e => {
                    console.warn('Audio playback blocked by browser:', e);
                  });
                }
                resolve(); // Resolve anyway to not block game flow
              });
          } else {
            resolve();
          }
        } else {
          console.warn('🔇 Audio ref is null, cannot play sound');
          resolve();
        }
      } catch (error) {
        console.error('Audio playback error:', error);
        resolve();
      }
    });
  };
  


  if (!gameEngine || !gameState) return null;

  const currentQuestion = gameEngine.getCurrentQuestion();
  if (!currentQuestion) return null;

  const shuffledAnswers = gameEngine.getShuffledAnswers();
  const progress = gameEngine.getProgress();

  // Reset when question changes - Force immediate state cleanup
  useEffect(() => {
    console.log('🔄 RESET: Question changed, clearing all state immediately');
    setSelectedAnswer(null);
    setShowFeedback(false);
    setAnswerIsCorrect(false);
    setCorrectAnswer('');
  }, [currentQuestion?.id]);

  // Additional effect to ensure state is cleared when question index changes
  useEffect(() => {
    if (gameState?.currentQuestionIndex !== undefined) {
      console.log('🔄 QUESTION INDEX RESET: Clearing state on question index change');
      setSelectedAnswer(null);
      setShowFeedback(false);
      setAnswerIsCorrect(false);
      setCorrectAnswer('');
    }
  }, [gameState?.currentQuestionIndex]);

  const handleAnswerSelect = async (answer: string) => {
    // Block if already answered
    if (selectedAnswer !== null) {
      console.log('⚠️ BLOCKED: Already answered');
      return;
    }

    console.log('🎯 ANSWER CLICKED:', answer);
    console.log('📝 CORRECT ANSWER:', currentQuestion.correctAnswer);
    
    const isCorrect = answer === currentQuestion.correctAnswer;
    
    // Set state for tracking, but only show feedback for wrong answers
    setSelectedAnswer(answer);
    setAnswerIsCorrect(isCorrect);
    setCorrectAnswer(currentQuestion.correctAnswer);
    
    // Only show feedback for wrong answers
    if (!isCorrect) {
      setShowFeedback(true);
      // Play wrong answer sound and WAIT for it to start (critical for iOS on 3rd error)
      console.log('🔊 Playing wrong answer sound...');
      await playWrongAnswerSound();
      console.log('🔊 Sound playing confirmed');
    }
    
    console.log('🚨 FEEDBACK STATE SET:', {
      selected: answer,
      correct: isCorrect,
      correctAnswer: currentQuestion.correctAnswer,
      showFeedback: !isCorrect
    });
    
    // DELAY game advancement - immediate for correct answers, 2 seconds for wrong answers
    const delayTime = isCorrect ? 0 : 2000;
    setTimeout(() => {
      console.log(`⏰ SUBMITTING ANSWER TO GAME ENGINE after ${delayTime/1000} seconds`);
      submitAnswer(answer);
      
      // Clear feedback state after submission
      setTimeout(() => {
        console.log('⏰ CLEARING FEEDBACK');
        setSelectedAnswer(null);
        setShowFeedback(false);
        setAnswerIsCorrect(false);
        setCorrectAnswer('');
      }, 100); // Small delay to allow game state to update
    }, delayTime); // Variable delay based on answer correctness
  };

  // MOBILE FOCUS CLEANUP: Simple focus removal on question change
  useEffect(() => {
    console.log('🔄 MOBILE FOCUS CLEANUP: Removing focus from answer buttons');
    if (typeof document !== 'undefined') {
      setTimeout(() => {
        // Remove focus from any currently focused button
        if (document.activeElement && document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        
        // Clear focus from all answer buttons
        const buttons = document.querySelectorAll('.f1-answer-button-container');
        buttons.forEach((button) => {
          if (button instanceof HTMLElement) {
            button.blur();
          }
        });
      }, 50);
    }
  }, [currentQuestion?.id]);

  return (
    <div className="f1-game-container">

      {/* Progress Bar */}
      <div className="f1-spacing-sm">
        <div className="flex justify-between f1-progress text-gray-400 mb-1">
          <span>Q{progress?.current || 0}/{progress?.total || 0}</span>
          <span>{progress?.percentage?.toFixed(0) || 0}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-md h-2">
          <div 
            className="bg-blue-500 h-2 rounded-md transition-all duration-300 ease-out"
            style={{
              width: `${progress?.percentage || 0}%`
            }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="f1-question-container bg-gray-700 rounded-lg mb-3">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="f1-question-text text-white m-0 f1-readable">
              {currentQuestion?.question || 'Loading question...'}
            </h2>
          </div>
        </div>
      </div>

      {/* FEEDBACK MESSAGE - Only show for wrong answers */}
      {showFeedback && !answerIsCorrect && (
        <div className="bg-red-600 text-white f1-spacing-sm rounded-lg mb-3 text-center border-2 border-red-400 animate-shake">
          <div className="flex items-center justify-center gap-2">
            <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="f1-question-text font-bold">❌ WRONG!</span>
          </div>
          <div className="mt-1 f1-modal-text">
            Correct: <strong className="f1-readable">{correctAnswer}</strong>
          </div>
        </div>
      )}

      {/* Answer Buttons */}
      <div className="f1-answer-grid">
        {shuffledAnswers?.map((answer, index) => {
          // Force consistent styling - ensure no state persistence
          const isAnswered = selectedAnswer !== null;
          const isSelected = answer === selectedAnswer;
          const shouldShowFeedback = showFeedback && !answerIsCorrect;
          
          // MOBILE HOVER PERSISTENCE FIX: Use original styling with enhanced mobile reset
          let buttonClasses = 'f1-answer-button-container f1-mobile-button-reset flex items-center gap-3 border-2 transition-all duration-200 f1-answer-button f1-readable';
          
          // MOBILE-FIRST STYLING: No hover effects on mobile, desktop-only hover
          if (!shouldShowFeedback && !isAnswered) {
            // Default interactive state - hover only on desktop devices
            buttonClasses += ' bg-gray-600 border-gray-500 text-white cursor-pointer f1-desktop-only-hover';
          } else if (shouldShowFeedback && isSelected && !answerIsCorrect) {
            // Wrong selected answer - dimmed out
            buttonClasses += ' bg-gray-700 border-gray-600 text-gray-400 opacity-50 cursor-default';
          } else if (shouldShowFeedback && !isSelected) {
            // Other non-selected answers during wrong feedback - dimmed out
            buttonClasses += ' bg-gray-700 border-gray-600 text-gray-400 opacity-50 cursor-default';
          } else {
            // All other cases - default gray styling (including correct answers)
            buttonClasses += ' bg-gray-600 border-gray-500 text-white cursor-default';
          }

          return (
            <button
              key={`question-${currentQuestion?.id}-answer-${index}-${answer.substring(0, 10)}`}
              onClick={() => handleAnswerSelect(answer)}
              onTouchStart={(e) => {
                // Blur immediately on touch to prevent any focus states
                if (e.target instanceof HTMLElement) {
                  e.target.blur();
                }
              }}
              disabled={isAnswered}
              className={buttonClasses}
            >
              {/* Letter circle */}
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-500 text-white flex items-center justify-center f1-answer-letter flex-shrink-0">
                {String.fromCharCode(65 + index)}
              </div>
              
              {/* Answer text */}
              <span className="flex-grow text-left f1-readable">
                {answer}
              </span>
            </button>
          );
        }) || []}
      </div>
    </div>
  );
}
