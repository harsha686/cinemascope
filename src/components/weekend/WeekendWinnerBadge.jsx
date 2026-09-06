import React from 'react';
import { Trophy, Sparkles } from 'lucide-react';

export default function WeekendWinnerBadge({
  genreName = '',
  edition = '',
  size = 'md', // sm | md | lg
  variant = 'gold', // gold | subtle | banner
  onClick,
}) {
  const sizeStyles = {
    sm: {
      padding: '3px 8px',
      fontSize: 10,
      iconSize: 11,
      gap: 4,
    },
    md: {
      padding: '5px 12px',
      fontSize: 11,
      iconSize: 13,
      gap: 6,
    },
    lg: {
      padding: '8px 18px',
      fontSize: 13,
      iconSize: 16,
      gap: 8,
    },
  }[size] || {
    padding: '5px 12px',
    fontSize: 11,
    iconSize: 13,
    gap: 6,
  };

  const isBanner = variant === 'banner';

  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: sizeStyles.gap,
        padding: sizeStyles.padding,
        background: variant === 'subtle'
          ? 'rgba(201,168,76,0.1)'
          : 'linear-gradient(135deg, rgba(201,168,76,0.22) 0%, rgba(201,168,76,0.08) 100%)',
        border: '1px solid var(--gold)',
        borderRadius: isBanner ? 4 : 20,
        color: 'var(--gold)',
        fontFamily: 'var(--font-serif)',
        fontSize: sizeStyles.fontSize,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        boxShadow: '0 2px 10px rgba(201,168,76,0.15)',
        cursor: onClick ? 'pointer' : 'default',
        width: isBanner ? '100%' : 'auto',
        justifyContent: isBanner ? 'center' : 'flex-start',
        userSelect: 'none',
      }}
    >
      <Trophy size={sizeStyles.iconSize} color="var(--gold)" style={{ flexShrink: 0 }} />
      <span>
        Weekend Winner{genreName ? ` · ${genreName}` : ''}
        {edition ? <span style={{ opacity: 0.8, fontWeight: 400, marginLeft: 4 }}>({edition})</span> : ''}
      </span>
      {size === 'lg' && <Sparkles size={sizeStyles.iconSize - 2} color="var(--gold)" style={{ opacity: 0.8 }} />}
    </div>
  );
}
