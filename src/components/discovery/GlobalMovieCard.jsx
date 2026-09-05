import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Heart, Eye, Star } from 'lucide-react';
import { useApp } from '../../AppContext';
import { getMovieStatus, toggleWatchlist, toggleWatched, toggleFavorite } from '../../services/movieLibraryService';

export default function GlobalMovieCard({ movie, onStatusChange }) {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [status, setStatus] = useState({ inWatchlist: false, isWatched: false, isFavorite: false });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (currentUser && movie?.tmdbId) {
      loadStatus();
    }
  }, [currentUser, movie]);

  const loadStatus = async () => {
    try {
      const currentStatus = await getMovieStatus(movie.tmdbId);
      setStatus(currentStatus);
    } catch (e) {
      console.error('Failed to load status', e);
    }
  };

  const handleAction = async (e, action) => {
    e.stopPropagation();
    if (!currentUser) {
      alert('Please log in to track movies');
      return;
    }
    
    try {
      let result;
      if (action === 'watchlist') result = await toggleWatchlist(movie.tmdbId, movie);
      else if (action === 'watched') result = await toggleWatched(movie.tmdbId, movie);
      else if (action === 'favorite') result = await toggleFavorite(movie.tmdbId, movie);
      
      const newStatus = { ...status, ...result };
      setStatus(newStatus);
      if (onStatusChange) onStatusChange(newStatus);
    } catch (err) {
      console.error(err);
    }
  };

  if (!movie) return null;

  return (
    <div 
      className="global-movie-card"
      style={{
        width: '180px',
        position: 'relative',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
        border: '1px solid var(--border-subtle)'
      }}
      onClick={() => navigate(`/movie/tmdb-${movie.tmdbId}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ position: 'relative', width: '100%', paddingBottom: '150%', backgroundColor: 'var(--bg)' }}>
        {movie.posterUrl ? (
          <img 
            src={movie.posterUrl} 
            alt={movie.title} 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            No Poster
          </div>
        )}
        
        {/* Language Badge */}
        {movie.language && (
          <div className="badge" style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', textTransform: 'uppercase' }}>
            {movie.language}
          </div>
        )}

        {/* Status Indicators */}
        <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
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
          {movie.voteAverage > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--gold)' }}>
              <Star size={12} fill="var(--gold)" /> {movie.voteAverage.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
