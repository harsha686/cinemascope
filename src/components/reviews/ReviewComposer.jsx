import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useApp } from '../../AppContext';
import { setPersonalRating } from '../../services/movieLibraryService';

// Cinema review parameters with icons/labels
const REVIEW_PARAMS = [
  { key: 'direction',  label: 'Direction',   emoji: '🎬' },
  { key: 'story',      label: 'Story',        emoji: '📖' },
  { key: 'acting',     label: 'Acting',       emoji: '🎭' },
  { key: 'screenplay', label: 'Screenplay',   emoji: '📝' },
  { key: 'music',      label: 'Music',        emoji: '🎵' },
  { key: 'dop',        label: 'DOP',          emoji: '📷' },
  { key: 'vfx',        label: 'VFX',          emoji: '✨' },
];

const EMPTY_PARAMS = Object.fromEntries(REVIEW_PARAMS.map(p => [p.key, 0]));

function calcAverage(params) {
  const rated = REVIEW_PARAMS.filter(p => params[p.key] > 0);
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
      gridTemplateColumns: '130px 1fr auto',
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

      {/* 10 half-star dots or 5 star buttons */}
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

export default function ReviewComposer({ movie, existingReview = null, onClose, onSuccess }) {
  const { state, dispatch } = useApp();
  const currentUser = state.currentUser;

  const [params, setParams] = useState(
    existingReview?.parameterRatings ? existingReview.parameterRatings : { ...EMPTY_PARAMS }
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

  const overallRating = calcAverage(params);
  const ratedCount = REVIEW_PARAMS.filter(p => params[p.key] > 0).length;

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
      const targetMovieId = movie.id || (movie.tmdbId ? `tmdb-${movie.tmdbId}` : null);
      const rawTmdbId = movie.tmdbId || (targetMovieId ? String(targetMovieId).replace('tmdb-', '') : null);

      const payload = {
        rating: overallRating,
        parameterRatings: params,
        reviewText: note.trim(),
      };

      if (existingReview) {
        dispatch({ type: 'UPDATE_REVIEW', payload: { id: existingReview.id, movieId: targetMovieId, ...payload } });
      } else {
        dispatch({
          type: 'ADD_REVIEW',
          payload: {
            id: `rev-${Date.now()}`,
            movieId: targetMovieId,
            tmdbId: rawTmdbId,
            userId: currentUser.id,
            userDisplayName: currentUser.displayName || 'Cinema Enthusiast',
            ...payload,
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            likesCount: 0,
            reportCount: 0,
          },
        });
      }

      if (rawTmdbId && overallRating > 0) {
        setPersonalRating(rawTmdbId, currentUser.id, overallRating).catch(console.error);
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
            {existingReview ? 'Edit Your Review' : 'Rate This Film'}
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>
            {movie.title}
          </h3>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Per-parameter star pickers */}
        {REVIEW_PARAMS.map(param => (
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
            Overall Rating <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({ratedCount} of {REVIEW_PARAMS.length} rated)</span>
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
              Your Note <span style={{ color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </label>
            <span style={{ fontSize: 11, color: note.length > 500 ? '#f87171' : 'var(--text-muted)' }}>
              {note.length} / 500
            </span>
          </div>
          <textarea
            className="input"
            rows={3}
            placeholder="Anything you'd like to add about the film..."
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
