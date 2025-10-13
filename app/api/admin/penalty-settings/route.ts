
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const settings = await prisma.penalty_settings.findFirst();
    
    if (!settings) {
      // Create default settings if none exist
      const defaultSettings = await prisma.penalty_settings.create({
        data: {
          id: `penalty_settings_${Date.now()}`,
          level3PenaltySeconds: 1.0,
          level4PenaltySeconds: 1.0,
          level5PenaltySeconds: 1.0,
          level4GridDropPenalty: 5.0,
          level5SponsorPenalty: 10.0,
          updatedAt: new Date()
        }
      });
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching penalty settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const {
      level3PenaltySeconds,
      level4PenaltySeconds,
      level5PenaltySeconds,
      level4GridDropPenalty,
      level5SponsorPenalty
    } = await request.json();

    // Get existing settings or create new ones
    const existingSettings = await prisma.penalty_settings.findFirst();
    
    let updatedSettings;
    if (existingSettings) {
      updatedSettings = await prisma.penalty_settings.update({
        where: { id: existingSettings.id },
        data: {
          level3PenaltySeconds: parseFloat(level3PenaltySeconds.toString()),
          level4PenaltySeconds: parseFloat(level4PenaltySeconds.toString()),
          level5PenaltySeconds: parseFloat(level5PenaltySeconds.toString()),
          level4GridDropPenalty: parseFloat(level4GridDropPenalty.toString()),
          level5SponsorPenalty: parseFloat(level5SponsorPenalty.toString())
        }
      });
    } else {
      updatedSettings = await prisma.penalty_settings.create({
        data: {
          id: `penalty_settings_${Date.now()}`,
          level3PenaltySeconds: parseFloat(level3PenaltySeconds.toString()),
          level4PenaltySeconds: parseFloat(level4PenaltySeconds.toString()),
          level5PenaltySeconds: parseFloat(level5PenaltySeconds.toString()),
          level4GridDropPenalty: parseFloat(level4GridDropPenalty.toString()),
          level5SponsorPenalty: parseFloat(level5SponsorPenalty.toString()),
          updatedAt: new Date()
        }
      });
    }

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating penalty settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
