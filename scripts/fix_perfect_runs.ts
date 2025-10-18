
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPerfectRuns() {
  try {
    console.log('🔍 Recalculating Perfect Run times for all users...\n');
    
    // Get all users
    const users = await prisma.users.findMany();
    
    for (const user of users) {
      const scores = await prisma.game_scores.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' }
      });
      
      // Find all perfect runs (5 consecutive perfect games)
      let consecutivePerfectLevels: typeof scores[number][] = [];
      let perfectRunCandidates: (typeof scores[number][])[] = [];
      
      scores.forEach(score => {
        if (score.completed && score.questionsCorrect === score.totalQuestions) {
          if (consecutivePerfectLevels.length === 0 || 
              score.level === consecutivePerfectLevels[consecutivePerfectLevels.length - 1].level + 1) {
            consecutivePerfectLevels.push(score);
            
            if (consecutivePerfectLevels.length === 5) {
              perfectRunCandidates.push([...consecutivePerfectLevels]);
              consecutivePerfectLevels = [];
            }
          } else {
            consecutivePerfectLevels = [score];
          }
        } else {
          consecutivePerfectLevels = [];
        }
      });
      
      if (perfectRunCandidates.length > 0) {
        const fastestRun = perfectRunCandidates.reduce((fastest, current) => {
          const currentTotal = current.reduce((sum, s) => sum + s.finalTime, 0);
          const fastestTotal = fastest.reduce((sum, s) => sum + s.finalTime, 0);
          return currentTotal < fastestTotal ? current : fastest;
        });
        
        const fastestRunTime = fastestRun.reduce((sum, s) => sum + s.finalTime, 0);
        const fastestRunDate = fastestRun[4].createdAt;
        
        const leaderboardEntry = await prisma.leaderboard.findUnique({
          where: { userId: user.id }
        });
        
        if (leaderboardEntry) {
          await prisma.leaderboard.update({
            where: { userId: user.id },
            data: {
              hasPerfectRun: true,
              perfectRunTime: fastestRunTime,
              perfectRunDate: fastestRunDate
            }
          });
          
          const mins = Math.floor(fastestRunTime / 60);
          const secs = Math.floor(fastestRunTime % 60);
          console.log(`✅ Updated ${user.username}: Perfect Run = ${mins}:${secs.toString().padStart(2, '0')} (from ${perfectRunCandidates.length} run(s))`);
        } else {
          console.log(`  ⏭️  Skipped ${user.username}: No leaderboard entry`);
        }
      }
    }
    
    console.log('\n✅ Perfect Run recalculation complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPerfectRuns();
