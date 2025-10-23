
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

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
      // Calculate total time from best scores (this is "All Levels" time)
      // Keep full precision with milliseconds
      const allLevelsTime = validBestScores.reduce((sum, score) => sum + score!.finalTime, 0);
      
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

    // NEW: Progressive level tracking (Levels 1-4 only, not Level 5 as it becomes "All Levels")
    // This tracks cumulative times as users progress through levels
    await updateProgressiveLevelTracking(userId, username, completedLevel, validBestScores);

  } catch (error) {
    console.error('Error updating leaderboard:', error);
  }
}

async function updateProgressiveLevelTracking(
  userId: string, 
  username: string, 
  completedLevel: number,
  bestScores: any[]
) {
  try {
    // Only track levels 1-4 (Level 5 completion becomes "All Levels")
    if (completedLevel < 1 || completedLevel > 4) {
      return;
    }

    // Get current leaderboard entry
    const currentEntry = await prisma.leaderboard.findUnique({
      where: { userId }
    });

    // Check which levels are completed
    const completedLevels = bestScores
      .filter(score => score !== null)
      .map(score => score!.level)
      .sort();

    // Determine highest completed level (1-4 only)
    const highestLevel = Math.min(Math.max(...completedLevels), 4);

    // If user hasn't completed at least level 1, don't update
    if (highestLevel < 1) {
      return;
    }

    // Check if user completed all 5 levels (becomes "All Levels", remove from level tracking)
    const hasCompletedAllLevels = completedLevels.includes(5);
    
    if (hasCompletedAllLevels) {
      // User completed all levels - remove from progressive tracking
      await prisma.leaderboard.update({
        where: { userId },
        data: {
          highest_completed_level: null,
          level_1_cumulative_time: null,
          level_2_cumulative_time: null,
          level_3_cumulative_time: null,
          level_4_cumulative_time: null,
          level_1_completed_at: null,
          level_2_completed_at: null,
          level_3_completed_at: null,
          level_4_completed_at: null,
        }
      });
      return;
    }

    // Calculate cumulative times up to highest level (keeping full precision with milliseconds)
    const cumulativeTimes: { [key: number]: number } = {};
    let cumulativeSum = 0;

    for (let level = 1; level <= highestLevel; level++) {
      const scoreForLevel = bestScores.find(s => s?.level === level);
      if (scoreForLevel) {
        cumulativeSum += scoreForLevel.finalTime;
        cumulativeTimes[level] = cumulativeSum;
      }
    }

    // Get completion timestamps
    const completionDates: { [key: number]: Date } = {};
    for (let level = 1; level <= highestLevel; level++) {
      const scoreForLevel = bestScores.find(s => s?.level === level);
      if (scoreForLevel) {
        completionDates[level] = scoreForLevel.createdAt;
      }
    }

    // Build update data
    const updateData: any = {
      username,
      highest_completed_level: highestLevel,
      level_1_cumulative_time: cumulativeTimes[1] || null,
      level_2_cumulative_time: cumulativeTimes[2] || null,
      level_3_cumulative_time: cumulativeTimes[3] || null,
      level_4_cumulative_time: cumulativeTimes[4] || null,
      level_1_completed_at: completionDates[1] || null,
      level_2_completed_at: completionDates[2] || null,
      level_3_completed_at: completionDates[3] || null,
      level_4_completed_at: completionDates[4] || null,
    };

    // Update or create leaderboard entry
    await prisma.leaderboard.upsert({
      where: { userId },
      update: updateData,
      create: {
        id: `leaderboard_${userId}_${Date.now()}`,
        userId,
        ...updateData,
        totalTime: 0, // Will be set by other logic
        completedDate: completionDates[highestLevel] || new Date(),
        allLevelsCompleted: false,
        noMistakes: false,
      }
    });

  } catch (error) {
    console.error('Error updating progressive level tracking:', error);
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
