import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Heart, Eye, Star, Film, Clock, Tv } from 'lucide-react';
import { useApp } from '../../AppContext';
import {
  getMovieStatusSync,
  getMovieStatus,
  toggleWatchlist,
  toggleWatched,
  toggleFavorite,
} from '../../services/movieLibraryService';
import StarRating from '../reviews/StarRating';

export default function MovieCard({
  movie,
  compact = false,
  onStatusChange,
  className = '',
  style = {},
}) {
  const navigate = useNavigate();
  const { state, currentUser: ctxUser, getMovieRating } = useApp();
  const activeUser = ctxUser || state?.currentUser;

  if (!movie) return null;

  // Determine media identification
  const isTv = Boolean(
    movie.mediaType === 'tv' ||
    movie.isTv ||
    String(movie.tmdbId).startsWith('tv-') ||
    String(movie.id).includes('-tv-') ||
    movie.type === 'SERIES'
  );

  const rawTmdbId = movie.tmdbId || (
    typeof movie.id === 'string' && movie.id.startsWith('tmdb-')
      ? movie.id.replace(/^tmdb-(tv-)?/, '')
      : (typeof movie.id === 'string' && movie.id.startsWith('tv-') ? movie.id.replace('tv-', '') : null)
  );

  const cleanId = rawTmdbId || movie.id;

  const targetPath = isTv
    ? (rawTmdbId ? `/movie/tmdb-tv-${rawTmdbId}` : `/movie/${movie.id}`)
    : (rawTmdbId ? `/movie/tmdb-${rawTmdbId}` : `/movie/${movie.id}`);

  // Library state
  const [libStatus, setLibStatus] = useState(() => {
    if (!cleanId) return { inWatchlist: false, isWatched: false, isFavorite: false };
    return getMovieStatusSync(cleanId, activeUser?.id);
  });

  useEffect(() => {
    if (cleanId && activeUser) {
      getMovieStatus(cleanId, activeUser.id)
        .then(st => setLibStatus(st))
        .catch(() => {});
    }
  }, [cleanId, activeUser]);

  const handleAction = async (e, action) => {
    e.stopPropagation();
    if (!activeUser) {
      alert('Please log in to track movies in your personal library.');
      navigate('/login');
      return;
    }

    const prevStatus = { ...libStatus };
    const optimistic = { ...libStatus };
    if (action === 'watchlist') optimistic.inWatchlist = !optimistic.inWatchlist;
    if (action === 'favorite') optimistic.isFavorite = !optimistic.isFavorite;
    if (action === 'watched') optimistic.isWatched = !optimistic.isWatched;
    setLibStatus(optimistic);

    try {
      const meta = {
        title: movie.title,
        posterUrl: movie.posterUrl,
        releaseYear: movie.releaseYear || (movie.releaseDate ? movie.releaseDate.split('-')[0] : ''),
        language: movie.language,
        type: isTv ? 'SERIES' : 'MOVIE',
      };

      let res;
      if (action === 'watchlist') res = await toggleWatchlist(cleanId, activeUser.id, meta);
      else if (action === 'favorite') res = await toggleFavorite(cleanId, activeUser.id, meta);
      else if (action === 'watched') res = await toggleWatched(cleanId, activeUser.id, meta);

      const updated = { ...optimistic, ...(res || {}) };
      setLibStatus(updated);
      if (onStatusChange) onStatusChange(updated);
    } catch (err) {
      console.error('Library action failed:', err);
      setLibStatus(prevStatus);
    }
  };

  // Rating calculation
  const localRating = getMovieRating ? getMovieRating(movie.id) : { average: 0, count: 0 };
  const rawTmdbRating = movie.voteAverage || 0;
  const tmdbScore = rawTmdbRating > 5 ? Math.round((rawTmdbRating / 2) * 10) / 10 : rawTmdbRating;
  const displayScore = localRating.count > 0 ? localRating.average : (tmdbScore > 0 ? tmdbScore : null);

  // Status badges for local catalog
  const statusBadge = {
    CURRENTLY_SHOWING: { label: 'Now Showing', class: 'badge-verified' },
    COMING_SOON: { label: 'Coming Soon', class: 'badge-estimated' },
    ARCHIVED: { label: 'Archived', class: 'badge-dim' },
  }[movie.status];

  const releaseYear = movie.releaseYear || (movie.releaseDate ? movie.releaseDate.split('-')[0] : '');

  return (
    <div
      className={`movie-card card interactive-card ${className}`}
      onClick={() => navigate(targetPath)}
      style={{
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
    >
      {/* Poster Image Container */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '2/3', background: '#0a0806', overflow: 'hidden' }}>
        <img
          src={movie.posterUrl || '/demo-frame.jpg'}
          alt={`${movie.title} poster`}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.35s ease',
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/demo-frame.jpg';
          }}
        />

        {/* Top-Left Badges */}
        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {isTv ? (
            <span className="badge" style={{ background: 'linear-gradient(135deg, #9333ea, #6b21a8)', color: '#ffffff', fontSize: 9, fontWeight: 700, padding: '2px 6px' }}>
              Series
            </span>
          ) : statusBadge ? (
            <span className={`badge ${statusBadge.class}`} style={{ fontSize: 9, backdropFilter: 'blur(6px)', padding: '2px 6px' }}>
              {statusBadge.label}
            </span>
          ) : movie.language ? (
            <span className="badge" style={{ background: 'rgba(0,0,0,0.75)', color: '#ffffff', fontSize: 9, padding: '2px 6px' }}>
              {movie.language}
            </span>
          ) : null}
        </div>

        {/* Top-Right Quick Library Micro-Actions */}
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            zIndex: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <button
            type="button"
            aria-label="Add to Watchlist"
            onClick={(e) => handleAction(e, 'watchlist')}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: libStatus.inWatchlist ? 'var(--gold)' : 'rgba(10, 8, 6, 0.72)',
              color: libStatus.inWatchlist ? '#0a0806' : 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(8px)',
              border: libStatus.inWatchlist ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            title={libStatus.inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
          >
            <Bookmark size={13} fill={libStatus.inWatchlist ? '#0a0806' : 'none'} />
          </button>

          <button
            type="button"
            aria-label="Mark as Favorite"
            onClick={(e) => handleAction(e, 'favorite')}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: libStatus.isFavorite ? 'var(--gold)' : 'rgba(10, 8, 6, 0.72)',
              color: libStatus.isFavorite ? '#0a0806' : 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(8px)',
              border: libStatus.isFavorite ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            title={libStatus.isFavorite ? 'In Favorites' : 'Add to Favorites'}
          >
            <Heart size={13} fill={libStatus.isFavorite ? '#0a0806' : 'none'} />
          </button>

          <button
            type="button"
            aria-label="Mark as Watched"
            onClick={(e) => handleAction(e, 'watched')}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: libStatus.isWatched ? 'var(--gold)' : 'rgba(10, 8, 6, 0.72)',
              color: libStatus.isWatched ? '#0a0806' : 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(8px)',
              border: libStatus.isWatched ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            title={libStatus.isWatched ? 'Watched' : 'Mark Watched'}
          >
            <Eye size={13} />
          </button>
        </div>

        {/* Aspect Ratio / Tech Tag (if available) */}
        {movie.aspectRatio && (
          <div style={{
            position: 'absolute',
            bottom: 6,
            right: 6,
            fontSize: 8.5,
            color: 'rgba(255,255,255,0.85)',
            background: 'rgba(0,0,0,0.7)',
            padding: '2px 5px',
            borderRadius: 2,
            backdropFilter: 'blur(4px)',
            letterSpacing: '0.05em'
          }}>
            {movie.aspectRatio}
          </div>
        )}
      </div>

      {/* Movie Information */}
      <div style={{ padding: compact ? '10px 12px' : '12px 14px', display: 'flex', flexDirection: 'column', flex: 1, gap: 6 }}>
        {/* Meta row: Language & Year */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-muted)' }}>
          {movie.language && (
            <span style={{ color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              {movie.language}
            </span>
          )}
          {releaseYear && (
            <>
              <span>•</span>
              <span>{releaseYear}</span>
            </>
          )}
          {movie.runtime && !compact && (
            <>
              <span>•</span>
              <span>{movie.runtime}</span>
            </>
          )}
        </div>

        {/* Movie Title */}
        <h3
          style={{
            fontSize: compact ? 13 : 14,
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '0.01em',
            lineHeight: 1.3,
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={movie.title}
        >
          {movie.title}
        </h3>

        {/* Rating Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto', paddingTop: 2 }}>
          {displayScore !== null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Star size={12} fill="var(--gold)" color="var(--gold)" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)' }}>
                {displayScore.toFixed(1)}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>/ 5</span>
            </div>
          ) : (
            <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Unrated</span>
          )}

          {localRating.count > 0 && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {localRating.count} review{localRating.count !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
