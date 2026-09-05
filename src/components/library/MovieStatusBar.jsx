import React, { useState, useEffect } from 'react';
import { Bookmark, Heart, Eye, Star, BookOpen } from 'lucide-react';
import { useApp } from '../../AppContext';
import { getMovieStatus, toggleWatchlist, toggleWatched, toggleFavorite } from '../../services/movieLibraryService';
import DiaryEntryForm from './DiaryEntryForm';
import PersonalRatingPicker from './PersonalRatingPicker';

export default function MovieStatusBar({ tmdbId, movieMeta, compact, onStatusChange }) {
  const { currentUser } = useApp();
  const [status, setStatus] = useState({ inWatchlist: false, isWatched: false, isFavorite: false, rating: 0 });
  const [showDiary, setShowDiary] = useState(false);
  const [showRating, setShowRating] = useState(false);

  useEffect(() => {
    if (currentUser && tmdbId) {
      loadStatus();
    }
  }, [currentUser, tmdbId]);

  const loadStatus = async () => {
    try {
      const currentStatus = await getMovieStatus(tmdbId);
      setStatus(currentStatus);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAction = async (action) => {
    if (!currentUser) {
      alert('Please log in to track movies');
      return;
    }
    
    try {
      let result;
      if (action === 'watchlist') result = await toggleWatchlist(tmdbId, movieMeta);
      else if (action === 'watched') result = await toggleWatched(tmdbId, movieMeta);
      else if (action === 'favorite') result = await toggleFavorite(tmdbId, movieMeta);
      
      const newStatus = { ...status, ...result };
      setStatus(newStatus);
      if (onStatusChange) onStatusChange(newStatus);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRatingChange = async (newRating) => {
    setStatus(prev => ({ ...prev, rating: newRating }));
    setShowRating(false);
  };

  const iconSize = compact ? 16 : 20;

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
      <button className={`btn ${compact ? 'btn-sm' : ''} ${status.inWatchlist ? 'btn-outline' : 'btn-ghost'}`} onClick={() => handleAction('watchlist')} style={{ color: status.inWatchlist ? 'var(--gold)' : 'var(--text-secondary)' }}>
        <Bookmark size={iconSize} fill={status.inWatchlist ? 'var(--gold)' : 'none'} />
        {!compact && <span style={{ marginLeft: '8px' }}>Watchlist</span>}
      </button>

      <button className={`btn ${compact ? 'btn-sm' : ''} ${status.isFavorite ? 'btn-outline' : 'btn-ghost'}`} onClick={() => handleAction('favorite')} style={{ color: status.isFavorite ? 'var(--gold)' : 'var(--text-secondary)' }}>
        <Heart size={iconSize} fill={status.isFavorite ? 'var(--gold)' : 'none'} />
        {!compact && <span style={{ marginLeft: '8px' }}>Favorite</span>}
      </button>

      <button className={`btn ${compact ? 'btn-sm' : ''} ${status.isWatched ? 'btn-outline' : 'btn-ghost'}`} onClick={() => handleAction('watched')} style={{ color: status.isWatched ? 'var(--gold)' : 'var(--text-secondary)' }}>
        <Eye size={iconSize} />
        {!compact && <span style={{ marginLeft: '8px' }}>Watched</span>}
      </button>

      <div style={{ position: 'relative' }}>
        <button className={`btn ${compact ? 'btn-sm' : ''} btn-ghost`} onClick={() => currentUser ? setShowRating(!showRating) : alert('Please log in')} style={{ color: status.rating > 0 ? 'var(--gold)' : 'var(--text-secondary)' }}>
          <Star size={iconSize} fill={status.rating > 0 ? 'var(--gold)' : 'none'} />
          {!compact && <span style={{ marginLeft: '8px' }}>{status.rating > 0 ? status.rating : 'Rate'}</span>}
        </button>
        {showRating && (
          <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', zIndex: 50, background: 'var(--bg-card)', padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <PersonalRatingPicker value={status.rating} onChange={handleRatingChange} size="sm" />
          </div>
        )}
      </div>

      <button className={`btn ${compact ? 'btn-sm' : ''} btn-primary`} onClick={() => currentUser ? setShowDiary(true) : alert('Please log in')}>
        <BookOpen size={iconSize} />
        {!compact && <span style={{ marginLeft: '8px' }}>Log it</span>}
      </button>

      {showDiary && (
        <DiaryEntryForm 
          tmdbId={tmdbId} 
          movieMeta={movieMeta} 
          onClose={() => setShowDiary(false)} 
          onSave={() => { setShowDiary(false); loadStatus(); }} 
        />
      )}
    </div>
  );
}
