import React, { useState, useEffect } from 'react';
import { Bookmark, Heart, Eye, Star, BookOpen } from 'lucide-react';
import { useApp } from '../../AppContext';
import { getMovieStatus, toggleWatchlist, toggleWatched, toggleFavorite, setPersonalRating } from '../../services/movieLibraryService';
import DiaryEntryForm from './DiaryEntryForm';
import PersonalRatingPicker from './PersonalRatingPicker';

export default function MovieStatusBar({ tmdbId, movieMeta, compact, onStatusChange }) {
  const { currentUser, state } = useApp();
  const activeUser = currentUser || state?.currentUser;

  const [status, setStatus] = useState({ inWatchlist: false, isWatched: false, isFavorite: false, rating: 0 });
  const [showDiary, setShowDiary] = useState(false);
  const [showRating, setShowRating] = useState(false);

  useEffect(() => {
    if (tmdbId) {
      loadStatus();
    }
  }, [activeUser, tmdbId]);

  const loadStatus = async () => {
    try {
      const currentStatus = await getMovieStatus(tmdbId);
      setStatus(currentStatus);
    } catch (e) {
      console.error('Error loading movie status:', e);
    }
  };

  const handleAction = async (action) => {
    if (!activeUser) {
      alert('Please log in to track movies in your personal library.');
      return;
    }
    
    try {
      let result;
      if (action === 'watchlist') result = await toggleWatchlist(tmdbId, activeUser.id);
      else if (action === 'watched') result = await toggleWatched(tmdbId, activeUser.id);
      else if (action === 'favorite') result = await toggleFavorite(tmdbId, activeUser.id);
      
      const newStatus = { ...status, ...result };
      setStatus(newStatus);
      if (onStatusChange) onStatusChange(newStatus);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRatingChange = async (newRating) => {
    if (!activeUser) {
      alert('Please log in to rate movies.');
      return;
    }
    try {
      const res = await setPersonalRating(tmdbId, activeUser.id, newRating);
      const newStatus = { ...status, ...res, rating: newRating };
      setStatus(newStatus);
      setShowRating(false);
      if (onStatusChange) onStatusChange(newStatus);
    } catch (err) {
      console.error(err);
    }
  };

  const iconSize = compact ? 15 : 18;

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
      <button
        type="button"
        className={`btn ${compact ? 'btn-sm' : ''} ${status.inWatchlist ? 'btn-outline' : 'btn-ghost'}`}
        onClick={() => handleAction('watchlist')}
        style={{
          color: status.inWatchlist ? 'var(--gold)' : 'var(--text-secondary)',
          borderColor: status.inWatchlist ? 'var(--gold)' : undefined,
          background: status.inWatchlist ? 'var(--gold-faint)' : undefined
        }}
        title="Want to Watch"
      >
        <Bookmark size={iconSize} fill={status.inWatchlist ? 'var(--gold)' : 'none'} />
        {!compact && <span style={{ marginLeft: '6px' }}>Watchlist</span>}
      </button>

      <button
        type="button"
        className={`btn ${compact ? 'btn-sm' : ''} ${status.isFavorite ? 'btn-outline' : 'btn-ghost'}`}
        onClick={() => handleAction('favorite')}
        style={{
          color: status.isFavorite ? 'var(--gold)' : 'var(--text-secondary)',
          borderColor: status.isFavorite ? 'var(--gold)' : undefined,
          background: status.isFavorite ? 'var(--gold-faint)' : undefined
        }}
        title="Favorite"
      >
        <Heart size={iconSize} fill={status.isFavorite ? 'var(--gold)' : 'none'} />
        {!compact && <span style={{ marginLeft: '6px' }}>Favorite</span>}
      </button>

      <button
        type="button"
        className={`btn ${compact ? 'btn-sm' : ''} ${status.isWatched ? 'btn-outline' : 'btn-ghost'}`}
        onClick={() => handleAction('watched')}
        style={{
          color: status.isWatched ? 'var(--gold)' : 'var(--text-secondary)',
          borderColor: status.isWatched ? 'var(--gold)' : undefined,
          background: status.isWatched ? 'var(--gold-faint)' : undefined
        }}
        title="Mark Watched"
      >
        <Eye size={iconSize} />
        {!compact && <span style={{ marginLeft: '6px' }}>Watched</span>}
      </button>



      <button
        type="button"
        className={`btn ${compact ? 'btn-sm' : ''} btn-primary`}
        onClick={() => activeUser ? setShowDiary(true) : alert('Please log in to add to diary.')}
        title="Add to Movie Diary"
      >
        <BookOpen size={iconSize} />
        {!compact && <span style={{ marginLeft: '6px' }}>Log it</span>}
      </button>

      {showDiary && (
        <DiaryEntryForm
          tmdbId={tmdbId}
          movieMeta={movieMeta}
          onClose={() => setShowDiary(false)}
          onSave={() => {
            loadStatus();
            if (onStatusChange) onStatusChange({ ...status, isWatched: true });
          }}
        />
      )}
    </div>
  );
}
