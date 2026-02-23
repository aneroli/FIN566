import { NextResponse } from 'next/server';
import { getCumulativeScores } from '@/lib/store';
import { loadConfig } from '@/lib/config';

export async function GET() {
  try {
    const config = loadConfig();
    const results = await getCumulativeScores(config);
    return NextResponse.json({ results });
  } catch (err) {
    console.error('Score calculation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
