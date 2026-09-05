import React, { useState, useEffect } from 'react';
import { Bookmark, Heart, Eye, FolderPlus, Star } from 'lucide-react';
import { useApp } from '../../AppContext';
import { getMovieStatus, toggleWatchlist, toggleWatched, toggleFavorite, setPersonalRating } from '../../services/movieLibraryService';
import CollectionPicker from './CollectionPicker';
import PersonalRatingPicker from './PersonalRatingPicker';

export default function MovieStatusBar({ tmdbId, movieMeta, compact, onStatusChange }) {
  const { currentUser, state } = useApp();
  const activeUser = currentUser || state?.currentUser;

  const cleanTmdbId = String(tmdbId || '').replace('tmdb-', '');

  const [status, setStatus] = useState({ inWatchlist: false, isWatched: false, isFavorite: false, rating: 0 });
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const [showRatingPopover, setShowRatingPopover] = useState(false);

  useEffect(() => {
    if (cleanTmdbId) {
      loadStatus();
    }
  }, [activeUser, cleanTmdbId]);

  const loadStatus = async () => {
    try {
      const currentStatus = await getMovieStatus(cleanTmdbId);
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
      if (action === 'watchlist') result = await toggleWatchlist(cleanTmdbId, activeUser.id);
      else if (action === 'watched') result = await toggleWatched(cleanTmdbId, activeUser.id);
      else if (action === 'favorite') result = await toggleFavorite(cleanTmdbId, activeUser.id);
      
      const newStatus = { ...status, ...result };
      setStatus(newStatus);
      if (onStatusChange) onStatusChange(newStatus);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRatingSelect = async (newRating) => {
    if (!activeUser) {
      alert('Please log in to rate movies.');
      return;
    }
    try {
      const res = await setPersonalRating(cleanTmdbId, activeUser.id, newRating);
      const newStatus = { ...status, ...res, rating: newRating };
      setStatus(newStatus);
      setShowRatingPopover(false);
      if (onStatusChange) onStatusChange(newStatus);
    } catch (err) {
      console.error(err);
    }
  };

  const iconSize = compact ? 15 : 18;

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', position: 'relative' }}>
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

      <div style={{ position: 'relative' }}>
        <button
          type="button"
          className={`btn ${compact ? 'btn-sm' : ''} ${status.rating > 0 ? 'btn-outline' : 'btn-ghost'}`}
          onClick={() => {
            if (!activeUser) {
              alert('Please log in to rate movies.');
              return;
            }
            setShowRatingPopover(!showRatingPopover);
          }}
          style={{
            color: status.rating > 0 ? 'var(--gold)' : 'var(--text-secondary)',
            borderColor: status.rating > 0 ? 'var(--gold)' : undefined,
            background: status.rating > 0 ? 'var(--gold-faint)' : undefined
          }}
          title="Rate Movie"
        >
          <Star size={iconSize} fill={status.rating > 0 ? 'var(--gold)' : 'none'} />
          {!compact && (
            <span style={{ marginLeft: '6px' }}>
              {status.rating > 0 ? `★ ${status.rating}` : 'Rate'}
            </span>
          )}
        </button>

        {showRatingPopover && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            zIndex: 100,
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            minWidth: '200px'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Your Personal Rating
            </div>
            <PersonalRatingPicker value={status.rating} onChange={handleRatingSelect} size="md" />
            <button
              onClick={() => setShowRatingPopover(false)}
              style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right', marginTop: '4px' }}
            >
              Done
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        className={`btn ${compact ? 'btn-sm' : ''} btn-ghost`}
        onClick={() => {
          if (!activeUser) {
            alert('Please log in to manage your collections.');
            return;
          }
          setShowCollectionPicker(true);
        }}
        style={{
          color: 'var(--text-secondary)'
        }}
        title="Add to Collection"
      >
        <FolderPlus size={iconSize} color="var(--gold)" />
        {!compact && <span style={{ marginLeft: '6px' }}>Collection</span>}
      </button>

      {showCollectionPicker && (
        <CollectionPicker
          tmdbId={cleanTmdbId}
          movieMeta={movieMeta}
          onClose={() => setShowCollectionPicker(false)}
        />
      )}
    </div>
  );
}
