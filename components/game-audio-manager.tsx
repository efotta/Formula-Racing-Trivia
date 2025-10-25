
'use client';

import { useEffect, useRef } from 'react';

interface GameAudioManagerProps {
  onAudioReady?: () => void;
}

/**
 * Global Audio Manager - Persists across all game state changes
 * This component never unmounts, so audio continues playing even when
 * game states change (like transitioning to game-over on 3rd error)
 */
export default function GameAudioManager({ onAudioReady }: GameAudioManagerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef<boolean>(false);

  // Initialize audio once on mount
  useEffect(() => {
    try {
      console.log('🔊 AUDIO MANAGER: Initializing global audio manager');
      
      // Create audio element
      audioRef.current = new Audio('/audio/trivia_wrong_answer_ding.mp3');
      audioRef.current.volume = 1.0; // Full volume
      audioRef.current.preload = 'auto'; // Pre-load for instant playback
      
      // Force load the audio immediately
      audioRef.current.load();
      
      // iOS Safari requires user interaction to unlock audio
      const unlockAudio = () => {
        if (!audioUnlockedRef.current && audioRef.current) {
          console.log('🔊 AUDIO MANAGER: Attempting to unlock audio on iOS');
          
          audioRef.current.play().then(() => {
            audioRef.current!.pause();
            audioRef.current!.currentTime = 0;
            audioUnlockedRef.current = true;
            console.log('✅ AUDIO MANAGER: Audio unlocked and ready');
            if (onAudioReady) onAudioReady();
          }).catch((error) => {
            console.warn('⚠️ AUDIO MANAGER: Audio unlock failed, will retry on next interaction', error);
          });
        }
      };
      
      // Listen for first user interaction
      document.addEventListener('touchstart', unlockAudio, { once: true });
      document.addEventListener('click', unlockAudio, { once: true });
      
      // Expose global play function that returns a promise
      // This promise resolves when the audio has finished playing
      (window as any).__playWrongAnswerSound = (): Promise<void> => {
        return new Promise((resolve, reject) => {
          if (audioRef.current) {
            console.log('🔊 AUDIO MANAGER: Playing wrong answer sound');
            audioRef.current.currentTime = 0;
            
            // Listen for the 'ended' event to know when audio completes
            const handleEnded = () => {
              console.log('✅ AUDIO MANAGER: Audio playback completed');
              audioRef.current?.removeEventListener('ended', handleEnded);
              audioRef.current?.removeEventListener('error', handleError);
              resolve();
            };
            
            const handleError = (error: Event) => {
              console.error('❌ AUDIO MANAGER: Playback error', error);
              audioRef.current?.removeEventListener('ended', handleEnded);
              audioRef.current?.removeEventListener('error', handleError);
              reject(error);
            };
            
            audioRef.current.addEventListener('ended', handleEnded);
            audioRef.current.addEventListener('error', handleError);
            
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log('✅ AUDIO MANAGER: Sound started playing successfully');
                })
                .catch((error) => {
                  console.error('❌ AUDIO MANAGER: Playback start failed', error);
                  audioRef.current?.removeEventListener('ended', handleEnded);
                  audioRef.current?.removeEventListener('error', handleError);
                  reject(error);
                });
            }
          } else {
            console.warn('⚠️ AUDIO MANAGER: Audio ref is null');
            reject(new Error('Audio ref is null'));
          }
        });
      };
      
      console.log('✅ AUDIO MANAGER: Global audio manager initialized');
      
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
      console.error('❌ AUDIO MANAGER: Initialization failed', error);
    }
  }, [onAudioReady]);

  // This component renders nothing, it just manages audio
  return null;
}
