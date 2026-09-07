import React from 'react';
import { X, SlidersHorizontal, RotateCcw, Check } from 'lucide-react';

export default function FilterDrawerModal({
  isOpen,
  onClose,
  activeType,
  activeGenre,
  activeLang,
  activeDecade,
  activeSort,
  genres = [],
  languages = [],
  decades = [],
  sorts = [],
  onUpdateFilter,
  onResetFilters,
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderTop: '1px solid var(--border)',
          borderTopLeftRadius: 'var(--radius-lg)',
          borderTopRightRadius: 'var(--radius-lg)',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.9)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={18} color="var(--gold)" />
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              Filter & Sort
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={onResetFilters}
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RotateCcw size={12} /> Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Filters Body */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Media Type */}
          <div>
            <label
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-serif)',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Media Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'movie', label: 'Movies' },
                { id: 'tv', label: 'TV Series' },
              ].map((tab) => {
                const isActive = activeType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onUpdateFilter('type', tab.id === 'all' ? '' : tab.id)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '13px',
                      fontWeight: isActive ? 700 : 500,
                      background: isActive ? 'var(--gold-faint)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isActive ? 'var(--gold)' : 'var(--border-subtle)'}`,
                      color: isActive ? 'var(--gold)' : 'var(--text-secondary)',
                      textAlign: 'center',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-serif)',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Sort Order
            </label>
            <select
              className="input"
              value={activeSort}
              onChange={(e) => onUpdateFilter('sort', e.target.value)}
              style={{
                width: '100%',
                background: '#18140e',
                color: '#ffffff',
                height: '42px',
                fontSize: '14px',
              }}
            >
              {sorts.map((s) => (
                <option key={s.val} value={s.val} style={{ background: '#18140e', color: '#ffffff' }}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Genre Selection */}
          <div>
            <label
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-serif)',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Genre
            </label>
            <select
              className="input"
              value={activeGenre}
              onChange={(e) => onUpdateFilter('genre', e.target.value)}
              style={{
                width: '100%',
                background: '#18140e',
                color: '#ffffff',
                height: '42px',
                fontSize: '14px',
              }}
            >
              <option value="" style={{ background: '#18140e', color: '#ffffff' }}>
                All Genres
              </option>
              {genres.map((g) => (
                <option key={g.id} value={g.id} style={{ background: '#18140e', color: '#ffffff' }}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Language Selection */}
          <div>
            <label
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-serif)',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Language / Cinema
            </label>
            <select
              className="input"
              value={activeLang}
              onChange={(e) => onUpdateFilter('language', e.target.value)}
              style={{
                width: '100%',
                background: '#18140e',
                color: '#ffffff',
                height: '42px',
                fontSize: '14px',
              }}
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code} style={{ background: '#18140e', color: '#ffffff' }}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Decade Selection */}
          <div>
            <label
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-serif)',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Era / Decade
            </label>
            <select
              className="input"
              value={activeDecade}
              onChange={(e) => onUpdateFilter('decade', e.target.value)}
              style={{
                width: '100%',
                background: '#18140e',
                color: '#ffffff',
                height: '42px',
                fontSize: '14px',
              }}
            >
              {decades.map((d) => (
                <option key={d.val} value={d.val} style={{ background: '#18140e', color: '#ffffff' }}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer Apply Button */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-secondary)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', height: '44px', fontSize: '14px' }}
          >
            <Check size={16} /> View Matching Results
          </button>
        </div>
      </div>
    </div>
  );
}
