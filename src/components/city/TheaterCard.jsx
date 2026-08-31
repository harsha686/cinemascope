import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Monitor, MapPin, Layers, ChevronRight, Star } from 'lucide-react';

function FeatureBadge({ label }) {
  const colors = {
    '4K Laser': { bg: 'rgba(201,168,76,0.12)', color: '#c9a84c' },
    'Dolby Atmos': { bg: 'rgba(96,165,250,0.12)', color: '#60a5fa' },
    'IMAX': { bg: 'rgba(134,239,172,0.12)', color: '#4ade80' },
    'Recliners': { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
    'Large Format': { bg: 'rgba(251,146,60,0.12)', color: '#fb923c' },
    'Barco HDR': { bg: 'rgba(192,132,252,0.12)', color: '#c084fc' },
    'Christie Projector': { bg: 'rgba(201,168,76,0.12)', color: '#c9a84c' },
    'JBL Sound': { bg: 'rgba(96,165,250,0.12)', color: '#60a5fa' },
    'Barco Flagship': { bg: 'rgba(201,168,76,0.12)', color: '#c9a84c' },
    '4K': { bg: 'rgba(201,168,76,0.12)', color: '#c9a84c' },
    'Premium Screens': { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
  };
  const style = colors[label] || { bg: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      background: style.bg,
      color: style.color,
      fontSize: 9,
      fontFamily: 'var(--font-serif)',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      borderRadius: 2,
      border: `1px solid ${style.color}30`,
    }}>{label}</span>
  );
}

export default function TheaterCard({ theater, compact = false }) {
  const navigate = useNavigate();
  if (!theater) return null;

  const typeLabel = {
    multiplex: 'Multiplex',
    'single-screen': 'Single Screen',
    twin: 'Twin Cinema',
  }[theater.type] || theater.type;

  const hasIMAX = theater.features?.includes('IMAX');
  const hasAtmos = theater.features?.some(f => f.includes('Atmos'));
  const has4K = theater.features?.some(f => f.includes('4K'));

  return (
    <div
      className="card"
      onClick={() => navigate(`/theater/${theater.id}`)}
      style={{ cursor: 'pointer', padding: compact ? 16 : 24, display: 'flex', flexDirection: 'column', gap: compact ? 10 : 16, borderRadius: 2 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-serif)', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              {typeLabel}
            </span>
            {theater.chain && theater.chain !== 'Independent' && (
              <>
                <span style={{ color: 'var(--border)', fontSize: 10 }}>·</span>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-serif)', letterSpacing: '0.1em', color: 'var(--gold)', opacity: 0.7 }}>
                  {theater.chain}
                </span>
              </>
            )}
          </div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: compact ? 14 : 17, color: 'var(--text-primary)', letterSpacing: '0.03em', lineHeight: 1.2 }}>
            {theater.name}
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)' }}>
            <Monitor size={11} />
            <span>{theater.totalScreens} screen{theater.totalScreens > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Location */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <MapPin size={11} color="var(--text-muted)" />
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {theater.area || theater.address?.split(',')[0]}
        </span>
      </div>

      {/* Description */}
      {!compact && theater.description && (
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {theater.description}
        </p>
      )}

      {/* Feature badges */}
      {theater.features && theater.features.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {theater.features.slice(0, compact ? 3 : 6).map(f => <FeatureBadge key={f} label={f} />)}
          {compact && theater.features.length > 3 && (
            <span style={{ fontSize: 9, color: 'var(--text-muted)', alignSelf: 'center' }}>+{theater.features.length - 3}</span>
          )}
        </div>
      )}

      {/* CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', letterSpacing: '0.1em' }}>
          {theater.sourceConfidence === 'reported' ? 'Data: Reported' : theater.sourceConfidence === 'estimated' ? 'Data: Estimated' : ''}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--gold)', fontSize: 11, fontFamily: 'var(--font-serif)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          View Screens
          <ChevronRight size={13} />
        </div>
      </div>
    </div>
  );
}
