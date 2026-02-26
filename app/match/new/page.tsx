'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getPlayers, addMatch, seedInitialData } from '../../../lib/storage';
import type { Player } from '../../../lib/types';

export default function NewMatchPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [p1Id, setP1Id] = useState('');
  const [p2Id, setP2Id] = useState('');
  const [p1Score, setP1Score] = useState<number | ''>('');
  const [p2Score, setP2Score] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    seedInitialData();
    const p = getPlayers();
    setPlayers(p);
    if (p.length >= 1) setP1Id(p[0].id);
    if (p.length >= 2) setP2Id(p[1].id);
  }, []);

  const p1 = players.find((p) => p.id === p1Id);
  const p2 = players.find((p) => p.id === p2Id);
  const p1Won =
    typeof p1Score === 'number' &&
    typeof p2Score === 'number' &&
    p1Score !== p2Score
      ? p1Score > p2Score
      : null;
  const winner = p1Won === true ? p1 : p1Won === false ? p2 : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!p1Id || !p2Id) {
      setError('Select both players');
      return;
    }
    if (p1Id === p2Id) {
      setError('Players must be different');
      return;
    }
    if (p1Score === '' || p2Score === '') {
      setError('Enter scores for both players');
      return;
    }
    if (p1Score === p2Score) {
      setError('Tie games not allowed — someone has to win');
      return;
    }

    setSubmitting(true);
    try {
      addMatch(p1Id, p2Id, Number(p1Score), Number(p2Score));
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  }

  function ScoreButton({
    player,
    score,
    onScore,
  }: {
    player: Player | undefined;
    score: number | '';
    onScore: (s: number) => void;
  }) {
    return (
      <div style={{ flex: 1 }}>
        <div className="label-muted" style={{ marginBottom: '12px' }}>
          {player?.name ?? 'Player'}
        </div>
        <div
          className="score-display"
          style={{
            color: score === '' ? '#e8e4dc' : '#000',
          }}
        >
          {score === '' ? '—' : score}
        </div>
        <div
          style={{ display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}
        >
          <button
            type="button"
            className="btn-primary"
            style={{ fontSize: '18px', padding: '12px 20px', letterSpacing: '0' }}
            onClick={() => onScore(typeof score === 'number' ? score + 1 : 1)}
          >
            +
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ fontSize: '18px', padding: '12px 20px', letterSpacing: '0' }}
            onClick={() => onScore(typeof score === 'number' && score > 0 ? score - 1 : 0)}
          >
            −
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: '20px' }}
            onClick={() => onScore(0)}
          >
            ×
          </button>
        </div>
        {/* Quick-set common scores */}
        <div style={{ display: 'flex', gap: '4px', marginTop: '12px', flexWrap: 'wrap' }}>
          {[11, 15, 21].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onScore(n)}
              style={{
                background: score === n ? '#000' : 'transparent',
                color: score === n ? '#f4f1eb' : '#000',
                border: '1px solid #000',
                fontFamily: 'inherit',
                fontSize: '10px',
                fontWeight: 400,
                letterSpacing: '0.12em',
                padding: '4px 10px',
                cursor: 'pointer',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className="page">
      <div className="page-hero">
        <div className="page-title">New<br />Match</div>
        <div className="page-subtitle">Record a result</div>
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
        <form onSubmit={handleSubmit}>
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
              <label htmlFor="p1" className="form-label">
                Player 1
              </label>
              <select
                id="p1"
                className="form-select"
                value={p1Id}
                onChange={(e) => {
                  setP1Id(e.target.value);
                  setError('');
                }}
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                textAlign: 'center',
                paddingBottom: '12px',
              }}
            >
              <span className="label-muted">VS</span>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="p2" className="form-label">
                Player 2
              </label>
              <select
                id="p2"
                className="form-select"
                value={p2Id}
                onChange={(e) => {
                  setP2Id(e.target.value);
                  setError('');
                }}
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="divider" style={{ marginBottom: '48px' }} />

          {/* Score inputs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              gap: '32px',
              alignItems: 'start',
              marginBottom: '48px',
            }}
          >
            <ScoreButton
              player={p1}
              score={p1Score}
              onScore={(s) => { setP1Score(s); setError(''); }}
            />

            {/* Center divider + winner reveal */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: '48px',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: 1,
                  height: '80px',
                  backgroundColor: '#000',
                }}
              />
              {winner && (
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      backgroundColor: '#ff4500',
                      margin: '0 auto 8px',
                    }}
                  />
                  <div
                    className="label"
                    style={{ color: '#ff4500', fontSize: '9px' }}
                  >
                    Winner
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 900,
                      letterSpacing: '-0.01em',
                      textTransform: 'uppercase',
                      marginTop: '4px',
                    }}
                  >
                    {winner.name}
                  </div>
                </div>
              )}
            </div>

            <ScoreButton
              player={p2}
              score={p2Score}
              onScore={(s) => { setP2Score(s); setError(''); }}
            />
          </div>

          {error && <div className="msg-error">{error}</div>}

          <div
            style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              marginTop: '32px',
            }}
          >
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
              style={{ fontSize: '11px' }}
            >
              {submitting ? 'Saving...' : 'Save Match'}
            </button>
            <Link href="/" className="btn-secondary" style={{ fontSize: '11px' }}>
              Cancel
            </Link>
          </div>
        </form>
      )}
    </main>
  );
}
