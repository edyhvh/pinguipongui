'use client';

import type { Player, Match, PlayerStats, PlayerStatsExtended, H2HRecord } from './types';

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
  ['p-mc', 'p-jv', 9, 4],   // MC won 9, JV won 4, total 13 games
  ['p-mc', 'p-cc', 0, 2],   // MC won 0, CC won 2, total 2 games
  ['p-mc', 'p-cs', 2, 0],   // MC won 2, CS won 0, total 2 games
  ['p-mc', 'p-jm', 3, 0],   // MC won 3, JM won 0, total 3 games
  ['p-mc', 'p-fc', 4, 1],   // MC won 4, FC won 1, total 5 games
  ['p-jv', 'p-cc', 0, 3],   // JV won 0, CC won 3, total 3 games
  ['p-jv', 'p-cs', 5, 2],   // JV won 5, CS won 2, total 7 games
  ['p-jv', 'p-jm', 5, 1],   // JV won 5, JM won 1, total 6 games
  ['p-jv', 'p-fc', 6, 6],   // JV won 6, FC won 6, total 12 games
  ['p-cs', 'p-jm', 1, 1],   // CS won 1, JM won 1, total 2 games
  ['p-cs', 'p-cr', 2, 0],   // CS won 2, CR won 0, total 2 games
  ['p-jm', 'p-fc', 2, 1],   // JM won 2, FC won 1, total 3 games
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

// Extended stats with rating formula
export function getPlayerStatsExtended(players: Player[], matches: Match[]): PlayerStatsExtended[] {
  // Find active players (those with at least 1 game)
  const activePlayers = new Set<string>();
  for (const m of matches) {
    activePlayers.add(m.player1Id);
    activePlayers.add(m.player2Id);
  }
  const activeCount = activePlayers.size;

  const stats: PlayerStatsExtended[] = players.map((player) => {
    const playerMatches = matches.filter(
      (m) => m.player1Id === player.id || m.player2Id === player.id,
    );
    
    const wins = playerMatches.filter((m) => m.winnerId === player.id).length;
    const losses = playerMatches.filter((m) => m.loserId === player.id).length;
    const totalGames = playerMatches.length;
    
    // Calculate win rate
    const winRate = totalGames > 0 ? wins / totalGames : 0;
    
    // Calculate confidence: games / (games + 8)
    const confidence = totalGames > 0 ? totalGames / (totalGames + 8) : 0;
    
    // Calculate distribution (HHI inverted)
    // First, count games per opponent
    const gamesPerOpponent = new Map<string, number>();
    const h2h = new Map<string, H2HRecord>();
    
    for (const m of playerMatches) {
      const opponentId = m.player1Id === player.id ? m.player2Id : m.player1Id;
      const current = gamesPerOpponent.get(opponentId) || 0;
      gamesPerOpponent.set(opponentId, current + 1);
      
      // Track head-to-head
      const h2hRecord = h2h.get(opponentId) || { opponentId, wins: 0, losses: 0, games: 0 };
      if (m.winnerId === player.id) {
        h2hRecord.wins++;
      } else {
        h2hRecord.losses++;
      }
      h2hRecord.games++;
      h2h.set(opponentId, h2hRecord);
    }
    
    // Calculate distribution: 1 - sum((games_vs_opponent / totalGames)^2)
    let distribution = 0;
    if (totalGames > 0) {
      let sumSquares = 0;
      for (const [, games] of gamesPerOpponent) {
        const fraction = games / totalGames;
        sumSquares += fraction * fraction;
      }
      distribution = 1 - sumSquares;
    }
    
    // Calculate rating: WinRate × ((Confidence × 0.8) + (Distribution × 0.2)) × 100
    const multiplier = (confidence * 0.8) + (distribution * 0.2);
    const rating = winRate * multiplier * 100;
    
    return {
      player,
      wins,
      losses,
      totalGames,
      winRate,
      confidence,
      distribution,
      rating,
      opponents: gamesPerOpponent.size,
      activePlayers: activeCount,
      gamesPerOpponent,
      h2h,
    };
  });
  
  // Sort by rating (descending) with tiebreakers
  return stats.sort((a, b) => {
    // First tiebreaker: rating
    if (b.rating !== a.rating) return b.rating - a.rating;
    
    // Both have games - check head-to-head
    if (a.totalGames > 0 && b.totalGames > 0) {
      const aH2h = a.h2h.get(b.player.id);
      const bH2h = b.h2h.get(a.player.id);
      
      if (aH2h && bH2h) {
        if (aH2h.wins !== bH2h.wins) {
          return bH2h.wins - aH2h.wins; // More wins against opponent ranks higher
        }
      }
    }
    
    // Second tiebreaker: total games
    return b.totalGames - a.totalGames;
  });
}
