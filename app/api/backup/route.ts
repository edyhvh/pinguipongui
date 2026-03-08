// Server-only — Backup and restore API
import { NextRequest, NextResponse } from 'next/server';
import { readData as readRedisData, writeData as writeRedisData, isRedisAvailable } from '@/lib/redis-storage';
import { readData as readJsonData, writeData as writeJsonData } from '@/lib/json-file-storage';
import { readData as readStorageData } from '@/lib/storage-abstraction';

// POST /api/backup - Export current data to JSON file (backup)
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action === 'export') {
      // Export from Redis to JSON file
      if (!isRedisAvailable()) {
        return NextResponse.json(
          { success: false, message: 'Redis is not configured' },
          { status: 500 }
        );
      }

      const redisData = await readRedisData();
      if (!redisData) {
        return NextResponse.json(
          { success: false, message: 'No data found in Redis' },
          { status: 404 }
        );
      }

      await writeJsonData(redisData);

      return NextResponse.json({
        success: true,
        message: `Successfully exported ${redisData.players.length} players and ${redisData.matches.length} matches to JSON file`,
        playersCount: redisData.players.length,
        matchesCount: redisData.matches.length,
      });
    }

    if (action === 'restore') {
      // Restore from JSON file to Redis
      if (!isRedisAvailable()) {
        return NextResponse.json(
          { success: false, message: 'Redis is not configured' },
          { status: 500 }
        );
      }

      const jsonData = await readJsonData();
      if (!jsonData) {
        return NextResponse.json(
          { success: false, message: 'No data found in JSON backup file' },
          { status: 404 }
        );
      }

      await writeRedisData(jsonData);

      return NextResponse.json({
        success: true,
        message: `Successfully restored ${jsonData.players.length} players and ${jsonData.matches.length} matches to Redis`,
        playersCount: jsonData.players.length,
        matchesCount: jsonData.matches.length,
      });
    }

    // Default: Get current data status
    const redisAvailable = isRedisAvailable();
    let redisData = null;
    let jsonData = null;

    if (redisAvailable) {
      redisData = await readRedisData();
    }
    jsonData = await readJsonData();

    return NextResponse.json({
      redisAvailable,
      redisDataExists: redisData !== null,
      redisPlayersCount: redisData?.players?.length || 0,
      redisMatchesCount: redisData?.matches?.length || 0,
      jsonFileExists: jsonData !== null,
      jsonPlayersCount: jsonData?.players?.length || 0,
      jsonMatchesCount: jsonData?.matches?.length || 0,
    });
  } catch (error) {
    console.error('Backup API error:', error);
    return NextResponse.json(
      { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// GET /api/backup - Get backup status
export async function GET() {
  try {
    const redisAvailable = isRedisAvailable();
    let redisData = null;
    let jsonData = null;

    if (redisAvailable) {
      redisData = await readRedisData();
    }
    jsonData = await readJsonData();

    return NextResponse.json({
      redisAvailable,
      redisDataExists: redisData !== null,
      redisPlayersCount: redisData?.players?.length || 0,
      redisMatchesCount: redisData?.matches?.length || 0,
      jsonFileExists: jsonData !== null,
      jsonPlayersCount: jsonData?.players?.length || 0,
      jsonMatchesCount: jsonData?.matches?.length || 0,
    });
  } catch (error) {
    console.error('Backup status API error:', error);
    return NextResponse.json(
      { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
