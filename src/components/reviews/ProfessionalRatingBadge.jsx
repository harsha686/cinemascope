import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function ProfessionalRatingBadge({
  size = 'md',
  showText = true,
  onClick = null,
  interactive = false,
  title = null,
  style = {},
}) {
  const isClickable = Boolean(onClick || interactive);
  const sizes = {
    sm: { fontSize: 10, iconSize: 10, padding: '2px 7px', gap: 3 },
    md: { fontSize: 12, iconSize: 12, padding: '3px 10px', gap: 4 },
    lg: { fontSize: 13, iconSize: 14, padding: '5px 13px', gap: 5 },
  };
  const s = sizes[size] || sizes.md;

  const defaultTitle = isClickable
    ? 'Click to view verified professional details & credentials'
    : 'Verified Professional Reviewer';

  return (
    <span
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick && onClick(e); } } : undefined}
      title={title || defaultTitle}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.08))',
        border: '1px solid rgba(16,185,129,0.35)',
        borderRadius: 20,
        padding: s.padding,
        color: '#10b981',
        fontSize: s.fontSize,
        fontWeight: 600,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        userSelect: 'none',
        ...style,
      }}
      onMouseEnter={isClickable ? (e) => {
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.22), rgba(5,150,105,0.15))';
        e.currentTarget.style.borderColor = '#10b981';
        e.currentTarget.style.transform = 'translateY(-1px)';
      } : undefined}
      onMouseLeave={isClickable ? (e) => {
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.08))';
        e.currentTarget.style.borderColor = 'rgba(16,185,129,0.35)';
        e.currentTarget.style.transform = 'none';
      } : undefined}
    >
      <ShieldCheck size={s.iconSize} />
      {showText && 'Verified Professional'}
    </span>
  );
}
