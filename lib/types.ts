export interface Player {
  id: string;
  name: string;
  createdAt: string;
}

export interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  player1Score: number;
  player2Score: number;
  winnerId: string;
  loserId: string;
  playedAt: string;
}

export interface ArchivedSeason {
  id: string;
  name: string;
  startedAt: string;
  endedAt: string;
  players: Player[];
  matches: Match[];
  history: HistoryEntry[];
}

export const CURRENT_SEASON_ID = 'september-2026';
export const CURRENT_SEASON_LABEL = 'September 2026';

export interface PlayerStats {
  player: Player;
  wins: number;
  losses: number;
  totalMatches: number;
  winRate: number;
  pointsFor: number;
  pointsAgainst: number;
}

// Extended stats for ranking with rating formula
export interface H2HRecord {
  opponentId: string;
  wins: number;
  losses: number;
  games: number;
}

export type HistoryAction = 'add_matches' | 'remove_match' | 'add_player' | 'remove_player' | 'revert';

export interface HistoryEntry {
  id: string;
  timestamp: string;
  action: HistoryAction;
  description: string;
  // Payloads for reverting
  addedMatches?: Match[];   // 'add_matches': delete these on revert
  removedMatch?: Match;     // 'remove_match': re-add this on revert
  addedPlayer?: Player;     // 'add_player': delete this on revert
  removedPlayer?: Player;   // 'remove_player': re-add this on revert
}

export interface PlayerStatsExtended {
  player: Player;
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
  confidence: number;
  distribution: number;
  rating: number;
  opponents: number; // unique opponents faced
  activePlayers: number; // total active players in tournament
  gamesPerOpponent: Map<string, number>; // for distribution calculation
  h2h: Map<string, H2HRecord>; // head-to-head records
}
