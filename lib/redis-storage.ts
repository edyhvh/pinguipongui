// Server-only — no 'use client'
import { Redis } from '@upstash/redis';
import type { Player, Match, HistoryEntry, ArchivedSeason } from './types';
import { CURRENT_SEASON_ID } from './types';

export interface AppData {
  players: Player[];
  matches: Match[];
  history: HistoryEntry[];
  seeded: boolean;
  schemaVersion: 2;
  currentSeasonId: string;
  archivedSeasons: ArchivedSeason[];
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

const DATA_KEY = 'pinguipongui:data';
const MAX_HISTORY = 100;
const MAX_RECENT_OPERATIONS = 200;

// Check if Redis is configured
const hasRedisConfig =
  typeof process.env.UPSTASH_REDIS_REST_URL === 'string' && process.env.UPSTASH_REDIS_REST_URL.length > 0 &&
  typeof process.env.UPSTASH_REDIS_REST_TOKEN === 'string' && process.env.UPSTASH_REDIS_REST_TOKEN.length > 0;

const redis = hasRedisConfig ? Redis.fromEnv() : null;

export function isRedisAvailable(): boolean {
  return redis !== null;
}

export function emptyData(): AppData {
  return {
    players: [], matches: [], history: [], seeded: false, schemaVersion: 2,
    currentSeasonId: CURRENT_SEASON_ID, archivedSeasons: [], recentOperations: [],
  };
}

function normalizeData(raw: Record<string, unknown>): { data: AppData; migrated: boolean } {
  const recentOperations = Array.isArray(raw.recentOperations) ? raw.recentOperations : [];
  const currentPlayers = Array.isArray(raw.players) ? raw.players as Player[] : [];
  const currentMatches = Array.isArray(raw.matches) ? raw.matches as Match[] : [];
  const currentHistory = Array.isArray(raw.history) ? raw.history as HistoryEntry[] : [];

  if (raw.schemaVersion === 2 && typeof raw.currentSeasonId === 'string') {
    return {
      data: {
        players: currentPlayers,
        matches: currentMatches,
        history: currentHistory,
        seeded: !!raw.seeded,
        schemaVersion: 2,
        currentSeasonId: raw.currentSeasonId,
        archivedSeasons: Array.isArray(raw.archivedSeasons) ? raw.archivedSeasons as ArchivedSeason[] : [],
        recentOperations: recentOperations as AppData['recentOperations'],
      },
      migrated: false,
    };
  }

  const now = new Date().toISOString();
  const archivedSeason: ArchivedSeason = {
    id: 'before-september-2026',
    name: 'Previous season',
    startedAt: currentMatches.at(-1)?.playedAt ?? currentPlayers.at(0)?.createdAt ?? now,
    endedAt: now,
    players: currentPlayers,
    matches: currentMatches,
    history: currentHistory,
  };

  return {
    data: {
      // Keep the roster, but intentionally start the new season without results.
      players: currentPlayers,
      matches: [],
      history: [],
      seeded: false,
      schemaVersion: 2,
      currentSeasonId: CURRENT_SEASON_ID,
      archivedSeasons: currentPlayers.length || currentMatches.length || currentHistory.length ? [archivedSeason] : [],
      recentOperations: [],
    },
    migrated: true,
  };
}

// Returns null if data doesn't exist yet, throws on read errors
export async function readData(): Promise<AppData | null> {
  if (!redis) {
    throw new Error('Redis is not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.');
  }

  const raw = await redis.get<Record<string, unknown>>(DATA_KEY);

  if (!raw) return null;

  const normalized = normalizeData(raw);
  if (normalized.migrated) {
    await redis.set(DATA_KEY, normalized.data);
  }

  const rawRecent = Array.isArray(normalized.data.recentOperations) ? normalized.data.recentOperations : [];
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
    ...normalized.data,
    recentOperations,
  };
}

export async function writeData(data: AppData): Promise<void> {
  if (!redis) {
    throw new Error('Redis is not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.');
  }

  // Trim data to stay within limits
  const trimmedData = { ...data };
  if (trimmedData.history.length > MAX_HISTORY) {
    trimmedData.history = trimmedData.history.slice(0, MAX_HISTORY);
  }
  if (trimmedData.recentOperations && trimmedData.recentOperations.length > MAX_RECENT_OPERATIONS) {
    trimmedData.recentOperations = trimmedData.recentOperations.slice(0, MAX_RECENT_OPERATIONS);
  }

  await redis.set(DATA_KEY, trimmedData);
}
