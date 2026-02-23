// lib/store.js
// Persistent storage using Upstash Redis (via Vercel Marketplace).
// Falls back to in-memory for local development.

let redis = null;

async function getRedis() {
  if (redis) return redis;
  try {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;
    const { Redis } = await import('@upstash/redis');
    redis = new Redis({ url, token });
    return redis;
  } catch {
    return null;
  }
}

// ─── In-memory fallback for local dev ───
const memStore = { bids: {} };

async function loadBids() {
  const client = await getRedis();
  if (client) {
    try {
      const data = await client.get('exercise-bids');
      return data || {};
    } catch (err) {
      console.error('Redis read error, falling back to memory:', err.message);
      return memStore.bids;
    }
  }
  return memStore.bids;
}

async function saveBids(bids) {
  const client = await getRedis();
  if (client) {
    try {
      await client.set('exercise-bids', bids);
    } catch (err) {
      console.error('Redis write error:', err.message);
    }
  }
  memStore.bids = bids;
}

// ─── Public API ───

export async function submitBid(groupId, groupName, round, data) {
  const bids = await loadBids();
  if (!bids[groupId]) {
    bids[groupId] = { groupName, bids: {} };
  }
  bids[groupId].groupName = groupName;
  bids[groupId].bids[round] = {
    amount: parseFloat(data.bidAmount),
    answers: data.answers || {},
    reflection: data.reflection || null,
    submitterName: data.submitterName || null,
    fileName: data.fileName || null,
    fileUrl: data.fileUrl || null,
    timestamp: new Date().toISOString(),
  };
  await saveBids(bids);
  return bids[groupId].bids[round];
}

export async function getAllBids() {
  return await loadBids();
}

export async function getHighestBidForRound(round) {
  const bids = await loadBids();
  let highest = 0;
  let leadingGroup = null;
  for (const [groupId, groupData] of Object.entries(bids)) {
    const bid = groupData.bids?.[round];
    if (bid && bid.amount > highest) {
      highest = bid.amount;
      leadingGroup = groupId;
    }
  }
  return { highest, leadingGroup };
}

export async function resetAllBids() {
  await saveBids({});
}

export async function getProgress(config) {
  const bids = await loadBids();
  const progress = {};
  for (const group of config.groups) {
    const groupBids = bids[group.id];
    progress[group.id] = {
      teamName: group.name,
      emoji: group.emoji || '',
      groupId: group.id,
      currentRound: groupBids
        ? Math.max(...Object.keys(groupBids.bids).map(Number), -1) + 1
        : 0,
      bids: {},
    };
    for (let r = 0; r <= config.max_rounds; r++) {
      progress[group.id].bids[r] = groupBids?.bids?.[r] || null;
    }
  }
  return progress;
}

export async function getClassRankings(config) {
  const bids = await loadBids();
  const trueValues = config.true_values || {};
  const rankings = {};

  for (let r = 0; r <= config.max_rounds; r++) {
    const trueVal = trueValues[r];
    if (!trueVal) continue;

    const entries = [];
    for (const group of config.groups) {
      const bid = bids[group.id]?.bids?.[r];
      if (bid) {
        const deviation = Math.abs(bid.amount - trueVal) / trueVal;
        const accuracy = Math.max(0, 100 - deviation * 100);
        entries.push({
          groupId: group.id,
          teamName: group.name,
          emoji: group.emoji || '',
          accuracy: Math.round(accuracy * 10) / 10,
          submitted: true,
        });
      } else {
        entries.push({
          groupId: group.id,
          teamName: group.name,
          emoji: group.emoji || '',
          accuracy: 0,
          submitted: false,
        });
      }
    }
    entries.sort((a, b) => {
      if (a.submitted && !b.submitted) return -1;
      if (!a.submitted && b.submitted) return 1;
      return b.accuracy - a.accuracy;
    });
    rankings[r] = entries;
  }

  return rankings;
}

export async function getCumulativeScores(config) {
  const bids = await loadBids();
  const trueValues = config.true_values || {};
  const maxPoints = config.scoring?.max_points_per_round || 100;
  const penaltyPerPercent = config.scoring?.penalty_per_percent || 5;

  const teamScores = {};
  for (const group of config.groups) {
    teamScores[group.id] = {
      groupId: group.id,
      teamName: group.name,
      emoji: group.emoji || '',
      totalScore: 0,
      roundScores: {},
    };
  }

  for (let r = 0; r <= config.max_rounds; r++) {
    const trueVal = trueValues[r];
    if (!trueVal) continue;

    for (const group of config.groups) {
      const bid = bids[group.id]?.bids?.[r];
      if (bid) {
        const deviation = (Math.abs(bid.amount - trueVal) / trueVal) * 100;
        const score = Math.max(0, Math.round(maxPoints - deviation * penaltyPerPercent));
        teamScores[group.id].roundScores[r] = {
          bid: bid.amount,
          deviation: deviation.toFixed(1),
          score,
        };
        teamScores[group.id].totalScore += score;
      } else {
        teamScores[group.id].roundScores[r] = { bid: null, deviation: null, score: 0 };
      }
    }
  }

  const sorted = Object.values(teamScores).sort((a, b) => b.totalScore - a.totalScore);
  return {
    details: sorted,
    winner: sorted[0] || null,
    trueValues,
  };
}
