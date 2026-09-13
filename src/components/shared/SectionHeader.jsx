import React from 'react';

/**
 * SectionHeader — Unified eyebrow label + heading pattern used across all sections.
 * Replaces the repeated inline `gold uppercase span + h2` pattern throughout the app.
 */
export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'left',    // 'left' | 'center'
  size = 'md',       // 'sm' | 'md' | 'lg'
  action,            // { label, to, onClick } — optional right-aligned CTA
  style = {},
}) {
  const titleSize = size === 'lg' ? 'clamp(28px, 4vw, 42px)' : size === 'sm' ? '18px' : 'clamp(22px, 3.5vw, 32px)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: action ? 'space-between' : (align === 'center' ? 'center' : 'flex-start'),
        gap: 16,
        flexWrap: 'wrap',
        marginBottom: size === 'sm' ? 20 : 32,
        ...style,
      }}
    >
      <div style={{ textAlign: align }}>
        {eyebrow && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            justifyContent: align === 'center' ? 'center' : 'flex-start',
            marginBottom: 6,
          }}>
            {align === 'center' && (
              <div style={{ height: 1, width: 24, background: 'var(--gold-dim)', flexShrink: 0 }} />
            )}
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
            }}>
              {eyebrow}
            </span>
            {align === 'center' && (
              <div style={{ height: 1, width: 24, background: 'var(--gold-dim)', flexShrink: 0 }} />
            )}
          </div>
        )}
        <h2 style={{
          fontSize: titleSize,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '0.02em',
          lineHeight: 1.2,
          margin: 0,
        }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            marginTop: 6,
            lineHeight: 1.6,
          }}>
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        action.to ? (
          // Import-free anchor — caller can use Link if needed, or pass onClick
          <a
            href={action.to}
            onClick={e => { e.preventDefault(); if (action.onClick) action.onClick(); }}
            className="btn btn-ghost btn-sm"
            style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            {action.label}
          </a>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="btn btn-ghost btn-sm"
            style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
