import React, { useState } from 'react';
import { X } from 'lucide-react';
import { addDiaryEntry } from '../../services/movieLibraryService';
import PersonalRatingPicker from './PersonalRatingPicker';

export default function DiaryEntryForm({ tmdbId, movieMeta, onClose, onSave }) {
  const [dateWatched, setDateWatched] = useState(new Date().toISOString().split('T')[0]);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isRewatch, setIsRewatch] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    try {
      await addDiaryEntry(tmdbId, {
        dateWatched,
        rating,
        review,
        isRewatch,
        tags,
        movieMeta
      });
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
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-sm)', width: '100%', maxWidth: '800px', display: 'flex', overflow: 'hidden', position: 'relative', border: '1px solid var(--border)' }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', zIndex: 10 }}>
          <X size={24} />
        </button>

        <div style={{ width: '30%', backgroundColor: 'var(--bg-card)', padding: '20px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {movieMeta?.posterUrl ? (
             <img src={movieMeta.posterUrl} alt={movieMeta.title} style={{ width: '100%', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }} />
          ) : (
            <div style={{ width: '100%', aspectRatio: '2/3', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-sm)', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Poster</div>
          )}
          <h3 style={{ margin: '0 0 8px 0', textAlign: 'center', color: 'var(--text-primary)' }}>{movieMeta?.title || 'Unknown Title'}</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>{movieMeta?.releaseYear || ''}</p>
        </div>

        <div style={{ width: '70%', padding: '32px' }}>
          <h2 style={{ margin: '0 0 24px 0', color: 'var(--text-primary)' }}>I watched...</h2>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Date Watched</label>
                <input 
                  type="date" 
                  className="input" 
                  style={{ width: '100%' }}
                  value={dateWatched}
                  onChange={(e) => setDateWatched(e.target.value)}
                  required
                />
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '28px' }}>
                <input 
                  type="checkbox" 
                  id="rewatch"
                  checked={isRewatch}
                  onChange={(e) => setIsRewatch(e.target.checked)}
                />
                <label htmlFor="rewatch" style={{ color: 'var(--text-primary)', cursor: 'pointer' }}>I've watched this before</label>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Rating</label>
              <PersonalRatingPicker value={rating} onChange={setRating} size="lg" />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Review (optional)</label>
              <textarea 
                className="input"
                style={{ width: '100%', minHeight: '120px', resize: 'vertical' }}
                placeholder="Add your thoughts..."
                maxLength={500}
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
              <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{review.length}/500</div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Tags (comma-separated)</label>
              <input 
                type="text" 
                className="input" 
                style={{ width: '100%' }}
                placeholder="e.g. cinema, with friends, mind-bending"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
