import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'filemanager',
      environment: process.env.NODE_ENV || 'development'
    },
    { status: 200 }
  );
}
