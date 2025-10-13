
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const questions = await prisma.questions.findMany({
      orderBy: [
        { level: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { level, levelName, question, correctAnswer, wrongAnswers, questionType } = await request.json();

    // Validate required fields
    if (!level || !levelName || !question || !correctAnswer || !wrongAnswers) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!Array.isArray(wrongAnswers) || wrongAnswers.length !== 3) {
      return NextResponse.json({ error: 'Exactly 3 wrong answers are required' }, { status: 400 });
    }

    // Validate questionType
    if (questionType && !['Fixed', 'Fluid'].includes(questionType)) {
      return NextResponse.json({ error: 'Question type must be either Fixed or Fluid' }, { status: 400 });
    }

    const newQuestion = await prisma.questions.create({
      data: {
        id: `question_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        level: parseInt(level),
        levelName,
        question,
        correctAnswer,
        wrongAnswers,
        questionType: questionType || 'Fixed', // Default to Fixed if not provided
        updatedAt: new Date()
      }
    });

    return NextResponse.json(newQuestion);
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
