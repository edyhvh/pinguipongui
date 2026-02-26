// Server-only seed data — no 'use client'
import type { Player, Match } from './types';

const SEED_PLAYERS: Player[] = [
  { id: 'p-mc', name: 'MC', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'p-jv', name: 'JV', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'p-cc', name: 'CC', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'p-dk', name: 'DK', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'p-cs', name: 'CS', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'p-jm', name: 'JM', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'p-fc', name: 'FC', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'p-cr', name: 'CR', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'p-vm', name: 'VM', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'p-mr', name: 'MR', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'p-lm', name: 'LM', createdAt: '2024-01-01T00:00:00Z' },
];

// [player1Id, player2Id, p1wins, p2wins]
const SEED_H2H: [string, string, number, number][] = [
  ['p-mc', 'p-jv', 9, 4],
  ['p-mc', 'p-cc', 0, 2],
  ['p-mc', 'p-cs', 2, 0],
  ['p-mc', 'p-jm', 3, 0],
  ['p-mc', 'p-fc', 4, 1],
  ['p-jv', 'p-cc', 0, 3],
  ['p-jv', 'p-cs', 5, 2],
  ['p-jv', 'p-jm', 5, 1],
  ['p-jv', 'p-fc', 6, 6],
  ['p-cs', 'p-jm', 1, 1],
  ['p-cs', 'p-cr', 2, 0],
  ['p-jm', 'p-fc', 2, 1],
];

const LOSER_SCORES = [9, 7, 8, 6, 9, 8, 7, 9, 6, 8, 7, 9, 8, 6, 9, 7];

export function generateSeedData(): { players: Player[]; matches: Match[] } {
  const matches: Match[] = [];
  const startMs = new Date('2024-07-01').getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  let dayOffset = 0;

  for (const [p1, p2, p1wins, p2wins] of SEED_H2H) {
    const sequence: string[] = [];
    let r1 = p1wins, r2 = p2wins;
    while (r1 > 0 || r2 > 0) {
      if (r1 > 0) { sequence.push(p1); r1--; }
      if (r2 > 0) { sequence.push(p2); r2--; }
    }
    for (const winnerId of sequence) {
      const loserId = winnerId === p1 ? p2 : p1;
      const loserScore = LOSER_SCORES[matches.length % LOSER_SCORES.length];
      matches.push({
        id: `seed-${matches.length}`,
        player1Id: winnerId,
        player2Id: loserId,
        player1Score: 11,
        player2Score: loserScore,
        winnerId,
        loserId,
        playedAt: new Date(startMs + dayOffset * dayMs).toISOString(),
      });
      dayOffset += 2 + (matches.length % 3);
    }
  }

  matches.sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());
  return { players: SEED_PLAYERS, matches };
}
