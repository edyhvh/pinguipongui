'use client';

import { useEffect, useState } from 'react';
import { getPlayerStatsExtended, getPreviousSeason } from '../../lib/storage';
import type { ArchivedSeason, PlayerStatsExtended } from '../../lib/types';

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function PreviousSeasonPage() {
  const [season, setSeason] = useState<ArchivedSeason | null>(null);
  const [stats, setStats] = useState<PlayerStatsExtended[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    getPreviousSeason()
      .then((data) => {
        setSeason(data);
        if (data) setStats(getPlayerStatsExtended(data.players, data.matches));
        setMounted(true);
      })
      .catch(() => {
        setLoadError(true);
        setMounted(true);
      });
  }, []);

  return (
    <main className="page">
      <div className="page-hero">
        <div className="page-title">Previous<br />Season</div>
        <div className="page-subtitle">Archived results · read only</div>
      </div>

      {loadError ? (
        <div className="empty-state">
          <div className="label-muted">Failed to load archived results — refresh and try again</div>
        </div>
      ) : !mounted ? null : !season ? (
        <div className="empty-state">
          <div className="empty-number">0</div>
          <div className="label-muted" style={{ marginTop: '16px' }}>No previous season has been archived yet</div>
        </div>
      ) : (
        <>
          <section style={{ marginBottom: '64px' }}>
            <div className="section-header">
              <span className="section-title">{season.name}</span>
              <span className="label-muted">{season.matches.length} games · {season.players.length} players</span>
            </div>

            <div className="previous-season-table">
              <div className="previous-season-row previous-season-header">
                <div className="label">#</div>
                <div className="label">Player</div>
                <div className="label" style={{ textAlign: 'right' }}>Rating</div>
                <div className="label" style={{ textAlign: 'center' }}>W</div>
                <div className="label" style={{ textAlign: 'center' }}>L</div>
                <div className="label" style={{ textAlign: 'center' }}>Games</div>
                <div className="label" style={{ textAlign: 'right' }}>Win %</div>
              </div>
              {stats.map((stat, index) => (
                <div key={stat.player.id} className="previous-season-row">
                  <div className="rank-number" style={{ color: index === 0 && stat.totalGames > 0 ? '#ff4500' : '#000' }}>
                    {stat.totalGames > 0 ? index + 1 : '—'}
                  </div>
                  <div className="player-name-large">{stat.player.name}</div>
                  <div className="stat-number" style={{ textAlign: 'right' }}>
                    {stat.totalGames > 0 ? stat.rating.toFixed(2) : '—'}
                  </div>
                  <div className="stat-number" style={{ textAlign: 'center' }}>{stat.wins}</div>
                  <div className="stat-number" style={{ textAlign: 'center', color: '#666' }}>{stat.losses}</div>
                  <div className="stat-number" style={{ textAlign: 'center' }}>{stat.totalGames}</div>
                  <div className="stat-number" style={{ textAlign: 'right' }}>
                    {stat.totalGames > 0 ? `${Math.round(stat.winRate * 100)}%` : '—'}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="section-header">
              <span className="section-title">Match History</span>
              <span className="label-muted">{season.matches.length} results</span>
            </div>
            <div>
              {season.matches.map((match) => {
                const winner = season.players.find((player) => player.id === match.winnerId)?.name ?? '?';
                const loser = season.players.find((player) => player.id === match.loserId)?.name ?? '?';
                return (
                  <div key={match.id} className="previous-match-row">
                    <div className="label-muted">{formatDate(match.playedAt)}</div>
                    <div style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase' }}>{winner}</div>
                    <div className="label-muted">beat</div>
                    <div style={{ fontSize: '14px', textTransform: 'uppercase' }}>{loser}</div>
                    <div className="match-score-small">{match.player1Score}–{match.player2Score}</div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
