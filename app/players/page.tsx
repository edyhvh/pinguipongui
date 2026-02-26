'use client';

import { useEffect, useState } from 'react';
import { getAllData, addPlayer, removePlayer, getPlayerStats } from '../../lib/storage';
import type { Player, PlayerStats } from '../../lib/types';

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mounted, setMounted] = useState(false);

  async function refresh() {
    const data = await getAllData();
    setPlayers(data.players);
    setStats(getPlayerStats(data.players, data.matches));
  }

  useEffect(() => {
    refresh().then(() => setMounted(true));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim()) {
      setError('Enter a player name');
      return;
    }
    try {
      const player = await addPlayer(name);
      setSuccess(`${player.name} added`);
      setName('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  async function handleRemove(id: string, playerName: string) {
    if (!confirm(`Remove ${playerName}? Their match history will remain.`)) return;
    await removePlayer(id);
    await refresh();
  }

  const statMap = new Map(stats.map((s) => [s.player.id, s]));

  return (
    <main className="page">
      <div className="page-hero">
        <div className="page-title">Players</div>
        <div className="page-subtitle">
          {mounted ? `${players.length} registered` : '—'}
        </div>
      </div>

      {/* Add player form */}
      <section style={{ marginBottom: '64px' }}>
        <div className="section-header">
          <span className="section-title">Add Player</span>
        </div>

        <form onSubmit={handleAdd}>
          <div className="form-group">
            <label htmlFor="player-name" className="form-label">
              Full Name
            </label>
            <input
              id="player-name"
              type="text"
              className="form-input"
              placeholder="Enter name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
                setSuccess('');
              }}
              maxLength={40}
              autoComplete="off"
            />
          </div>

          {error && <div className="msg-error">{error}</div>}
          {success && (
            <div className="msg-success">
              ✓ {success}
            </div>
          )}

          <div style={{ marginTop: '24px' }}>
            <button type="submit" className="btn-primary">
              Add Player
            </button>
          </div>
        </form>
      </section>

      <div className="divider" style={{ marginBottom: '48px' }} />

      {/* Player list */}
      <section>
        <div className="section-header">
          <span className="section-title">All Players</span>
        </div>

        {!mounted ? null : players.length === 0 ? (
          <div className="empty-state">
            <div className="empty-number">0</div>
            <div className="label-muted" style={{ marginTop: '16px' }}>
              No players yet — add your first player above
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 48px 48px 80px 32px',
                gap: '16px',
                paddingBottom: '8px',
                borderBottom: '1px solid #000',
                marginBottom: '0',
              }}
            >
              <div className="label">Player</div>
              <div className="label" style={{ textAlign: 'center' }}>W</div>
              <div className="label" style={{ textAlign: 'center' }}>L</div>
              <div className="label">Win %</div>
              <div />
            </div>

            {players.map((player) => {
              const s = statMap.get(player.id);
              return (
                <div
                  key={player.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 48px 48px 80px 32px',
                    gap: '16px',
                    alignItems: 'center',
                    padding: '16px 0',
                    borderBottom: '1px solid #ccc',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '18px',
                        fontWeight: 900,
                        letterSpacing: '-0.01em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {player.name}
                    </div>
                    <div className="label-muted" style={{ marginTop: '2px' }}>
                      Since{' '}
                      {new Date(player.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 900,
                      textAlign: 'center',
                    }}
                  >
                    {s?.wins ?? 0}
                  </div>

                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 400,
                      textAlign: 'center',
                      color: '#666',
                    }}
                  >
                    {s?.losses ?? 0}
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 900,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {s && s.totalMatches > 0
                        ? `${Math.round(s.winRate * 100)}%`
                        : '—'}
                    </div>
                    <div className="label-muted" style={{ marginTop: '2px' }}>
                      {s?.totalMatches ?? 0} played
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-ghost"
                    title="Remove player"
                    onClick={() => handleRemove(player.id, player.name)}
                    style={{ fontSize: '16px', color: '#ccc' }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
