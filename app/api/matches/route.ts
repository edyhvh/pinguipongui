import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '../../../lib/blob';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.entries)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { entries } = body;
    if (entries.length === 0) return NextResponse.json({ ok: true });
    if (entries.length > 500) {
      return NextResponse.json({ error: 'Too many matches in one request' }, { status: 400 });
    }

    // Validate shape of each entry
    for (const e of entries) {
      if (typeof e.winnerId !== 'string' || typeof e.loserId !== 'string') {
        return NextResponse.json({ error: 'Invalid entry format' }, { status: 400 });
      }
      if (e.winnerId === e.loserId) {
        return NextResponse.json({ error: 'Winner and loser must be different' }, { status: 400 });
      }
    }

    const data = await readData();
    const playerIds = new Set(data.players.map((p) => p.id));

    // Validate all player IDs exist
    for (const e of entries) {
      if (!playerIds.has(e.winnerId) || !playerIds.has(e.loserId)) {
        return NextResponse.json({ error: 'Unknown player ID' }, { status: 400 });
      }
    }

    const base = Date.now();
    const newMatches = entries.map((e: { winnerId: string; loserId: string }, i: number) => ({
      id: crypto.randomUUID(),
      player1Id: e.winnerId,
      player2Id: e.loserId,
      player1Score: 1,
      player2Score: 0,
      winnerId: e.winnerId,
      loserId: e.loserId,
      playedAt: new Date(base + i * 1000).toISOString(),
    }));

    // Build readable description
    const playerMap = new Map(data.players.map((p) => [p.id, p.name]));
    const tally = new Map<string, { winner: string; loser: string; count: number }>();
    for (const e of entries) {
      const key = `${e.winnerId}>${e.loserId}`;
      const cur = tally.get(key);
      if (cur) cur.count++;
      else tally.set(key, { winner: playerMap.get(e.winnerId) ?? '?', loser: playerMap.get(e.loserId) ?? '?', count: 1 });
    }
    const parts = Array.from(tally.values()).map(
      (t) => `${t.winner} beat ${t.loser}${t.count > 1 ? ` ×${t.count}` : ''}`,
    );
    const description = `Added ${entries.length} match${entries.length !== 1 ? 'es' : ''}: ${parts.join(', ')}`;

    const historyEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action: 'add_matches' as const,
      description,
      addedMatches: newMatches,
    };

    await writeData({
      ...data,
      matches: [...[...newMatches].reverse(), ...data.matches],
      history: [historyEntry, ...data.history],
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('POST /api/matches:', err);
    return NextResponse.json({ error: 'Failed to add matches' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.id !== 'string' || !body.id.trim()) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { id } = body;
    const data = await readData();
    const match = data.matches.find((m) => m.id === id);
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

    const playerMap = new Map(data.players.map((p) => [p.id, p.name]));
    const historyEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action: 'remove_match' as const,
      description: `Removed match: ${playerMap.get(match.winnerId) ?? '?'} beat ${playerMap.get(match.loserId) ?? '?'}`,
      removedMatch: match,
    };

    await writeData({
      ...data,
      matches: data.matches.filter((m) => m.id !== id),
      history: [historyEntry, ...data.history],
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/matches:', err);
    return NextResponse.json({ error: 'Failed to remove match' }, { status: 500 });
  }
}
