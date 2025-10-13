
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

// GET - List all admin users
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // Get all admin users
    const admins = await prisma.users.findMany({
      where: {
        isAdmin: true,
        isApproved: true
      },
      select: {
        id: true,
        username: true,
        addedBy: true,
        createdAt: true
      },
      orderBy: {
        username: 'asc'
      }
    });

    return NextResponse.json({
      admins,
      total: admins.length
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add new admin user
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { targetUsername } = await request.json();

    if (!targetUsername) {
      return NextResponse.json({ error: 'Target username is required' }, { status: 400 });
    }

    // Validate username format
    if (targetUsername.length < 3 || targetUsername.length > 20) {
      return NextResponse.json({ 
        error: 'Username must be between 3 and 20 characters' 
      }, { status: 400 });
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(targetUsername)) {
      return NextResponse.json({ 
        error: 'Username can only contain letters, numbers, and underscores' 
      }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { username: targetUsername }
    });

    if (existingUser) {
      // User exists - update their admin status
      if (existingUser.isAdmin && existingUser.isApproved) {
        return NextResponse.json({ 
          error: 'User is already an approved admin' 
        }, { status: 400 });
      }

      const updatedUser = await prisma.users.update({
        where: { username: targetUsername },
        data: {
          isAdmin: true,
          isApproved: true,
          addedBy: authResult.user?.username || 'unknown'
        },
        select: {
          id: true,
          username: true,
          addedBy: true,
          createdAt: true
        }
      });

      return NextResponse.json({
        message: `${targetUsername} has been granted admin privileges`,
        admin: updatedUser
      });
    } else {
      // User doesn't exist - create new admin user
      const newAdmin = await prisma.users.create({
        data: {
          id: `admin_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          username: targetUsername,
          updatedAt: new Date(),
          isAdmin: true,
          isApproved: true,
          addedBy: authResult.user?.username || 'unknown'
        },
        select: {
          id: true,
          username: true,
          addedBy: true,
          createdAt: true
        }
      });

      return NextResponse.json({
        message: `New admin user ${targetUsername} created successfully`,
        admin: newAdmin
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error adding admin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove admin privileges
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUsername = searchParams.get('username');

    if (!targetUsername) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Prevent admin from removing their own privileges
    if (targetUsername === authResult.user?.username) {
      return NextResponse.json({ 
        error: 'Cannot remove your own admin privileges' 
      }, { status: 400 });
    }

    // Check if target user exists and is admin
    const targetUser = await prisma.users.findUnique({
      where: { username: targetUsername }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!targetUser.isAdmin) {
      return NextResponse.json({ 
        error: 'User is not an admin' 
      }, { status: 400 });
    }

    // Prevent removal of system-created admins
    if (targetUser.addedBy === 'system') {
      return NextResponse.json({ 
        error: 'Cannot remove privileges from system admin users' 
      }, { status: 403 });
    }

    // Remove admin privileges
    await prisma.users.update({
      where: { username: targetUsername },
      data: {
        isAdmin: false,
        isApproved: false,
        addedBy: null
      }
    });

    return NextResponse.json({ 
      message: `Admin privileges removed from ${targetUsername}` 
    });
  } catch (error) {
    console.error('Error removing admin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
