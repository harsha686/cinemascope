import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Heart, Eye, Star } from 'lucide-react';
import { useApp } from '../../AppContext';
import { getMovieStatus, toggleWatchlist, toggleWatched, toggleFavorite } from '../../services/movieLibraryService';

export default function GlobalMovieCard({ movie, onStatusChange }) {
  const navigate = useNavigate();
  const { currentUser, state } = useApp();
  const activeUser = currentUser || state?.currentUser;
  const [status, setStatus] = useState({ inWatchlist: false, isWatched: false, isFavorite: false });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (movie?.tmdbId) {
      loadStatus();
    }
  }, [activeUser, movie]);

  const loadStatus = async () => {
    try {
      const currentStatus = await getMovieStatus(movie.tmdbId, activeUser?.id);
      setStatus(currentStatus);
    } catch (e) {
      console.error('Failed to load status', e);
    }
  };

  const handleAction = async (e, action) => {
    e.stopPropagation();
    if (!activeUser) {
      alert('Please log in to track movies in your personal library.');
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
      console.error(err);
    }
  };

  if (!movie) return null;

  const isTvSeries = movie.mediaType === 'tv' || movie.isTv || String(movie.tmdbId).startsWith('tv-') || String(movie.id).includes('-tv-');
  const targetId = isTvSeries
    ? (String(movie.tmdbId).startsWith('tv-') ? `tmdb-${movie.tmdbId}` : `tmdb-tv-${movie.tmdbId}`)
    : `tmdb-${movie.tmdbId}`;

  return (
    <div 
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
        border: '1px solid var(--border-subtle)'
      }}
      onClick={() => navigate(`/movie/${targetId}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ position: 'relative', width: '100%', paddingBottom: '150%', backgroundColor: 'var(--bg)' }}>
        {movie.posterUrl ? (
          <img 
            src={movie.posterUrl} 
            alt={movie.title} 
            loading="lazy"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s ease' }}
          />
        ) : (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            No Poster
          </div>
        )}
        
        {/* Badges Container */}
        <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', gap: '4px', zIndex: 2 }}>
          {movie.language && (
            <div className="badge" style={{ backgroundColor: 'rgba(0,0,0,0.75)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {movie.language}
            </div>
          )}
          {isTvSeries && (
            <div className="badge" style={{ background: 'linear-gradient(135deg, #9333ea, #6b21a8)', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Series
            </div>
          )}
        </div>

        {/* Status Indicators */}
        <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px', zIndex: 2 }}>
          {status.isWatched && <Eye size={12} color="var(--gold)" />}
          {status.isFavorite && <Heart size={12} color="var(--gold)" fill="var(--gold)" />}
          {status.inWatchlist && <Bookmark size={12} color="var(--gold)" />}
        </div>

        {/* Hover Action Overlay */}
        {isHovered && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <button className="btn btn-outline btn-sm" onClick={(e) => handleAction(e, 'watchlist')} style={{ color: status.inWatchlist ? 'var(--gold)' : 'white' }}>
              <Bookmark size={16} fill={status.inWatchlist ? 'var(--gold)' : 'none'} style={{ marginRight: '8px' }} /> Watchlist
            </button>
            <button className="btn btn-outline btn-sm" onClick={(e) => handleAction(e, 'favorite')} style={{ color: status.isFavorite ? 'var(--gold)' : 'white' }}>
              <Heart size={16} fill={status.isFavorite ? 'var(--gold)' : 'none'} style={{ marginRight: '8px' }} /> Favorite
            </button>
            <button className="btn btn-outline btn-sm" onClick={(e) => handleAction(e, 'watched')} style={{ color: status.isWatched ? 'var(--gold)' : 'white' }}>
              <Eye size={16} style={{ marginRight: '8px' }} /> Watched
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: '12px' }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {movie.title}
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span>{movie.releaseYear || 'Unknown Year'}</span>
          {(() => {
            const rawRating = movie.voteAverage || 0;
            const rating5 = rawRating > 5 ? Math.round((rawRating / 2) * 10) / 10 : rawRating;
            const rating10 = movie.voteAverage10 || (rawRating > 5 ? rawRating : Math.round(rawRating * 20) / 10);
            if (rating5 <= 0) return null;
            return (
              <span
                style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--gold)', fontWeight: 600 }}
                title={`Rating: ${rating5.toFixed(1)} / 5 (TMDb: ${rating10.toFixed(1)}/10)`}
              >
                <Star size={12} fill="var(--gold)" /> {rating5.toFixed(1)}
              </span>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
