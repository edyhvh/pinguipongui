'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllData, getPlayerStatsExtended } from '../lib/storage';
import { CURRENT_SEASON_LABEL } from '../lib/types';
import type { Player, Match, PlayerStatsExtended } from '../lib/types';

function formatPct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatNum(value: number): string {
  return value.toFixed(2);
}

function StandingsRow({
  stat,
  rank,
}: {
  stat: PlayerStatsExtended;
  rank: number | null;
}) {
  const isFirst = rank !== null && rank === 1;
  const hasGames = stat.totalGames > 0;

  // For players with 0 games, show "—" for rank, Win%, Confidence, Distribution
  const displayRank = rank !== null ? rank : '—';
  const displayWinPct = hasGames ? formatPct(stat.winRate) : '—';
  const displayConfidence = hasGames ? formatPct(stat.confidence) : '—';
  const displayDistribution = hasGames ? formatPct(stat.distribution) : '—';
  const displayRating = hasGames ? formatNum(stat.rating) : '—';
  const displayOpponents = hasGames ? `${stat.opponents}/${stat.activePlayers}` : '—';

  return (
    <div className="standings-row" style={{ 
      opacity: hasGames ? 1 : 0.5,
      backgroundColor: hasGames ? 'transparent' : '#f5f5f5'
    }}>
      {/* Rank */}
      <div
        className="rank-number"
        style={{ color: isFirst ? '#ff4500' : '#000' }}
      >
        {displayRank}
      </div>

      {/* Player */}
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
      </div>

      {/* Rating */}
      <div style={{ textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.06)', padding: '12px 0' }}>
        <div
          className="stat-number"
          style={{ color: isFirst ? '#ff4500' : '#000', fontWeight: 900 }}
        >
          {displayRating}
        </div>
      </div>

      {/* Win% */}
      <div style={{ textAlign: 'center' }}>
        <div
          className="stat-number"
          style={{ color: isFirst ? '#ff4500' : '#000' }}
        >
          {displayWinPct}
        </div>
      </div>

      {/* Confidence */}
      <div style={{ textAlign: 'center' }}>
        <div className="stat-number">{displayConfidence}</div>
      </div>

      {/* Distribution */}
      <div style={{ textAlign: 'center' }}>
        <div className="stat-number">{displayDistribution}</div>
      </div>

      {/* Wins */}
      <div style={{ textAlign: 'center' }}>
        <div
          className="stat-number"
          style={{ color: isFirst ? '#ff4500' : '#000' }}
        >
          {stat.wins}
        </div>
      </div>

      {/* Losses */}
      <div style={{ textAlign: 'center' }}>
        <div className="stat-number">{stat.losses}</div>
      </div>

      {/* Games */}
      <div style={{ textAlign: 'center' }}>
        <div className="stat-number">{stat.totalGames}</div>
      </div>

      {/* Opponents */}
      <div style={{ textAlign: 'center' }}>
        <div className="stat-number">{displayOpponents}</div>
      </div>
    </div>
  );
}


function H2HMatrix({ stats }: { stats: PlayerStatsExtended[] }) {
  // Only players who have played at least one game
  const active = stats.filter((s) => s.totalGames > 0);
  if (active.length < 2) return null;

  return (
    <section style={{ marginBottom: '64px' }}>
      <div className="section-header">
        <span className="section-title">Head-to-Head</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `80px repeat(${active.length}, 1fr)`,
            minWidth: `${80 + active.length * 60}px`,
          }}
        >
          {/* Header row */}
          <div style={{ borderBottom: '1px solid #000', paddingBottom: '6px' }} />
          {active.map((col) => (
            <div
              key={col.player.id}
              style={{
                textAlign: 'center',
                fontSize: '10px',
                fontWeight: 900,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                paddingBottom: '6px',
                borderBottom: '1px solid #000',
              }}
            >
              {col.player.name}
            </div>
          ))}

          {/* Data rows */}
          {active.map((row) => (
            <div key={row.player.id} style={{ display: 'contents' }}>
              {/* Row label */}
              <div
                key={`label-${row.player.id}`}
                style={{
                  fontSize: '10px',
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid #e8e4dc',
                }}
              >
                {row.player.name}
              </div>

              {/* Cells */}
              {active.map((col) => {
                const isSelf = row.player.id === col.player.id;
                const record = row.h2h.get(col.player.id);

                let bg = 'transparent';
                let textColor = '#000';
                let content = '—';

                if (isSelf) {
                  bg = 'rgba(0,0,0,0.04)';
                  content = '·';
                  textColor = '#ccc';
                } else if (record && record.games > 0) {
                  content = `${record.wins}–${record.losses}`;
                  if (record.wins > record.losses) {
                    bg = 'rgba(0,0,0,0.07)';
                    textColor = '#000';
                  } else if (record.losses > record.wins) {
                    bg = 'transparent';
                    textColor = '#999';
                  }
                }

                return (
                  <div
                    key={`${row.player.id}-${col.player.id}`}
                    style={{
                      textAlign: 'center',
                      fontSize: '11px',
                      fontWeight: record && !isSelf ? 900 : 400,
                      letterSpacing: '0.02em',
                      padding: '10px 4px',
                      backgroundColor: bg,
                      color: textColor,
                      borderBottom: '1px solid #e8e4dc',
                    }}
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="label-muted" style={{ marginTop: '12px' }}>
        Row vs column — e.g. &quot;9–4&quot; means the row player won 9, lost 4 against that opponent. Bold = winning record.
      </div>
    </section>
  );
}

export default function HomePage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<PlayerStatsExtended[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getAllData();
        if (cancelled) return;
        setPlayers(data.players);
        setMatches(data.matches);
        setStats(getPlayerStatsExtended(data.players, data.matches));
        setLoadError(false);
        setMounted(true);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    }
    load();
    const interval = setInterval(load, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Separate players with games from those without
  const playersWithGames = stats.filter(s => s.totalGames > 0);
  const playersWithoutGames = stats.filter(s => s.totalGames === 0);
  
  // Combine: ranked players first, then unranked
  const rankedStats = [...playersWithGames, ...playersWithoutGames];

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
              Ugly<br />Pong
            </div>
            <div className="page-subtitle">Tracker · {CURRENT_SEASON_LABEL}</div>
            <div className="season-sticker" aria-label="New Season">New Season</div>
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
            <div className="label-muted">Games Played</div>
          </div>
        </div>
      </div>

      {/* Standings Table */}
      <section style={{ marginBottom: '64px' }}>
        <div className="section-header">
          <span className="section-title">Standings</span>
          {mounted && players.length === 0 && (
            <Link href="/players" className="btn-secondary" style={{ padding: '8px 16px' }}>
              Add Players
            </Link>
          )}
        </div>

        {loadError ? (
          <div className="empty-state">
            <div className="label-muted">Failed to load data — check your connection and refresh</div>
          </div>
        ) : !mounted ? null : stats.length === 0 ? (
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
            {/* Table header - 10 columns */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '50px 1fr 80px 70px 70px 70px 50px 50px 70px 70px',
                gap: '8px',
                paddingBottom: '8px',
                borderBottom: '1px solid #000',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <div className="label">#</div>
              <div className="label">Player</div>
              <div className="label" style={{ textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.06)', padding: '4px 0' }}>Rating</div>
              <div className="label" style={{ textAlign: 'center' }}>Win%</div>
              <div className="label" style={{ textAlign: 'center' }}>Conf.</div>
              <div className="label" style={{ textAlign: 'center' }}>Dist.</div>
              <div className="label" style={{ textAlign: 'center' }}>W</div>
              <div className="label" style={{ textAlign: 'center' }}>L</div>
              <div className="label" style={{ textAlign: 'center' }}>Games</div>
              <div className="label" style={{ textAlign: 'center' }}>Opp.</div>
            </div>

            {/* Ranked players (with games) */}
            {playersWithGames.map((stat, i) => (
              <StandingsRow
                key={stat.player.id}
                stat={stat}
                rank={i + 1}
              />
            ))}

            {/* Unranked players (0 games) - show with rank as "—" */}
            {playersWithoutGames.map((stat) => (
              <StandingsRow
                key={stat.player.id}
                stat={stat}
                rank={null}
              />
            ))}
          </>
        )}
      </section>

      {/* Head-to-Head Matrix */}
      {mounted && <H2HMatrix stats={rankedStats} />}

    </main>
  );
}
