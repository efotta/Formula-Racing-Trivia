
'use client';

import { useEffect, useState } from 'react';
import { Trophy, Medal, Award, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LeaderboardEntry {
  id: string;
  username: string;
  totalTime: number;
  completedDate: string;
  allLevelsCompleted: boolean;
  noMistakes: boolean;
  allLevelsTime?: number | null;
  perfectRunTime?: number | null;
  hasPerfectRun: boolean;
  perfectRunDate?: string | null;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard');
      const data = await response.json();
      setEntries(data);
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

  const formatDate = (dateString: string): string => {
    // Use a consistent format to avoid hydration mismatches
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-500" />;
      default:
        return <div className="w-6 h-6 flex items-center justify-center text-gray-400 font-semibold">#{rank}</div>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-orange-500/30';
      default:
        return 'bg-gray-800/50 border-gray-700/50';
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-white">Formula Trivia Champions</h1>
        </div>
        
        {/* Return to Game Button - Moved below title */}
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
            title="Return to Game"
          >
            {/* Mobile: Show compact text, Desktop: Show full text */}
            <span className="sm:hidden">Back</span>
            <span className="hidden sm:inline">Return to Game</span>
          </Button>
        </div>
        
        <p className="text-gray-400">
          Champions ranked by Perfect Run times first, then All Level times. "Perfect Run" shows single continuous completion time. "All Levels" shows sum of best individual level times.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-300 mb-2">
            No Champions Yet
          </h3>
          <p className="text-gray-400">
            Be the first to complete all 5 levels without any mistakes!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => {
            const rank = index + 1;
            return (
              <div
                key={entry.id}
                className={`border rounded-lg p-3 transition-all duration-200 hover:shadow-lg ${getRankBg(rank)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    {getRankIcon(rank)}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm sm:text-base truncate">
                        {entry.username}
                      </h3>
                      <div className="space-y-0.5 text-xs text-gray-400 mt-0.5">
                        {/* Show Perfect Run accomplishment first */}
                        {entry.hasPerfectRun && entry.perfectRunTime && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              <span className="text-blue-400 font-medium">Perfect Run:</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(entry.perfectRunTime)}</span>
                            </div>
                            {entry.perfectRunDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span className="truncate">{formatDate(entry.perfectRunDate)}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Show All Levels accomplishment */}
                        {entry.allLevelsCompleted && entry.allLevelsTime && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-green-400 font-medium">All Levels:</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(entry.allLevelsTime)}</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Fallback: Show regular completion date if no specific accomplishment times */}
                        {(!entry.allLevelsTime && !entry.perfectRunTime) && (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span className="truncate">{formatDate(entry.completedDate)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(entry.totalTime)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}


    </div>
  );
}
