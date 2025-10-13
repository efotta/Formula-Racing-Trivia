
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { username, type, message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        id: `feedback_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        username: username || null,
        type: type || 'general',
        message: message.trim()
      }
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
