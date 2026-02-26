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

function emptyData(): AppData {
  return { players: [], matches: [], history: [], seeded: false };
}

export async function readData(): Promise<AppData> {
  try {
    const { blobs } = await list({ prefix: BLOB_PATHNAME });
    if (blobs.length === 0) return emptyData();

    // Most recently uploaded (in case there are multiple, take latest)
    const blob = blobs.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    )[0];

    const res = await fetch(blob.url, { cache: 'no-store' });
    if (!res.ok) return emptyData();

    const raw = await res.json();
    return {
      players: Array.isArray(raw.players) ? raw.players : [],
      matches: Array.isArray(raw.matches) ? raw.matches : [],
      history: Array.isArray(raw.history) ? raw.history : [],
      seeded: !!raw.seeded,
    };
  } catch (err) {
    console.error('readData failed:', err);
    return emptyData();
  }
}

export async function writeData(data: AppData): Promise<void> {
  // Cap history to stay within free tier limits
  if (data.history.length > MAX_HISTORY) {
    data.history = data.history.slice(0, MAX_HISTORY);
  }
  await put(BLOB_PATHNAME, JSON.stringify(data), {
    access: 'private',
    addRandomSuffix: false,
  });
}
