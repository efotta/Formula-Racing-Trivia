
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId, username, password } = await request.json();

    // Validate required fields
    if (!userId || !username || !password) {
      return NextResponse.json(
        { error: 'User ID, username, and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { 
          error: 'Password must be at least 6 characters long',
          code: 'PASSWORD_TOO_SHORT'
        },
        { status: 400 }
      );
    }

    // Find the user
    const existingUser = await prisma.users.findUnique({
      where: {
        id: userId,
        username: username
      }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user with password
    const updatedUser = await prisma.users.update({
      where: {
        id: userId
      },
      data: {
        password: hashedPassword,
        needsPasswordSetup: false,
      },
      select: {
        id: true,
        username: true,
        isAdmin: true,
      }
    });

    return NextResponse.json(
      { 
        message: `Password set successfully! Welcome back, ${updatedUser.username}!`,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          isAdmin: updatedUser.isAdmin || false
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
