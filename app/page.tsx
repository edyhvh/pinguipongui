'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPlayers, getMatches, getPlayerStats, seedInitialData } from '../lib/storage';
import type { Player, Match, PlayerStats } from '../lib/types';

const HATCH_BLACK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E%3Cline x1='3' y1='0' x2='3' y2='6' stroke='%23000000' stroke-width='1'/%3E%3C/svg%3E\")";
const HATCH_ORANGE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E%3Cline x1='3' y1='0' x2='3' y2='6' stroke='%23ff4500' stroke-width='1'/%3E%3C/svg%3E\")";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });
}

function WinBar({ rate, isFirst }: { rate: number; isFirst: boolean }) {
  return (
    <div className="win-bar-track">
      <div
        className="win-bar-fill"
        style={{
          width: `${Math.round(rate * 100)}%`,
          backgroundImage: isFirst ? HATCH_ORANGE : HATCH_BLACK,
          backgroundSize: '6px 6px',
        }}
      />
    </div>
  );
}

function StandingsRow({
  stat,
  rank,
  players,
}: {
  stat: PlayerStats;
  rank: number;
  players: Player[];
}) {
  const isFirst = rank === 1;
  const winPct = Math.round(stat.winRate * 100);

  return (
    <div className="standings-row">
      {/* Rank */}
      <div
        className="rank-number"
        style={{ color: isFirst ? '#ff4500' : '#000' }}
      >
        {rank}
      </div>

      {/* Player info */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isFirst && (
            <div
              style={{
                width: 8,
                height: 8,
                backgroundColor: '#ff4500',
                flexShrink: 0,
              }}
            />
          )}
          <div className="player-name-large">{stat.player.name}</div>
        </div>
        <div className="label-muted" style={{ marginTop: '4px' }}>
          {stat.totalMatches} {stat.totalMatches === 1 ? 'match' : 'matches'} ·{' '}
          {stat.pointsFor}pts for / {stat.pointsAgainst}pts against
        </div>
      </div>

      {/* Wins */}
      <div style={{ textAlign: 'center' }}>
        <div
          className="stat-number"
          style={{ color: isFirst ? '#ff4500' : '#000' }}
        >
          {stat.wins}
        </div>
        <div className="label-muted">W</div>
      </div>

      {/* Losses */}
      <div style={{ textAlign: 'center' }}>
        <div className="stat-number">{stat.losses}</div>
        <div className="label-muted">L</div>
      </div>

      {/* Win bar */}
      <div className="standings-bar-col">
        <div
          className="label"
          style={{ marginBottom: '4px', color: isFirst ? '#ff4500' : '#000' }}
        >
          {winPct}%
        </div>
        <WinBar rate={stat.winRate} isFirst={isFirst} />
      </div>
    </div>
  );
}

function MatchRow({
  match,
  players,
}: {
  match: Match;
  players: Player[];
}) {
  const p1 = players.find((p) => p.id === match.player1Id);
  const p2 = players.find((p) => p.id === match.player2Id);
  if (!p1 || !p2) return null;

  const p1Won = match.winnerId === match.player1Id;

  return (
    <div className="match-row">
      {/* Date */}
      <div className="label-muted match-date-col">{formatDate(match.playedAt)}</div>

      {/* Players */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 'clamp(14px, 2.5vw, 18px)',
              fontWeight: p1Won ? 900 : 400,
              letterSpacing: '-0.01em',
              textTransform: 'uppercase',
            }}
          >
            {p1.name}
          </span>
          <span className="vs-text">vs</span>
          <span
            style={{
              fontSize: 'clamp(14px, 2.5vw, 18px)',
              fontWeight: !p1Won ? 900 : 400,
              letterSpacing: '-0.01em',
              textTransform: 'uppercase',
            }}
          >
            {p2.name}
          </span>
        </div>
        <div className="label-muted" style={{ marginTop: '2px' }}>
          {formatDate(match.playedAt)}
        </div>
      </div>

      {/* Score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
        <span
          className="match-score"
          style={{ color: p1Won ? '#000' : '#999' }}
        >
          {match.player1Score}
        </span>
        <span className="match-score-separator">—</span>
        <span
          className="match-score"
          style={{ color: !p1Won ? '#000' : '#999' }}
        >
          {match.player2Score}
        </span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    seedInitialData();
    const p = getPlayers();
    const m = getMatches();
    setPlayers(p);
    setMatches(m);
    setStats(getPlayerStats(p, m));
    setMounted(true);
  }, []);

  const year = new Date().getFullYear();

  return (
    <main className="page">
      {/* Hero */}
      <div className="page-hero">
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div className="page-title">
              Table<br />Tennis
            </div>
            <div className="page-subtitle">Tracker · Season {year}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: 'clamp(48px, 8vw, 80px)',
                fontWeight: 900,
                letterSpacing: '-0.04em',
                lineHeight: 1,
                color: '#e8e4dc',
              }}
            >
              {mounted ? matches.length : '—'}
            </div>
            <div className="label-muted">Matches Played</div>
          </div>
        </div>
      </div>

      {/* Standings */}
      <section style={{ marginBottom: '64px' }}>
        <div className="section-header">
          <span className="section-title">Standings</span>
          {mounted && players.length === 0 && (
            <Link href="/players" className="btn-secondary" style={{ padding: '8px 16px' }}>
              Add Players
            </Link>
          )}
        </div>

        {!mounted ? null : stats.length === 0 ? (
          <div className="empty-state">
            <div className="empty-number">0</div>
            <div className="label-muted" style={{ marginTop: '16px' }}>
              No players yet —{' '}
              <Link href="/players" style={{ color: '#000', textDecoration: 'underline' }}>
                add players
              </Link>{' '}
              to get started
            </div>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 60px 60px 160px',
                gap: '16px',
                paddingBottom: '8px',
                borderBottom: '1px solid #000',
              }}
            >
              <div className="label">#</div>
              <div className="label">Player</div>
              <div className="label" style={{ textAlign: 'center' }}>W</div>
              <div className="label" style={{ textAlign: 'center' }}>L</div>
              <div className="label standings-bar-col">Win %</div>
            </div>

            {stats.map((stat, i) => (
              <StandingsRow
                key={stat.player.id}
                stat={stat}
                rank={i + 1}
                players={players}
              />
            ))}
          </>
        )}
      </section>

      {/* Recent Matches */}
      <section>
        <div className="section-header">
          <span className="section-title">Recent Matches</span>
          <Link href="/match/new" className="btn-primary" style={{ padding: '8px 16px' }}>
            + New Match
          </Link>
        </div>

        {!mounted ? null : matches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-number">—</div>
            <div className="label-muted" style={{ marginTop: '16px' }}>
              No matches yet —{' '}
              <Link href="/match/new" style={{ color: '#000', textDecoration: 'underline' }}>
                record a match
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {matches.slice(0, 20).map((match) => (
              <MatchRow key={match.id} match={match} players={players} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
