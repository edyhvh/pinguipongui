// Server-only — unified storage abstraction
// Uses Redis as primary storage, falls back to Blob for migration
import { readData as readBlobData, writeData as writeBlobData, emptyData as emptyBlobData, AppData as BlobAppData } from './blob';
import { readData as readRedisData, writeData as writeRedisData, emptyData as emptyRedisData, isRedisAvailable, AppData as RedisAppData } from './redis-storage';
import type { Player, Match, HistoryEntry } from './types';

export type AppData = BlobAppData;

// Helper to read data - tries Redis first, then Blob, then returns null
export async function readData(): Promise<AppData | null> {
  // Try Redis first
  if (isRedisAvailable()) {
    try {
      const redisData = await readRedisData();
      if (redisData !== null) {
        return redisData;
      }
    } catch (e) {
      console.warn('Redis read failed, trying Blob:', e);
    }
  }
  
  // Fall back to Blob
  try {
    const blobData = await readBlobData();
    if (blobData !== null) {
      return blobData;
    }
  } catch (e) {
    console.warn('Blob read failed:', e);
  }
  
  return null;
}

export async function writeData(data: AppData): Promise<void> {
  // Try Redis first
  if (isRedisAvailable()) {
    try {
      await writeRedisData(data);
      return;
    } catch (e) {
      console.warn('Redis write failed, trying Blob:', e);
    }
  }
  
  // Fall back to Blob
  await writeBlobData(data);
}

export function emptyData(): AppData {
  return emptyBlobData();
}
