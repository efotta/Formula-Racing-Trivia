
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

    // Helper function to round time consistently (same as frontend formatting)
    const roundTimeForDisplay = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return minutes * 60 + remainingSeconds;
    };

    // Calculate cumulative times for levels 1-4
    const level1Score = validBestScores.find(s => s!.level === 1);
    const level2Score = validBestScores.find(s => s!.level === 2);
    const level3Score = validBestScores.find(s => s!.level === 3);
    const level4Score = validBestScores.find(s => s!.level === 4);

    const level1Time = level1Score ? roundTimeForDisplay(level1Score.finalTime) : null;
    const level2Time = level1Time && level2Score 
      ? level1Time + roundTimeForDisplay(level2Score.finalTime) 
      : null;
    const level3Time = level2Time && level3Score 
      ? level2Time + roundTimeForDisplay(level3Score.finalTime) 
      : null;
    const level4Time = level3Time && level4Score 
      ? level3Time + roundTimeForDisplay(level4Score.finalTime) 
      : null;

    // Determine highest completed level (1-4 only, 5 is tracked by allLevelsCompleted)
    let highestLevel = 0;
    if (level4Score) highestLevel = 4;
    else if (level3Score) highestLevel = 3;
    else if (level2Score) highestLevel = 2;
    else if (level1Score) highestLevel = 1;

    // Get existing entry to preserve perfect run data if it exists
    const existingEntry = await prisma.leaderboard.findUnique({
      where: { userId }
    });

    if (allLevelsCompleted) {
      // User completed all 5 levels
      
      // Calculate total time from best scores (this is "All Levels" time)
      const allLevelsTime = validBestScores.reduce((sum, score) => sum + roundTimeForDisplay(score!.finalTime), 0);
      
      // Check if completed without mistakes (all best attempts should be 1)
      const noMistakes = validBestScores.every(score => score!.attempt === 1);

      // Get the completion date (latest level completion)
      const completedDate = validBestScores.sort((a, b) => 
        new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime()
      )[0]!.createdAt;

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
          // PRESERVE individual level data even when all levels are completed
          highest_completed_level: highestLevel > 0 ? highestLevel : undefined,
          level_1_cumulative_time: level1Time,
          level_2_cumulative_time: level2Time,
          level_3_cumulative_time: level3Time,
          level_4_cumulative_time: level4Time,
          level_1_completed_at: level1Score?.createdAt,
          level_2_completed_at: level2Score?.createdAt,
          level_3_completed_at: level3Score?.createdAt,
          level_4_completed_at: level4Score?.createdAt,
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
          highest_completed_level: highestLevel > 0 ? highestLevel : undefined,
          level_1_cumulative_time: level1Time,
          level_2_cumulative_time: level2Time,
          level_3_cumulative_time: level3Time,
          level_4_cumulative_time: level4Time,
          level_1_completed_at: level1Score?.createdAt,
          level_2_completed_at: level2Score?.createdAt,
          level_3_completed_at: level3Score?.createdAt,
          level_4_completed_at: level4Score?.createdAt,
        }
      });
    } else if (highestLevel > 0) {
      // User has NOT completed all 5 levels but has completed at least one level
      // This ensures users show up in Level 1-4 leaderboards
      
      // Use the latest level completion date as the completed date
      const latestLevelScore = validBestScores.sort((a, b) => 
        new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime()
      )[0];
      
      const completedDate = latestLevelScore!.createdAt;
      
      // Use the cumulative time up to the highest level as the display time
      let displayTime = 0;
      if (highestLevel >= 1 && level1Time) displayTime = level1Time;
      if (highestLevel >= 2 && level2Time) displayTime = level2Time;
      if (highestLevel >= 3 && level3Time) displayTime = level3Time;
      if (highestLevel >= 4 && level4Time) displayTime = level4Time;

      await prisma.leaderboard.upsert({
        where: { userId },
        update: {
          username,
          totalTime: displayTime,
          completedDate,
          allLevelsCompleted: false,
          highest_completed_level: highestLevel,
          level_1_cumulative_time: level1Time,
          level_2_cumulative_time: level2Time,
          level_3_cumulative_time: level3Time,
          level_4_cumulative_time: level4Time,
          level_1_completed_at: level1Score?.createdAt,
          level_2_completed_at: level2Score?.createdAt,
          level_3_completed_at: level3Score?.createdAt,
          level_4_completed_at: level4Score?.createdAt,
          // Preserve perfect run data if it exists
          ...(existingEntry?.hasPerfectRun && {
            hasPerfectRun: existingEntry.hasPerfectRun,
            perfectRunTime: existingEntry.perfectRunTime,
            perfectRunDate: existingEntry.perfectRunDate,
          })
        },
        create: {
          id: `leaderboard_${userId}_${Date.now()}`,
          userId,
          username,
          totalTime: displayTime,
          completedDate,
          allLevelsCompleted: false,
          noMistakes: false,
          hasPerfectRun: false,
          highest_completed_level: highestLevel,
          level_1_cumulative_time: level1Time,
          level_2_cumulative_time: level2Time,
          level_3_cumulative_time: level3Time,
          level_4_cumulative_time: level4Time,
          level_1_completed_at: level1Score?.createdAt,
          level_2_completed_at: level2Score?.createdAt,
          level_3_completed_at: level3Score?.createdAt,
          level_4_completed_at: level4Score?.createdAt,
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
          }),
          // Preserve individual level data
          ...(existingEntry?.highest_completed_level && {
            highest_completed_level: existingEntry.highest_completed_level,
            level_1_cumulative_time: existingEntry.level_1_cumulative_time,
            level_2_cumulative_time: existingEntry.level_2_cumulative_time,
            level_3_cumulative_time: existingEntry.level_3_cumulative_time,
            level_4_cumulative_time: existingEntry.level_4_cumulative_time,
            level_1_completed_at: existingEntry.level_1_completed_at,
            level_2_completed_at: existingEntry.level_2_completed_at,
            level_3_completed_at: existingEntry.level_3_completed_at,
            level_4_completed_at: existingEntry.level_4_completed_at,
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
