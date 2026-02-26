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
