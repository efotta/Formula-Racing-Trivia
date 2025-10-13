

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

// Ensure environment variables are loaded
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found in environment variables');
}

export async function POST(request: NextRequest) {
  try {
    console.log('Signup route called');
    const body = await request.json();
    const { username, password } = body;
    
    console.log('Signup route called with:', { username: username || 'missing', password: password ? 'provided' : 'missing' });
    
    if (!username || !password) {
      console.log('Missing username or password');
      return NextResponse.json({
        message: 'Username and password are required',
        success: false,
        error: 'Username and password are required'
      }, { status: 400 });
    }
    
    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: {
        username
      }
    });
    
    if (existingUser) {
      console.log('User already exists');
      return NextResponse.json({
        message: 'User already exists',
        success: false,
        error: 'User already exists'
      }, { status: 409 });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await prisma.users.create({
      data: {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username,
        password: hashedPassword,
        isAdmin: false,
        isApproved: true, // Auto-approve for test users
        needsPasswordSetup: false,
        updatedAt: new Date()
      }
    });
    
    console.log('Signup successful for user:', user.username);
    return NextResponse.json({
      message: 'User created successfully',
      success: true,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin || false
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({
      message: 'Internal server error',
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

