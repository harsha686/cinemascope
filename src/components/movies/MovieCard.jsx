import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Trophy, Medal, Award } from 'lucide-react';
import StarRating from '../reviews/StarRating';
import { useApp } from '../../AppContext';
import PosterPlaceholder from '../shared/PosterPlaceholder';

export default function MovieCard({ movie, compact = false, topRank = null }) {
  const navigate = useNavigate();
  const { getMovieRating } = useApp();

  if (!movie) return null;

  const { average, count } = getMovieRating(movie.id);

  const statusBadge = {
    CURRENTLY_SHOWING: { label: 'Now Showing', class: 'badge-verified' },
    COMING_SOON: { label: 'Coming Soon', class: 'badge-dim' },
    ARCHIVED: { label: 'Archived', class: 'badge-dim' },
  }[movie.status] || { label: movie.status, class: 'badge-dim' };

  const rankConfig = {
    1: {
      label: '#1 Top Rated',
      Icon: Trophy,
      style: {
        background: 'rgba(234, 179, 8, 0.22)',
        color: '#facc15',
        border: '1px solid rgba(250, 204, 21, 0.65)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
      },
      cardBorder: '1px solid rgba(250, 204, 21, 0.5)',
      cardShadow: '0 0 16px rgba(234, 179, 8, 0.08)',
    },
    2: {
      label: '#2 Top Rated',
      Icon: Medal,
      style: {
        background: 'rgba(226, 232, 240, 0.2)',
        color: '#f1f5f9',
        border: '1px solid rgba(226, 232, 240, 0.55)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
      },
      cardBorder: '1px solid rgba(226, 232, 240, 0.4)',
      cardShadow: '0 0 14px rgba(226, 232, 240, 0.06)',
    },
    3: {
      label: '#3 Top Rated',
      Icon: Award,
      style: {
        background: 'rgba(205, 127, 50, 0.22)',
        color: '#fdba74',
        border: '1px solid rgba(205, 127, 50, 0.55)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
      },
      cardBorder: '1px solid rgba(205, 127, 50, 0.4)',
      cardShadow: '0 0 14px rgba(205, 127, 50, 0.06)',
    },
  }[topRank];

  const handleClick = () => navigate(`/movie/${movie.id}`);
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="link"
      tabIndex={0}
      className={`card interactive-card ${topRank ? `top-rated-movie-card rank-${topRank}` : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${movie.title} — ${statusBadge.label}`}
      style={{
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-card)',
        border: rankConfig ? rankConfig.cardBorder : '1px solid var(--border-subtle)',
        boxShadow: rankConfig ? rankConfig.cardShadow : 'none',
        outline: 'none',
        position: 'relative',
        transition: 'all var(--transition-fast)',
      }}
    >
      {/* Poster Image Container */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '2/3', background: '#080705', overflow: 'hidden', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0' }}>
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={`${movie.title} movie poster`}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 300ms ease',
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
              e.target.parentElement.querySelector('.poster-placeholder')?.style && (e.target.parentElement.querySelector('.poster-placeholder').style.display = 'flex');
            }}
          />
        ) : null}

        {/* SVG Placeholder */}
        <div
          className="poster-placeholder"
          style={{
            position: 'absolute',
            inset: 0,
            display: movie.posterUrl ? 'none' : 'flex',
          }}
        >
          <PosterPlaceholder title={movie.title} style={{ position: 'absolute', inset: 0 }} />
        </div>

        {/* Status Badge Overlay */}
        <div style={{ position: 'absolute', top: 6, left: 6, zIndex: 2 }}>
          <span className={`badge ${statusBadge.class}`} style={{ fontSize: 9, backdropFilter: 'blur(6px)' }}>
            {statusBadge.label}
          </span>
        </div>

        {/* Top Rated Podium Rank Overlay */}
        {rankConfig && (
          <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 2 }}>
            <span
              className="badge"
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.04em',
                backdropFilter: 'blur(8px)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                ...rankConfig.style,
              }}
            >
              <rankConfig.Icon size={10} />
              {rankConfig.label}
            </span>
          </div>
        )}
      </div>

      {/* Movie Details */}
      <div style={{ padding: compact ? 10 : 12, display: 'flex', flexDirection: 'column', flex: 1, gap: 6 }}>
        {/* Strict 2-Badge / Meta Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
            {movie.language}
          </span>
          {movie.aspectRatio && (
            <span className="badge badge-dim" style={{ marginLeft: 'auto', fontSize: 9, padding: '1px 5px' }}>
              {movie.aspectRatio}
            </span>
          )}
        </div>

        <h3 style={{
          fontSize: compact ? 13 : 15,
          fontWeight: 600,
          color: 'var(--text-primary)',
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          margin: 0,
        }}>
          {movie.title}
        </h3>

        {/* Rating & Review Count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto', paddingTop: 4 }}>
          {count > 0 ? (
            <>
              <StarRating rating={average} readOnly size={11} showScore />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                {count} {count === 1 ? 'review' : 'reviews'}
              </span>
            </>
          ) : (
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>No reviews yet</span>
          )}
        </div>
      </div>
    </div>
  );
}
