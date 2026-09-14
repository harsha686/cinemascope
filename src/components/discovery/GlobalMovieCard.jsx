import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Heart, Eye, Star, ChevronRight } from 'lucide-react';
import { useApp } from '../../AppContext';
import { getMovieStatus, toggleWatchlist, toggleWatched, toggleFavorite } from '../../services/movieLibraryService';
import PosterPlaceholder from '../shared/PosterPlaceholder';

export default function GlobalMovieCard({ movie, onStatusChange }) {
  const navigate = useNavigate();
  const { state } = useApp();
  const activeUser = state?.currentUser;
  const [status, setStatus] = useState({ inWatchlist: false, isWatched: false, isFavorite: false });
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (movie?.tmdbId && activeUser?.id) {
      loadStatus();
    }
  }, [activeUser?.id, movie?.tmdbId]);

  const loadStatus = async () => {
    try {
      const currentStatus = await getMovieStatus(movie.tmdbId, activeUser?.id);
      setStatus(currentStatus);
    } catch (e) {
      // Non-critical
    }
  };

  const handleAction = async (e, action) => {
    e.stopPropagation();
    if (!activeUser) {
      navigate('/login');
      return;
    }
    try {
      let result;
      if (action === 'watchlist') result = await toggleWatchlist(movie.tmdbId, activeUser.id, movie);
      else if (action === 'watched') result = await toggleWatched(movie.tmdbId, activeUser.id, movie);
      else if (action === 'favorite') result = await toggleFavorite(movie.tmdbId, activeUser.id, movie);

      const newStatus = { ...status, ...result };
      setStatus(newStatus);
      if (onStatusChange) onStatusChange(newStatus);
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  if (!movie) return null;

  const isTvSeries = movie.mediaType === 'tv' || movie.isTv || String(movie.tmdbId).startsWith('tv-') || String(movie.id).includes('-tv-');
  const targetId = isTvSeries
    ? (String(movie.tmdbId).startsWith('tv-') ? `tmdb-${movie.tmdbId}` : `tmdb-tv-${movie.tmdbId}`)
    : `tmdb-${movie.tmdbId}`;

  const rawRating = movie.voteAverage || 0;
  const rating5 = rawRating > 5 ? Math.round((rawRating / 2) * 10) / 10 : rawRating;

  const handleCardClick = () => {
    navigate(`/movie/${targetId}`);
  };

  return (
    <div
      role="article"
      tabIndex={0}
      className="global-movie-card interactive-card"
      style={{
        width: '180px',
        maxWidth: '100%',
        flexShrink: 0,
        position: 'relative',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        cursor: 'pointer',
        border: '1px solid var(--border-subtle)',
        outline: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Poster Container */}
      <div style={{ position: 'relative', width: '100%', paddingBottom: '150%', background: '#080705' }}>
        {movie.posterUrl && !imgError ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            loading="lazy"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.25s ease' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
            <PosterPlaceholder title={movie.title} />
          </div>
        )}

        {/* Top-left Badges (Max 2 Badges) */}
        <div style={{ position: 'absolute', top: 6, left: 6, display: 'flex', gap: 4, zIndex: 2 }}>
          {movie.language && (
            <span className="badge" style={{ fontSize: 9, padding: '2px 5px', textTransform: 'uppercase' }}>
              {movie.language}
            </span>
          )}
          {isTvSeries && (
            <span className="badge" style={{ fontSize: 9, padding: '2px 5px', background: 'rgba(147, 51, 234, 0.18)', color: '#c084fc', borderColor: 'rgba(147, 51, 234, 0.3)' }}>
              Series
            </span>
          )}
        </div>

        {/* Top-right Status Icons (Saved / Watched Indicators) */}
        <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', flexDirection: 'column', gap: 3, zIndex: 2 }}>
          {status.isWatched && (
            <div style={{ background: 'rgba(0,0,0,0.7)', borderRadius: '50%', padding: 3, display: 'flex' }} title="Watched">
              <Eye size={11} color="var(--color-success)" />
            </div>
          )}
          {status.isFavorite && (
            <div style={{ background: 'rgba(0,0,0,0.7)', borderRadius: '50%', padding: 3, display: 'flex' }} title="Favorite">
              <Heart size={11} color="var(--accent)" fill="var(--accent)" />
            </div>
          )}
          {status.inWatchlist && (
            <div style={{ background: 'rgba(0,0,0,0.7)', borderRadius: '50%', padding: 3, display: 'flex' }} title="Watchlist">
              <Bookmark size={11} color="var(--accent)" fill="var(--accent)" />
            </div>
          )}
        </div>

        {/* Hover Action Overlay: Exactly ONE Primary Button + Compact Icon Strip */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(10, 8, 6, 0.82)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity var(--transition-base)',
          pointerEvents: isHovered ? 'auto' : 'none',
          padding: '12px 8px',
        }}>
          {/* Exactly ONE Primary Accent Action */}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            style={{ width: '130px', justifyContent: 'center', fontSize: 11, padding: '7px 0', gap: 4 }}
          >
            View Details
            <ChevronRight size={13} />
          </button>

          {/* Secondary Actions Collapsed into a Compact Neutral Icon Row */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              onClick={(e) => handleAction(e, 'watchlist')}
              title={status.inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              aria-label="Toggle Watchlist"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: status.inWatchlist ? 'var(--accent-subtle)' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${status.inWatchlist ? 'var(--accent)' : 'var(--border-neutral)'}`,
                color: status.inWatchlist ? 'var(--accent)' : 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Bookmark size={13} fill={status.inWatchlist ? 'var(--accent)' : 'none'} />
            </button>

            <button
              type="button"
              onClick={(e) => handleAction(e, 'favorite')}
              title={status.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              aria-label="Toggle Favorite"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: status.isFavorite ? 'var(--accent-subtle)' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${status.isFavorite ? 'var(--accent)' : 'var(--border-neutral)'}`,
                color: status.isFavorite ? 'var(--accent)' : 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Heart size={13} fill={status.isFavorite ? 'var(--accent)' : 'none'} />
            </button>

            <button
              type="button"
              onClick={(e) => handleAction(e, 'watched')}
              title={status.isWatched ? 'Mark as Unwatched' : 'Mark as Watched'}
              aria-label="Toggle Watched"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: status.isWatched ? 'var(--color-success-bg)' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${status.isWatched ? 'var(--color-success)' : 'var(--border-neutral)'}`,
                color: status.isWatched ? 'var(--color-success)' : 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Eye size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{
          margin: '0 0 4px',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-primary)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: 1.3,
        }}>
          {movie.title}
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 'auto', paddingTop: 2 }}>
          <span>{movie.releaseYear || ''}</span>
          {rating5 > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-primary)', fontWeight: 600, fontSize: 11 }}>
              <Star size={10} fill="var(--accent)" color="var(--accent)" /> {rating5.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
