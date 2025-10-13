
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface QuestionData {
  levelNumber: number;
  levelName: string;
  question: string;
  correctAnswer: string | number;
  wrongAnswers: (string | number)[];
}

async function migrateQuestions() {
  try {
    console.log('🚀 Starting Formula Trivia Questions Migration...');
    
    // Read the corrected JSON file
    const filePath = path.join(__dirname, '..', 'formula_trivia_questions_corrected.json');
    const jsonData = fs.readFileSync(filePath, 'utf8');
    const questionsData: QuestionData[] = JSON.parse(jsonData);
    
    console.log(`📖 Loaded ${questionsData.length} questions from corrected dataset`);
    
    // Clear existing questions
    console.log('🧹 Clearing existing questions...');
    const deletedCount = await prisma.question.deleteMany({});
    console.log(`✅ Deleted ${deletedCount.count} existing questions`);
    
    // Insert new questions
    console.log('📝 Inserting new questions...');
    let insertedCount = 0;
    
    for (const questionData of questionsData) {
      try {
        // Convert all answers to strings for consistency
        const correctAnswer = String(questionData.correctAnswer);
        const wrongAnswers = questionData.wrongAnswers.map(answer => String(answer));
        
        await prisma.question.create({
          data: {
            level: questionData.levelNumber,
            levelName: questionData.levelName,
            question: questionData.question,
            correctAnswer,
            wrongAnswers
          }
        });
        
        insertedCount++;
        
        // Log progress every 20 questions
        if (insertedCount % 20 === 0) {
          console.log(`✅ Inserted ${insertedCount}/${questionsData.length} questions`);
        }
      } catch (error) {
        console.error(`❌ Error inserting question ${insertedCount + 1}:`, error);
        console.error('Question data:', questionData);
      }
    }
    
    console.log(`🎉 Migration completed successfully!`);
    console.log(`📊 Total questions inserted: ${insertedCount}`);
    
    // Verify the migration
    console.log('🔍 Verifying migration...');
    const totalQuestions = await prisma.question.count();
    console.log(`✅ Total questions in database: ${totalQuestions}`);
    
    // Check questions by level
    for (let level = 1; level <= 5; level++) {
      const levelCount = await prisma.question.count({
        where: { level: level }
      });
      console.log(`📋 Level ${level}: ${levelCount} questions`);
    }
    
    // Verify the fixed question 131
    const fixedQuestion = await prisma.question.findFirst({
      where: {
        question: "How many of the current F1 races are held on street circuits?"
      }
    });
    
    if (fixedQuestion) {
      console.log('🔧 Fixed Question 131 verification:');
      console.log(`   Question: ${fixedQuestion.question}`);
      console.log(`   Correct Answer: ${fixedQuestion.correctAnswer}`);
      console.log(`   Wrong Answers: ${JSON.stringify(fixedQuestion.wrongAnswers)}`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateQuestions()
  .then(() => {
    console.log('✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
