
'use client';

import { useEffect, useState, useRef } from 'react';
import { Trophy, Medal, Award, Search, Zap, Star, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers';

interface LeaderboardEntry {
  userId: string;
  username: string;
  rank: number;
}

interface PerfectRunEntry extends LeaderboardEntry {
  perfectRunTime: number;
  perfectRunDate: string;
}

interface AllLevelsEntry extends LeaderboardEntry {
  allLevelsTime: number;
  completedDate: string;
}

interface LevelEntry extends LeaderboardEntry {
  level_1_cumulative_time?: number;
  level_2_cumulative_time?: number;
  level_3_cumulative_time?: number;
  level_4_cumulative_time?: number;
  level_1_completed_at?: string;
  level_2_completed_at?: string;
  level_3_completed_at?: string;
  level_4_completed_at?: string;
}

interface LeaderboardData {
  perfectRuns: PerfectRunEntry[];
  allLevels: AllLevelsEntry[];
  level4: LevelEntry[];
  level3: LevelEntry[];
  level2: LevelEntry[];
  level1: LevelEntry[];
  userPosition: {
    category: string;
    rank: number | null;
    score: number;
    inTop20: boolean;
  } | null;
}

export default function Leaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [highlightUser, setHighlightUser] = useState(false);
  const userEntryRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard');
      const responseData = await response.json();
      setData(responseData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toFixed(3).padStart(6, '0')}`;
  };

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankBg = (rank: number, isUser: boolean) => {
    if (isUser && highlightUser) {
      return 'bg-gradient-to-r from-blue-600/30 to-blue-500/30 border-blue-400 shadow-lg shadow-blue-500/20 animate-pulse-slow';
    }
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30';
      case 2: return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30';
      case 3: return 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-orange-500/30';
      default: return 'bg-gray-800/50 border-gray-700/50';
    }
  };

  const handleFindMyScore = () => {
    if (userEntryRef.current) {
      userEntryRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightUser(true);
      setTimeout(() => setHighlightUser(false), 3000);
    } else {
      // User not on leaderboard
      alert('Complete Level 1 to join the leaderboard!');
    }
  };

  const renderEntry = (
    entry: PerfectRunEntry | AllLevelsEntry | LevelEntry,
    category: string,
    time: number,
    icon: React.ReactNode,
    categoryLabel: string
  ) => {
    const isCurrentUser = !!(user && user.username === entry.username);
    
    return (
      <div
        key={`${category}-${entry.userId}`}
        ref={isCurrentUser ? userEntryRef : null}
        className={`border rounded-lg p-3 transition-all duration-200 hover:shadow-lg ${getRankBg(entry.rank, isCurrentUser)}`}
      >
        <div className="flex items-center gap-3">
          <div className="text-lg font-bold text-gray-300 min-w-[3rem]">
            {getMedalEmoji(entry.rank)}
          </div>
          <div className="flex items-center gap-2 flex-1">
            {icon}
            <span className="text-sm font-medium text-gray-400">{categoryLabel}:</span>
            <span className="font-semibold text-white">
              {entry.username}
            </span>
            {isCurrentUser && (
              <Star 
                className="w-7 h-7 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.7)] animate-pulse" 
                strokeWidth={2.5}
              />
            )}
          </div>
          <div className="text-sm font-mono text-gray-300">
            {formatTime(time)}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-full w-full overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasAnyEntries = data && (
    data.perfectRuns.length > 0 ||
    data.allLevels.length > 0 ||
    data.level4.length > 0 ||
    data.level3.length > 0 ||
    data.level2.length > 0 ||
    data.level1.length > 0
  );

  return (
    <div className="h-full w-full overflow-y-auto">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          {/* Title Row */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 flex-shrink-0" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white truncate">
                Formula Trivia Champions
              </h1>
            </div>
            {/* Return to Game Button - Always Visible */}
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="flex-shrink-0 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
            >
              <span className="sm:hidden">Back</span>
              <span className="hidden sm:inline">Return to Game</span>
            </Button>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center justify-between gap-3">
            {user && (
              <Button
                onClick={handleFindMyScore}
                variant="outline"
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Find My Score</span>
                <span className="sm:hidden">Find Score</span>
              </Button>
            )}
            <p className="text-xs sm:text-sm text-gray-400 text-right">
              Top 20 scores in each category
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

      {!hasAnyEntries ? (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-300 mb-2">
            No Champions Yet
          </h3>
          <p className="text-gray-400">
            Be the first to complete Level 1 and join the leaderboard!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* CHAMPIONS SECTION */}
          {(data.perfectRuns.length > 0 || data.allLevels.length > 0) && (
            <>
              <div className="border-b-2 border-yellow-500/30 pb-2">
                <h2 className="text-2xl font-bold text-yellow-500">CHAMPIONS</h2>
              </div>

              {data.perfectRuns.length > 0 && (
                <div className="space-y-2">
                  {data.perfectRuns.map((entry) =>
                    renderEntry(
                      entry,
                      'perfectRun',
                      entry.perfectRunTime,
                      <Zap className="w-4 h-4 text-blue-400" />,
                      'PERFECT RUN'
                    )
                  )}
                </div>
              )}

              {data.allLevels.length > 0 && (
                <div className="space-y-2">
                  {data.allLevels.map((entry) =>
                    renderEntry(
                      entry,
                      'allLevels',
                      entry.allLevelsTime,
                      <Star className="w-4 h-4 text-green-400" />,
                      'ALL LEVELS'
                    )
                  )}
                </div>
              )}
            </>
          )}

          {/* LEVEL LEADERS SECTION */}
          {(data.level4.length > 0 || data.level3.length > 0 || data.level2.length > 0 || data.level1.length > 0) && (
            <>
              <div className="border-b-2 border-blue-500/30 pb-2 mt-8">
                <h2 className="text-2xl font-bold text-blue-500">LEVEL LEADERS</h2>
              </div>

              {data.level4.length > 0 && (
                <div className="space-y-2">
                  {data.level4.map((entry) =>
                    renderEntry(
                      entry,
                      'level4',
                      entry.level_4_cumulative_time!,
                      <BarChart3 className="w-4 h-4 text-purple-400" />,
                      'LEVEL 4'
                    )
                  )}
                </div>
              )}

              {data.level3.length > 0 && (
                <div className="space-y-2">
                  {data.level3.map((entry) =>
                    renderEntry(
                      entry,
                      'level3',
                      entry.level_3_cumulative_time!,
                      <BarChart3 className="w-4 h-4 text-purple-400" />,
                      'LEVEL 3'
                    )
                  )}
                </div>
              )}

              {data.level2.length > 0 && (
                <div className="space-y-2">
                  {data.level2.map((entry) =>
                    renderEntry(
                      entry,
                      'level2',
                      entry.level_2_cumulative_time!,
                      <BarChart3 className="w-4 h-4 text-purple-400" />,
                      'LEVEL 2'
                    )
                  )}
                </div>
              )}

              {data.level1.length > 0 && (
                <div className="space-y-2">
                  {data.level1.map((entry) =>
                    renderEntry(
                      entry,
                      'level1',
                      entry.level_1_cumulative_time!,
                      <BarChart3 className="w-4 h-4 text-purple-400" />,
                      'LEVEL 1'
                    )
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
