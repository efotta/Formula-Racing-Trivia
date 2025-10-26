
'use client';

import { useEffect, useRef } from 'react';

interface GameAudioManagerProps {
  onAudioReady?: () => void;
}

/**
 * Global Audio Manager - Persists across all game state changes
 * This component never unmounts, so audio continues playing even when
 * game states change (like transitioning to game-over on 3rd error)
 * 
 * V3 IPHONE FIX:
 * - Uses direct Audio element in DOM with callback-based approach
 * - FORCE RESTARTS audio on each play (no "already playing" blocking)
 * - Ensures 3rd beep always plays by stopping any existing playback first
 */
export default function GameAudioManager({ onAudioReady }: GameAudioManagerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(false);

  // Initialize audio once on mount
  useEffect(() => {
    try {
      console.log('🔊 AUDIO MANAGER V3: Initializing with force-restart capability for iPhone');
      
      // Create audio element
      audioRef.current = new Audio('/audio/trivia_wrong_answer_ding.mp3');
      audioRef.current.volume = 1.0; // Full volume
      audioRef.current.preload = 'auto'; // Pre-load for instant playback
      
      // Force load the audio immediately
      audioRef.current.load();
      
      // iOS Safari requires user interaction to unlock audio
      const unlockAudio = () => {
        if (!audioUnlockedRef.current && audioRef.current) {
          console.log('🔊 AUDIO MANAGER V3: Unlocking audio on first interaction');
          
          audioRef.current.play().then(() => {
            audioRef.current!.pause();
            audioRef.current!.currentTime = 0;
            audioUnlockedRef.current = true;
            console.log('✅ AUDIO MANAGER V3: Audio unlocked and ready');
            if (onAudioReady) onAudioReady();
          }).catch((error) => {
            console.warn('⚠️ AUDIO MANAGER V3: Audio unlock failed, will retry', error);
          });
        }
      };
      
      // Listen for first user interaction
      document.addEventListener('touchstart', unlockAudio, { once: true });
      document.addEventListener('click', unlockAudio, { once: true });
      
      // Expose global play function with CALLBACK instead of promise
      // This ensures we can block UI updates until audio completes
      (window as any).__playWrongAnswerSound = (onComplete?: () => void) => {
        if (audioRef.current) {
          try {
            console.log('🔊 AUDIO MANAGER V3: Playing wrong answer sound (force restart)');
            
            // CRITICAL FIX: Force stop any existing playback and reset
            // This prevents the "already playing" issue on 3rd beep
            try {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            } catch (e) {
              console.warn('⚠️ Force stop failed:', e);
            }
            
            isPlayingRef.current = true;
            
            // Set up ended event listener
            const handleEnded = () => {
              console.log('✅ AUDIO MANAGER V3: Sound finished playing');
              isPlayingRef.current = false;
              audioRef.current?.removeEventListener('ended', handleEnded);
              audioRef.current?.removeEventListener('error', handleError);
              
              // Call completion callback
              if (onComplete) {
                console.log('📞 AUDIO MANAGER V3: Calling completion callback');
                onComplete();
              }
            };
            
            // Set up error handler
            const handleError = (error: any) => {
              console.error('❌ AUDIO MANAGER V3: Playback error', error);
              isPlayingRef.current = false;
              audioRef.current?.removeEventListener('ended', handleEnded);
              audioRef.current?.removeEventListener('error', handleError);
              
              // Call completion callback even on error
              if (onComplete) {
                console.log('📞 AUDIO MANAGER V3: Calling completion callback (after error)');
                onComplete();
              }
            };
            
            audioRef.current.addEventListener('ended', handleEnded);
            audioRef.current.addEventListener('error', handleError);
            
            // Play immediately - MUST be synchronous from click event for iOS
            const playPromise = audioRef.current.play();
            
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log('✅ AUDIO MANAGER V3: Playback started successfully');
                })
                .catch((error) => {
                  console.error('❌ AUDIO MANAGER V3: Play promise rejected', error);
                  handleError(error);
                });
            }
          } catch (error) {
            console.error('❌ AUDIO MANAGER V3: Exception during playback', error);
            isPlayingRef.current = false;
            if (onComplete) onComplete();
          }
        } else {
          console.warn('⚠️ AUDIO MANAGER V3: Cannot play - audio ref is null');
          if (onComplete) onComplete();
        }
      };
      
      console.log('✅ AUDIO MANAGER V3: Global audio manager initialized with force-restart capability');
      
      return () => {
        // Cleanup
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('click', unlockAudio);
        delete (window as any).__playWrongAnswerSound;
        
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      };
    } catch (error) {
      console.error('❌ AUDIO MANAGER V2: Initialization failed', error);
    }
  }, [onAudioReady]);

  // This component renders nothing, it just manages audio
  return null;
}
