import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData, emptyData } from '../../../lib/blob';
import { withLock } from '../../../lib/lock';

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

    const ID_RE = /^[a-zA-Z0-9_-]+$/;
    // Validate shape of each entry
    for (const e of entries) {
      if (typeof e.winnerId !== 'string' || typeof e.loserId !== 'string') {
        return NextResponse.json({ error: 'Invalid entry format' }, { status: 400 });
      }
      if (!e.winnerId || e.winnerId.length > 64 || !ID_RE.test(e.winnerId) ||
          !e.loserId  || e.loserId.length  > 64 || !ID_RE.test(e.loserId)) {
        return NextResponse.json({ error: 'Invalid player ID format' }, { status: 400 });
      }
      if (e.winnerId === e.loserId) {
        return NextResponse.json({ error: 'Winner and loser must be different' }, { status: 400 });
      }
    }

    await withLock(async () => {
      const data = await readData() ?? { players: [], matches: [], history: [], seeded: true };
      const playerIds = new Set(data.players.map((p) => p.id));

      for (const e of entries) {
        if (!playerIds.has(e.winnerId) || !playerIds.has(e.loserId)) {
          throw Object.assign(new Error('Unknown player ID'), { status: 400 });
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

      await writeData({
        ...data,
        matches: [...[...newMatches].reverse(), ...data.matches],
        history: [{
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          action: 'add_matches' as const,
          description,
          addedMatches: newMatches,
        }, ...data.history],
      });
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err: any) {
    if (err?.status === 400) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error('POST /api/matches:', err);
    return NextResponse.json({ error: 'Failed to add matches' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const id = typeof body?.id === 'string' ? body.id.trim() : '';
    if (!id || id.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    await withLock(async () => {
      const data = await readData() ?? emptyData();
      const match = data.matches.find((m) => m.id === id);
      if (!match) throw Object.assign(new Error('Match not found'), { status: 404 });

      const playerMap = new Map(data.players.map((p) => [p.id, p.name]));

      await writeData({
        ...data,
        matches: data.matches.filter((m) => m.id !== id),
        history: [{
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          action: 'remove_match' as const,
          description: `Removed match: ${playerMap.get(match.winnerId) ?? '?'} beat ${playerMap.get(match.loserId) ?? '?'}`,
          removedMatch: match,
        }, ...data.history],
      });
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.status === 404) return NextResponse.json({ error: err.message }, { status: 404 });
    console.error('DELETE /api/matches:', err);
    return NextResponse.json({ error: 'Failed to remove match' }, { status: 500 });
  }
}
