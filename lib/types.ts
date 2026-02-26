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
