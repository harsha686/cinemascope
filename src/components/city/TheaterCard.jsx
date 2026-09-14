import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, MapPin, ChevronRight, Star, Trophy, Medal, Award } from 'lucide-react';
import { useApp } from '../../AppContext';

export function getFeatureBadgeStyle(feature) {
  if (!feature) return {};
  const f = feature.toLowerCase();

  // Dolby Atmos / Dolby -> Signature Acoustic Blue
  if (f.includes('atmos') || f.includes('dolby')) {
    return {
      color: '#60a5fa',
      background: 'rgba(37, 99, 235, 0.16)',
      borderColor: 'rgba(96, 165, 250, 0.45)',
    };
  }

  // Barco HDR / Barco Flagship / Barco -> Laser Purple / Violet
  if (f.includes('barco') || f.includes('hdr')) {
    return {
      color: '#c084fc',
      background: 'rgba(168, 85, 247, 0.16)',
      borderColor: 'rgba(192, 132, 252, 0.45)',
    };
  }

  // 4K / 4K Laser / Laser -> Radiant Gold / Yellow
  if (f.includes('4k') || f.includes('laser')) {
    return {
      color: '#facc15',
      background: 'rgba(234, 179, 8, 0.16)',
      borderColor: 'rgba(250, 204, 21, 0.45)',
    };
  }

  // IMAX -> Vibrant Emerald
  if (f.includes('imax')) {
    return {
      color: '#34d399',
      background: 'rgba(16, 185, 129, 0.16)',
      borderColor: 'rgba(52, 211, 153, 0.45)',
    };
  }

  // Christie -> Bright Orange
  if (f.includes('christie')) {
    return {
      color: '#fb923c',
      background: 'rgba(249, 115, 22, 0.16)',
      borderColor: 'rgba(251, 146, 60, 0.45)',
    };
  }

  // JBL -> Cyan
  if (f.includes('jbl')) {
    return {
      color: '#38bdf8',
      background: 'rgba(14, 165, 233, 0.16)',
      borderColor: 'rgba(56, 189, 248, 0.45)',
    };
  }

  // Default subtle badge
  return {
    color: 'var(--text-secondary)',
    background: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'var(--border-subtle)',
  };
}

export default function TheaterCard({ theater, compact = false, isTopRated = false, topRank = null }) {
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

  // Top 3 Podium Rank Configuration
  const rank = topRank || (isTopRated ? 1 : null);
  const rankConfig = {
    1: {
      label: '#1 Top Rated Theater',
      Icon: Trophy,
      badgeStyle: {
        background: 'rgba(234, 179, 8, 0.16)',
        color: '#facc15',
        border: '1px solid rgba(250, 204, 21, 0.5)',
      },
      cardStyle: {
        border: '1px solid rgba(250, 204, 21, 0.5)',
        boxShadow: '0 0 16px rgba(234, 179, 8, 0.08)',
      },
    },
    2: {
      label: '#2 Top Rated Theater',
      Icon: Medal,
      badgeStyle: {
        background: 'rgba(226, 232, 240, 0.14)',
        color: '#e2e8f0',
        border: '1px solid rgba(226, 232, 240, 0.45)',
      },
      cardStyle: {
        border: '1px solid rgba(226, 232, 240, 0.35)',
        boxShadow: '0 0 14px rgba(226, 232, 240, 0.06)',
      },
    },
    3: {
      label: '#3 Top Rated Theater',
      Icon: Award,
      badgeStyle: {
        background: 'rgba(205, 127, 50, 0.16)',
        color: '#fdba74',
        border: '1px solid rgba(205, 127, 50, 0.5)',
      },
      cardStyle: {
        border: '1px solid rgba(205, 127, 50, 0.35)',
        boxShadow: '0 0 14px rgba(205, 127, 50, 0.06)',
      },
    },
  }[rank];

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
      className={`card interactive-card ${rank ? `top-rated-theater-card rank-${rank}` : ''}`}
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
        border: rankConfig ? rankConfig.cardStyle.border : '1px solid var(--border-subtle)',
        boxShadow: rankConfig ? rankConfig.cardStyle.boxShadow : 'none',
        outline: 'none',
        position: 'relative',
        transition: 'all var(--transition-fast)',
      }}
    >
      {/* Top 3 Podium Highlight Badge */}
      {rankConfig && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: -4 }}>
          <span
            className="badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              ...rankConfig.badgeStyle,
            }}
          >
            <rankConfig.Icon size={11} /> {rankConfig.label}
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
          {(showAllFeatures ? sortedFeatures : visibleBadges).map((f) => {
            const fStyle = getFeatureBadgeStyle(f);
            return (
              <span
                key={f}
                className="badge"
                style={{
                  fontSize: 10,
                  padding: '2px 8px',
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                  ...fStyle,
                }}
              >
                {f}
              </span>
            );
          })}
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
