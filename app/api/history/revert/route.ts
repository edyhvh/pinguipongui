import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData, emptyData } from '../../../../lib/storage-abstraction';
import { withLock } from '../../../../lib/lock';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const id = typeof body?.id === 'string' ? body.id.trim() : '';
    if (!id || id.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    await withLock(async () => {
      const data = await readData() ?? emptyData();
      const entry = data.history.find((e) => e.id === id);
      if (!entry) throw Object.assign(new Error('History entry not found'), { status: 404 });
      if (entry.action === 'revert') {
        throw Object.assign(new Error('Cannot revert a revert'), { status: 400 });
      }

      let { matches, players } = data;

      switch (entry.action) {
        case 'add_matches': {
          const ids = new Set(entry.addedMatches!.map((m) => m.id));
          matches = matches.filter((m) => !ids.has(m.id));
          break;
        }
        case 'remove_match': {
          matches = [entry.removedMatch!, ...matches];
          break;
        }
        case 'add_player': {
          players = players.filter((p) => p.id !== entry.addedPlayer!.id);
          break;
        }
        case 'remove_player': {
          players = [...players, entry.removedPlayer!];
          break;
        }
      }

      await writeData({
        ...data,
        players,
        matches,
        history: [{
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          action: 'revert' as const,
          description: `Reverted: ${entry.description}`,
        }, ...data.history.filter((e) => e.id !== id)],
      });
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const status = typeof err === 'object' && err !== null && 'status' in err ? err.status : undefined;
    const message = err instanceof Error ? err.message : 'Failed to revert';
    if (status === 404) return NextResponse.json({ error: message }, { status: 404 });
    if (status === 400) return NextResponse.json({ error: message }, { status: 400 });
    console.error('POST /api/history/revert:', err);
    return NextResponse.json({ error: 'Failed to revert' }, { status: 500 });
  }
}
