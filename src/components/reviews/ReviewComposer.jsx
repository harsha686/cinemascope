import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Monitor } from 'lucide-react';
import { useApp } from '../../AppContext';
import { setPersonalRating } from '../../services/movieLibraryService';
import { MOVIE_REVIEW_PARAMS, THEATER_REVIEW_PARAMS, getParamsForReview } from '../../data/reviewParams';

function calcAverage(params, paramList) {
  const rated = paramList.filter(p => params[p.key] > 0);
  if (rated.length === 0) return 0;
  const sum = rated.reduce((acc, p) => acc + params[p.key], 0);
  return Math.round((sum / rated.length) * 10) / 10;
}

// Star picker row for a single parameter
function ParamStarPicker({ param, value, onChange }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '150px 1fr auto',
      alignItems: 'center',
      gap: 12,
      padding: '10px 14px',
      background: value > 0 ? 'rgba(220,182,91,0.04)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${value > 0 ? 'rgba(220,182,91,0.2)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 4,
      transition: 'all 150ms ease',
    }}>
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>{param.emoji}</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: value > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {param.label}
        </span>
      </div>

      {/* 5 star buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[1, 2, 3, 4, 5].map(star => {
          const active = (hovered || value) >= star;
          return (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => onChange(value === star ? 0 : star)}
              style={{
                fontSize: 20,
                lineHeight: 1,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: active ? 'var(--gold)' : 'rgba(255,255,255,0.15)',
                transition: 'color 100ms ease, transform 100ms ease',
                transform: active ? 'scale(1.15)' : 'scale(1)',
                padding: '2px',
              }}
            >
              ★
            </button>
          );
        })}
      </div>

      {/* Score badge */}
      <div style={{
        minWidth: 36,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 700,
        color: value > 0 ? 'var(--gold)' : 'var(--text-muted)',
      }}>
        {value > 0 ? `${value}/5` : '—'}
      </div>
    </div>
  );
}

export default function ReviewComposer({
  movie = null,
  theater = null,
  initialScreenId = null,
  existingReview = null,
  onClose,
  onSuccess,
  reviewType = 'USER',
}) {
  const { state, dispatch, isVerifiedPro } = useApp();
  const currentUser = state.currentUser;

  const isTheater = !!theater || (existingReview?.theaterId || existingReview?.targetType === 'THEATER');
  const activeParams = isTheater ? THEATER_REVIEW_PARAMS : MOVIE_REVIEW_PARAMS;
  const emptyParams = Object.fromEntries(activeParams.map(p => [p.key, 0]));

  const [params, setParams] = useState(
    existingReview?.parameterRatings ? existingReview.parameterRatings : { ...emptyParams }
  );
  const [selectedScreenId, setSelectedScreenId] = useState(
    existingReview?.screenId || initialScreenId || ''
  );
  const [note, setNote] = useState(existingReview?.reviewText || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingReview) {
      setParams(existingReview.parameterRatings || { ...EMPTY_PARAMS });
      setNote(existingReview.reviewText || '');
    }
  }, [existingReview]);

  const overallRating = calcAverage(params, activeParams);
  const ratedCount = activeParams.filter(p => params[p.key] > 0).length;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!currentUser) {
      setError('You must be logged in to submit a review.');
      return;
    }

    if (ratedCount === 0) {
      setError('Please rate at least one parameter.');
      return;
    }

    if (note.trim().length > 0 && note.trim().length < 10) {
      setError('Your note must be at least 10 characters, or leave it empty.');
      return;
    }

    setIsSubmitting(true);

    try {
      const isUserPro = currentUser && isVerifiedPro ? isVerifiedPro(currentUser.id) : false;
      const effectiveReviewType = reviewType || (existingReview?.reviewType) || (isUserPro ? 'PROFESSIONAL' : 'USER');

      if (isTheater) {
        const selectedScreen = theater?.screens?.find(s => s.id === selectedScreenId);
        const payload = {
          rating: overallRating,
          parameterRatings: params,
          reviewText: note.trim(),
          reviewType: effectiveReviewType,
          theaterId: theater?.id || existingReview?.theaterId,
          theaterName: theater?.name || existingReview?.theaterName || 'Cinema',
          screenId: selectedScreenId || null,
          screenName: selectedScreen ? `${selectedScreen.name}${selectedScreen.aspectRatio ? ` (${selectedScreen.aspectRatio})` : ''}` : (existingReview?.screenName || null),
          targetType: 'THEATER',
        };

        if (existingReview) {
          dispatch({
            type: 'UPDATE_REVIEW',
            payload: {
              id: existingReview.id,
              userId: existingReview.userId || currentUser.id,
              userDisplayName: existingReview.userDisplayName || currentUser.displayName || 'Cinema Enthusiast',
              userEmail: existingReview.userEmail || currentUser.email,
              ...payload,
            },
          });
        } else {
          dispatch({
            type: 'ADD_REVIEW',
            payload: {
              id: `rev-th-${Date.now()}`,
              userId: currentUser.id,
              userDisplayName: currentUser.displayName || 'Cinema Enthusiast',
              userEmail: currentUser.email,
              status: 'PUBLISHED',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              likesCount: 0,
              reportCount: 0,
              ...payload,
            },
          });
        }
      } else {
        const targetMovieId = movie?.id || (movie?.tmdbId ? `tmdb-${movie.tmdbId}` : (existingReview?.movieId || null));
        const rawTmdbId = movie?.tmdbId || (targetMovieId ? String(targetMovieId).replace('tmdb-', '') : null);

        const payload = {
          rating: overallRating,
          parameterRatings: params,
          reviewText: note.trim(),
          reviewType: effectiveReviewType,
          targetType: 'MOVIE',
        };

        if (existingReview) {
          dispatch({
            type: 'UPDATE_REVIEW',
            payload: {
              id: existingReview.id,
              movieId: targetMovieId,
              userId: existingReview.userId || currentUser.id,
              userDisplayName: existingReview.userDisplayName || currentUser.displayName || 'Cinema Enthusiast',
              userEmail: existingReview.userEmail || currentUser.email,
              ...payload,
            },
          });
        } else {
          dispatch({
            type: 'ADD_REVIEW',
            payload: {
              id: `rev-${Date.now()}`,
              movieId: targetMovieId,
              tmdbId: rawTmdbId,
              userId: currentUser.id,
              userDisplayName: currentUser.displayName || 'Cinema Enthusiast',
              userEmail: currentUser.email,
              status: 'PUBLISHED',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              likesCount: 0,
              reportCount: 0,
              ...payload,
            },
          });
        }

        if (rawTmdbId && overallRating > 0) {
          setPersonalRating(rawTmdbId, currentUser.id, overallRating).catch(console.error);
        }
      }

      setIsSubmitting(false);
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setIsSubmitting(false);
      setError('An error occurred while saving your review. Please try again.');
    }
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: 24,
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4 }}>
            {existingReview ? 'Edit Your Review' : isTheater ? 'Rate This Cinema' : 'Rate This Film'}
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>
            {isTheater ? (theater?.name || existingReview?.theaterName || 'Cinema') : (movie?.title || existingReview?.movieTitle || 'Movie')}
          </h3>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Screen Picker (for Theaters with multiple screens) */}
        {isTheater && theater?.screens && theater.screens.length > 1 && (
          <div style={{ marginBottom: 6 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Screen Visited <span style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </label>
            <select
              className="input"
              value={selectedScreenId}
              onChange={e => setSelectedScreenId(e.target.value)}
              style={{ fontSize: 12, background: 'var(--bg-surface, #18140e)', color: 'var(--text-primary)', padding: '6px 12px' }}
            >
              <option value="">General Theater Experience (All Screens)</option>
              {theater.screens.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.aspectRatio || s.formatName || 'Screen'} {s.projection ? `(${s.projection})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Per-parameter star pickers */}
        {activeParams.map(param => (
          <ParamStarPicker
            key={param.key}
            param={param}
            value={params[param.key]}
            onChange={(v) => setParams(prev => ({ ...prev, [param.key]: v }))}
          />
        ))}

        {/* Overall average display */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          background: overallRating > 0 ? 'rgba(220,182,91,0.08)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${overallRating > 0 ? 'var(--gold-dim)' : 'var(--border-subtle)'}`,
          borderRadius: 4,
          marginTop: 4,
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Overall Rating <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({ratedCount} of {activeParams.length} rated)</span>
          </span>
          <span style={{
            fontSize: 22,
            fontWeight: 700,
            color: overallRating > 0 ? 'var(--gold)' : 'var(--text-muted)',
          }}>
            {overallRating > 0 ? `${overallRating} / 5` : '—'}
          </span>
        </div>

        {/* Optional short note */}
        <div style={{ marginTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Your Review Note <span style={{ color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </label>
            <span style={{ fontSize: 11, color: note.length > 500 ? '#f87171' : 'var(--text-muted)' }}>
              {note.length} / 500
            </span>
          </div>
          <textarea
            className="input"
            rows={3}
            placeholder={isTheater ? "Share your experience regarding screen brightness, sound acoustics, seating comfort, AC, and snack pricing..." : "Anything you'd like to add about the film..."}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            style={{ resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, borderRadius: 3 }}>
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          {onClose && (
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
          )}
          <button type="submit" disabled={isSubmitting || ratedCount === 0} className="btn btn-primary">
            {isSubmitting ? 'Saving...' : existingReview ? 'Update Review' : 'Publish Review'}
          </button>
        </div>
      </form>
    </div>
  );
}
