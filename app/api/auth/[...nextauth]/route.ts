

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

// Basic NextAuth.js compatibility routes for testing framework
// The app uses custom authentication via localStorage and API routes

export async function GET(request: NextRequest, { params }: { params: { nextauth: string[] } }) {
  const action = params.nextauth[0];
  
  switch (action) {
    case 'providers':
      return NextResponse.json({});
    
    case 'session':
      return NextResponse.json({ user: null, expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() });
    
    case 'csrf':
      return NextResponse.json({ csrfToken: 'dummy-csrf-token-for-testing' });
    
    default:
      return NextResponse.json({ message: 'Custom auth system - use app interface' });
  }
}

export async function POST(request: NextRequest, { params }: { params: { nextauth: string[] } }) {
  const action = params.nextauth[0];
  
  // Handle signin and signup requests directly
  if (action === 'signin') {
    try {
      const body = await request.json();
      const { username, password } = body;
      
      if (!username || !password) {
        return NextResponse.json({
          message: 'Username and password are required',
          success: false,
          error: 'Username and password are required'
        }, { status: 400 });
      }
      
      // Find user by username
      const user = await prisma.users.findUnique({
        where: { username }
      });
      
      if (!user || !user.password) {
        return NextResponse.json({
          message: 'Invalid credentials',
          success: false,
          error: 'Invalid credentials'
        }, { status: 401 });
      }
      
      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return NextResponse.json({
          message: 'Invalid credentials',
          success: false,
          error: 'Invalid credentials'
        }, { status: 401 });
      }
      
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
  
  if (action === 'signup') {
    try {
      const body = await request.json();
      const { username, password } = body;
      
      if (!username || !password) {
        return NextResponse.json({
          message: 'Username and password are required',
          success: false,
          error: 'Username and password are required'
        }, { status: 400 });
      }
      
      // Check if user already exists
      const existingUser = await prisma.users.findUnique({
        where: { username }
      });
      
      if (existingUser) {
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
          isApproved: true,
          needsPasswordSetup: false,
          updatedAt: new Date()
        }
      });
      
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
  
  // Handle other NextAuth requests
  try {
    await request.json(); // Consume the request body for other actions
  } catch (e) {
    // Ignore JSON parsing errors for compatibility
  }
  
  switch (action) {
    case 'signout':
      return NextResponse.json({ url: '/' });
    
    case 'callback':
      return NextResponse.json({ url: '/' });
    
    case 'csrf':
      return NextResponse.json({ csrfToken: 'dummy-csrf-token-for-testing' });
    
    default:
      return NextResponse.json({ message: 'Custom auth system - use app interface' });
  }
}

