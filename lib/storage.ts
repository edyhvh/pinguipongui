'use client';

import type { Player, Match, PlayerStats } from './types';

const PLAYERS_KEY = 'pinguipongui_players';
const MATCHES_KEY = 'pinguipongui_matches';
const SEED_KEY = 'pinguipongui_seeded_v1';

// ─── Seed data ────────────────────────────────────────────────────────────────

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
  ['p-mc', 'p-jv',  9, 4],
  ['p-mc', 'p-cc',  0, 2],
  ['p-mc', 'p-cs',  2, 0],
  ['p-mc', 'p-jm',  3, 0],
  ['p-mc', 'p-fc',  4, 1],
  ['p-jv', 'p-cc',  0, 3],
  ['p-jv', 'p-cs',  5, 2],
  ['p-jv', 'p-jm',  5, 1],
  ['p-jv', 'p-fc',  6, 6],
  ['p-cs', 'p-jm',  1, 1],
  ['p-cs', 'p-cr',  2, 0],
  ['p-jm', 'p-fc',  2, 1],
];

// Realistic-looking loser scores (all < 11)
const LOSER_SCORES = [9, 7, 8, 6, 9, 8, 7, 9, 6, 8, 7, 9, 8, 6, 9, 7];

export function seedInitialData(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(SEED_KEY)) return;

  const matches: Match[] = [];
  const startMs = new Date('2024-07-01').getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  let dayOffset = 0;

  for (const [p1, p2, p1wins, p2wins] of SEED_H2H) {
    // Interleave wins so history looks natural
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
      dayOffset += 2 + (matches.length % 3); // 2–4 days between matches
    }
  }

  // Newest first
  matches.sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());

  localStorage.setItem(PLAYERS_KEY, JSON.stringify(SEED_PLAYERS));
  localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
  localStorage.setItem(SEED_KEY, '1');
}

export function getPlayers(): Player[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(PLAYERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function savePlayers(players: Player[]): void {
  localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
}

export function addPlayer(name: string): Player {
  const players = getPlayers();
  const trimmed = name.trim().toUpperCase();
  if (!trimmed) throw new Error('Name required');
  if (players.some((p) => p.name === trimmed)) throw new Error('Player already exists');
  const player: Player = {
    id: crypto.randomUUID(),
    name: trimmed,
    createdAt: new Date().toISOString(),
  };
  savePlayers([...players, player]);
  return player;
}

export function removePlayer(id: string): void {
  savePlayers(getPlayers().filter((p) => p.id !== id));
}

export function getMatches(): Match[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(MATCHES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveMatches(matches: Match[]): void {
  localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
}

export function addMatch(
  player1Id: string,
  player2Id: string,
  player1Score: number,
  player2Score: number,
): Match {
  if (player1Id === player2Id) throw new Error('Players must be different');
  if (player1Score === player2Score) throw new Error('Tie games are not allowed');
  const winnerId = player1Score > player2Score ? player1Id : player2Id;
  const loserId = player1Score > player2Score ? player2Id : player1Id;
  const match: Match = {
    id: crypto.randomUUID(),
    player1Id,
    player2Id,
    player1Score,
    player2Score,
    winnerId,
    loserId,
    playedAt: new Date().toISOString(),
  };
  saveMatches([match, ...getMatches()]);
  return match;
}

export function removeMatch(id: string): void {
  saveMatches(getMatches().filter((m) => m.id !== id));
}

export function getPlayerStats(players: Player[], matches: Match[]): PlayerStats[] {
  return players
    .map((player) => {
      const pm = matches.filter(
        (m) => m.player1Id === player.id || m.player2Id === player.id,
      );
      const wins = pm.filter((m) => m.winnerId === player.id).length;
      const losses = pm.filter((m) => m.loserId === player.id).length;
      let pointsFor = 0;
      let pointsAgainst = 0;
      for (const m of pm) {
        if (m.player1Id === player.id) {
          pointsFor += m.player1Score;
          pointsAgainst += m.player2Score;
        } else {
          pointsFor += m.player2Score;
          pointsAgainst += m.player1Score;
        }
      }
      return {
        player,
        wins,
        losses,
        totalMatches: pm.length,
        winRate: pm.length > 0 ? wins / pm.length : 0,
        pointsFor,
        pointsAgainst,
      };
    })
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.totalMatches - a.totalMatches;
    });
}
