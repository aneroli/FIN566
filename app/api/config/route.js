import { NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';

export async function GET() {
  try {
    const config = loadConfig();
    return NextResponse.json(config);
  } catch (err) {
    console.error('Config error:', err);
    return NextResponse.json({ error: 'Failed to load config' }, { status: 500 });
  }
}
