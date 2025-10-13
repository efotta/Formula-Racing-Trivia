
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { processed } = await request.json();

    const updatedFeedback = await prisma.feedback.update({
      where: { id: params.id },
      data: { processed: Boolean(processed) }
    });

    return NextResponse.json(updatedFeedback);
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // Delete the feedback
    const deletedFeedback = await prisma.feedback.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Feedback deleted successfully',
      deletedFeedback 
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
