
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Flag, Trophy, Info, MessageSquare, Settings, User, LogOut, Shield, Share, Download } from 'lucide-react';
import { useGameStore } from '@/lib/game-store';
import { useAuth } from '@/components/providers';
import AuthForms from '@/components/auth/auth-forms';
import UserProfile from '@/components/user-profile';
import InviteFriend from '@/components/invite-friend';


interface HomeScreenProps {
  onStartGame: (level: number) => void;
  onShowLeaderboard: () => void;
  onShowPenaltyRules: () => void;
  onShowFeedback: () => void;
  onShowAdmin: () => void;
  shouldShowLevelSelect?: boolean;
  onLevelSelectClose?: () => void;
}

export default function HomeScreen({ 
  onStartGame, 
  onShowLeaderboard, 
  onShowPenaltyRules, 
  onShowFeedback,
  onShowAdmin,
  shouldShowLevelSelect = false,
  onLevelSelectClose
}: HomeScreenProps) {
  const { user, setUser, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showInviteFriend, setShowInviteFriend] = useState(false);
  const [showPWAInstructions, setShowPWAInstructions] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [progressLoadingKey, setProgressLoadingKey] = useState(0); // Force refresh key
  const { completedLevels, perfectLevels, setUsername, setUserId, setCompletedLevels, setPerfectLevels, getAccessibleLevels, isLevelAccessible } = useGameStore();

  // Load user's completed levels from database when user logs in
  const loadUserCompletedLevels = async (forceRefresh = false) => {
    if (user?.id) {
      try {
        if (forceRefresh) {
          setIsLoadingProgress(true);
        }
        
        console.log('🔄 SYNC: Loading completed levels for user:', user.username, forceRefresh ? '(forced refresh)' : '');
        const response = await fetch(`/api/users?userId=${user.id}&t=${Date.now()}`); // Cache buster
        if (response.ok) {
          const userData = await response.json();
          const userCompletedLevels = userData.stats?.completedLevels || [];
          const userPerfectLevels = userData.stats?.perfectLevels || [];
          
          console.log('📡 SYNC: API Response - Completed levels:', userCompletedLevels);
          console.log('📡 SYNC: API Response - Perfect levels:', userPerfectLevels);
          
          // Update game store with fresh data - use direct store access for immediate update
          const store = useGameStore.getState();
          store.setUsername(user.username);
          store.setUserId(user.id);
          store.setCompletedLevels(userCompletedLevels);
          store.setPerfectLevels(userPerfectLevels);
          
          // Wait for multiple render cycles to ensure all state is propagated
          await new Promise(resolve => setTimeout(resolve, 100));
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Verify state synchronization with polling approach
          let retryCount = 0;
          const maxRetries = 5;
          let storeUpdated = false;
          
          while (!storeUpdated && retryCount < maxRetries) {
            const currentStore = useGameStore.getState();
            storeUpdated = 
              JSON.stringify(currentStore.completedLevels) === JSON.stringify(userCompletedLevels) &&
              JSON.stringify(currentStore.perfectLevels) === JSON.stringify(userPerfectLevels);
            
            if (!storeUpdated) {
              console.warn(`⚠️ SYNC: Store state not updated (attempt ${retryCount + 1}/${maxRetries}), retrying...`);
              // Force update again
              currentStore.setCompletedLevels(userCompletedLevels);
              currentStore.setPerfectLevels(userPerfectLevels);
              await new Promise(resolve => setTimeout(resolve, 50));
              retryCount++;
            }
          }
          
          if (!storeUpdated) {
            console.error('❌ SYNC: Failed to synchronize store state after multiple retries');
          } else {
            console.log('✅ SYNC: Store state successfully synchronized');
          }
          
          // Force a re-render key update to refresh level selection UI
          if (forceRefresh) {
            setProgressLoadingKey(prev => prev + 1);
          }
          
          // Calculate accessible levels for debugging - use fresh store state
          const finalStore = useGameStore.getState();
          const accessibleLevels = finalStore.getAccessibleLevels();
          console.log('🔓 SYNC: Accessible levels after update:', accessibleLevels);
          
          // Detailed breakdown for debugging
          console.log('🔍 SYNC: Level accessibility breakdown:');
          for (let level = 1; level <= 5; level++) {
            const isAccessible = finalStore.isLevelAccessible(level);
            const isCompleted = userCompletedLevels.includes(level);
            const isPerfect = userPerfectLevels.includes(level);
            console.log(`  Level ${level}: accessible=${isAccessible}, completed=${isCompleted}, perfect=${isPerfect}`);
          }
          
          return { 
            success: true,
            userCompletedLevels, 
            userPerfectLevels, 
            accessibleLevels,
            storeUpdated
          };
          
        } else {
          console.error('❌ SYNC: Failed to load user data, status:', response.status);
          // If we can't load data, ensure levels are empty for new users
          setCompletedLevels([]);
          setPerfectLevels([]);
          return { 
            success: false, 
            userCompletedLevels: [], 
            userPerfectLevels: [], 
            accessibleLevels: [1] 
          };
        }
      } catch (error) {
        console.error('❌ SYNC: Error loading user completed levels:', error);
        // If there's an error, ensure levels are empty for new users
        setCompletedLevels([]);
        setPerfectLevels([]);
        return { 
          success: false, 
          userCompletedLevels: [], 
          userPerfectLevels: [], 
          accessibleLevels: [1] 
        };
      } finally {
        if (forceRefresh) {
          setIsLoadingProgress(false);
        }
      }
    } else {
      console.log('🚫 SYNC: No user logged in, resetting levels');
      // No user logged in, reset levels
      setCompletedLevels([]);
      setPerfectLevels([]);
      return { 
        success: true, 
        userCompletedLevels: [], 
        userPerfectLevels: [], 
        accessibleLevels: [1] 
      };
    }
  };

  useEffect(() => {
    loadUserCompletedLevels();
  }, [user?.id, setCompletedLevels, setPerfectLevels, setUsername, setUserId]);

  // Monitor store state changes for debugging
  useEffect(() => {
    console.log('🔄 STORE: Store state changed:');
    console.log('  Perfect levels:', perfectLevels);
    console.log('  Completed levels:', completedLevels);
    console.log('  Accessible levels:', getAccessibleLevels());
  }, [perfectLevels, completedLevels, getAccessibleLevels]);

  // Automatically open level selection modal when shouldShowLevelSelect is true
  useEffect(() => {
    if (shouldShowLevelSelect && user) {
      console.log('🎯 MODAL: shouldShowLevelSelect triggered, forcing refresh and opening modal...');
      openLevelSelectionWithRefresh();
    }
  }, [shouldShowLevelSelect, user]);

  // Comprehensive scroll prevention for iOS devices
  useEffect(() => {
    if (showLevelSelect) {
      // Store current scroll position
      const scrollY = window.scrollY;
      
      // Apply scroll prevention classes
      document.body.classList.add('f1-no-scroll');
      document.documentElement.classList.add('f1-no-scroll');
      
      // Additional iOS-specific prevention
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.height = '100vh';
      document.body.style.overflow = 'hidden';
      
      // Prevent touch events on body
      const preventTouchMove = (e: TouchEvent) => {
        // Allow touch events on the modal content only
        const target = e.target as Element;
        if (!target.closest('[role="dialog"]')) {
          e.preventDefault();
        }
      };
      
      document.addEventListener('touchmove', preventTouchMove, { passive: false });
      
      return () => {
        // Remove classes
        document.body.classList.remove('f1-no-scroll');
        document.documentElement.classList.remove('f1-no-scroll');
        
        // Restore body styles
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.overflow = '';
        
        // Remove event listener
        document.removeEventListener('touchmove', preventTouchMove);
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [showLevelSelect]);

  // Helper function to open level selection with guaranteed fresh data
  const openLevelSelectionWithRefresh = async () => {
    try {
      console.log('🎯 REFRESH: Starting forced refresh before opening level selection...');
      const syncResult = await loadUserCompletedLevels(true); // Force refresh with loading state
      
      if (syncResult.success && syncResult.storeUpdated) {
        console.log('🎯 REFRESH: User progress refreshed and store updated successfully');
        console.log('  Accessible levels:', syncResult.accessibleLevels);
        
        // Final verification that store state is properly accessible
        const finalStore = useGameStore.getState();
        const finalAccessibleLevels = finalStore.getAccessibleLevels();
        console.log('🎯 REFRESH: Final store verification:', {
          completedLevels: finalStore.completedLevels,
          perfectLevels: finalStore.perfectLevels,
          accessibleLevels: finalAccessibleLevels
        });
        
        // Only open modal if we have confidence the data is properly loaded
        if (finalAccessibleLevels.length > 0) {
          console.log('✅ REFRESH: Opening level selection modal with confirmed synchronized data');
          setShowLevelSelect(true);
        } else {
          console.warn('⚠️ REFRESH: No accessible levels found, opening with default state');
          setShowLevelSelect(true);
        }
      } else {
        console.log('🎯 REFRESH: Sync failed or store not updated, opening modal with current state');
        console.log(`  Success: ${syncResult?.success}, Store Updated: ${syncResult?.storeUpdated}`);
        
        // Even if sync fails, still open the modal but with current store state
        setShowLevelSelect(true);
      }
    } catch (error) {
      console.error('🎯 REFRESH: Error during forced refresh:', error);
      // Still open modal even if refresh fails
      setShowLevelSelect(true);
    }
  };

  const levels = [
    { number: 1, name: 'Rookie', description: 'Basic Formula knowledge', color: 'bg-green-500' },
    { number: 2, name: 'Midfielder', description: 'Intermediate questions', color: 'bg-blue-500' },
    { number: 3, name: 'Front Runner', description: 'Advanced with penalties', color: 'bg-yellow-500' },
    { number: 4, name: 'World Champion', description: 'Expert level + grid penalties', color: 'bg-orange-500' },
    { number: 5, name: 'Formula Legend', description: 'Master level + sponsor penalties', color: 'bg-red-500' }
  ];

  const handleStartEngines = async () => {
    if (user) {
      console.log('🚀 START: Start Engines clicked, opening level selection with refresh...');
      await openLevelSelectionWithRefresh();
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    console.log('🔐 AUTH: Authentication successful, opening level selection with refresh...');
    
    // Wait a brief moment for user context to update, then load progress and open modal
    setTimeout(async () => {
      await openLevelSelectionWithRefresh();
    }, 100);
  };

  const handleLevelSelect = (level: number) => {
    console.log(`🎮 SELECT: Level ${level} selected`);
    
    // Use store state directly for most reliable check
    const storeState = useGameStore.getState();
    console.log(`🎮 SELECT: Store state check:`, {
      perfectLevels: storeState.perfectLevels,
      completedLevels: storeState.completedLevels,
      accessibleLevels: storeState.getAccessibleLevels(),
      isLevelAccessible: storeState.isLevelAccessible(level)
    });
    
    // Check if level is accessible before allowing selection
    if (!storeState.isLevelAccessible(level)) {
      console.log(`🚫 SELECT: Level ${level} is not accessible, preventing selection`);
      return; // Prevent selection of locked levels
    }
    
    console.log(`✅ SELECT: Level ${level} is accessible, starting game`);
    setSelectedLevel(level);
    setShowLevelSelect(false);
    onStartGame(level);
  };

  const handleSignOut = () => {
    setUser(null);
  };

  const handlePWAInstall = () => {
    setShowPWAInstructions(true);
  };

  return (
    <div className="f1-viewport-container f1-ipad-home-container bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <div className="relative flex-1 f1-ipad-hero-section flex items-center justify-center pb-8 sm:pb-12">
        {/* Formula Trivia Background Image */}
        <div className="absolute inset-0 bg-gray-900">
          <div className="relative w-full h-full">
            <Image
              src="/formula-trivia-launch.jpg"
              alt="Formula Racing Car"
              fill
              priority
              quality={90}
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
        </div>
        {/* Dark overlay for text readability */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/80"
        />
        
        {/* User Profile Section - iPad optimized positioning */}
        {user && (
          <div className="absolute top-4 left-2 right-2 sm:top-4 sm:left-auto sm:right-4 f1-ipad-user-profile z-20 safe-area-inset-top">
            {/* Mobile: More compact layout */}
            <div className="sm:hidden bg-black/60 backdrop-blur-sm rounded-lg p-2 border border-white/20">
              <div className="text-white text-xs text-center mb-1.5 truncate leading-tight">
                Welcome, <span className="font-semibold">{user.username}</span>
              </div>
              <div className="flex gap-1.5">
                <Button
                  onClick={() => setShowUserProfile(true)}
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-white/70 text-white hover:bg-white hover:text-black text-xs flex-1 h-7 px-2"
                >
                  <User className="w-3 h-3 mr-1" />
                  Profile
                </Button>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-red-400/70 text-red-400 hover:bg-red-400 hover:text-white text-xs flex-1 h-7 px-2"
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  Sign Out
                </Button>
              </div>
            </div>
            
            {/* Desktop & iPad: Horizontal layout */}
            <div className="hidden sm:flex items-center gap-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
              <div className="text-white text-sm">
                Welcome, <span className="font-semibold">{user.username}</span>
              </div>
              <Button
                onClick={() => setShowUserProfile(true)}
                variant="outline"
                size="sm"
                className="bg-transparent border-white text-white hover:bg-white hover:text-black"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="bg-transparent border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
        
        {/* Hero Content - iPad optimized */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 f1-ipad-hero-content">
          <div className="pt-20 sm:pt-8">
            <Flag className="w-10 h-10 sm:w-16 sm:h-16 text-blue-400 mx-auto mb-3 sm:mb-4" />
            <h1 className="f1-hero-title f1-ipad-title text-white mb-3 sm:mb-4 f1-readable text-center">
              Formula Trivia Challenge
            </h1>
            <div className="f1-hero-subtitle f1-ipad-subtitle text-gray-300 mb-4 sm:mb-6 f1-readable text-center max-w-4xl mx-auto">
              {user 
                ? (
                    <>
                      <div>Ready to test your Grand Prix racing knowledge?</div>
                      <div>Choose your level and start racing!</div>
                    </>
                  )
                : "Prove your knowledge and race to the top of the leaderboard"
              }
            </div>
          </div>
          
          <Button
            onClick={handleStartEngines}
            size="lg"
            className="f1-button-responsive f1-ipad-button bg-blue-600 hover:bg-blue-700 text-white f1-button-text font-semibold mb-4 sm:mb-6 transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading 
              ? 'Loading...' 
              : user 
                ? 'Start Racing' 
                : 'Start Your Engines'
            }
          </Button>
          
          <p className="f1-hero-description f1-ipad-description text-white f1-readable text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            If you have questions or comments about Formula Trivia, email formula_trivia@yahoo.com
          </p>
        </div>
      </div>

      {/* Navigation - iPad optimized */}
      <div className="bg-gray-900/90 f1-ipad-navigation backdrop-blur-sm border-t border-gray-800 sticky bottom-0">
        <div className="max-w-6xl mx-auto px-4 py-4 f1-nav-mobile-padding sm:py-4">
          {/* Mobile: Clean 3x2 Grid Layout */}
          <div className="sm:hidden lg:hidden grid grid-cols-2 gap-2">
            {/* Row 1 */}
            <Button
              variant="outline"
              onClick={onShowLeaderboard}
              className="flex items-center gap-2 f1-nav-text px-3 py-2 justify-center min-h-[2.5rem]"
            >
              <Trophy className="w-4 h-4" />
              <span>Leaderboard</span>
            </Button>
            <Button
              variant="outline"
              onClick={onShowPenaltyRules}
              className="flex items-center gap-2 f1-nav-text px-3 py-2 justify-center min-h-[2.5rem]"
            >
              <Info className="w-4 h-4" />
              <span>Rules</span>
            </Button>
            
            {/* Row 2 */}
            <Button
              variant="outline"
              onClick={() => setShowInviteFriend(true)}
              className="flex items-center gap-2 f1-nav-text px-3 py-2 justify-center min-h-[2.5rem]"
            >
              <Share className="w-4 h-4" />
              <span>Invite Friend</span>
            </Button>
            <Button
              variant="outline"
              onClick={onShowFeedback}
              className="flex items-center gap-2 f1-nav-text px-3 py-2 justify-center min-h-[2.5rem]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Feedback</span>
            </Button>
            
            {/* Row 3 */}
            <Button
              onClick={handlePWAInstall}
              className="flex items-center gap-2 f1-nav-text px-3 py-2 justify-center min-h-[2.5rem] bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="w-4 h-4" />
              <span>Download App</span>
            </Button>
            <Link href="/privacy-policy" className="block">
              <Button
                variant="outline"
                className="flex items-center gap-2 f1-nav-text px-3 py-2 justify-center w-full min-h-[2.5rem]"
              >
                <Shield className="w-4 h-4" />
                <span>Privacy</span>
              </Button>
            </Link>
            
            {/* Row 4 - Admin Button (if user is admin) */}
            {user?.isAdmin && (
              <Button
                variant="outline"
                onClick={onShowAdmin}
                className="col-span-2 flex items-center gap-2 f1-nav-text px-3 py-2 justify-center min-h-[2.5rem]"
              >
                <Settings className="w-4 h-4" />
                <span>Admin Panel</span>
              </Button>
            )}
          </div>
          
          {/* iPad: Single Row Layout with White Buttons */}
          <div className="hidden sm:flex lg:hidden f1-ipad-nav-row justify-center gap-3 flex-wrap max-w-4xl mx-auto">
            <Button
              variant="outline"
              onClick={onShowLeaderboard}
              className="f1-ipad-nav-button-white flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              <span>Leaderboard</span>
            </Button>
            <Button
              variant="outline"
              onClick={onShowPenaltyRules}
              className="f1-ipad-nav-button-white flex items-center gap-2"
            >
              <Info className="w-4 h-4" />
              <span>Rules</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowInviteFriend(true)}
              className="f1-ipad-nav-button-white flex items-center gap-2"
            >
              <Share className="w-4 h-4" />
              <span>Invite</span>
            </Button>
            <Button
              variant="outline"
              onClick={onShowFeedback}
              className="f1-ipad-nav-button-white flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Feedback</span>
            </Button>
            <Button
              onClick={handlePWAInstall}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              <Download className="w-4 h-4" />
              <span>Download App</span>
            </Button>
            <Link href="/privacy-policy">
              <Button
                variant="outline"
                className="f1-ipad-nav-button-white flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>Privacy</span>
              </Button>
            </Link>
            {user?.isAdmin && (
              <Button
                variant="outline"
                onClick={onShowAdmin}
                className="f1-ipad-nav-button-white flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                <span>Admin</span>
              </Button>
            )}
          </div>
          
          {/* Desktop: Single Row Layout */}
          <div className="hidden lg:flex justify-center gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={onShowLeaderboard}
              className="flex items-center gap-2 f1-nav-text px-4 py-2 min-h-[2.5rem]"
            >
              <Trophy className="w-4 h-4" />
              <span>Leaderboard</span>
            </Button>
            <Button
              variant="outline"
              onClick={onShowPenaltyRules}
              className="flex items-center gap-2 f1-nav-text px-4 py-2 min-h-[2.5rem]"
            >
              <Info className="w-4 h-4" />
              <span>Penalty Rules</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowInviteFriend(true)}
              className="flex items-center gap-2 f1-nav-text px-4 py-2 min-h-[2.5rem]"
            >
              <Share className="w-4 h-4" />
              <span>Invite Friend</span>
            </Button>
            <Button
              variant="outline"
              onClick={onShowFeedback}
              className="flex items-center gap-2 f1-nav-text px-4 py-2 min-h-[2.5rem]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Feedback</span>
            </Button>
            <Button
              onClick={handlePWAInstall}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              <Download className="w-4 h-4" />
              <span>Download App</span>
            </Button>
            <Link href="/privacy-policy">
              <Button
                variant="outline"
                className="flex items-center gap-2 f1-nav-text px-4 py-2 min-h-[2.5rem]"
              >
                <Shield className="w-4 h-4" />
                <span>Privacy Policy</span>
              </Button>
            </Link>
            {user?.isAdmin && (
              <Button
                variant="outline"
                onClick={onShowAdmin}
                className="flex items-center gap-2 f1-nav-text px-4 py-2 min-h-[2.5rem]"
              >
                <Settings className="w-4 h-4" />
                <span>Admin</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      <AuthForms
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* User Profile Modal */}
      <UserProfile
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
      />

      {/* Invite Friend Modal */}
      <InviteFriend
        isOpen={showInviteFriend}
        onClose={() => setShowInviteFriend(false)}
      />

      {/* PWA Installation Instructions Modal */}
      {showPWAInstructions && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Install Formula Racing Trivia
              </h3>
              <button
                onClick={() => setShowPWAInstructions(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* iOS Instructions */}
            {typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && (() => {
              const isSafari = /Safari/.test(navigator.userAgent) && !/CriOS|Chrome/.test(navigator.userAgent);
              const isChrome = /CriOS|Chrome/.test(navigator.userAgent);
              
              return (
                <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  {isSafari ? (
                    <>
                      <p className="font-semibold">To install on iOS (Safari):</p>
                      <ol className="list-decimal list-inside space-y-2 pl-2">
                        <li>Tap the <strong>Share</strong> button <svg className="inline w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg> at the bottom of Safari</li>
                        <li>In the menu that appears, <strong>scroll down through the options</strong></li>
                        <li>Tap <strong>"Add to Home Screen"</strong> <svg className="inline w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg></li>
                        <li>Tap <strong>"Add"</strong> in the top right corner to confirm</li>
                      </ol>
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-3">
                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">💡 Tip:</p>
                        <p className="text-xs text-blue-800 dark:text-blue-200">
                          If you don't see "Add to Home Screen", make sure you're in <strong>Safari</strong> browser (not Chrome) and scroll down past the app suggestions.
                        </p>
                      </div>
                    </>
                  ) : isChrome ? (
                    <>
                      <p className="font-semibold">Chrome Browser Detected:</p>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                        <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-100 mb-2">⚠️ Installation Not Available in Chrome</p>
                        <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-3">
                          To install Formula Racing Trivia as an app on your iPhone, you need to use <strong>Safari</strong> browser.
                        </p>
                        <p className="text-xs text-yellow-800 dark:text-yellow-200 font-semibold mb-1">
                          How to switch to Safari:
                        </p>
                        <ol className="list-decimal list-inside space-y-1 pl-2 text-xs text-yellow-800 dark:text-yellow-200">
                          <li>Copy this page's URL (long press the address bar)</li>
                          <li>Open the <strong>Safari</strong> app on your iPhone</li>
                          <li>Paste the URL and go to the page</li>
                          <li>Then tap "Download App" again for instructions</li>
                        </ol>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold">To install on iOS:</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        Open this page in <strong>Safari</strong> browser, then:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 pl-2">
                        <li>Tap the <strong>Share</strong> button at the bottom</li>
                        <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                        <li>Tap <strong>"Add"</strong> to confirm</li>
                      </ol>
                    </>
                  )}
                </div>
              );
            })()}

            {/* Android Instructions */}
            {typeof window !== 'undefined' && /Android/.test(navigator.userAgent) && (
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <p className="font-semibold">To install on Android:</p>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                  <li>Tap the <strong>⋮</strong> menu in Chrome</li>
                  <li>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></li>
                  <li>Tap <strong>"Install"</strong> or <strong>"Add"</strong></li>
                </ol>
              </div>
            )}

            {/* Desktop Instructions */}
            {typeof window !== 'undefined' && !/iPad|iPhone|iPod|Android/.test(navigator.userAgent) && (
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <p className="font-semibold">Want quick access on Desktop?</p>
                <p className="mt-3">
                  Press <strong>Command+D</strong> (Mac) or <strong>Ctrl+D</strong> (Windows) to bookmark this page.
                </p>
                <p className="mt-2">
                  Add it to your Bookmarks Bar so you can return anytime!
                </p>
              </div>
            )}

            <button
              onClick={() => setShowPWAInstructions(false)}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Level Select Modal */}
      <Dialog open={showLevelSelect} onOpenChange={(open) => {
        setShowLevelSelect(open);
        if (!open && onLevelSelectClose) {
          onLevelSelectClose();
        }
      }}>
        <DialogContent className="sm:max-w-2xl f1-level-select-modal">
          <DialogHeader className="flex-shrink-0 pb-1">
            <DialogTitle className="f1-modal-title text-center text-base sm:text-lg">Select Your Level</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col overflow-hidden">
            {/* Header Info Section - Extra Compact for Mobile */}
            <div className="flex-shrink-0 mb-1.5">
              <p className="f1-modal-text text-gray-600 mb-1.5 f1-readable text-center text-xs sm:text-sm">
                Progress through levels by completing them perfectly.
              </p>
              
              {/* Progress Status and Refresh Button */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-1.5">
                <div className="f1-nav-text text-gray-500 text-center sm:text-left text-xs">
                  Progress: {completedLevels.length} done, {perfectLevels.length} perfect
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openLevelSelectionWithRefresh()}
                  disabled={isLoadingProgress}
                  className="f1-nav-text flex-shrink-0 h-6 px-2 text-xs"
                >
                  {isLoadingProgress ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
            </div>
            
            {/* Loading indicator while refreshing progress */}
            {isLoadingProgress && (
              <div className="flex items-center justify-center py-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="f1-modal-text text-gray-600">Refreshing...</span>
                </div>
              </div>
            )}
            
            {/* Level selection grid - OPTIMIZED COMPACT LAYOUT */}
            <div className="f1-level-grid-container mb-1.5">
              <div key={`levels-${progressLoadingKey}-${user?.id}-${JSON.stringify(perfectLevels)}-${JSON.stringify(completedLevels)}`} className={`grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-1.5 px-0.5 ${isLoadingProgress ? 'opacity-50' : ''}`}>
                {levels.map((level) => {
                  // Use store state directly for most reliable data with fresh call each time
                  const storeState = useGameStore.getState();
                  const isAccessible = storeState.isLevelAccessible(level.number);
                  const isPerfect = storeState.perfectLevels.includes(level.number);
                  const isCompleted = storeState.completedLevels.includes(level.number);
                  
                  // Debug logging for level accessibility (only when not loading)
                  if (!isLoadingProgress) {
                    console.log(`🎯 RENDER: Level ${level.number} - Accessible: ${isAccessible}, Perfect: ${isPerfect}, Completed: ${isCompleted}`);
                    console.log(`🎯 RENDER: Store perfectLevels:`, storeState.perfectLevels);
                    console.log(`🎯 RENDER: Store completedLevels:`, storeState.completedLevels);
                    console.log(`🎯 RENDER: Store accessibleLevels:`, storeState.getAccessibleLevels());
                  }
                  
                  return (
                    <Button
                      key={`level-${level.number}-${progressLoadingKey}-${isAccessible}-${isPerfect}-${isCompleted}`}
                      variant="outline"
                      onClick={() => handleLevelSelect(level.number)}
                      disabled={!isAccessible || isLoadingProgress}
                      className={`h-auto text-left justify-start relative py-1 px-2 transition-all duration-200 ${
                        !isAccessible 
                          ? 'opacity-50 cursor-not-allowed bg-gray-100 hover:bg-gray-100' 
                          : 'hover:scale-[1.01] hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className={`w-6 h-6 ${
                          isAccessible ? level.color : 'bg-gray-400'
                        } rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {isAccessible ? level.number : '🔒'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold text-xs ${!isAccessible ? 'text-gray-400' : ''} f1-readable leading-tight`}>
                            {level.name}
                          </div>
                          <div className={`text-xs ${!isAccessible ? 'text-gray-400' : 'text-gray-600'} f1-readable leading-tight ${!isAccessible ? 'mb-0' : 'mb-0.5'}`}>
                            {isAccessible ? level.description : 'Complete previous levels to unlock'}
                          </div>
                          
                          {/* Status indicators - MORE COMPACT */}
                          {isAccessible && (
                            <div className="flex gap-1 text-xs">
                              {isCompleted && (
                                <span className="text-green-600 font-medium text-xs">✓</span>
                              )}
                              {isPerfect && (
                                <span className="text-yellow-600 font-medium text-xs">⭐</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
            
            {/* Return to Home Button - Fixed at Bottom */}
            <div className="flex-shrink-0 border-t border-gray-200 pt-1.5 mt-1.5">
              <Button
                onClick={() => {
                  setShowLevelSelect(false);
                  if (onLevelSelectClose) {
                    onLevelSelectClose();
                  }
                }}
                disabled={isLoadingProgress}
                className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm h-8 sm:h-9 disabled:opacity-50 transition-all duration-200"
              >
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Return to Home
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
