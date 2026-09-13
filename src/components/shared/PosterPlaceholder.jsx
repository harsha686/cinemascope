import React from 'react';

/**
 * PosterPlaceholder — SVG-based poster placeholder for missing movie posters.
 * Replaces broken `/demo-frame.jpg` 404 and plain "No Poster" text fallbacks.
 */
export default function PosterPlaceholder({ title, style = {} }) {
  const initials = title
    ? title
        .split(' ')
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase()
    : '?';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(145deg, #1a1612 0%, #0f0d0a 100%)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...style,
      }}
    >
      {/* Film strip sprocket holes */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.25 }}
      >
        <rect x="2" y="2" width="44" height="44" rx="3" stroke="#f59e0b" strokeWidth="1.5" fill="none" />
        <rect x="6" y="6" width="36" height="36" rx="1" stroke="#f59e0b" strokeWidth="1" fill="none" opacity="0.5" />
        {/* sprocket holes */}
        <rect x="5" y="9" width="5" height="8" rx="1" fill="#f59e0b" opacity="0.4" />
        <rect x="5" y="21" width="5" height="8" rx="1" fill="#f59e0b" opacity="0.4" />
        <rect x="5" y="33" width="5" height="8" rx="1" fill="#f59e0b" opacity="0.4" />
        <rect x="38" y="9" width="5" height="8" rx="1" fill="#f59e0b" opacity="0.4" />
        <rect x="38" y="21" width="5" height="8" rx="1" fill="#f59e0b" opacity="0.4" />
        <rect x="38" y="33" width="5" height="8" rx="1" fill="#f59e0b" opacity="0.4" />
        {/* play triangle */}
        <polygon points="20,17 20,31 32,24" fill="#f59e0b" opacity="0.35" />
      </svg>

      {initials && initials !== '?' && (
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.15em',
          color: 'rgba(245,158,11,0.5)',
          textTransform: 'uppercase',
        }}>
          {initials}
        </span>
      )}
    </div>
  );
}
