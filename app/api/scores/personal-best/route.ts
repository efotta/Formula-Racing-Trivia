

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const level = searchParams.get('level');

    if (!userId || !level) {
      return NextResponse.json({ error: 'userId and level parameters are required' }, { status: 400 });
    }

    const levelNumber = parseInt(level);
    if (levelNumber < 1 || levelNumber > 5) {
      return NextResponse.json({ error: 'Level must be between 1 and 5' }, { status: 400 });
    }

    // Find the user's best (lowest) final time for this level among completed attempts
    const personalBest = await prisma.game_scores.findFirst({
      where: {
        userId: userId,
        level: levelNumber,
        completed: true,
        questionsCorrect: 25, // Only perfect runs count
      },
      orderBy: {
        finalTime: 'asc' // Get the lowest (best) time
      },
      select: {
        finalTime: true,
        createdAt: true
      }
    });

    if (!personalBest) {
      // No previous completed attempts for this level
      return NextResponse.json({ personalBestTime: null });
    }

    return NextResponse.json({ 
      personalBestTime: personalBest.finalTime,
      achievedAt: personalBest.createdAt
    });
  } catch (error) {
    console.error('Error fetching personal best time:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
