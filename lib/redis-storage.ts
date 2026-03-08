// Server-only — no 'use client'
import { Redis } from '@upstash/redis';
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
  return { players: [], matches: [], history: [], seeded: false, recentOperations: [] };
}

// Returns null if data doesn't exist yet, throws on read errors
export async function readData(): Promise<AppData | null> {
  if (!redis) {
    throw new Error('Redis is not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.');
  }

  const raw = await redis.get<{
    players: Player[];
    matches: Match[];
    history: HistoryEntry[];
    seeded: boolean;
    recentOperations?: RecentOperation[];
  }>(DATA_KEY);

  if (!raw) return null;

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
