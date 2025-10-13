import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting database seeding...');

    // Create demo user
    const demoUsername = 'johndoe';

    // Check if demo user already exists
    const existingUser = await prisma.users.findUnique({
      where: { username: demoUsername }
    });

    if (existingUser) {
      console.log('Demo user already exists');
    } else {
      // Create demo user (no password needed)
      const demoUser = await prisma.users.create({
        data: {
          id: randomUUID(),
          username: demoUsername,
          updatedAt: new Date()
        }
      });

      console.log('Demo user created:', demoUser.username);

      // Create some sample game scores for the demo user
      const sampleScores = [
        {
          level: 1,
          levelName: 'Rookie',
          questionsCorrect: 10,
          totalQuestions: 10,
          timeInSeconds: 45.2,
          penalties: 0,
          penaltyTime: 0,
          finalTime: 45.2,
          completed: true,
          attempt: 1
        },
        {
          level: 2,
          levelName: 'Midfielder',
          questionsCorrect: 10,
          totalQuestions: 10,
          timeInSeconds: 52.8,
          penalties: 0,
          penaltyTime: 0,
          finalTime: 52.8,
          completed: true,
          attempt: 1
        },
        {
          level: 3,
          levelName: 'Front Runner',
          questionsCorrect: 9,
          totalQuestions: 10,
          timeInSeconds: 68.5,
          penalties: 1,
          penaltyTime: 1.0,
          finalTime: 69.5,
          completed: true,
          attempt: 2
        },
        {
          level: 4,
          levelName: 'World Champion',
          questionsCorrect: 8,
          totalQuestions: 10,
          timeInSeconds: 89.2,
          penalties: 2,
          penaltyTime: 7.0,
          finalTime: 96.2,
          completed: true,
          attempt: 3
        },
        {
          level: 5,
          levelName: 'Formula Legend',
          questionsCorrect: 10,
          totalQuestions: 10,
          timeInSeconds: 112.3,
          penalties: 0,
          penaltyTime: 0,
          finalTime: 112.3,
          completed: true,
          attempt: 1
        }
      ];

      // Create sample scores
      for (const scoreData of sampleScores) {
        await prisma.game_scores.create({
          data: {
            id: randomUUID(),
            userId: demoUser.id,
            username: demoUser.username,
            ...scoreData
          }
        });
      }

      console.log('Sample game scores created for demo user');

      // Create leaderboard entry for demo user (since they completed all levels)
      const totalTime = sampleScores.reduce((sum, score) => sum + score.finalTime, 0);
      const noMistakes = sampleScores.every(score => score.attempt === 1);

      await prisma.leaderboard.create({
        data: {
          id: randomUUID(),
          userId: demoUser.id,
          username: demoUser.username,
          totalTime: totalTime,
          completedDate: new Date(),
          allLevelsCompleted: true,
          noMistakes: noMistakes
        }
      });

      console.log('Leaderboard entry created for demo user');
    }

    // Create approved admin users
    const adminUsernames = ['admin', 'Jeff'];
    
    for (const adminUsername of adminUsernames) {
      const existingAdmin = await prisma.users.findUnique({
        where: { username: adminUsername }
      });

      if (existingAdmin) {
        // Update existing user to be admin if not already
        if (!existingAdmin.isAdmin || !existingAdmin.isApproved) {
          await prisma.users.update({
            where: { username: adminUsername },
            data: {
              isAdmin: true,
              isApproved: true,
              addedBy: 'system'
            }
          });
          console.log(`Updated existing user ${adminUsername} to be an approved admin`);
        } else {
          console.log(`Admin user ${adminUsername} already exists and is approved`);
        }
      } else {
        // Create new admin user
        await prisma.users.create({
          data: {
            id: randomUUID(),
            username: adminUsername,
            isAdmin: true,
            isApproved: true,
            addedBy: 'system',
            updatedAt: new Date()
          }
        });
        console.log(`Created approved admin user: ${adminUsername}`);
      }
    }

    // Load Formula trivia questions
    // Check multiple possible locations for the questions file
    const possiblePaths = [
      path.join(process.cwd(), 'formula_trivia_questions_corrected.json'), // Project root
      path.join(process.cwd(), 'prisma', 'formula_trivia_questions_corrected.json'), // Prisma folder
      path.join(process.cwd(), 'public', 'formula_trivia_questions_corrected.json'), // Public folder
      path.join(process.cwd(), 'scripts', 'formula_trivia_questions_corrected.json'), // Scripts folder
    ];

    const questionsFilePath = possiblePaths.find(p => fs.existsSync(p));
    
    if (questionsFilePath) {
      const existingQuestions = await prisma.questions.count();
      
      if (existingQuestions === 0) {
        console.log('Loading F1 trivia questions...');
        
        const questionsData = JSON.parse(fs.readFileSync(questionsFilePath, 'utf-8'));
        
        for (const questionData of questionsData) {
          await prisma.questions.create({
            data: {
              id: randomUUID(),
              level: questionData.levelNumber,
              levelName: questionData.levelName,
              question: questionData.question,
              correctAnswer: String(questionData.correctAnswer),
              wrongAnswers: questionData.wrongAnswers.map((answer: any) => String(answer)),
              updatedAt: new Date()
            }
          });
        }
        
        console.log(`Loaded ${questionsData.length} F1 trivia questions`);
      } else {
        console.log(`Questions already exist in database (${existingQuestions} questions)`);
      }
    } else {
      console.log('Questions file not found in any of these locations:');
      possiblePaths.forEach(p => console.log(`  - ${p}`));
      console.log('Skipping question loading');
    }

    // Initialize penalty settings if they don't exist
    const existingPenaltySettings = await prisma.penalty_settings.findFirst();
    if (!existingPenaltySettings) {
      await prisma.penalty_settings.create({
        data: {
          id: randomUUID(),
          level3PenaltySeconds: 1.0,
          level4PenaltySeconds: 1.0,
          level5PenaltySeconds: 1.0,
          level4GridDropPenalty: 5.0,
          level5SponsorPenalty: 10.0,
          updatedAt: new Date()
        }
      });
      console.log('Penalty settings initialized');
    }

    // Initialize admin settings if they don't exist
    const existingAdminSettings = await prisma.admin_settings.findFirst();
    if (!existingAdminSettings) {
      await prisma.admin_settings.create({
        data: {
          id: randomUUID(),
          updatedAt: new Date()
        }
      });
      console.log('Admin settings initialized');
    }

    console.log('Database seeding completed successfully!');
    console.log('\nDemo Account Details:');
    console.log('Username: johndoe');
    console.log('Note: No password required - just enter the username!');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
