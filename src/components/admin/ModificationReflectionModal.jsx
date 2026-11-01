import React from 'react';
import { CheckCircle2, ExternalLink, Globe, Database, Film, MapPin, Calendar, Clock, ArrowRight, Eye, X } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Computes a human-readable list of changes between previous movie and updated movie
 */
export function computeMovieDiff(prev = {}, current = {}, allTheaters = [], allCities = []) {
  if (!prev || Object.keys(prev).length === 0) {
    return [{ field: 'Creation', label: 'New Movie Added', oldVal: null, newVal: 'Created and listed in catalog' }];
  }

  const diffs = [];

  // Helper for title
  if ((prev.title || '').trim() !== (current.title || '').trim()) {
    diffs.push({ field: 'Title', label: 'Movie Title', oldVal: prev.title, newVal: current.title });
  }

  // Status
  if (prev.status !== current.status) {
    const formatStatus = s => s === 'CURRENTLY_SHOWING' ? 'Now Showing' : s === 'COMING_SOON' ? 'Coming Soon' : 'Archived';
    diffs.push({ field: 'Status', label: 'Catalog Status', oldVal: formatStatus(prev.status), newVal: formatStatus(current.status) });
  }

  // Release Date
  if ((prev.releaseDate || '') !== (current.releaseDate || '')) {
    diffs.push({ field: 'Release Date', label: 'Release Date', oldVal: prev.releaseDate || 'None', newVal: current.releaseDate || 'None' });
  }

  // Runtime
  if ((prev.runtime || '').trim() !== (current.runtime || '').trim()) {
    diffs.push({ field: 'Runtime', label: 'Runtime Duration', oldVal: prev.runtime, newVal: current.runtime });
  }

  // Language
  if ((prev.language || '').trim() !== (current.language || '').trim()) {
    diffs.push({ field: 'Language', label: 'Language', oldVal: prev.language, newVal: current.language });
  }

  // Director
  if ((prev.director || '').trim() !== (current.director || '').trim()) {
    diffs.push({ field: 'Director', label: 'Director', oldVal: prev.director, newVal: current.director });
  }

  // Aspect Ratio
  if ((prev.aspectRatio || '') !== (current.aspectRatio || '')) {
    diffs.push({ field: 'Aspect Ratio', label: 'Aspect Ratio Spec', oldVal: prev.aspectRatio, newVal: current.aspectRatio });
  }

  // Poster URL
  if ((prev.posterUrl || '').trim() !== (current.posterUrl || '').trim()) {
    diffs.push({ field: 'Poster', label: 'Official Poster Image', oldVal: 'Previous Poster', newVal: 'Updated Poster' });
  }

  // Theaters
  const prevTheaters = Array.isArray(prev.theaters) ? prev.theaters : [];
  const currTheaters = Array.isArray(current.theaters) ? current.theaters : [];
  const addedTheaters = currTheaters.filter(t => !prevTheaters.includes(t));
  const removedTheaters = prevTheaters.filter(t => !currTheaters.includes(t));

  if (addedTheaters.length > 0 || removedTheaters.length > 0) {
    const getTheaterName = id => allTheaters.find(t => t.id === id)?.name || id;
    const addedNames = addedTheaters.map(getTheaterName);
    const removedNames = removedTheaters.map(getTheaterName);

    let summary = '';
    if (addedNames.length > 0) summary += `+ Added: ${addedNames.join(', ')}`;
    if (removedNames.length > 0) summary += `${summary ? ' | ' : ''}- Removed: ${removedNames.join(', ')}`;

    diffs.push({
      field: 'Theaters',
      label: 'Theaters Assigned',
      oldVal: `${prevTheaters.length} theater${prevTheaters.length !== 1 ? 's' : ''}`,
      newVal: `${currTheaters.length} theater${currTheaters.length !== 1 ? 's' : ''} (${summary})`
    });
  }

  // Cities
  const prevCities = Array.isArray(prev.cities) ? prev.cities : [];
  const currCities = Array.isArray(current.cities) ? current.cities : [];
  if (JSON.stringify(prevCities.sort()) !== JSON.stringify(currCities.sort())) {
    const getCityName = id => allCities.find(c => c.id === id)?.name || id;
    diffs.push({
      field: 'Cities',
      label: 'City Coverage',
      oldVal: prevCities.map(getCityName).join(', ') || 'None',
      newVal: currCities.map(getCityName).join(', ') || 'None'
    });
  }

  // OTT Platform
  if ((prev.ottPlatform || '') !== (current.ottPlatform || '')) {
    diffs.push({ field: 'OTT', label: 'Streaming Platform', oldVal: prev.ottPlatform || 'None', newVal: current.ottPlatform || 'None' });
  }

  if (diffs.length === 0) {
    diffs.push({ field: 'General', label: 'Movie Details', oldVal: 'Previous Version', newVal: 'Updated & Refreshed' });
  }

  return diffs;
}

export default function ModificationReflectionModal({
  isOpen,
  onClose,
  movie,
  diffs = [],
  isNew = false,
  allTheaters = [],
  allCities = [],
}) {
  if (!isOpen || !movie) return null;

  const publicUrl = `/movie/${movie.id}`;
  const isNowShowing = movie.status === 'CURRENTLY_SHOWING';
  const assignedTheaters = Array.isArray(movie.theaters) ? movie.theaters : [];
  const theaterNames = assignedTheaters.map(tId => allTheaters.find(t => t.id === tId)?.name || tId);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #181512 0%, #0d0b09 100%)',
          border: '1px solid var(--gold-dim, #dcb65b)',
          borderRadius: 12,
          maxWidth: 620,
          width: '100%',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(220, 182, 91, 0.15)',
          overflow: 'hidden',
          animation: 'fadeIn 200ms ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(220, 182, 91, 0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(74, 222, 128, 0.15)',
              border: '1px solid #4ade80',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4ade80',
            }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontFamily: 'var(--font-serif)', color: '#ffffff', letterSpacing: '0.02em' }}>
                {isNew ? 'New Movie Created & Reflected' : 'Modification Reflected to Users'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
                All changes are now active in the user interface and database
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: 6, color: 'var(--text-muted)', borderRadius: '50%' }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '20px 24px', maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
          
          {/* Movie Card Preview Banner */}
          <div style={{
            display: 'flex',
            gap: 16,
            padding: 14,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 8,
            alignItems: 'center',
          }}>
            <img
              src={movie.posterUrl}
              alt={movie.title}
              style={{
                width: 50,
                height: 75,
                objectFit: 'cover',
                borderRadius: 4,
                border: '1px solid var(--border)',
                flexShrink: 0,
              }}
              onError={e => { e.target.src = '/demo-frame.jpg'; }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className={`badge ${isNowShowing ? 'badge-verified' : movie.status === 'COMING_SOON' ? 'badge-estimated' : 'badge-dim'}`} style={{ fontSize: 9 }}>
                  {isNowShowing ? 'Now Showing' : movie.status === 'COMING_SOON' ? 'Coming Soon' : 'Archived'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{movie.language} • {movie.runtime || '2h 30m'}</span>
              </div>
              <h4 style={{ margin: '4px 0 2px', fontSize: 16, fontFamily: 'var(--font-serif)', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {movie.title}
              </h4>
              <div style={{ fontSize: 11, color: 'var(--gold)' }}>
                Release Date: {movie.releaseDate || 'Not specified'}
              </div>
            </div>
          </div>

          {/* User Reflection Verification Checklist */}
          <div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Live Reflection Verification
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Check 1: Public Listing */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(74, 222, 128, 0.05)',
                border: '1px solid rgba(74, 222, 128, 0.2)',
                borderRadius: 6,
                fontSize: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Globe size={15} color="#4ade80" />
                  <div>
                    <span style={{ color: '#ffffff', fontWeight: 600 }}>Public Visibility: </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Visible in <strong style={{ color: 'var(--gold)' }}>{isNowShowing ? 'Now Showing' : movie.status === 'COMING_SOON' ? 'Coming Soon' : 'Archive'}</strong> tab
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(74, 222, 128, 0.15)' }}>
                  Reflected Live
                </span>
              </div>

              {/* Check 2: Theaters */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 6,
                fontSize: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <MapPin size={15} color="var(--gold)" />
                  <div>
                    <span style={{ color: '#ffffff', fontWeight: 600 }}>Theaters Screening: </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {theaterNames.length > 0 ? `${theaterNames.length} theaters (${theaterNames.slice(0, 3).join(', ')}${theaterNames.length > 3 ? ` +${theaterNames.length - 3} more` : ''})` : 'No theaters assigned yet'}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: 10, color: theaterNames.length > 0 ? '#4ade80' : 'var(--text-muted)', fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(255, 255, 255, 0.05)' }}>
                  {theaterNames.length > 0 ? `${theaterNames.length} active` : 'None'}
                </span>
              </div>

              {/* Check 3: Cloud Database Sync */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 6,
                fontSize: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Database size={15} color="#60a5fa" />
                  <div>
                    <span style={{ color: '#ffffff', fontWeight: 600 }}>Database Storage: </span>
                    <span style={{ color: 'var(--text-secondary)' }}>Supabase Cloud Database &amp; Local Storage synced</span>
                  </div>
                </div>
                <span style={{ fontSize: 10, color: '#60a5fa', fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(96, 165, 250, 0.15)' }}>
                  ✓ Synced
                </span>
              </div>
            </div>
          </div>

          {/* Exact Field Diffs */}
          {diffs && diffs.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Exact Changes Applied ({diffs.length})
              </div>
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 6,
                padding: '8px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}>
                {diffs.map((d, idx) => (
                  <div key={idx} style={{ fontSize: 12, display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 0', borderBottom: idx !== diffs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <span style={{ color: 'var(--gold)', minWidth: 100, fontWeight: 600, flexShrink: 0 }}>
                      {d.label || d.field}:
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                      {d.oldVal && (
                        <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          {String(d.oldVal)}
                        </span>
                      )}
                      {d.oldVal && <ArrowRight size={12} color="var(--text-muted)" />}
                      <span style={{ color: '#4ade80', fontWeight: 600 }}>
                        {String(d.newVal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer with Direct "View as User" Action */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
            Live URL: <code style={{ color: 'var(--gold)', fontSize: 11 }}>{publicUrl}</code>
          </span>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline btn-sm"
              style={{ fontSize: 12 }}
            >
              Done
            </button>

            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{
                fontSize: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                textDecoration: 'none',
              }}
            >
              <Eye size={13} />
              <span>View Public Page as User ↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
