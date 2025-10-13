

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

// Ensure environment variables are loaded
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found in environment variables');
}

export async function POST(request: NextRequest) {
  try {
    console.log('Signin route called');
    const body = await request.json();
    const { username, password } = body;
    
    console.log('Signin route called with:', { username: username || 'missing', password: password ? 'provided' : 'missing' });
    
    if (!username || !password) {
      console.log('Missing username or password');
      return NextResponse.json({
        message: 'Username and password are required',
        success: false,
        error: 'Username and password are required'
      }, { status: 400 });
    }
    
    // Find user by username
    const user = await prisma.users.findUnique({
      where: {
        username
      }
    });
    
    if (!user || !user.password) {
      console.log('User not found or no password');
      return NextResponse.json({
        message: 'Invalid credentials',
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      console.log('Invalid password');
      return NextResponse.json({
        message: 'Invalid credentials',
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }
    
    console.log('Signin successful for user:', user.username);
    return NextResponse.json({
      message: 'Login successful',
      success: true,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin || false
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json({
      message: 'Internal server error',
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

