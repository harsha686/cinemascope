import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, MapPin, ChevronRight, Star, Trophy, Layers } from 'lucide-react';
import { useApp } from '../../AppContext';

export default function TheaterCard({ theater, compact = false, isTopRated = false }) {
  const navigate = useNavigate();
  const { getTheaterRating } = useApp();
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  if (!theater) return null;

  const ratingInfo = getTheaterRating ? getTheaterRating(theater.id) : { average: 0, count: 0 };

  const typeLabel = {
    multiplex: 'Multiplex',
    'single-screen': 'Single Screen',
    twin: 'Twin Cinema',
  }[theater.type] || theater.type;

  // Prioritize top distinguishing specs for the 2-badge cap
  const allFeatures = theater.features || [];
  const priorityOrder = ['IMAX', '4K Laser', 'Dolby Atmos', 'Barco Flagship', 'Barco HDR', 'Christie Projector', 'Large Format', 'Recliners'];
  const sortedFeatures = [...allFeatures].sort((a, b) => {
    const idxA = priorityOrder.indexOf(a);
    const idxB = priorityOrder.indexOf(b);
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  const visibleBadges = sortedFeatures.slice(0, 2);
  const remainingCount = sortedFeatures.length - 2;

  const handleCardClick = () => {
    navigate(`/theater/${theater.id}`);
  };

  return (
    <div
      role="article"
      tabIndex={0}
      className={`card interactive-card ${isTopRated ? 'top-rated-theater-card' : ''}`}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      style={{
        cursor: 'pointer',
        padding: compact ? 16 : 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-card)',
        border: isTopRated ? '1px solid var(--accent-border)' : '1px solid var(--border-subtle)',
        outline: 'none',
        position: 'relative',
        transition: 'all var(--transition-fast)',
      }}
    >
      {/* Top Rated Highlight Badge (Single Featured Item Highlight) */}
      {isTopRated && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: -4 }}>
          <span
            className="badge badge-featured"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
            }}
          >
            <Trophy size={11} /> #1 Top Rated Theater
          </span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600 }}>
              {typeLabel}
            </span>
            {theater.chain && theater.chain !== 'Independent' && (
              <>
                <span style={{ color: 'var(--border-subtle)', fontSize: 10 }}>·</span>
                <span style={{ fontSize: 10, letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                  {theater.chain}
                </span>
              </>
            )}
          </div>
          <h3 style={{
            fontSize: compact ? 14 : 16,
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.25,
            margin: 0,
          }}>
            {theater.name}
          </h3>
        </div>

        {/* Screen Count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
          <Monitor size={12} />
          <span>{theater.totalScreens} screen{theater.totalScreens > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Location */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <MapPin size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {theater.area || theater.address?.split(',')[0]}
        </span>
      </div>

      {/* Feature Badges — Strict 2-Badge Cap + Overflow Toggle */}
      {visibleBadges.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          {(showAllFeatures ? sortedFeatures : visibleBadges).map((f) => (
            <span
              key={f}
              className="badge"
              style={{ fontSize: 10, padding: '2px 8px' }}
            >
              {f}
            </span>
          ))}
          {remainingCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAllFeatures(!showAllFeatures);
              }}
              className="badge"
              style={{
                fontSize: 10,
                padding: '2px 8px',
                cursor: 'pointer',
                background: showAllFeatures ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                borderColor: 'var(--border-neutral)',
                color: 'var(--text-secondary)',
              }}
              title={showAllFeatures ? 'Show less' : 'View all specs'}
            >
              {showAllFeatures ? 'Show less' : `+${remainingCount} more`}
            </button>
          )}
        </div>
      )}

      {/* Footer / CTA Area — Single Primary Accent Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 6 }}>
        {/* Rating */}
        {ratingInfo.count > 0 ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Star size={12} fill="var(--accent)" color="var(--accent)" />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
              {ratingInfo.average}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              ({ratingInfo.count})
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>No reviews yet</span>
        )}

        {/* Primary CTA Button — Exactly ONE Accent Action */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
          className="btn btn-primary btn-sm"
          style={{ padding: '5px 12px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          View Screens
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}
