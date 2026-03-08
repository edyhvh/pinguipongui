// Server-only — no 'use client'
// JSON file storage as backup/restore source for Redis
import fs from 'fs/promises';
import path from 'path';
import type { Player, Match, HistoryEntry } from './types';

export interface AppData {
  players: Player[];
  matches: Match[];
  history: HistoryEntry[];
  seeded: boolean;
  recentOperations?: {
    id: string;
    payloadHash: string;
    timestamp: string;
  }[];
}

interface RecentOperation {
  id: string;
  payloadHash: string;
  timestamp: string;
}

const DATA_FILE_PATH = path.join(process.cwd(), 'pinguipongui-data.json');
const MAX_HISTORY = 100;
const MAX_RECENT_OPERATIONS = 200;

export function emptyData(): AppData {
  return { players: [], matches: [], history: [], seeded: false, recentOperations: [] };
}

// Returns null if the file doesn't exist yet, throws on read errors
export async function readData(): Promise<AppData | null> {
  try {
    try {
      await fs.access(DATA_FILE_PATH);
    } catch {
      // File doesn't exist
      return null;
    }

    const rawContent = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    const raw = JSON.parse(rawContent);

    const rawRecent = Array.isArray(raw.recentOperations) ? raw.recentOperations : [];
    const recentOperations: RecentOperation[] = rawRecent
      .flatMap((op: unknown) => {
        if (!op || typeof op !== 'object') return [];
        const candidate = op as Record<string, unknown>;
        if (
          typeof candidate.id !== 'string' ||
          typeof candidate.payloadHash !== 'string' ||
          typeof candidate.timestamp !== 'string'
        ) {
          return [];
        }
        return [{ id: candidate.id, payloadHash: candidate.payloadHash, timestamp: candidate.timestamp }];
      })
      .slice(0, MAX_RECENT_OPERATIONS);

    return {
      players: Array.isArray(raw.players) ? raw.players : [],
      matches: Array.isArray(raw.matches) ? raw.matches : [],
      history: Array.isArray(raw.history) ? raw.history : [],
      seeded: !!raw.seeded,
      recentOperations,
    };
  } catch (error) {
    console.error('Error reading JSON file:', error);
    throw error;
  }
}

export async function writeData(data: AppData, filePath?: string): Promise<void> {
  // On Vercel/serverless deployments the filesystem is read-only; skip file writes.
  if (process.env.VERCEL) {
    console.warn('JSON file write skipped: running on Vercel (read-only filesystem). Use Redis as primary storage.');
    return;
  }

  const targetPath = filePath || DATA_FILE_PATH;

  const trimmedData = { ...data };
  if (trimmedData.history && trimmedData.history.length > MAX_HISTORY) {
    trimmedData.history = trimmedData.history.slice(0, MAX_HISTORY);
  }
  if (trimmedData.recentOperations && trimmedData.recentOperations.length > MAX_RECENT_OPERATIONS) {
    trimmedData.recentOperations = trimmedData.recentOperations.slice(0, MAX_RECENT_OPERATIONS);
  }

  await fs.writeFile(targetPath, JSON.stringify(trimmedData, null, 2) + '\n', 'utf-8');
}

// Utility function to export Redis data to JSON file (for backup)
export async function exportFromRedis(
  redisReadFn: () => Promise<AppData | null>,
  outputPath?: string,
): Promise<{ success: boolean; message: string; playersCount?: number; matchesCount?: number }> {
  try {
    const redisData = await redisReadFn();

    if (!redisData) {
      return { success: false, message: 'No data found in Redis' };
    }

    const targetPath = outputPath || DATA_FILE_PATH;

    await writeData(redisData, targetPath);

    return {
      success: true,
      message: `Successfully exported ${redisData.players.length} players and ${redisData.matches.length} matches to ${targetPath}`,
      playersCount: redisData.players.length,
      matchesCount: redisData.matches.length,
    };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// Utility function to import JSON file data to Redis (for restore)
export async function importToRedis(
  jsonReadFn: () => Promise<AppData | null>,
  redisWriteFn: (data: AppData) => Promise<void>,
): Promise<{ success: boolean; message: string; playersCount?: number; matchesCount?: number }> {
  try {
    const jsonData = await jsonReadFn();

    if (!jsonData) {
      return { success: false, message: 'No data found in JSON file' };
    }

    await redisWriteFn(jsonData);

    return {
      success: true,
      message: `Successfully imported ${jsonData.players.length} players and ${jsonData.matches.length} matches to Redis`,
      playersCount: jsonData.players.length,
      matchesCount: jsonData.matches.length,
    };
  } catch (error) {
    console.error('Import error:', error);
    return { success: false, message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}
