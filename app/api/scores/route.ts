
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      username,
      level,
      levelName,
      questionsCorrect,
      totalQuestions,
      timeInSeconds,
      penalties,
      penaltyTime,
      finalTime,
      completed,
      attempt,
      perfectRunSessionId // New field to track perfect run sessions
    } = await request.json();

    // Validate user exists
    if (!userId || !username) {
      return NextResponse.json({ error: 'User ID and username are required' }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate required fields
    if (!level || !levelName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Save the game score
    const gameScore = await prisma.game_scores.create({
      data: {
        id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        username: username,
        level: parseInt(level),
        levelName,
        questionsCorrect: parseInt(questionsCorrect),
        totalQuestions: parseInt(totalQuestions),
        timeInSeconds: parseFloat(timeInSeconds.toString()),
        penalties: parseInt(penalties) || 0,
        penaltyTime: parseFloat(penaltyTime.toString()) || 0,
        finalTime: parseFloat(finalTime.toString()),
        completed: Boolean(completed),
        attempt: parseInt(attempt) || 1
      }
    });

    // If level completed, check if user completed all levels for leaderboard
    if (completed) {
      await updateLeaderboard(userId, username, level);
      
      // If this was part of a perfect run, update the perfect run session
      if (perfectRunSessionId) {
        await updatePerfectRunSession(perfectRunSessionId, userId, username, level, finalTime);
      }
    }

    return NextResponse.json(gameScore);
  } catch (error) {
    console.error('Error saving score:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function updateLeaderboard(userId: string, username: string, completedLevel: number) {
  try {
    // Get the best (fastest) completion for each level for this user
    const bestScoresByLevel = await prisma.game_scores.groupBy({
      by: ['level'],
      where: {
        userId,
        completed: true
      },
      _min: {
        finalTime: true,
        attempt: true
      }
    });

    // Get the actual score records for the best times
    const bestScores = await Promise.all(
      bestScoresByLevel.map(async (levelGroup: typeof bestScoresByLevel[number]) => {
        return await prisma.game_scores.findFirst({
          where: {
            userId,
            level: levelGroup.level,
            finalTime: levelGroup._min.finalTime || 0,
            completed: true
          },
          orderBy: {
            createdAt: 'asc' // Get the earliest record if there are ties
          }
        });
      })
    );

    const validBestScores = bestScores.filter(score => score !== null);

    // Check if user completed all 5 levels
    const allLevels = [1, 2, 3, 4, 5];
    const userCompletedLevels = validBestScores.map(score => score!.level);
    const allLevelsCompleted = allLevels.every(level => userCompletedLevels.includes(level));

    if (allLevelsCompleted) {
      // Helper function to round time consistently (same as frontend formatting)
      const roundTimeForDisplay = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return minutes * 60 + remainingSeconds;
      };

      // Calculate total time from best scores (this is "All Levels" time)
      // Use the same rounding logic as the individual level displays for consistency
      const allLevelsTime = validBestScores.reduce((sum, score) => sum + roundTimeForDisplay(score!.finalTime), 0);
      
      // Check if completed without mistakes (all best attempts should be 1)
      const noMistakes = validBestScores.every(score => score!.attempt === 1);

      // Get the completion date (latest level completion)
      const completedDate = validBestScores.sort((a, b) => 
        new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime()
      )[0]!.createdAt;

      // Get existing entry to preserve perfect run data if it exists
      const existingEntry = await prisma.leaderboard.findUnique({
        where: { userId }
      });

      // For display purposes, use the better time (perfect run if available, otherwise all levels)
      const displayTime = existingEntry?.perfectRunTime && existingEntry.perfectRunTime < allLevelsTime 
        ? existingEntry.perfectRunTime 
        : allLevelsTime;

      // Update or create leaderboard entry
      await prisma.leaderboard.upsert({
        where: { userId },
        update: {
          username,
          totalTime: displayTime, // Use better time for ranking
          completedDate,
          allLevelsCompleted: true,
          noMistakes,
          allLevelsTime, // Always update the sum of best individual times
        },
        create: {
          id: `leaderboard_${userId}_${Date.now()}`,
          userId,
          username,
          totalTime: displayTime,
          completedDate,
          allLevelsCompleted: true,
          noMistakes,
          allLevelsTime,
          hasPerfectRun: false, // Will be updated by perfect run logic
        }
      });
    }
  } catch (error) {
    console.error('Error updating leaderboard:', error);
  }
}

async function updatePerfectRunSession(sessionId: string, userId: string, username: string, completedLevel: number, levelTime: number) {
  try {
    // Get the current perfect run session
    const session = await prisma.perfect_run_sessions.findUnique({
      where: { sessionId }
    });

    if (!session || session.userId !== userId) {
      console.error('Invalid perfect run session');
      return;
    }

    // Update the session with the completed level
    const nextLevel = completedLevel + 1;
    const isLastLevel = completedLevel === 5;
    
    if (isLastLevel) {
      // Complete the perfect run session
      const completedSession = await prisma.perfect_run_sessions.update({
        where: { sessionId },
        data: {
          currentLevel: nextLevel,
          completedAt: new Date(),
          completed: true,
          totalTime: session.totalTime ? session.totalTime + levelTime : levelTime
        }
      });

      // Update leaderboard with perfect run data
      const existingEntry = await prisma.leaderboard.findUnique({
        where: { userId }
      });

      const perfectRunTime = completedSession.totalTime!;
      const shouldUpdateDisplay = !existingEntry?.totalTime || perfectRunTime < existingEntry.totalTime;

      await prisma.leaderboard.upsert({
        where: { userId },
        update: {
          perfectRunTime,
          hasPerfectRun: true,
          perfectRunDate: completedSession.completedAt!,
          ...(shouldUpdateDisplay && {
            totalTime: perfectRunTime, // Update display time if this is better
            completedDate: completedSession.completedAt!
          })
        },
        create: {
          id: `leaderboard_${userId}_${Date.now()}`,
          userId,
          username,
          totalTime: perfectRunTime,
          completedDate: completedSession.completedAt!,
          allLevelsCompleted: false, // May be updated later by regular completion logic
          noMistakes: true, // Perfect run implies no mistakes
          perfectRunTime,
          hasPerfectRun: true,
          perfectRunDate: completedSession.completedAt
        }
      });
    } else {
      // Continue the perfect run session
      await prisma.perfect_run_sessions.update({
        where: { sessionId },
        data: {
          currentLevel: nextLevel,
          totalTime: session.totalTime ? session.totalTime + levelTime : levelTime
        }
      });
    }
  } catch (error) {
    console.error('Error updating perfect run session:', error);
  }
}
