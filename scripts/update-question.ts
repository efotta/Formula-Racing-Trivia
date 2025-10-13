
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateQuestion() {
  try {
    const questionId = 'cmcuxz1ic0005x936xarpckrh';
    
    // Update the question with:
    // 1. Fix the typo: "How may points" -> "How many points"
    // 2. Update wrong answers to include "points"
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        question: 'How many points are awarded for 1st place in a standard F1 race?',
        wrongAnswers: ['30 points', '20 points', '50 points']
      }
    });
    
    console.log('Question updated successfully!');
    console.log('Updated question:', updatedQuestion);
    
    // Verify the update
    const verifyQuestion = await prisma.question.findUnique({
      where: { id: questionId }
    });
    
    console.log('\nVerification:');
    console.log('Question:', verifyQuestion?.question);
    console.log('Correct Answer:', verifyQuestion?.correctAnswer);
    console.log('Wrong Answers:', verifyQuestion?.wrongAnswers);
    
  } catch (error) {
    console.error('Error updating question:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateQuestion();
