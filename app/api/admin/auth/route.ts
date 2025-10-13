
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

// POST - Verify admin access
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminAccess(request);
    
    if (!authResult.isValid) {
      return NextResponse.json({ 
        authenticated: false, 
        error: authResult.error 
      }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: authResult.user
    });
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json({ 
      authenticated: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
