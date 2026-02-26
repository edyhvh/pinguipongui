// Server-only — no 'use client'
import { put, list } from '@vercel/blob';
import type { Player, Match, HistoryEntry } from './types';

export interface AppData {
  players: Player[];
  matches: Match[];
  history: HistoryEntry[];
  seeded: boolean;
}

const BLOB_PATHNAME = 'pinguipongui-data.json';
const MAX_HISTORY = 100;

export function emptyData(): AppData {
  return { players: [], matches: [], history: [], seeded: false };
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
  return {
    players: Array.isArray(raw.players) ? raw.players : [],
    matches: Array.isArray(raw.matches) ? raw.matches : [],
    history: Array.isArray(raw.history) ? raw.history : [],
    seeded: !!raw.seeded,
  };
}

export async function writeData(data: AppData): Promise<void> {
  if (data.history.length > MAX_HISTORY) {
    data.history = data.history.slice(0, MAX_HISTORY);
  }
  await put(BLOB_PATHNAME, JSON.stringify(data), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}
