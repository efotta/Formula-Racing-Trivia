
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const currentUserId = (session?.user as any)?.id;

    // Run all queries in parallel for better performance
    const [perfectRuns, allLevels, level4, level3, level2, level1] = await Promise.all([
      // Get Perfect Runs (top 20)
      prisma.leaderboard.findMany({
        where: {
          hasPerfectRun: true,
          perfectRunTime: { not: null }
        },
        orderBy: [
          { perfectRunTime: 'asc' },
          { perfectRunDate: 'asc' }
        ],
        take: 20,
        select: {
          userId: true,
          username: true,
          perfectRunTime: true,
          perfectRunDate: true,
        }
      }),

      // Get All Levels (top 20)
      prisma.leaderboard.findMany({
        where: {
          allLevelsCompleted: true,
          allLevelsTime: { not: null }
        },
        orderBy: [
          { allLevelsTime: 'asc' },
          { completedDate: 'asc' }
        ],
        take: 20,
        select: {
          userId: true,
          username: true,
          allLevelsTime: true,
          completedDate: true,
        }
      }),

      // Get Level 4 leaders (top 20)
      prisma.leaderboard.findMany({
        where: {
          highest_completed_level: 4,
          level_4_cumulative_time: { not: null }
        },
        orderBy: [
          { level_4_cumulative_time: 'asc' },
          { level_4_completed_at: 'asc' }
        ],
        take: 20,
        select: {
          userId: true,
          username: true,
          level_4_cumulative_time: true,
          level_4_completed_at: true,
        }
      }),

      // Get Level 3 leaders (top 20)
      prisma.leaderboard.findMany({
        where: {
          highest_completed_level: 3,
          level_3_cumulative_time: { not: null }
        },
        orderBy: [
          { level_3_cumulative_time: 'asc' },
          { level_3_completed_at: 'asc' }
        ],
        take: 20,
        select: {
          userId: true,
          username: true,
          level_3_cumulative_time: true,
          level_3_completed_at: true,
        }
      }),

      // Get Level 2 leaders (top 20)
      prisma.leaderboard.findMany({
        where: {
          highest_completed_level: 2,
          level_2_cumulative_time: { not: null }
        },
        orderBy: [
          { level_2_cumulative_time: 'asc' },
          { level_2_completed_at: 'asc' }
        ],
        take: 20,
        select: {
          userId: true,
          username: true,
          level_2_cumulative_time: true,
          level_2_completed_at: true,
        }
      }),

      // Get Level 1 leaders (top 20)
      prisma.leaderboard.findMany({
        where: {
          highest_completed_level: 1,
          level_1_cumulative_time: { not: null }
        },
        orderBy: [
          { level_1_cumulative_time: 'asc' },
          { level_1_completed_at: 'asc' }
        ],
        take: 20,
        select: {
          userId: true,
          username: true,
          level_1_cumulative_time: true,
          level_1_completed_at: true,
        }
      })
    ]);

    // Find user's position if logged in
    let userPosition = null;
    if (currentUserId) {
      const userEntry = await prisma.leaderboard.findUnique({
        where: { userId: currentUserId }
      });

      if (userEntry) {
        // Determine which category the user is in
        if (userEntry.hasPerfectRun && userEntry.perfectRunTime) {
          const rank = perfectRuns.findIndex(e => e.userId === currentUserId) + 1;
          userPosition = {
            category: 'perfectRun',
            rank: rank > 0 ? rank : null,
            score: userEntry.perfectRunTime,
            inTop20: rank > 0 && rank <= 20
          };
        } else if (userEntry.allLevelsCompleted && userEntry.allLevelsTime) {
          const rank = allLevels.findIndex(e => e.userId === currentUserId) + 1;
          userPosition = {
            category: 'allLevels',
            rank: rank > 0 ? rank : null,
            score: userEntry.allLevelsTime,
            inTop20: rank > 0 && rank <= 20
          };
        } else if (userEntry.highest_completed_level === 4 && userEntry.level_4_cumulative_time) {
          const rank = level4.findIndex(e => e.userId === currentUserId) + 1;
          userPosition = {
            category: 'level4',
            rank: rank > 0 ? rank : null,
            score: userEntry.level_4_cumulative_time,
            inTop20: rank > 0 && rank <= 20
          };
        } else if (userEntry.highest_completed_level === 3 && userEntry.level_3_cumulative_time) {
          const rank = level3.findIndex(e => e.userId === currentUserId) + 1;
          userPosition = {
            category: 'level3',
            rank: rank > 0 ? rank : null,
            score: userEntry.level_3_cumulative_time,
            inTop20: rank > 0 && rank <= 20
          };
        } else if (userEntry.highest_completed_level === 2 && userEntry.level_2_cumulative_time) {
          const rank = level2.findIndex(e => e.userId === currentUserId) + 1;
          userPosition = {
            category: 'level2',
            rank: rank > 0 ? rank : null,
            score: userEntry.level_2_cumulative_time,
            inTop20: rank > 0 && rank <= 20
          };
        } else if (userEntry.highest_completed_level === 1 && userEntry.level_1_cumulative_time) {
          const rank = level1.findIndex(e => e.userId === currentUserId) + 1;
          userPosition = {
            category: 'level1',
            rank: rank > 0 ? rank : null,
            score: userEntry.level_1_cumulative_time,
            inTop20: rank > 0 && rank <= 20
          };
        }
      }
    }

    // Return categorized leaderboard
    return NextResponse.json({
      perfectRuns: perfectRuns.map((entry, index) => ({ ...entry, rank: index + 1 })),
      allLevels: allLevels.map((entry, index) => ({ ...entry, rank: index + 1 })),
      level4: level4.map((entry, index) => ({ ...entry, rank: index + 1 })),
      level3: level3.map((entry, index) => ({ ...entry, rank: index + 1 })),
      level2: level2.map((entry, index) => ({ ...entry, rank: index + 1 })),
      level1: level1.map((entry, index) => ({ ...entry, rank: index + 1 })),
      userPosition
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
