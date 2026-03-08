import { NextRequest, NextResponse } from 'next/server';
import { readData as readJsonData, writeData as writeJsonData } from '../../../lib/json-file-storage';
import { readData as readRedisData, writeData as writeRedisData, isRedisAvailable } from '../../../lib/redis-storage';

// This endpoint handles data restoration from JSON backup to Redis
// Use ?force=true to overwrite existing data
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const force = searchParams.get('force') === 'true';

    // First, check what's currently in Redis
    const existingRedisData = await readRedisData();
    
    if (existingRedisData && existingRedisData.players.length > 0 && !force) {
      return NextResponse.json({
        alreadyMigrated: true,
        message: 'Data already exists in Redis. No restore needed. Use ?force=true to overwrite.',
        playersCount: existingRedisData.players.length,
        matchesCount: existingRedisData.matches.length,
      });
    }

    // Try to restore from JSON backup file
    const jsonData = await readJsonData();
    
    if (!jsonData) {
      return NextResponse.json(
        { error: 'No backup file found. Please ensure pinguipongui-data.json exists in the project root.' },
        { status: 404 }
      );
    }

    // Write to Redis
    await writeRedisData(jsonData);

    return NextResponse.json({
      success: true,
      message: `Successfully restored ${jsonData.players.length} players and ${jsonData.matches.length} matches to Redis`,
      playersCount: jsonData.players.length,
      matchesCount: jsonData.matches.length,
    });
  } catch (err) {
    console.error('Restore error:', err);
    return NextResponse.json({ error: 'Restore failed' }, { status: 500 });
  }
}

// Check current status of both stores
export async function GET() {
  try {
    const redisAvailable = isRedisAvailable();
    
    let jsonData = null;
    let redisData = null;
    
    try {
      jsonData = await readJsonData();
    } catch (e) {
      // JSON file might not exist
    }
    
    try {
      redisData = await readRedisData();
    } catch (e) {
      // Redis might not be configured
    }

    return NextResponse.json({
      redisConfigured: redisAvailable,
      jsonBackup: jsonData ? {
        playersCount: jsonData.players.length,
        matchesCount: jsonData.matches.length,
        historyCount: jsonData.history.length,
        seeded: jsonData.seeded,
      } : null,
      redis: redisData ? {
        playersCount: redisData.players.length,
        matchesCount: redisData.matches.length,
        historyCount: redisData.history.length,
        seeded: redisData.seeded,
      } : null,
    });
  } catch (err) {
    console.error('Status check error:', err);
    return NextResponse.json({ error: 'Status check failed' }, { status: 500 });
  }
}
