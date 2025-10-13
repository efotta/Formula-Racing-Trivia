
'use client';

import { useState } from 'react';
import HomeScreen from '@/components/home-screen';
import GameScreen from '@/components/game-screen';
import Leaderboard from '@/components/leaderboard';
import PenaltyRules from '@/components/penalty-rules';
import FeedbackForm from '@/components/feedback-form';
import EnhancedAdminPanel from '@/components/enhanced-admin-panel';
import { useAuth } from '@/components/providers';

type View = 'home' | 'game' | 'leaderboard';

export default function Home() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<View>('home');
  const [gameLevel, setGameLevel] = useState<number | null>(null);
  const [showPenaltyRules, setShowPenaltyRules] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [shouldShowLevelSelect, setShouldShowLevelSelect] = useState(false);

  const handleStartGame = (level: number) => {
    setGameLevel(level);
    setCurrentView('game');
    setShouldShowLevelSelect(false); // Clear the flag when starting a game
  };

  const handleReturnHome = () => {
    setCurrentView('home');
    setGameLevel(null);
  };

  const handleReturnToLevelSelection = () => {
    setCurrentView('home');
    setGameLevel(null);
    setShouldShowLevelSelect(true);
  };

  const handleShowLeaderboard = () => {
    setCurrentView('leaderboard');
  };

  const handleShowPenaltyRules = () => {
    setShowPenaltyRules(true);
  };

  const handleShowFeedback = () => {
    setShowFeedback(true);
  };

  const handleShowAdmin = () => {
    setShowAdmin(true);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return (
          <HomeScreen
            onStartGame={handleStartGame}
            onShowLeaderboard={handleShowLeaderboard}
            onShowPenaltyRules={handleShowPenaltyRules}
            onShowFeedback={handleShowFeedback}
            onShowAdmin={handleShowAdmin}
            shouldShowLevelSelect={shouldShowLevelSelect}
            onLevelSelectClose={() => setShouldShowLevelSelect(false)}
          />
        );
      case 'game':
        return gameLevel ? (
          <GameScreen
            level={gameLevel}
            onReturnHome={handleReturnToLevelSelection}
          />
        ) : (
          <HomeScreen
            onStartGame={handleStartGame}
            onShowLeaderboard={handleShowLeaderboard}
            onShowPenaltyRules={handleShowPenaltyRules}
            onShowFeedback={handleShowFeedback}
            onShowAdmin={handleShowAdmin}
            shouldShowLevelSelect={shouldShowLevelSelect}
            onLevelSelectClose={() => setShouldShowLevelSelect(false)}
          />
        );
      case 'leaderboard':
        return <Leaderboard />;
      default:
        return (
          <HomeScreen
            onStartGame={handleStartGame}
            onShowLeaderboard={handleShowLeaderboard}
            onShowPenaltyRules={handleShowPenaltyRules}
            onShowFeedback={handleShowFeedback}
            onShowAdmin={handleShowAdmin}
            shouldShowLevelSelect={shouldShowLevelSelect}
            onLevelSelectClose={() => setShouldShowLevelSelect(false)}
          />
        );
    }
  };

  return (
    <div className="f1-viewport-container bg-gray-900 f1-readable">
      {renderCurrentView()}
      
      {/* Modals */}
      <PenaltyRules
        open={showPenaltyRules}
        onClose={() => setShowPenaltyRules(false)}
      />
      
      <FeedbackForm
        open={showFeedback}
        onClose={() => setShowFeedback(false)}
      />
      
      {user && (
        <EnhancedAdminPanel
          open={showAdmin}
          onClose={() => setShowAdmin(false)}
          currentUsername={user.username}
        />
      )}
    </div>
  );
}
