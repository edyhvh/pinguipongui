import { NextResponse } from 'next/server';
import { readData } from '../../../lib/storage-abstraction';

export async function GET() {
  try {
    const data = await readData();
    const season = data?.archivedSeasons?.[0] ?? null;

    return NextResponse.json({ season });
  } catch (error) {
    console.error('GET /api/previous-season:', error);
    return NextResponse.json({ error: 'Failed to read previous season' }, { status: 500 });
  }
}
