'use client';

import type { Player, Match, PlayerStats, PlayerStatsExtended, H2HRecord, HistoryEntry } from './types';

// ─── API callers (client → API routes → Redis/JSON file) ──────────────────────────

export async function getAllData(): Promise<{ players: Player[]; matches: Match[]; history: HistoryEntry[] }> {
  const res = await fetch('/api/data', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load data');
  return res.json();
}

export async function addPlayer(name: string): Promise<Player> {
  const res = await fetch('/api/players', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to add player');
  return data;
}

export async function removePlayer(id: string): Promise<void> {
  const res = await fetch('/api/players', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? 'Failed to remove player');
  }
}

export async function addMatchesBulk(
  entries: Array<{ winnerId: string; loserId: string }>,
  operationId: string,
): Promise<void> {
  const res = await fetch('/api/matches', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Idempotency-Key': operationId,
    },
    body: JSON.stringify({ entries, operationId }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? 'Failed to add matches');
  }
}

export async function removeMatch(id: string): Promise<void> {
  const res = await fetch('/api/matches', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? 'Failed to remove match');
  }
}

export async function revertHistoryEntry(entryId: string): Promise<void> {
  const res = await fetch('/api/history/revert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: entryId }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? 'Failed to revert');
  }
}

// ─── Pure computation (no I/O) ────────────────────────────────────────────────

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

export function getPlayerStatsExtended(players: Player[], matches: Match[]): PlayerStatsExtended[] {
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
    const winRate = totalGames > 0 ? wins / totalGames : 0;
    const confidence = totalGames > 0 ? totalGames / (totalGames + 8) : 0;

    const gamesPerOpponent = new Map<string, number>();
    const h2h = new Map<string, H2HRecord>();

    for (const m of playerMatches) {
      const opponentId = m.player1Id === player.id ? m.player2Id : m.player1Id;
      gamesPerOpponent.set(opponentId, (gamesPerOpponent.get(opponentId) || 0) + 1);
      const h2hRecord = h2h.get(opponentId) || { opponentId, wins: 0, losses: 0, games: 0 };
      if (m.winnerId === player.id) h2hRecord.wins++;
      else h2hRecord.losses++;
      h2hRecord.games++;
      h2h.set(opponentId, h2hRecord);
    }

    let distribution = 0;
    if (totalGames > 0) {
      let sumSquares = 0;
      for (const [, games] of gamesPerOpponent) {
        const fraction = games / totalGames;
        sumSquares += fraction * fraction;
      }
      distribution = 1 - sumSquares;
    }

    const multiplier = confidence * 0.8 + distribution * 0.2;
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

  return stats.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (a.totalGames > 0 && b.totalGames > 0) {
      const aH2h = a.h2h.get(b.player.id);
      const bH2h = b.h2h.get(a.player.id);
      if (aH2h && bH2h && aH2h.wins !== bH2h.wins) {
        return bH2h.wins - aH2h.wins;
      }
    }
    return b.totalGames - a.totalGames;
  });
}
