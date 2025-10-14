
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

// GET - List all users (for admin management)
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // Get all users with their admin status, ordered alphabetically
    const users = await prisma.users.findMany({
      select: {
        id: true,
        username: true,
        isAdmin: true,
        isApproved: true,
        addedBy: true,
        createdAt: true,
        _count: {
          select: {
            game_scores: true
          }
        }
      },
      orderBy: {
        username: 'asc'
      }
    });

    return NextResponse.json({
      users,
      total: users.length,
      admins: users.filter((u): u is typeof users[number] => u.isAdmin && u.isApproved).length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a user (admin only)
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

    // Prevent admin from deleting themselves
    if (targetUsername === authResult.user?.username) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await prisma.users.findUnique({
      where: { username: targetUsername }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deletion of system-created admins by non-system admins
    if (targetUser.isAdmin && targetUser.addedBy === 'system') {
      return NextResponse.json({ 
        error: 'Cannot delete system admin users' 
      }, { status: 403 });
    }

    // Delete the user (Prisma will handle cascading deletes due to onDelete: Cascade)
    await prisma.users.delete({
      where: { username: targetUsername }
    });

    return NextResponse.json({ 
      message: `User ${targetUsername} deleted successfully` 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
