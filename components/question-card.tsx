
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
  
  // Function to play wrong answer audio using global audio manager
  // This calls the persistent audio manager that never unmounts
  // MUST be called synchronously from the click event for iPhone compatibility
  // V4: Enhanced with better defensive checks and fallbacks
  const playWrongAnswerSound = (onComplete?: () => void): void => {
    try {
      console.log('🔊 QUESTION CARD V4: Calling global audio manager');
      console.log('🔊 QUESTION CARD V4: Function type:', typeof (window as any).__playWrongAnswerSound);
      console.log('🔊 QUESTION CARD V4: Has callback:', !!onComplete);
      
      // Call the global audio function exposed by GameAudioManager
      // V4: Enhanced defensive checks for iPhone compatibility
      if (typeof (window as any).__playWrongAnswerSound === 'function') {
        (window as any).__playWrongAnswerSound(onComplete);
        console.log('✅ QUESTION CARD V4: Audio playback initiated');
      } else {
        console.error('❌ QUESTION CARD V4: Global audio function NOT available!');
        console.error('❌ This means GameAudioManager failed to initialize');
        console.error('❌ Check console for AUDIO MANAGER initialization errors');
        
        // DEFENSIVE FALLBACK: If audio function is missing, still call callback
        // This prevents the game from getting stuck waiting for audio
        if (onComplete) {
          console.log('⚠️ FALLBACK V4: Calling completion callback without audio');
          setTimeout(onComplete, 500); // Small delay to mimic audio duration
        }
      }
    } catch (error) {
      console.error('❌ QUESTION CARD V4: Error calling audio function', error);
      // DEFENSIVE FALLBACK: Always call callback to prevent stuck state
      if (onComplete) {
        console.log('⚠️ FALLBACK V4: Calling completion callback after error');
        setTimeout(onComplete, 500);
      }
    }
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

  const handleAnswerSelect = (answer: string) => {
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
    
    // Check if this is the third wrong answer (critical for iPhone audio)
    const currentWrongAnswers = gameState?.wrongAnswers || 0;
    const willBeThirdError = !isCorrect && currentWrongAnswers === 2;
    
    console.log('🔍 ERROR CHECK:', {
      currentWrongAnswers,
      isCorrect,
      willBeThirdError
    });
    
    // Only show feedback for wrong answers
    if (!isCorrect) {
      setShowFeedback(true);
      
      if (willBeThirdError) {
        // CRITICAL: Third wrong answer on iPhone
        // V5 FIX: Wait for audio + give user time to see correct answer
        console.log('🚨 THIRD WRONG ANSWER V5: Playing audio and waiting for completion + delay');
        
        // Trigger audio synchronously from click event
        // Use callback to ensure audio completes, then add delay for user to see answer
        playWrongAnswerSound(() => {
          console.log('✅ AUDIO COMPLETE V5: Audio ended callback - waiting 2.5s for user to see answer');
          
          // Add 2.5-second delay after audio completes so user can see correct answer
          setTimeout(() => {
            console.log('⏰ THIRD ANSWER V5: Submitting after audio + 2.5s delay');
            submitAnswer(answer);
            
            // Clear feedback state after submission
            setTimeout(() => {
              console.log('⏰ CLEARING FEEDBACK');
              setSelectedAnswer(null);
              setShowFeedback(false);
              setAnswerIsCorrect(false);
              setCorrectAnswer('');
            }, 100);
          }, 2500); // 2.5-second delay after audio completes
        });
      } else {
        // First or second wrong answer: Play audio but don't wait for completion
        console.log('🔊 WRONG ANSWER V5 (not third): Playing audio without waiting');
        playWrongAnswerSound(); // Fire and forget
        
        // V5: Increased to 3-second delay for first/second wrong answers
        // This gives user more time to see the correct answer
        setTimeout(() => {
          console.log('⏰ SUBMITTING ANSWER TO GAME ENGINE after 3 seconds');
          submitAnswer(answer);
          
          // Clear feedback state after submission
          setTimeout(() => {
            console.log('⏰ CLEARING FEEDBACK');
            setSelectedAnswer(null);
            setShowFeedback(false);
            setAnswerIsCorrect(false);
            setCorrectAnswer('');
          }, 100);
        }, 3000); // V5: Increased from 2 seconds to 3 seconds
      }
    } else {
      // Correct answer: Submit immediately
      console.log('✅ CORRECT ANSWER: Submitting immediately');
      submitAnswer(answer);
      
      // Clear feedback state after submission
      setTimeout(() => {
        console.log('⏰ CLEARING FEEDBACK');
        setSelectedAnswer(null);
        setShowFeedback(false);
        setAnswerIsCorrect(false);
        setCorrectAnswer('');
      }, 100);
    }
    
    console.log('🚨 FEEDBACK STATE SET:', {
      selected: answer,
      correct: isCorrect,
      correctAnswer: currentQuestion.correctAnswer,
      showFeedback: !isCorrect,
      willBeThirdError
    });
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
