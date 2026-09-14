import React, { useState, useEffect } from 'react';
import { X, Search, Film } from 'lucide-react';
import { useApp } from '../../AppContext';
import { addDiaryEntry } from '../../services/movieLibraryService';
import PersonalRatingPicker from './PersonalRatingPicker';
import SearchAutocomplete from '../discovery/SearchAutocomplete';

export default function DiaryEntryForm({ tmdbId: initialTmdbId, movieMeta: initialMovieMeta, onClose, onSave }) {
  const { state } = useApp();
  const currentUser = state?.currentUser;

  const [currentTmdbId, setCurrentTmdbId] = useState(initialTmdbId || '');
  const [currentMovieMeta, setCurrentMovieMeta] = useState(initialMovieMeta || null);

  const [dateWatched, setDateWatched] = useState(new Date().toISOString().split('T')[0]);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isRewatch, setIsRewatch] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialTmdbId) setCurrentTmdbId(initialTmdbId);
    if (initialMovieMeta) setCurrentMovieMeta(initialMovieMeta);
  }, [initialTmdbId, initialMovieMeta]);

  const handleSelectMovie = (movie) => {
    const rawId = movie.tmdbId || (typeof movie.id === 'string' ? movie.id.replace(/^tmdb-(tv-)?/, '') : movie.id);
    setCurrentTmdbId(String(rawId));
    setCurrentMovieMeta({
      title: movie.title || movie.name || '',
      posterUrl: movie.posterUrl || '',
      releaseYear: movie.releaseYear || (movie.releaseDate ? movie.releaseDate.split('-')[0] : '')
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentTmdbId) {
      alert('Please search and select a movie or series to log.');
      return;
    }
    setIsSubmitting(true);
    
    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    try {
      await addDiaryEntry(currentTmdbId, {
        tmdb_id: currentTmdbId,
        movie_title: currentMovieMeta?.title || '',
        poster_url: currentMovieMeta?.posterUrl || '',
        watched_on: dateWatched,
        personal_rating: rating,
        review_text: review,
        is_rewatch: isRewatch,
        tags
      }, currentUser?.id);
      if (onSave) onSave();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
      <div style={{ backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-sm)', width: '100%', maxWidth: '820px', display: 'flex', flexDirection: 'row', overflow: 'hidden', position: 'relative', border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', zIndex: 10 }}>
          <X size={24} />
        </button>

        {/* Left Side: Poster & Selection Preview */}
        <div style={{ width: '32%', minWidth: '220px', backgroundColor: 'var(--bg-card)', padding: '24px 20px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {currentMovieMeta?.posterUrl ? (
             <img src={currentMovieMeta.posterUrl} alt={currentMovieMeta.title} style={{ width: '100%', maxWidth: '180px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', boxShadow: '0 8px 16px rgba(0,0,0,0.4)', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', maxWidth: '180px', aspectRatio: '2/3', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-sm)', marginBottom: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-subtle)', padding: 12, textAlign: 'center' }}>
              <Film size={28} style={{ marginBottom: 8, opacity: 0.5 }} />
              <span style={{ fontSize: 12 }}>{currentMovieMeta?.title ? 'No Poster Available' : 'Search & Select Movie'}</span>
            </div>
          )}
          <h3 style={{ margin: '0 0 6px 0', textAlign: 'center', color: 'var(--text-primary)', fontSize: 16, fontFamily: 'var(--font-serif)' }}>
            {currentMovieMeta?.title || 'Log a Movie / Show'}
          </h3>
          {currentMovieMeta?.releaseYear && (
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>{currentMovieMeta.releaseYear}</p>
          )}

          {currentMovieMeta && (
            <button
              type="button"
              onClick={() => {
                setCurrentTmdbId('');
                setCurrentMovieMeta(null);
              }}
              style={{
                marginTop: 12,
                background: 'none',
                border: 'none',
                color: 'var(--gold)',
                fontSize: 12,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Change Movie
            </button>
          )}
        </div>

        {/* Right Side: Log Form */}
        <div style={{ width: '68%', padding: '32px', overflowY: 'auto', maxHeight: '90vh' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <h2 style={{ margin: 0, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)', fontSize: 22 }}>
              I watched...
            </h2>
          </div>
          
          {/* If movie is not yet selected, show live movie search */}
          {!currentMovieMeta ? (
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>
                Search Film or TV Show to Log
              </label>
              <SearchAutocomplete
                placeholder="Type movie or series title..."
                onSelectMovie={handleSelectMovie}
                onSelect={handleSelectMovie}
              />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                Select any movie or show from the global archive to log date, personal rating, review, and tags.
              </p>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Date Watched</label>
                <input 
                  type="date" 
                  className="input" 
                  style={{ width: '100%', background: 'var(--bg-card)' }} 
                  value={dateWatched}
                  onChange={(e) => setDateWatched(e.target.value)}
                  required
                />
              </div>
              <div style={{ flex: 1, minWidth: '180px', display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '24px' }}>
                <input 
                  type="checkbox" 
                  id="rewatch-modal"
                  checked={isRewatch}
                  onChange={(e) => setIsRewatch(e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: 'var(--gold)', width: 16, height: 16 }}
                />
                <label htmlFor="rewatch-modal" style={{ color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13 }}>I've watched this before (Rewatch)</label>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Personal Rating</label>
              <PersonalRatingPicker value={rating} onChange={setRating} size="lg" />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Your Thoughts / Diary Review (optional)</label>
              <textarea 
                className="input" 
                style={{ width: '100%', minHeight: '110px', resize: 'vertical', background: 'var(--bg-card)', fontSize: 13, lineHeight: 1.5 }}
                placeholder="What did you think? Favorite scene, theater experience, reflections..."
                maxLength={500}
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
              <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{review.length}/500</div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Tags (comma-separated)</label>
              <input 
                type="text" 
                className="input" 
                style={{ width: '100%', background: 'var(--bg-card)', fontSize: 13 }}
                placeholder="e.g. cinema hall, with friends, mind-bending, re-release"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting || !currentTmdbId}>
                {isSubmitting ? 'Logging...' : 'Log to Movie Diary'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
