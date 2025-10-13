
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { level, levelName, question, correctAnswer, wrongAnswers, questionType } = await request.json();

    // Build update data object
    const updateData: any = {};

    // Handle full question update (all fields provided)
    if (level && levelName && question && correctAnswer && wrongAnswers) {
      // Validate for full update
      if (!Array.isArray(wrongAnswers) || wrongAnswers.length !== 3) {
        return NextResponse.json({ error: 'Exactly 3 wrong answers are required' }, { status: 400 });
      }

      updateData.level = parseInt(level);
      updateData.levelName = levelName;
      updateData.question = question;
      updateData.correctAnswer = correctAnswer;
      updateData.wrongAnswers = wrongAnswers;
    }

    // Handle questionType update (can be partial or full)
    if (questionType) {
      if (!['Fixed', 'Fluid'].includes(questionType)) {
        return NextResponse.json({ error: 'Question type must be either Fixed or Fluid' }, { status: 400 });
      }
      updateData.questionType = questionType;
    }

    // Ensure we have something to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
    }

    const updatedQuestion = await prisma.questions.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await prisma.questions.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
