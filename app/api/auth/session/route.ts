

import { NextResponse } from 'next/server';

export async function GET() {
  // Session endpoint for testing framework compatibility
  return NextResponse.json({
    user: null,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });
}

export async function POST() {
  // Session endpoint for testing framework compatibility
  return NextResponse.json({
    user: null,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });
}

