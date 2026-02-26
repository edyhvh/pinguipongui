import { NextResponse } from 'next/server';
import { readData, writeData } from '../../../lib/blob';
import { generateSeedData } from '../../../lib/seed';

export async function GET() {
  try {
    let data = await readData();

    // Seed on first ever request
    if (!data.seeded) {
      const { players, matches } = generateSeedData();
      data = { players, matches, history: [], seeded: true };
      await writeData(data);
    }

    return NextResponse.json({
      players: data.players,
      matches: data.matches,
      history: data.history,
    });
  } catch (err) {
    console.error('GET /api/data:', err);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}
