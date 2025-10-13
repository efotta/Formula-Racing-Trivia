
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findQuestion() {
  try {
    // Search for the question about points for 1st place
    const questions = await prisma.question.findMany({
      where: {
        OR: [
          { question: { contains: 'points are awarded for 1st place' } },
          { question: { contains: 'points awarded for 1st place' } }
        ]
      }
    });

    console.log('Found questions:', questions);
    
    if (questions.length > 0) {
      questions.forEach((q, index) => {
        console.log(`\nQuestion ${index + 1}:`);
        console.log('ID:', q.id);
        console.log('Level:', q.level);
        console.log('Question:', q.question);
        console.log('Correct Answer:', q.correctAnswer);
        console.log('Wrong Answers:', q.wrongAnswers);
      });
    } else {
      console.log('No questions found. Let me search more broadly...');
      
      // Search more broadly for "points" and "1st place"
      const broadQuestions = await prisma.question.findMany({
        where: {
          AND: [
            { question: { contains: 'points' } },
            { question: { contains: '1st place' } }
          ]
        }
      });
      
      console.log('Broad search results:', broadQuestions);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findQuestion();
