
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Get user profile data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        createdAt: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user stats
    const scores = await prisma.game_scores.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }
    });

    // Get completed levels (finished all questions regardless of wrong answers)
    const completedLevels = [...new Set(scores.filter((s: typeof scores[number]) => s.completed).map((s: typeof scores[number]) => s.level))] as number[];
    const allLevelsCompleted = completedLevels.length === 5 && completedLevels.every((level) => [1,2,3,4,5].includes(level));
    
    // Get perfect levels (0 wrong answers)
    const perfectLevels = [...new Set(scores.filter((s: typeof scores[number]) => s.completed && s.questionsCorrect === s.totalQuestions).map((s: typeof scores[number]) => s.level))] as number[];
    
    // Calculate best times for all completed levels
    const bestTimesByLevel = scores
      .filter((s: typeof scores[number]) => s.completed)
      .reduce((acc: Record<number, number>, score: typeof scores[number]) => {
        if (!acc[score.level] || score.finalTime < acc[score.level]) {
          acc[score.level] = score.finalTime;
        }
        return acc;
      }, {} as Record<number, number>);

    // Helper function to round time consistently (same as frontend formatting)
    const roundTimeForDisplay = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return minutes * 60 + remainingSeconds;
    };

    // Calculate best overall time if all levels completed (sum of displayed individual times)
    // This ensures the total matches what users see when they add up the individual level times
    const allLevelsTime = allLevelsCompleted 
      ? Object.values(bestTimesByLevel).reduce((sum: number, time: number) => sum + roundTimeForDisplay(time), 0)
      : null;

    // Get leaderboard entry to check for perfect run time
    const leaderboardEntry = await prisma.leaderboard.findUnique({
      where: { userId: userId }
    });

    // Use the calculated all levels time (sum of displayed individual times)
    // This ensures consistency with what users see when adding up individual level times
    const bestOverallTime = allLevelsTime;
      
    // Calculate perfect completion stats
    const perfectTimesByLevel = scores
      .filter((s: typeof scores[number]) => s.completed && s.questionsCorrect === s.totalQuestions)
      .reduce((acc: Record<number, number>, score: typeof scores[number]) => {
        if (!acc[score.level] || score.finalTime < acc[score.level]) {
          acc[score.level] = score.finalTime;
        }
        return acc;
      }, {} as Record<number, number>);

    const stats = {
      totalGames: scores.length,
      bestTime: bestOverallTime,
      allLevelsTime: allLevelsTime, // Sum of best individual level times
      perfectRunTime: leaderboardEntry?.perfectRunTime || null,
      hasPerfectRun: leaderboardEntry?.hasPerfectRun || false,
      timeSource: bestOverallTime && leaderboardEntry?.perfectRunTime && allLevelsTime && leaderboardEntry.perfectRunTime < allLevelsTime 
        ? 'perfectRun' 
        : 'allLevels', // Indicate which time is being displayed
      averageTime: scores.length > 0 
        ? scores.filter((s: typeof scores[number]) => s.completed).reduce((sum, s) => sum + s.finalTime, 0) / scores.filter((s: typeof scores[number]) => s.completed).length
        : 0,
      completedLevels,
      perfectLevels,
      allLevelsCompleted,
      bestTimesByLevel,
      perfectTimesByLevel
    };

    return NextResponse.json({
      ...user,
      stats,
      recentScores: scores.slice(0, 10)
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
