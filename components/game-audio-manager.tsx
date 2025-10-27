
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
 * V4 COMPREHENSIVE IPHONE FIX:
 * - Audio file now cached in Service Worker (no 404s!)
 * - Uses direct Audio element in DOM with callback-based approach
 * - FORCE RESTARTS audio on each play (no "already playing" blocking)
 * - Enhanced defensive checks and fallback mechanisms
 * - Better error handling and logging for iPhone debugging
 */
export default function GameAudioManager({ onAudioReady }: GameAudioManagerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(false);

  // Initialize audio once on mount
  useEffect(() => {
    try {
      console.log('🔊 AUDIO MANAGER V11: Initializing with PERSISTENT audio element');
      console.log('🔊 AUDIO MANAGER V11: Audio file path: /audio/trivia_wrong_answer_ding.mp3');
      console.log('🔊 AUDIO MANAGER V11: Service Worker should have cached this file (v16)');
      
      // V11: Store audio element in GLOBAL SCOPE so it survives component unmount!
      if (!(window as any).__globalAudioElement) {
        console.log('🔊 AUDIO MANAGER V11: Creating NEW global audio element');
        (window as any).__globalAudioElement = new Audio('/audio/trivia_wrong_answer_ding.mp3');
      } else {
        console.log('🔊 AUDIO MANAGER V11: Reusing EXISTING global audio element');
      }
      
      // Use the global audio element
      audioRef.current = (window as any).__globalAudioElement;
      
      if (audioRef.current) {
        audioRef.current.volume = 1.0; // Full volume
        audioRef.current.preload = 'auto'; // Pre-load for instant playback
        
        // Add error handler to detect loading issues
        audioRef.current.onerror = (error) => {
          console.error('❌ AUDIO MANAGER V11: Audio file failed to load!', error);
          console.error('❌ This might be a 404 or CORS issue - check network tab');
        };
        
        audioRef.current.onloadeddata = () => {
          console.log('✅ AUDIO MANAGER V11: Audio file loaded successfully');
        };
        
        // Force load the audio immediately
        audioRef.current.load();
      }
      
      // iOS Safari requires user interaction to unlock audio
      const unlockAudio = () => {
        if (!audioUnlockedRef.current && audioRef.current) {
          console.log('🔊 AUDIO MANAGER V11: Unlocking audio on first interaction');
          
          audioRef.current.play().then(() => {
            audioRef.current!.pause();
            audioRef.current!.currentTime = 0;
            audioUnlockedRef.current = true;
            console.log('✅ AUDIO MANAGER V11: Audio unlocked and ready');
            if (onAudioReady) onAudioReady();
          }).catch((error) => {
            console.warn('⚠️ AUDIO MANAGER V11: Audio unlock failed, will retry', error);
          });
        }
      };
      
      // Listen for first user interaction
      document.addEventListener('touchstart', unlockAudio, { once: true });
      document.addEventListener('click', unlockAudio, { once: true });
      
      // Expose global play function with CALLBACK instead of promise
      // This ensures we can block UI updates until audio completes
      (window as any).__playWrongAnswerSound = (onComplete?: () => void) => {
        console.log('🎵 GLOBAL PLAY FUNCTION V4: Called', {
          hasAudioRef: !!audioRef.current,
          isPlaying: isPlayingRef.current,
          audioUnlocked: audioUnlockedRef.current,
          hasCallback: !!onComplete
        });
        
        if (audioRef.current) {
          try {
            console.log('🔊 AUDIO MANAGER V11: Playing wrong answer sound (force restart)');
            
            // CRITICAL FIX: Force stop any existing playback and reset
            // This prevents the "already playing" issue on 3rd beep
            try {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
              console.log('✅ AUDIO MANAGER V11: Force stopped existing playback');
            } catch (e) {
              console.warn('⚠️ Force stop failed:', e);
            }
            
            isPlayingRef.current = true;
            
            // Set up ended event listener
            const handleEnded = () => {
              console.log('✅ AUDIO MANAGER V11: Sound finished playing');
              isPlayingRef.current = false;
              audioRef.current?.removeEventListener('ended', handleEnded);
              audioRef.current?.removeEventListener('error', handleError);
              
              // Call completion callback
              if (onComplete) {
                console.log('📞 AUDIO MANAGER V11: Calling completion callback');
                onComplete();
              }
            };
            
            // Set up error handler
            const handleError = (error: any) => {
              console.error('❌ AUDIO MANAGER V11: Playback error', error);
              isPlayingRef.current = false;
              audioRef.current?.removeEventListener('ended', handleEnded);
              audioRef.current?.removeEventListener('error', handleError);
              
              // Call completion callback even on error
              if (onComplete) {
                console.log('📞 AUDIO MANAGER V11: Calling completion callback (after error)');
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
                  console.log('✅ AUDIO MANAGER V11: Playback started successfully');
                })
                .catch((error) => {
                  console.error('❌ AUDIO MANAGER V11: Play promise rejected', error);
                  handleError(error);
                });
            }
          } catch (error) {
            console.error('❌ AUDIO MANAGER V11: Exception during playback', error);
            isPlayingRef.current = false;
            if (onComplete) onComplete();
          }
        } else {
          console.warn('⚠️ AUDIO MANAGER V11: Cannot play - audio ref is null');
          if (onComplete) onComplete();
        }
      };
      
      console.log('✅ AUDIO MANAGER V11: Global audio manager initialized');
      console.log('✅ AUDIO MANAGER V11: window.__playWrongAnswerSound is now available');
      console.log('✅ AUDIO MANAGER V11: Verification:', typeof (window as any).__playWrongAnswerSound);
      
      // Verify the function is actually accessible
      setTimeout(() => {
        if (typeof (window as any).__playWrongAnswerSound === 'function') {
          console.log('✅ VERIFICATION V11: Global audio function confirmed accessible');
        } else {
          console.error('❌ VERIFICATION V11: Global audio function NOT accessible!');
        }
      }, 100);
      
      return () => {
        // V10 FIX: NEVER remove the global audio function!
        // iPhone needs this function to persist across ALL component lifecycles
        console.log('🧹 AUDIO MANAGER V11: Cleanup called - keeping global function alive');
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('click', unlockAudio);
        
        // V10: DO NOT delete the global function!
        // delete (window as any).__playWrongAnswerSound;  // ← REMOVED!
        
        // V10: DO NOT destroy the audio element!
        // Keep it alive for future plays
        // if (audioRef.current) {
        //   audioRef.current.pause();
        //   audioRef.current = null;
        // }
        
        console.log('✅ AUDIO MANAGER V11: Global function preserved across unmount');
      };
    } catch (error) {
      console.error('❌ AUDIO MANAGER V11: Initialization failed', error);
    }
  }, []); // V10: Empty array - only run once, never cleanup function

  // This component renders nothing, it just manages audio
  return null;
}
