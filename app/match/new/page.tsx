'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getPlayers, addMatchesBulk, seedInitialData } from '../../../lib/storage';
import type { Player } from '../../../lib/types';

type Entry = { winnerId: string; loserId: string };

export default function NewMatchPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [p1Id, setP1Id] = useState('');
  const [p2Id, setP2Id] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    seedInitialData();
    const p = getPlayers();
    setPlayers(p);
    if (p.length >= 1) setP1Id(p[0].id);
    if (p.length >= 2) setP2Id(p[1].id);
  }, []);

  const p1 = players.find((p) => p.id === p1Id);
  const p2 = players.find((p) => p.id === p2Id);
  const playersSelected = p1Id && p2Id && p1Id !== p2Id;

  const p1Wins = entries.filter((e) => e.winnerId === p1Id).length;
  const p2Wins = entries.filter((e) => e.winnerId === p2Id).length;
  const total = entries.length;

  function recordWin(winnerId: string, loserId: string) {
    setEntries((prev) => [...prev, { winnerId, loserId }]);
  }

  function undoLast() {
    setEntries((prev) => prev.slice(0, -1));
  }

  function handleSave() {
    if (entries.length === 0) return;
    setSaving(true);
    addMatchesBulk(entries);
    router.push('/');
  }

  function handlePlayerChange(slot: 1 | 2, id: string) {
    if (slot === 1) setP1Id(id);
    else setP2Id(id);
    setEntries([]);
  }

  return (
    <main className="page">
      <div className="page-hero">
        <div className="page-title">New<br />Match</div>
        <div className="page-subtitle">Record results</div>
      </div>

      {players.length < 2 ? (
        <div className="empty-state">
          <div className="empty-number">!</div>
          <div className="label-muted" style={{ marginTop: '16px' }}>
            You need at least 2 players —{' '}
            <Link href="/players" style={{ color: '#000', textDecoration: 'underline' }}>
              add players first
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Player selectors */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              gap: '24px',
              alignItems: 'end',
              marginBottom: '48px',
            }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="p1" className="form-label">Player 1</label>
              <select
                id="p1"
                className="form-select"
                value={p1Id}
                onChange={(e) => handlePlayerChange(1, e.target.value)}
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div style={{ textAlign: 'center', paddingBottom: '12px' }}>
              <span className="label-muted">VS</span>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="p2" className="form-label">Player 2</label>
              <select
                id="p2"
                className="form-select"
                value={p2Id}
                onChange={(e) => handlePlayerChange(2, e.target.value)}
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {p1Id === p2Id && (
            <div className="msg-error" style={{ marginBottom: '24px' }}>
              Select two different players
            </div>
          )}

          {playersSelected && (
            <>
              <div className="divider" style={{ marginBottom: '40px' }} />

              {/* Win buttons */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  marginBottom: '40px',
                }}
              >
                <button
                  type="button"
                  onClick={() => recordWin(p1Id, p2Id)}
                  style={{
                    background: 'transparent',
                    border: '2px solid #000',
                    cursor: 'pointer',
                    padding: '32px 16px',
                    textAlign: 'center',
                    fontFamily: 'inherit',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    style={{
                      fontSize: 'clamp(28px, 4vw, 40px)',
                      fontWeight: 900,
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                    }}
                  >
                    {p1?.name}
                  </div>
                  <div className="label-muted" style={{ marginTop: '8px' }}>won</div>
                </button>

                <button
                  type="button"
                  onClick={() => recordWin(p2Id, p1Id)}
                  style={{
                    background: 'transparent',
                    border: '2px solid #000',
                    cursor: 'pointer',
                    padding: '32px 16px',
                    textAlign: 'center',
                    fontFamily: 'inherit',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    style={{
                      fontSize: 'clamp(28px, 4vw, 40px)',
                      fontWeight: 900,
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                    }}
                  >
                    {p2?.name}
                  </div>
                  <div className="label-muted" style={{ marginTop: '8px' }}>won</div>
                </button>
              </div>

              {/* Tally */}
              {total > 0 && (
                <>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto 1fr',
                      gap: '16px',
                      alignItems: 'center',
                      marginBottom: '32px',
                      padding: '24px 0',
                      borderTop: '1px solid #000',
                      borderBottom: '1px solid #000',
                    }}
                  >
                    {/* P1 tally */}
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: 'clamp(48px, 8vw, 80px)',
                          fontWeight: 900,
                          letterSpacing: '-0.05em',
                          lineHeight: 1,
                          color: p1Wins > p2Wins ? '#ff4500' : '#000',
                        }}
                      >
                        {p1Wins}
                      </div>
                      <div className="label-muted" style={{ marginTop: '4px' }}>{p1?.name}</div>
                    </div>

                    {/* Center */}
                    <div style={{ textAlign: 'center' }}>
                      <div className="label-muted">{total} {total === 1 ? 'game' : 'games'}</div>
                    </div>

                    {/* P2 tally */}
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: 'clamp(48px, 8vw, 80px)',
                          fontWeight: 900,
                          letterSpacing: '-0.05em',
                          lineHeight: 1,
                          color: p2Wins > p1Wins ? '#ff4500' : '#000',
                        }}
                      >
                        {p2Wins}
                      </div>
                      <div className="label-muted" style={{ marginTop: '4px' }}>{p2?.name}</div>
                    </div>
                  </div>

                  {/* Game log */}
                  <div style={{ marginBottom: '32px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {entries.map((e, i) => {
                      const winner = players.find((p) => p.id === e.winnerId);
                      const isLast = i === entries.length - 1;
                      return (
                        <div
                          key={i}
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            padding: '4px 8px',
                            border: `1px solid ${isLast ? '#ff4500' : '#ccc'}`,
                            color: isLast ? '#ff4500' : '#666',
                          }}
                        >
                          {winner?.name}
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleSave}
                      disabled={saving}
                      style={{ fontSize: '11px' }}
                    >
                      {saving ? 'Saving...' : `Save ${total} ${total === 1 ? 'Game' : 'Games'}`}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={undoLast}
                      style={{ fontSize: '11px' }}
                    >
                      Undo Last
                    </button>
                    <Link href="/" className="btn-ghost" style={{ fontSize: '11px' }}>
                      Cancel
                    </Link>
                  </div>
                </>
              )}

              {total === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div className="label-muted">Tap a player above to record who won each game</div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
