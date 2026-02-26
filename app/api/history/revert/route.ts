import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '../../../../lib/blob';
import { Mutex } from 'async-mutex';

const revertMutex = new Mutex();

export async function POST(req: NextRequest) {
  return revertMutex.runExclusive(async () => {
    try {
      const body = await req.json().catch(() => null);
      if (!body || typeof body.id !== 'string' || !body.id.trim()) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
      }

      const { id } = body;
      const data = await readData();
      const entry = data.history.find((e) => e.id === id);
      if (!entry) return NextResponse.json({ error: 'History entry not found' }, { status: 404 });
      if (entry.action === 'revert') {
        return NextResponse.json({ error: 'Cannot revert a revert' }, { status: 400 });
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

      const revertEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        action: 'revert' as const,
        description: `Reverted: ${entry.description}`,
      };

      await writeData({
        ...data,
        players,
        matches,
        history: [revertEntry, ...data.history.filter((e) => e.id !== id)],
      });

      return NextResponse.json({ ok: true });
    } catch (err) {
      console.error('POST /api/history/revert:', err);
      return NextResponse.json({ error: 'Failed to revert' }, { status: 500 });
    }
  });
}
