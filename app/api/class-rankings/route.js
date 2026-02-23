import { NextResponse } from 'next/server';
import { getClassRankings, getCumulativeScores } from '@/lib/store';
import { loadConfig } from '@/lib/config';

export async function GET() {
  try {
    const config = loadConfig();
    const rankings = await getClassRankings(config);
    const cumulative = await getCumulativeScores(config);
    return NextResponse.json({ rankings, cumulative });
  } catch (err) {
    console.error('Rankings error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
