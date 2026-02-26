import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '../../../lib/blob';

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

    const data = await readData();
    if (data.players.some((p) => p.name === name)) {
      return NextResponse.json({ error: 'Player already exists' }, { status: 409 });
    }

    const player = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    };

    const historyEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action: 'add_player' as const,
      description: `Added player: ${player.name}`,
      addedPlayer: player,
    };

    await writeData({
      ...data,
      players: [...data.players, player],
      history: [historyEntry, ...data.history],
    });

    return NextResponse.json(player, { status: 201 });
  } catch (err) {
    console.error('POST /api/players:', err);
    return NextResponse.json({ error: 'Failed to add player' }, { status: 500 });
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
    const player = data.players.find((p) => p.id === id);
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 });

    const historyEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action: 'remove_player' as const,
      description: `Removed player: ${player.name}`,
      removedPlayer: player,
    };

    await writeData({
      ...data,
      players: data.players.filter((p) => p.id !== id),
      history: [historyEntry, ...data.history],
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/players:', err);
    return NextResponse.json({ error: 'Failed to remove player' }, { status: 500 });
  }
}
