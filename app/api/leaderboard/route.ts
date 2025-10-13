
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get top users who have either completed all levels or have a perfect run
    const leaderboard = await prisma.leaderboard.findMany({
      where: {
        OR: [
          { allLevelsCompleted: true },
          { hasPerfectRun: true }
        ]
      },
      take: 100
    });

    // Sort manually to prioritize Perfect Run times over All Level times
    const sortedLeaderboard = leaderboard.sort((a, b) => {
      // Both have Perfect Runs - compare Perfect Run times
      if (a.hasPerfectRun && a.perfectRunTime && b.hasPerfectRun && b.perfectRunTime) {
        return a.perfectRunTime - b.perfectRunTime;
      }
      
      // Only A has Perfect Run - A wins
      if (a.hasPerfectRun && a.perfectRunTime && !(b.hasPerfectRun && b.perfectRunTime)) {
        return -1;
      }
      
      // Only B has Perfect Run - B wins
      if (b.hasPerfectRun && b.perfectRunTime && !(a.hasPerfectRun && a.perfectRunTime)) {
        return 1;
      }
      
      // Neither has Perfect Run - compare All Level times
      if (a.allLevelsTime && b.allLevelsTime) {
        return a.allLevelsTime - b.allLevelsTime;
      }
      
      // Fallback to total time if needed
      return a.totalTime - b.totalTime;
    });

    // Add rank to each entry
    const rankedLeaderboard = sortedLeaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    return NextResponse.json(rankedLeaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
