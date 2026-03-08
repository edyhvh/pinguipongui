// Server-only — unified storage abstraction
// Uses Redis as primary storage, falls back to JSON file for backup/restore
import { readData as readJsonData, writeData as writeJsonData, emptyData as emptyJsonData, AppData as JsonAppData } from './json-file-storage';
import { readData as readRedisData, writeData as writeRedisData, emptyData as emptyRedisData, isRedisAvailable, AppData as RedisAppData } from './redis-storage';
import type { Player, Match, HistoryEntry } from './types';

export type AppData = JsonAppData;

// Helper to read data - tries Redis first, then JSON file, then returns null
export async function readData(): Promise<AppData | null> {
  // Try Redis first
  if (isRedisAvailable()) {
    try {
      const redisData = await readRedisData();
      if (redisData !== null) {
        return redisData;
      }
    } catch (e) {
      console.warn('Redis read failed, trying JSON file:', e);
    }
  }
  
  // Fall back to JSON file (backup/restore source)
  try {
    const jsonData = await readJsonData();
    if (jsonData !== null) {
      return jsonData;
    }
  } catch (e) {
    console.warn('JSON file read failed:', e);
  }
  
  return null;
}

export async function writeData(data: AppData): Promise<void> {
  // Write to Redis (primary storage)
  if (isRedisAvailable()) {
    try {
      await writeRedisData(data);
      // Also write to JSON file as backup
      try {
        await writeJsonData(data);
      } catch (e) {
        console.warn('JSON file write failed:', e);
      }
      return;
    } catch (e) {
      console.warn('Redis write failed:', e);
    }
  }
  
  // Fall back to JSON file if Redis is not available
  await writeJsonData(data);
}

export function emptyData(): AppData {
  return emptyJsonData();
}
