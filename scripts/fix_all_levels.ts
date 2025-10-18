
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAllLevelsLeaderboard() {
  try {
    console.log('🔍 Recalculating All Levels completion for all users...\n');
    
    // Get all users
    const users = await prisma.users.findMany();
    
    for (const user of users) {
      // Get all completed scores for this user
      const completedScores = await prisma.game_scores.findMany({
        where: { 
          userId: user.id,
          completed: true
        },
        orderBy: { createdAt: 'asc' }
      });
      
      // Check if user has completed all 5 levels
      const completedLevels = new Set(completedScores.map(s => s.level));
      const hasAllLevels = [1, 2, 3, 4, 5].every(level => completedLevels.has(level));
      
      if (!hasAllLevels) {
        console.log(`  ⏭️  Skipped ${user.username}: Not all levels completed`);
        continue;
      }
      
      // Calculate best time for each level
      const bestTimes: { [level: number]: { time: number, date: Date } } = {};
      
      for (let level = 1; level <= 5; level++) {
        const levelScores = completedScores.filter(s => s.level === level);
        if (levelScores.length > 0) {
          const bestScore = levelScores.reduce((best, current) => 
            current.finalTime < best.finalTime ? current : best
          );
          bestTimes[level] = {
            time: bestScore.finalTime,
            date: bestScore.createdAt
          };
        }
      }
      
      // Calculate total time
      const totalTime = Object.values(bestTimes).reduce((sum, level) => sum + level.time, 0);
      
      // Get the date of the last level completion
      const lastLevelDate = bestTimes[5].date;
      
      // Check for no mistakes (all correct answers in best run)
      const noMistakes = [1, 2, 3, 4, 5].every(level => {
        const levelScores = completedScores.filter(s => s.level === level);
        return levelScores.some(s => s.questionsCorrect === s.totalQuestions);
      });
      
      // Update or create leaderboard entry
      const existingEntry = await prisma.leaderboard.findUnique({
        where: { userId: user.id }
      });
      
      if (existingEntry) {
        await prisma.leaderboard.update({
          where: { userId: user.id },
          data: {
            allLevelsCompleted: true,
            allLevelsTime: totalTime,
            totalTime: totalTime,
            completedDate: lastLevelDate,
            noMistakes: noMistakes
          }
        });
        
        const mins = Math.floor(totalTime / 60);
        const secs = Math.floor(totalTime % 60);
        console.log(`✅ Updated ${user.username}: All Levels = ${mins}:${secs.toString().padStart(2, '0')} (No Mistakes: ${noMistakes})`);
      } else {
        // Create new leaderboard entry
        await prisma.leaderboard.create({
          data: {
            id: `${user.id}-leaderboard`,
            userId: user.id,
            username: user.username,
            allLevelsCompleted: true,
            allLevelsTime: totalTime,
            totalTime: totalTime,
            completedDate: lastLevelDate,
            noMistakes: noMistakes,
            hasPerfectRun: false
          }
        });
        
        const mins = Math.floor(totalTime / 60);
        const secs = Math.floor(totalTime % 60);
        console.log(`✅ Created ${user.username}: All Levels = ${mins}:${secs.toString().padStart(2, '0')} (No Mistakes: ${noMistakes})`);
      }
    }
    
    console.log('\n✅ All Levels leaderboard recalculation complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllLevelsLeaderboard();
