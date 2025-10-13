import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function exportData() {
  try {
    const users = await prisma.user.findMany({
      include: {
        scores: true
      }
    });
    
    console.log(JSON.stringify({
      totalUsers: users.length,
      users: users.map(u => ({
        username: u.username,
        email: u.email,
        isAdmin: u.isAdmin,
        totalScores: u.scores.length,
        highestScore: Math.max(...u.scores.map(s => s.score), 0)
      }))
    }, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
