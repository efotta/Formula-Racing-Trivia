

import { NextResponse } from 'next/server';

export async function GET() {
  // CSRF token endpoint for testing framework compatibility
  return NextResponse.json({ csrfToken: 'dummy-token' });
}

export async function POST() {
  // CSRF token endpoint for testing framework compatibility
  return NextResponse.json({ csrfToken: 'dummy-token' });
}

