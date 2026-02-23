import { NextResponse } from 'next/server';
import { submitBid, getHighestBidForRound } from '@/lib/store';
import { loadConfig } from '@/lib/config';

async function uploadToBlob(file, fileName) {
  try {
    const { put } = await import('@vercel/blob');
    const blob = await put(fileName, file, { access: 'public' });
    return { fileName, fileUrl: blob.url };
  } catch (err) {
    console.error('Blob upload error (may not be configured):', err.message);
    return { fileName, fileUrl: null };
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();

    const submitterName = formData.get('submitterName') || '';
    const bidAmount = formData.get('bidAmount');
    const round = parseInt(formData.get('round'));
    const groupId = formData.get('groupId');
    const reflection = formData.get('reflection') || '';
    const answersJson = formData.get('answers') || '{}';
    const file = formData.get('file');

    let answers = {};
    try { answers = JSON.parse(answersJson); } catch(e) {}

    if (!bidAmount || isNaN(round) || !groupId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const config = loadConfig();
    const group = config.groups.find((g) => g.id === groupId);
    if (!group) {
      return NextResponse.json({ error: 'Invalid group' }, { status: 400 });
    }

    let fileName = null;
    let fileUrl = null;

    if (file && file.size > 0) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const blobName = `${groupId}/round${round}_${Date.now()}_${safeName}`;
      const result = await uploadToBlob(file, blobName);
      fileName = result.fileName;
      fileUrl = result.fileUrl;
    }

    await submitBid(groupId, group.name, round, {
      bidAmount,
      answers,
      reflection,
      submitterName,
      fileName,
      fileUrl,
    });

    const { leadingGroup } = await getHighestBidForRound(round);
    const isLeading = leadingGroup === groupId;

    return NextResponse.json({ success: true, isLeading });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: `Upload failed: ${err.message}` }, { status: 500 });
  }
}
