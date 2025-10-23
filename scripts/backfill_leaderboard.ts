import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillLeaderboard() {
  try {
    console.log('Starting leaderboard backfill...');

    // Get all users who have completed at least one level
    const usersWithScores = await prisma.game_scores.findMany({
      where: {
        completed: true
      },
      distinct: ['userId'],
      select: {
        userId: true,
        username: true
      }
    });

    console.log(`Found ${usersWithScores.length} users with completed levels`);

    // Process each user
    for (const user of usersWithScores) {
      console.log(`\nProcessing user: ${user.username} (${user.userId})`);
      
      // Get the best (fastest) completion for each level for this user
      const bestScoresByLevel = await prisma.game_scores.groupBy({
        by: ['level'],
        where: {
          userId: user.userId,
          completed: true
        },
        _min: {
          finalTime: true,
          attempt: true
        }
      });

      // Get the actual score records for the best times
      const bestScores = await Promise.all(
        bestScoresByLevel.map(async (levelGroup) => {
          return await prisma.game_scores.findFirst({
            where: {
              userId: user.userId,
              level: levelGroup.level,
              finalTime: levelGroup._min.finalTime || 0,
              completed: true
            },
            orderBy: {
              createdAt: 'asc'
            }
          });
        })
      );

      const validBestScores = bestScores.filter(score => score !== null);

      if (validBestScores.length === 0) {
        console.log(`  No valid scores found for ${user.username}, skipping`);
        continue;
      }

      // Check if user completed all 5 levels
      const allLevels = [1, 2, 3, 4, 5];
      const userCompletedLevels = validBestScores.map(score => score!.level);
      const allLevelsCompleted = allLevels.every(level => userCompletedLevels.includes(level));

      // Helper function to round time consistently
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

      // Determine highest completed level (1-4 only)
      let highestLevel = 0;
      if (level4Score) highestLevel = 4;
      else if (level3Score) highestLevel = 3;
      else if (level2Score) highestLevel = 2;
      else if (level1Score) highestLevel = 1;

      console.log(`  Completed levels: ${userCompletedLevels.join(', ')}`);
      console.log(`  Highest level (1-4): ${highestLevel}`);
      console.log(`  All levels completed: ${allLevelsCompleted}`);
      console.log(`  Level cumulative times: L1=${level1Time}, L2=${level2Time}, L3=${level3Time}, L4=${level4Time}`);

      // Get existing entry to preserve perfect run data
      const existingEntry = await prisma.leaderboard.findUnique({
        where: { userId: user.userId }
      });

      if (allLevelsCompleted) {
        // User completed all 5 levels
        const allLevelsTime = validBestScores.reduce((sum, score) => sum + roundTimeForDisplay(score!.finalTime), 0);
        const noMistakes = validBestScores.every(score => score!.attempt === 1);
        const completedDate = validBestScores.sort((a, b) => 
          new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime()
        )[0]!.createdAt;

        const displayTime = existingEntry?.perfectRunTime && existingEntry.perfectRunTime < allLevelsTime 
          ? existingEntry.perfectRunTime 
          : allLevelsTime;

        await prisma.leaderboard.upsert({
          where: { userId: user.userId },
          update: {
            username: user.username,
            totalTime: displayTime,
            completedDate,
            allLevelsCompleted: true,
            noMistakes,
            allLevelsTime,
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
            id: `leaderboard_${user.userId}_${Date.now()}`,
            userId: user.userId,
            username: user.username,
            totalTime: displayTime,
            completedDate,
            allLevelsCompleted: true,
            noMistakes,
            allLevelsTime,
            hasPerfectRun: false,
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

        console.log(`  ✓ Updated all-levels entry for ${user.username}`);
      } else if (highestLevel > 0) {
        // User has NOT completed all 5 levels but has completed at least one
        const latestLevelScore = validBestScores.sort((a, b) => 
          new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime()
        )[0];
        
        const completedDate = latestLevelScore!.createdAt;
        
        let displayTime = 0;
        if (highestLevel >= 1 && level1Time) displayTime = level1Time;
        if (highestLevel >= 2 && level2Time) displayTime = level2Time;
        if (highestLevel >= 3 && level3Time) displayTime = level3Time;
        if (highestLevel >= 4 && level4Time) displayTime = level4Time;

        await prisma.leaderboard.upsert({
          where: { userId: user.userId },
          update: {
            username: user.username,
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
            ...(existingEntry?.hasPerfectRun && {
              hasPerfectRun: existingEntry.hasPerfectRun,
              perfectRunTime: existingEntry.perfectRunTime,
              perfectRunDate: existingEntry.perfectRunDate,
            })
          },
          create: {
            id: `leaderboard_${user.userId}_${Date.now()}`,
            userId: user.userId,
            username: user.username,
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

        console.log(`  ✓ Updated partial-levels entry for ${user.username} (highest: Level ${highestLevel})`);
      }
    }

    console.log('\n✅ Leaderboard backfill completed successfully!');
  } catch (error) {
    console.error('Error during backfill:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

backfillLeaderboard();
