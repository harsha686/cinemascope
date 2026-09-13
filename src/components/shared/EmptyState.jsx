import React from 'react';
import { Link } from 'react-router-dom';
import { Film } from 'lucide-react';

/**
 * EmptyState — Unified empty/null state display across all pages and sections.
 * Replaces inconsistent ad-hoc empty state implementations.
 */
export default function EmptyState({
  icon: Icon = Film,
  title = 'Nothing here yet',
  subtitle,
  action,           // { label, to } or { label, onClick }
  compact = false,  // reduces padding for inline use
  style = {},
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: compact ? '32px 24px' : '64px 24px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        gap: 12,
        ...style,
      }}
    >
      <div style={{
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: 'var(--gold-faint)',
        border: '1px solid var(--gold-dim)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--gold)',
        marginBottom: 4,
      }}>
        <Icon size={22} />
      </div>

      <h3 style={{
        fontSize: compact ? 15 : 17,
        fontWeight: 600,
        color: 'var(--text-secondary)',
        margin: 0,
        letterSpacing: '0.02em',
      }}>
        {title}
      </h3>

      {subtitle && (
        <p style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          maxWidth: 360,
          lineHeight: 1.6,
          margin: 0,
        }}>
          {subtitle}
        </p>
      )}

      {action && (
        action.to ? (
          <Link
            to={action.to}
            className="btn btn-outline btn-sm"
            style={{ marginTop: 4 }}
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="btn btn-outline btn-sm"
            style={{ marginTop: 4 }}
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
