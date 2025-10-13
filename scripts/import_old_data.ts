
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function importOldData() {
  console.log('Starting data import from old database...\n');

  try {
    // Read the exported data
    const dataPath = path.join(process.cwd(), '../../../old_database_export.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const oldData = JSON.parse(rawData);

    console.log(`Found ${oldData.totalUsers} users and ${oldData.totalScores} scores to import\n`);

    // Import users first
    console.log('Importing users...');
    for (const user of oldData.users) {
      try {
        await prisma.user.upsert({
          where: { username: user.username },
          update: {
            isAdmin: user.isAdmin,
            isApproved: user.isApproved,
            password: user.password,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
          },
          create: {
            id: user.id,
            username: user.username,
            isAdmin: user.isAdmin,
            isApproved: user.isApproved,
            password: user.password,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
          },
        });
        console.log(`✓ Imported user: ${user.username}`);
      } catch (error: any) {
        console.error(`✗ Error importing user ${user.username}:`, error.message);
      }
    }

    // Import scores
    console.log('\nImporting scores...');
    let importedScores = 0;
    for (const score of oldData.scores) {
      try {
        await prisma.score.create({
          data: {
            id: score.id,
            userId: score.userId,
            username: score.username,
            level: score.level,
            levelName: score.levelName,
            score: score.questionsCorrect,
            totalQuestions: score.totalQuestions,
            timeInSeconds: score.timeInSeconds,
            penalties: score.penalties,
            penaltyTime: score.penaltyTime,
            finalTime: score.finalTime,
            completed: score.completed,
            attempt: score.attempt,
            createdAt: new Date(score.createdAt),
          },
        });
        importedScores++;
        if (importedScores % 50 === 0) {
          console.log(`  Imported ${importedScores}/${oldData.totalScores} scores...`);
        }
      } catch (error: any) {
        // Skip if score already exists (duplicate ID)
        if (!error.message.includes('Unique constraint')) {
          console.error(`✗ Error importing score:`, error.message);
        }
      }
    }

    console.log(`\n✅ Data import completed successfully!`);
    console.log(`   - Users imported: ${oldData.totalUsers}`);
    console.log(`   - Scores imported: ${importedScores}`);
    
  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importOldData();
