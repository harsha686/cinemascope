import React from 'react';

/**
 * SectionHeader — Unified eyebrow label + heading pattern used across all sections.
 * Clean neutral typography with clear visual hierarchy.
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
  const titleSize = size === 'lg' ? 'clamp(26px, 4vw, 36px)' : size === 'sm' ? '18px' : '22px';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: action ? 'space-between' : (align === 'center' ? 'center' : 'flex-start'),
        gap: 16,
        flexWrap: 'wrap',
        marginBottom: size === 'sm' ? 16 : 24,
        ...style,
      }}
    >
      <div style={{ textAlign: align }}>
        {eyebrow && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            justifyContent: align === 'center' ? 'center' : 'flex-start',
            marginBottom: 6,
          }}>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}>
              {eyebrow}
            </span>
          </div>
        )}
        <h2 style={{
          fontSize: titleSize,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
          lineHeight: 1.25,
          margin: 0,
        }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            marginTop: 4,
            marginBottom: 0,
            lineHeight: 1.5,
          }}>
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="btn btn-ghost btn-sm"
          style={{
            fontSize: 12,
            padding: '5px 10px',
            color: 'var(--text-secondary)',
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
