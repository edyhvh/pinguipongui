import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData, emptyData } from '../../../lib/storage-abstraction';
import { withLock } from '../../../lib/lock';

// Only letters, numbers, spaces, apostrophes, hyphens — no HTML
const NAME_RE = /^[A-Z0-9 '\-]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const name = body.name.trim().toUpperCase().slice(0, 30);
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    if (!NAME_RE.test(name)) return NextResponse.json({ error: 'Name contains invalid characters' }, { status: 400 });

    const player = await withLock(async () => {
      const data = await readData() ?? emptyData();
      if (data.players.some((p) => p.name === name)) {
        throw Object.assign(new Error('Player already exists'), { status: 409 });
      }

      const newPlayer = {
        id: crypto.randomUUID(),
        name,
        createdAt: new Date().toISOString(),
      };

      await writeData({
        ...data,
        players: [...data.players, newPlayer],
        history: [{
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          action: 'add_player' as const,
          description: `Added player: ${newPlayer.name}`,
          addedPlayer: newPlayer,
        }, ...data.history],
      });

      return newPlayer;
    });

    return NextResponse.json(player, { status: 201 });
  } catch (err: unknown) {
    const status = typeof err === 'object' && err !== null && 'status' in err ? err.status : undefined;
    const message = err instanceof Error ? err.message : 'Failed to add player';
    if (status === 409) return NextResponse.json({ error: message }, { status: 409 });
    console.error('POST /api/players:', err);
    return NextResponse.json({ error: 'Failed to add player' }, { status: 500 });
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
      const player = data.players.find((p) => p.id === id);
      if (!player) throw Object.assign(new Error('Player not found'), { status: 404 });

      await writeData({
        ...data,
        players: data.players.filter((p) => p.id !== id),
        history: [{
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          action: 'remove_player' as const,
          description: `Removed player: ${player.name}`,
          removedPlayer: player,
        }, ...data.history],
      });
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const status = typeof err === 'object' && err !== null && 'status' in err ? err.status : undefined;
    const message = err instanceof Error ? err.message : 'Failed to remove player';
    if (status === 404) return NextResponse.json({ error: message }, { status: 404 });
    console.error('DELETE /api/players:', err);
    return NextResponse.json({ error: 'Failed to remove player' }, { status: 500 });
  }
}
