import { NextResponse } from 'next/server';
import { readData as readBlobData, writeData as writeBlobData, emptyData } from '../../../lib/blob';
import { readData as readRedisData, writeData as writeRedisData, migrateFromBlob, isRedisAvailable } from '../../../lib/redis-storage';

// This endpoint migrates data from Vercel Blob to Upstash Redis
export async function POST() {
  try {
    // First, check what's currently in Redis
    const existingRedisData = await readRedisData();
    
    if (existingRedisData && existingRedisData.players.length > 0) {
      return NextResponse.json({
        alreadyMigrated: true,
        message: 'Data already exists in Redis. No migration needed.',
        playersCount: existingRedisData.players.length,
        matchesCount: existingRedisData.matches.length,
      });
    }

    // Perform migration from Blob to Redis
    const result = await migrateFromBlob(async () => {
      const data = await readBlobData();
      if (!data) return null;
      return {
        players: data.players,
        matches: data.matches,
        history: data.history,
        seeded: data.seeded,
        recentOperations: data.recentOperations,
      };
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        playersCount: result.playersCount,
        matchesCount: result.matchesCount,
      });
    } else {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
  } catch (err) {
    console.error('Migration error:', err);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}

// Check current status of both stores
export async function GET() {
  try {
    const redisAvailable = isRedisAvailable();
    
    let blobData = null;
    let redisData = null;
    
    try {
      blobData = await readBlobData();
    } catch (e) {
      // Blob might not exist
    }
    
    try {
      redisData = await readRedisData();
    } catch (e) {
      // Redis might not be configured
    }

    return NextResponse.json({
      redisConfigured: redisAvailable,
      blob: blobData ? {
        playersCount: blobData.players.length,
        matchesCount: blobData.matches.length,
        historyCount: blobData.history.length,
        seeded: blobData.seeded,
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
