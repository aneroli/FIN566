import { NextResponse } from 'next/server';
import { getProgress } from '@/lib/store';
import { loadConfig } from '@/lib/config';

export async function GET() {
  try {
    const config = loadConfig();
    const progressData = await getProgress(config);
    return NextResponse.json({ progressData });
  } catch (err) {
    console.error('Progress error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
