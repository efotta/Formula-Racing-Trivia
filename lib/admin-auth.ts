
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export async function verifyAdminAccess(request: NextRequest): Promise<{ isValid: boolean; user?: any; error?: string }> {
  try {
    // Get username from headers or request body
    let username: string | null = null;
    
    // Try to get username from Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      username = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
    
    // If not in header, try to get from request body
    if (!username) {
      try {
        const body = await request.clone().json();
        username = body.username;
      } catch {
        // Ignore JSON parsing errors
      }
    }
    
    // If still no username, try to get from URL params
    if (!username) {
      const url = new URL(request.url);
      username = url.searchParams.get('username') || url.searchParams.get('auth');
    }

    if (!username) {
      return {
        isValid: false,
        error: 'Username is required for admin access'
      };
    }

    // Verify user exists and has admin privileges
    const user = await prisma.users.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        isAdmin: true,
        isApproved: true,
        createdAt: true
      }
    });

    if (!user) {
      return {
        isValid: false,
        error: 'User not found'
      };
    }

    if (!user.isAdmin) {
      return {
        isValid: false,
        error: 'User does not have admin privileges'
      };
    }

    if (!user.isApproved) {
      return {
        isValid: false,
        error: 'Admin access not approved'
      };
    }

    return {
      isValid: true,
      user
    };
  } catch (error) {
    console.error('Admin auth verification error:', error);
    return {
      isValid: false,
      error: 'Internal server error during authentication'
    };
  }
}

export function createAdminResponse(statusCode: number, data: any) {
  return Response.json(data, { status: statusCode });
}
