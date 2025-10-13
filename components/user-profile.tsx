
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { User, Trophy, Target, Calendar } from 'lucide-react';
import { UserProfile as UserProfileType } from '@/lib/types';


interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchProfile();
    }
  }, [isOpen, user?.id]);

  const fetchProfile = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/users?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    // Use a consistent format to avoid hydration mismatches
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };


  const levels = [
    { number: 1, name: 'Rookie', color: 'bg-green-500' },
    { number: 2, name: 'Midfielder', color: 'bg-blue-500' },
    { number: 3, name: 'Front Runner', color: 'bg-yellow-500' },
    { number: 4, name: 'World Champion', color: 'bg-orange-500' },
    { number: 5, name: 'Legend', color: 'bg-red-500' }
  ];

  if (!user) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="user-profile-dialog sm:max-w-4xl max-h-[95vh] overflow-y-auto [&>button[data-close-button]]:hidden">
        {/* Custom Close Button for iOS compatibility */}
        <div className="absolute right-4 top-4 z-50">
          <button
            onClick={onClose}
            className="rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none p-1 bg-white border border-gray-200 shadow-sm"
            style={{
              color: '#000000 !important',
              WebkitTextFillColor: '#000000 !important'
            }}
          >
            <X 
              className="h-4 w-4" 
              style={{
                color: '#000000 !important',
                WebkitTextFillColor: '#000000 !important',
                fill: '#000000 !important',
                stroke: '#000000 !important'
              }}
            />
            <span className="sr-only">Close</span>
          </button>
        </div>
        
        <DialogHeader className="pb-2 sm:pb-6">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
            User Profile
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p>Loading profile...</p>
            </div>
          </div>
        ) : profile ? (
          <div className="space-y-2 sm:space-y-4">
            {/* Profile Header */}
            <Card>
              <CardHeader className="pb-1 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  {profile.username}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1 sm:pt-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-blue-600">{profile.stats.totalGames}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Total Games</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-green-600">
                      {profile.stats.completedLevels.length}/5
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Levels Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-purple-600">
                      {profile.stats.allLevelsTime ? formatTime(profile.stats.allLevelsTime) : '--:--'}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Best Time (All Levels)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                      {profile.stats.perfectRunTime ? formatTime(profile.stats.perfectRunTime) : '--:--'}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Perfect Run</div>
                  </div>
                </div>
                
                <div className="mt-2 sm:mt-4 space-y-3">
                  {profile.stats.allLevelsCompleted && (
                    <div className="text-center">
                      <Badge variant="default" className="bg-gold text-black text-xs sm:text-sm">
                        <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        All Levels Completed!
                      </Badge>
                    </div>
                  )}

                </div>
              </CardContent>
            </Card>

            {/* Level Progress */}
            <Card>
              <CardHeader className="pb-1 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                  Level Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1 sm:pt-3">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
                  {levels.map((level) => {
                    const isCompleted = profile.stats.completedLevels.includes(level.number);
                    const isPerfect = profile.stats.perfectLevels?.includes(level.number);
                    const bestTime = profile.stats.bestTimesByLevel?.[level.number];
                    
                    return (
                      <div key={level.number} className={`p-2 sm:p-4 rounded-lg border ${isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                        <div className="text-center">
                          <div className={`w-6 h-6 sm:w-8 sm:h-8 ${level.color} rounded-full flex items-center justify-center text-white font-bold mx-auto mb-1 sm:mb-2 relative text-xs sm:text-base`}>
                            {level.number}
                            {isPerfect && (
                              <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-400 rounded-full flex items-center justify-center">
                                <span className="text-[8px] sm:text-xs">⭐</span>
                              </div>
                            )}
                          </div>
                          <div className="font-semibold text-xs sm:text-sm">{level.name}</div>
                          {isCompleted ? (
                            <div className="mt-0.5 sm:mt-1">
                              <div className="text-[10px] sm:text-xs text-green-600">
                                Best: {formatTime(bestTime || 0)}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">Not completed</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>



            {/* Member Since */}
            <Card>
              <CardContent className="pt-3 sm:pt-4">
                <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-600">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Member since: {formatDate(profile.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Failed to load profile data.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
