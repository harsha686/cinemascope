import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Globe, Film, Star } from 'lucide-react';
import StarRating from '../reviews/StarRating';
import { useApp } from '../../AppContext';

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

  return (
    <div
      className="card"
      onClick={() => navigate(`/movie/${movie.id}`)}
      style={{
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        transition: 'transform var(--transition-base), border-color var(--transition-base), box-shadow var(--transition-base)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--border-strong)';
        e.currentTarget.style.boxShadow = 'var(--shadow-gold)';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Poster Image Container */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '2/3', background: '#000', overflow: 'hidden' }}>
        <img
          src={movie.posterUrl}
          alt={`${movie.title} official movie poster`}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 400ms ease',
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/demo-frame.jpg';
          }}
        />

        {/* Status Badge Overlay */}
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}>
          <span className={`badge ${statusBadge.class}`} style={{ fontSize: 9, backdropFilter: 'blur(6px)' }}>
            {statusBadge.label}
          </span>
        </div>

        {/* Poster Source attribution tag */}
        <div style={{
          position: 'absolute',
          bottom: 6,
          right: 6,
          fontSize: 8,
          fontFamily: 'var(--font-serif)',
          color: 'rgba(255,255,255,0.7)',
          background: 'rgba(0,0,0,0.65)',
          padding: '2px 6px',
          borderRadius: 2,
          backdropFilter: 'blur(4px)',
          letterSpacing: '0.05em'
        }}>
          {movie.posterSourceType === 'OFFICIAL' ? 'Official Poster' : 'TMDB'}
        </div>
      </div>

      {/* Movie Details */}
      <div style={{ padding: compact ? 12 : 16, display: 'flex', flexDirection: 'column', flex: 1, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {movie.language}
          </span>
          {movie.runtime && (
            <>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>•</span>
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
          fontFamily: 'var(--font-serif)',
          fontSize: compact ? 14 : 16,
          color: 'var(--text-primary)',
          letterSpacing: '0.03em',
          lineHeight: 1.25,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {movie.title}
        </h3>

        {/* Rating & Review Count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto', paddingTop: 4 }}>
          <StarRating rating={average} readOnly size={13} showScore />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {count} {count === 1 ? 'review' : 'reviews'}
          </span>
        </div>

        {/* Genre Tags */}
        {movie.genres && movie.genres.length > 0 && !compact && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
            {movie.genres.slice(0, 3).map(g => (
              <span key={g} style={{
                fontSize: 9,
                padding: '2px 6px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                borderRadius: 2
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
