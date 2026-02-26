export default function RankingPage() {
  return (
    <main className="page">
      <div className="page-hero">
        <div className="page-title">
          How<br />Ranking<br />Works
        </div>
        <div className="page-subtitle">Scoring System · Formula</div>
      </div>

      <section style={{ marginBottom: '64px' }}>
        <div className="section-header">
          <span className="section-title">Rating Formula</span>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <div
            style={{
              backgroundColor: '#000',
              color: '#f4f1eb',
              padding: '20px 24px',
              fontFamily: 'monospace',
              fontSize: '14px',
              letterSpacing: '0.02em',
              marginBottom: '12px',
            }}
          >
            Rating = WinRate × ((Confidence × 0.8) + (Distribution × 0.2)) × 100
          </div>
          <div className="label-muted">
            Rating is a composite score from 0–100. Higher = higher rank. Players with 0 games are unranked.
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '64px' }}>
        <div className="section-header">
          <span className="section-title">Components</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {/* Win Rate */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr',
              gap: '32px',
              alignItems: 'start',
              padding: '24px 0',
              borderBottom: '1px solid #000',
            }}
          >
            <div>
              <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>
                Win%
              </div>
              <div className="label-muted" style={{ marginTop: '4px' }}>Win Rate</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '8px' }}>
                <code style={{ backgroundColor: '#f0ede7', padding: '2px 6px' }}>wins / total games</code>
              </div>
              <div className="label-muted">
                The basic win percentage — what fraction of games you've won.
              </div>
            </div>
          </div>

          {/* Confidence */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr',
              gap: '32px',
              alignItems: 'start',
              padding: '24px 0',
              borderBottom: '1px solid #000',
            }}
          >
            <div>
              <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>
                Conf.
              </div>
              <div className="label-muted" style={{ marginTop: '4px' }}>Confidence</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '8px' }}>
                <code style={{ backgroundColor: '#f0ede7', padding: '2px 6px' }}>games / (games + 8)</code>
              </div>
              <div className="label-muted" style={{ marginBottom: '8px' }}>
                How much we trust your win rate. More games = higher confidence.
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                  marginTop: '12px',
                }}
              >
                {[
                  { games: 1, conf: '11%' },
                  { games: 5, conf: '38%' },
                  { games: 10, conf: '56%' },
                  { games: 20, conf: '71%' },
                  { games: 30, conf: '79%' },
                  { games: 50, conf: '86%' },
                ].map(({ games, conf }) => (
                  <div
                    key={games}
                    style={{
                      border: '1px solid #000',
                      padding: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontWeight: 900, fontSize: '18px' }}>{conf}</div>
                    <div className="label-muted">{games} games</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Distribution */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr',
              gap: '32px',
              alignItems: 'start',
              padding: '24px 0',
              borderBottom: '1px solid #000',
            }}
          >
            <div>
              <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>
                Dist.
              </div>
              <div className="label-muted" style={{ marginTop: '4px' }}>Distribution</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '8px' }}>
                <code style={{ backgroundColor: '#f0ede7', padding: '2px 6px' }}>
                  1 − Σ(games_vs_opponent / total)²
                </code>
              </div>
              <div className="label-muted">
                Rewards playing a variety of opponents. If all your games are against one person, distribution is low (0%). If spread evenly across many opponents, it approaches 100%. Based on the Herfindahl–Hirschman Index (inverted).
              </div>
            </div>
          </div>

          {/* Rating weight */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr',
              gap: '32px',
              alignItems: 'start',
              padding: '24px 0',
              borderBottom: '1px solid #000',
            }}
          >
            <div>
              <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>
                Weights
              </div>
              <div className="label-muted" style={{ marginTop: '4px' }}>Multiplier split</div>
            </div>
            <div>
              <div className="label-muted" style={{ marginBottom: '12px' }}>
                Confidence counts for 80% of the multiplier, distribution 20%. This keeps the focus on playing enough games while still rewarding variety.
              </div>
              <div style={{ display: 'flex', gap: '0', height: '32px' }}>
                <div
                  style={{
                    width: '80%',
                    backgroundColor: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f4f1eb',
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  Confidence 80%
                </div>
                <div
                  style={{
                    width: '20%',
                    backgroundColor: '#ff4500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  Dist. 20%
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '64px' }}>
        <div className="section-header">
          <span className="section-title">Tiebreakers</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {[
            { order: '1', label: 'Rating', desc: 'Higher composite rating wins.' },
            { order: '2', label: 'Head-to-head', desc: 'If ratings are equal, the player with more wins against the other ranks higher.' },
            { order: '3', label: 'Total games', desc: 'If head-to-head is equal, the player with more games played ranks higher.' },
          ].map(({ order, label, desc }) => (
            <div
              key={order}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr',
                gap: '24px',
                alignItems: 'start',
                padding: '20px 0',
                borderBottom: '1px solid #ccc',
              }}
            >
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#ccc', lineHeight: 1 }}>{order}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div className="label-muted">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: '64px' }}>
        <div className="section-header">
          <span className="section-title">Definitions</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {[
            { term: 'Active players', def: 'Players who have played at least 1 game.' },
            { term: 'Opp.', def: 'Unique opponents faced, shown as opponents / total active players.' },
            { term: 'Unranked', def: 'Players with 0 games are shown at the bottom with "—" in the rank column.' },
          ].map(({ term, def }) => (
            <div
              key={term}
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 1fr',
                gap: '24px',
                padding: '16px 0',
                borderBottom: '1px solid #ccc',
                fontSize: '13px',
              }}
            >
              <div style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{term}</div>
              <div className="label-muted">{def}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
