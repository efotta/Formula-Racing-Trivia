

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

// Start a new perfect run session
export async function POST(request: NextRequest) {
  try {
    const { userId, username } = await request.json();

    if (!userId || !username) {
      return NextResponse.json({ error: 'User ID and username are required' }, { status: 400 });
    }

    // Validate user exists
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already has an active perfect run session
    const activeSession = await prisma.perfect_run_sessions.findFirst({
      where: {
        userId,
        completed: false
      }
    });

    if (activeSession) {
      return NextResponse.json({ 
        sessionId: activeSession.sessionId,
        currentLevel: activeSession.currentLevel,
        startedAt: activeSession.startedAt,
        message: 'Resuming existing perfect run session'
      });
    }

    // Create new perfect run session
    const sessionId = nanoid();
    const session = await prisma.perfect_run_sessions.create({
      data: {
        id: `session_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        userId,
        username,
        sessionId,
        currentLevel: 1,
        totalTime: 0
      }
    });

    return NextResponse.json({
      sessionId: session.sessionId,
      currentLevel: session.currentLevel,
      startedAt: session.startedAt,
      message: 'Perfect run session started'
    });
  } catch (error) {
    console.error('Error creating perfect run session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get perfect run session status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    let session;
    if (sessionId) {
      // Get specific session
      session = await prisma.perfect_run_sessions.findUnique({
        where: { sessionId }
      });
    } else {
      // Get active session for user
      session = await prisma.perfect_run_sessions.findFirst({
        where: {
          userId,
          completed: false
        },
        orderBy: {
          startedAt: 'desc'
        }
      });
    }

    if (!session) {
      return NextResponse.json({ session: null });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error fetching perfect run session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Cancel/abort perfect run session
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');

    if (!sessionId || !userId) {
      return NextResponse.json({ error: 'Session ID and User ID are required' }, { status: 400 });
    }

    const session = await prisma.perfect_run_sessions.findUnique({
      where: { sessionId }
    });

    if (!session || session.userId !== userId) {
      return NextResponse.json({ error: 'Session not found or unauthorized' }, { status: 404 });
    }

    // Delete the session
    await prisma.perfect_run_sessions.delete({
      where: { sessionId }
    });

    return NextResponse.json({ message: 'Perfect run session cancelled' });
  } catch (error) {
    console.error('Error cancelling perfect run session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
