import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import StarRating from '../reviews/StarRating';
import { useApp } from '../../AppContext';
import PosterPlaceholder from '../shared/PosterPlaceholder';

export default function MovieCard({ movie, compact = false }) {
  const navigate = useNavigate();
  const { getMovieRating } = useApp();

  if (!movie) return null;

  const { average, count } = getMovieRating(movie.id);

  const statusBadge = {
    CURRENTLY_SHOWING: { label: 'Now Showing', class: 'badge-verified' },
    COMING_SOON: { label: 'Coming Soon', class: 'badge-estimated' },
    ARCHIVED: { label: 'Archived', class: 'badge-dim' },
  }[movie.status] || { label: movie.status, class: 'badge-dim' };

  const handleClick = () => navigate(`/movie/${movie.id}`);
  const handleKeyDown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } };

  return (
    <div
      role="link"
      tabIndex={0}
      className="card interactive-card"
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
        border: '1px solid var(--border-subtle)',
        outline: 'none',
      }}
    >
      {/* Poster Image Container */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '2/3', background: '#000', overflow: 'hidden', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0' }}>
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={`${movie.title} movie poster`}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 400ms ease',
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
              e.target.parentElement.querySelector('.poster-placeholder')?.style && (e.target.parentElement.querySelector('.poster-placeholder').style.display = 'flex');
            }}
          />
        ) : null}

        {/* SVG Placeholder — always rendered, hidden when image loads */}
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
        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
          <span className={`badge ${statusBadge.class}`} style={{ fontSize: 9, backdropFilter: 'blur(6px)' }}>
            {statusBadge.label}
          </span>
        </div>
      </div>

      {/* Movie Details */}
      <div style={{ padding: compact ? 10 : 14, display: 'flex', flexDirection: 'column', flex: 1, gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
            {movie.language}
          </span>
          {movie.runtime && (
            <>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>·</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{movie.runtime}</span>
            </>
          )}
          {movie.aspectRatio && (
            <span className="badge badge-dim" style={{ marginLeft: 'auto', fontSize: 9 }}>
              {movie.aspectRatio}
            </span>
          )}
        </div>

        <h3 style={{
          fontSize: compact ? 13 : 15,
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '0.01em',
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {movie.title}
        </h3>

        {/* Rating & Review Count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto', paddingTop: 4 }}>
          {count > 0 ? (
            <>
              <StarRating rating={average} readOnly size={12} showScore />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                {count} {count === 1 ? 'review' : 'reviews'}
              </span>
            </>
          ) : (
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>No reviews yet</span>
          )}
        </div>

        {/* Genre Tags */}
        {movie.genres && movie.genres.length > 0 && !compact && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
            {movie.genres.slice(0, 3).map(g => (
              <span key={g} style={{
                fontSize: 9,
                padding: '2px 6px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                borderRadius: 2,
              }}>
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
