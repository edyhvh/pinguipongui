// Server-only — no 'use client'
import { put, list } from '@vercel/blob';
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

const BLOB_PATHNAME = 'pinguipongui-data.json';
const MAX_HISTORY = 100;
const MAX_RECENT_OPERATIONS = 200;

export function emptyData(): AppData {
  return { players: [], matches: [], history: [], seeded: false, recentOperations: [] };
}

// Returns null if the blob doesn't exist yet, throws on read errors
export async function readData(): Promise<AppData | null> {
  const { blobs } = await list({ prefix: BLOB_PATHNAME });
  if (blobs.length === 0) return null;

  const blob = blobs.sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  )[0];

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const res = await fetch(blob.url, {
    cache: 'no-store',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Failed to fetch blob: ${res.status}`);

  const raw = await res.json();
  const rawRecent = Array.isArray(raw.recentOperations) ? raw.recentOperations : [];
  const recentOperations: RecentOperation[] = rawRecent.flatMap((op: unknown) => {
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
  }).slice(0, MAX_RECENT_OPERATIONS);

  return {
    players: Array.isArray(raw.players) ? raw.players : [],
    matches: Array.isArray(raw.matches) ? raw.matches : [],
    history: Array.isArray(raw.history) ? raw.history : [],
    seeded: !!raw.seeded,
    recentOperations,
  };
}

export async function writeData(data: AppData): Promise<void> {
  if (data.history.length > MAX_HISTORY) {
    data.history = data.history.slice(0, MAX_HISTORY);
  }
  if (data.recentOperations && data.recentOperations.length > MAX_RECENT_OPERATIONS) {
    data.recentOperations = data.recentOperations.slice(0, MAX_RECENT_OPERATIONS);
  }
  await put(BLOB_PATHNAME, JSON.stringify(data), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}
