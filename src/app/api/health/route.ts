import { NextRequest, NextResponse } from 'next/server';
import { getRuntimeConfig } from '@/lib/runtime-config';

export async function GET(request: NextRequest) {
  const config = getRuntimeConfig();
  
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'filemanager',
      environment: config.nodeEnv || 'development'
    },
    { status: 200 }
  );
}
