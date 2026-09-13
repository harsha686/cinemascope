import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Heart, Eye, Star } from 'lucide-react';
import { useApp } from '../../AppContext';
import { getMovieStatus, toggleWatchlist, toggleWatched, toggleFavorite } from '../../services/movieLibraryService';
import PosterPlaceholder from '../shared/PosterPlaceholder';

export default function GlobalMovieCard({ movie, onStatusChange }) {
  const navigate = useNavigate();
  const { state } = useApp();
  // Single authoritative source for currentUser
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
      // Silently fail — status is non-critical
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

  return (
    <div
      role="article"
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
      }}
      onClick={() => navigate(`/movie/${targetId}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Poster */}
      <div style={{ position: 'relative', width: '100%', paddingBottom: '150%' }}>
        {movie.posterUrl && !imgError ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            loading="lazy"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s ease' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
            <PosterPlaceholder title={movie.title} />
          </div>
        )}

        {/* Top-left Badges */}
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4, zIndex: 2 }}>
          {movie.language && (
            <div style={{ backgroundColor: 'rgba(0,0,0,0.75)', color: '#fff', padding: '2px 6px', borderRadius: 3, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, backdropFilter: 'blur(6px)' }}>
              {movie.language}
            </div>
          )}
          {isTvSeries && (
            <div style={{ background: 'linear-gradient(135deg, #9333ea, #6b21a8)', color: '#ffffff', padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Series
            </div>
          )}
        </div>

        {/* Top-right Status Icons */}
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', flexDirection: 'column', gap: 3, zIndex: 2 }}>
          {status.isWatched && <Eye size={12} color="var(--gold)" />}
          {status.isFavorite && <Heart size={12} color="var(--gold)" fill="var(--gold)" />}
          {status.inWatchlist && <Bookmark size={12} color="var(--gold)" />}
        </div>

        {/* Hover Action Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.72)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity var(--transition-base)',
          pointerEvents: isHovered ? 'auto' : 'none',
        }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={(e) => handleAction(e, 'watchlist')}
            style={{ color: status.inWatchlist ? 'var(--gold)' : 'white', borderColor: status.inWatchlist ? 'var(--gold)' : 'rgba(255,255,255,0.4)', minWidth: 120 }}
          >
            <Bookmark size={14} fill={status.inWatchlist ? 'var(--gold)' : 'none'} />
            {status.inWatchlist ? 'Saved' : 'Watchlist'}
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={(e) => handleAction(e, 'favorite')}
            style={{ color: status.isFavorite ? 'var(--gold)' : 'white', borderColor: status.isFavorite ? 'var(--gold)' : 'rgba(255,255,255,0.4)', minWidth: 120 }}
          >
            <Heart size={14} fill={status.isFavorite ? 'var(--gold)' : 'none'} />
            Favorite
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={(e) => handleAction(e, 'watched')}
            style={{ color: status.isWatched ? 'var(--gold)' : 'white', borderColor: status.isWatched ? 'var(--gold)' : 'rgba(255,255,255,0.4)', minWidth: 120 }}
          >
            <Eye size={14} />
            {status.isWatched ? 'Watched ✓' : 'Mark Watched'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3 }}>
          {movie.title}
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
          <span>{movie.releaseYear || ''}</span>
          {rating5 > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--gold)', fontWeight: 600 }}>
              <Star size={11} fill="var(--gold)" /> {rating5.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
