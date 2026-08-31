import React from 'react';

const REVIEW_PARAMS = [
  { key: 'direction',  label: 'Direction',   emoji: '🎬' },
  { key: 'story',      label: 'Story',        emoji: '📖' },
  { key: 'acting',     label: 'Acting',       emoji: '🎭' },
  { key: 'screenplay', label: 'Screenplay',   emoji: '📝' },
  { key: 'music',      label: 'Music',        emoji: '🎵' },
  { key: 'dop',        label: 'DOP',          emoji: '📷' },
  { key: 'vfx',        label: 'VFX',          emoji: '✨' },
];

export default function RatingBreakdown({ reviews = [] }) {
  const published = reviews.filter(r => r.status === 'PUBLISHED');

  if (published.length === 0) {
    return (
      <div style={{ padding: '20px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', textAlign: 'center', borderRadius: 4 }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          No ratings submitted yet. Be the first to rate!
        </p>
      </div>
    );
  }

  // Compute per-parameter averages across all reviews that rated that param
  const paramStats = REVIEW_PARAMS.map(param => {
    const ratedReviews = published.filter(r => r.parameterRatings && r.parameterRatings[param.key] > 0);
    if (ratedReviews.length === 0) return { ...param, avg: 0, count: 0 };
    const sum = ratedReviews.reduce((acc, r) => acc + r.parameterRatings[param.key], 0);
    return { ...param, avg: Math.round((sum / ratedReviews.length) * 10) / 10, count: ratedReviews.length };
  });

  // Overall average (across all ratings in all reviews)
  const allRatings = published.map(r => r.rating || 0).filter(v => v > 0);
  const overallAvg = allRatings.length > 0
    ? Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Overall score banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', background: 'rgba(220,182,91,0.06)', border: '1px solid var(--gold-dim)', borderRadius: 4 }}>
        <div>
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--gold)', lineHeight: 1 }}>
            {overallAvg > 0 ? overallAvg : 'N/A'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Based on {published.length} {published.length === 1 ? 'rating' : 'ratings'}
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', gap: 3 }}>
          {[1, 2, 3, 4, 5].map(s => (
            <div key={s} style={{
              flex: 1, height: 6, borderRadius: 3,
              background: s <= Math.round(overallAvg) ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
              transition: 'background 400ms ease',
            }} />
          ))}
        </div>
      </div>

      {/* Per-parameter breakdown */}
      <div style={{ padding: '14px 18px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          Average Scores by Category
        </div>
        {paramStats.map(param => {
          if (param.count === 0) return null;
          const pct = (param.avg / 5) * 100;
          const color = param.avg >= 4 ? 'var(--gold)' : param.avg >= 3 ? '#fbbf24' : '#f87171';
          return (
            <div key={param.key} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 48px', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                <span style={{ fontSize: 14 }}>{param.emoji}</span>
                <span>{param.label}</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 600ms ease' }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color, textAlign: 'right' }}>
                {param.avg}
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>/5</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
