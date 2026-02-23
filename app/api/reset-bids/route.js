import { NextResponse } from 'next/server';
import { resetAllBids } from '@/lib/store';

export async function POST() {
  try {
    await resetAllBids();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reset error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
