import React, { useState } from 'react';
import { Heart, Flag, Edit3, Trash2, Check } from 'lucide-react';
import { useApp } from '../../AppContext';

const REVIEW_PARAMS = [
  { key: 'direction',  label: 'Direction',   emoji: '🎬' },
  { key: 'story',      label: 'Story',        emoji: '📖' },
  { key: 'acting',     label: 'Acting',       emoji: '🎭' },
  { key: 'screenplay', label: 'Screenplay',   emoji: '📝' },
  { key: 'music',      label: 'Music',        emoji: '🎵' },
  { key: 'dop',        label: 'DOP',          emoji: '📷' },
  { key: 'vfx',        label: 'VFX',          emoji: '✨' },
];

function ScoreBar({ label, emoji, value }) {
  if (!value || value === 0) return null;
  const pct = (value / 5) * 100;
  const color = value >= 4 ? 'var(--gold)' : value >= 3 ? '#fbbf24' : '#f87171';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 36px', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
        <span style={{ fontSize: 13 }}>{emoji}</span>
        <span>{label}</span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 500ms ease' }} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color, textAlign: 'right' }}>
        {value}/5
      </div>
    </div>
  );
}

export default function ReviewCard({ review, onEdit, onDelete }) {
  const { state, dispatch } = useApp();
  const [reported, setReported] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Spam');
  const [showParams, setShowParams] = useState(false);

  if (!review) return null;

  const currentUser = state.currentUser;
  const isOwnReview = currentUser && currentUser.id === review.userId;
  const hasVotedHelpful = currentUser && state.helpfulVotes.some(v => v.userId === currentUser.id && v.reviewId === review.id);
  const hasParams = review.parameterRatings && Object.values(review.parameterRatings).some(v => v > 0);

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) { return isoString; }
  };

  const handleHelpfulClick = () => {
    if (!currentUser) { alert('Please log in to vote on reviews.'); return; }
    dispatch({ type: 'TOGGLE_HELPFUL_VOTE', payload: { userId: currentUser.id, reviewId: review.id } });
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!currentUser) { alert('Please log in to report a review.'); return; }
    dispatch({
      type: 'REPORT_REVIEW',
      payload: { id: `rep-${Date.now()}`, reviewId: review.id, userId: currentUser.id, reason: reportReason, createdAt: new Date().toISOString() }
    });
    setReported(true);
    setShowReportModal(false);
  };

  return (
    <div style={{
      padding: 18,
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-sm)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      {/* Header: avatar + name + overall score */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--gold-faint)', border: '1px solid var(--gold-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--gold)', fontWeight: 700, fontSize: 14,
          }}>
            {(review.userDisplayName || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {review.userDisplayName || 'Anonymous'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {formatDate(review.createdAt)}{review.updatedAt !== review.createdAt ? ' · Edited' : ''}
            </div>
          </div>
        </div>

        {/* Overall score pill */}
        {review.rating > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 20,
            background: 'var(--gold-faint)', border: '1px solid var(--gold-dim)',
          }}>
            <span style={{ color: 'var(--gold)', fontSize: 14 }}>★</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--gold)' }}>{review.rating}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ 5</span>
          </div>
        )}
      </div>

      {/* Per-parameter scores */}
      {hasParams && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {showParams ? (
            REVIEW_PARAMS.map(p => (
              <ScoreBar key={p.key} label={p.label} emoji={p.emoji} value={review.parameterRatings[p.key]} />
            ))
          ) : (
            /* Compact inline badges */
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {REVIEW_PARAMS.filter(p => (review.parameterRatings[p.key] || 0) > 0).map(p => {
                const v = review.parameterRatings[p.key];
                const color = v >= 4 ? 'var(--gold)' : v >= 3 ? '#fbbf24' : '#f87171';
                return (
                  <span key={p.key} style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-secondary)',
                  }}>
                    {p.emoji} {p.label} <strong style={{ color }}>{v}</strong>
                  </span>
                );
              })}
              <button
                type="button"
                onClick={() => setShowParams(true)}
                style={{ fontSize: 11, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
              >
                Details ▸
              </button>
            </div>
          )}
          {showParams && (
            <button
              type="button"
              onClick={() => setShowParams(false)}
              style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', marginTop: 2 }}
            >
              ▴ Show less
            </button>
          )}
        </div>
      )}

      {/* Optional note */}
      {review.reviewText ? (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
          {review.reviewText}
        </p>
      ) : null}

      {/* Footer actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
        <button
          type="button"
          onClick={handleHelpfulClick}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 11,
            color: hasVotedHelpful ? 'var(--gold)' : 'var(--text-muted)',
            background: hasVotedHelpful ? 'var(--gold-faint)' : 'transparent',
            padding: '4px 10px',
            border: `1px solid ${hasVotedHelpful ? 'var(--gold-dim)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          }}
        >
          <Heart size={12} fill={hasVotedHelpful ? 'var(--gold)' : 'none'} />
          <span>Helpful ({review.likesCount || 0})</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isOwnReview ? (
            <>
              <button type="button" onClick={() => onEdit && onEdit(review)}
                style={{ fontSize: 11, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                <Edit3 size={12} /> Edit
              </button>
              <button type="button"
                onClick={() => { if (window.confirm('Delete your review?')) onDelete && onDelete(review.id); }}
                style={{ fontSize: 11, color: '#f87171', display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                <Trash2 size={12} /> Delete
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setShowReportModal(true)} disabled={reported}
              style={{ fontSize: 11, color: reported ? '#4ade80' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: reported ? 'default' : 'pointer' }}>
              {reported ? <><Check size={12} /> Reported</> : <><Flag size={12} /> Report</>}
            </button>
          )}
        </div>
      </div>

      {/* Report modal */}
      {showReportModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 24, borderRadius: 'var(--radius-sm)', maxWidth: 400, width: '100%' }}>
            <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Report Review</h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Select a reason:</p>
            <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Spam or Advertising', 'Offensive Language', 'Harassment', 'Fake or Misleading', 'Other'].map(r => (
                <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <input type="radio" name="reason" value={r} checked={reportReason === r} onChange={e => setReportReason(e.target.value)} />
                  {r}
                </label>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowReportModal(false)} className="btn btn-ghost btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Submit Report</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
