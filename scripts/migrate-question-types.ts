
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
config();

const prisma = new PrismaClient();

async function migrateQuestionTypes() {
  try {
    console.log('Starting question type migration...');
    
    // Update all existing questions to have questionType = 'Fixed' 
    // This ensures consistency for any questions that might not have the default value
    const result = await prisma.question.updateMany({
      data: {
        questionType: 'Fixed',
      },
    });
    
    console.log(`Migration completed. Updated ${result.count} questions to 'Fixed'.`);
    
    // Verify the migration
    const totalQuestions = await prisma.question.count();
    const fixedQuestions = await prisma.question.count({
      where: { questionType: 'Fixed' }
    });
    const fluidQuestions = await prisma.question.count({
      where: { questionType: 'Fluid' }
    });
    
    console.log(`Total questions: ${totalQuestions}`);
    console.log(`Fixed questions: ${fixedQuestions}`);
    console.log(`Fluid questions: ${fluidQuestions}`);
    
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateQuestionTypes();
