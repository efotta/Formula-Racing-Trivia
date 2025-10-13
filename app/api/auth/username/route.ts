

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

// Ensure environment variables are loaded
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found in environment variables');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, flow } = body;
    
    console.log('Username route called with:', { 
      username: username || 'missing', 
      password: password ? 'provided' : 'missing',
      flow: flow || 'check'
    });
    
    // If no flow is specified, this is just a username check
    if (!flow) {
      if (!username) {
        return NextResponse.json({
          error: 'Username is required',
          userExists: false
        }, { status: 400 });
      }

      // Check if user exists
      const user = await prisma.users.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          isAdmin: true
        }
      });

      if (user) {
        return NextResponse.json({
          userExists: true,
          user: {
            id: user.id,
            username: user.username,
            isAdmin: user.isAdmin || false
          }
        }, { status: 200 });
      } else {
        return NextResponse.json({
          userExists: false
        }, { status: 200 });
      }
    }

    // Handle login flow
    if (flow === 'login') {
      if (!username || !password) {
        return NextResponse.json({
          error: 'Username and password are required',
          success: false
        }, { status: 400 });
      }

      // Find user by username
      const user = await prisma.users.findUnique({
        where: { username }
      });

      if (!user || !user.password) {
        return NextResponse.json({
          error: 'Invalid credentials',
          success: false
        }, { status: 401 });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return NextResponse.json({
          error: 'Invalid credentials',
          success: false
        }, { status: 401 });
      }

      console.log('Login successful for user:', user.username);
      return NextResponse.json({
        message: 'Login successful',
        success: true,
        user: {
          id: user.id,
          username: user.username,
          isAdmin: user.isAdmin || false
        }
      }, { status: 200 });
    }

    // Handle register flow
    if (flow === 'register') {
      if (!username || !password) {
        return NextResponse.json({
          error: 'Username and password are required',
          success: false
        }, { status: 400 });
      }

      // Check if user already exists
      const existingUser = await prisma.users.findUnique({
        where: { username }
      });

      if (existingUser) {
        return NextResponse.json({
          error: 'User already exists',
          success: false
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

      console.log('Registration successful for user:', user.username);
      return NextResponse.json({
        message: 'User created successfully',
        success: true,
        user: {
          id: user.id,
          username: user.username,
          isAdmin: user.isAdmin || false
        }
      }, { status: 201 });
    }

    return NextResponse.json({
      error: 'Invalid flow parameter',
      success: false
    }, { status: 400 });

  } catch (error) {
    console.error('Username route error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      success: false
    }, { status: 500 });
  }
}

