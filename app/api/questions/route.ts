
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');

    if (!level) {
      return NextResponse.json({ error: 'Level parameter is required' }, { status: 400 });
    }

    const levelNumber = parseInt(level);
    if (levelNumber < 1 || levelNumber > 5) {
      return NextResponse.json({ error: 'Level must be between 1 and 5' }, { status: 400 });
    }

    const questions = await prisma.questions.findMany({
      where: {
        level: levelNumber
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
