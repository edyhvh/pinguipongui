import { NextResponse } from 'next/server';
import { readData, emptyData } from '../../../lib/storage-abstraction';

export async function GET() {
  try {
    let data = await readData();

    // A new season starts empty. Existing data is migrated and archived by storage.
    if (data === null) {
      data = emptyData();
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
