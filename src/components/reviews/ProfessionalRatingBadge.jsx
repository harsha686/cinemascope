import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function ProfessionalRatingBadge({ size = 'md', showText = true }) {
  const sizes = {
    sm: { fontSize: 10, iconSize: 10, padding: '2px 7px', gap: 3 },
    md: { fontSize: 12, iconSize: 12, padding: '3px 10px', gap: 4 },
    lg: { fontSize: 13, iconSize: 14, padding: '5px 13px', gap: 5 },
  };
  const s = sizes[size] || sizes.md;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: s.gap,
      background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.08))',
      border: '1px solid rgba(16,185,129,0.35)',
      borderRadius: 20, padding: s.padding,
      color: '#10b981', fontSize: s.fontSize, fontWeight: 600,
      letterSpacing: '0.01em', whiteSpace: 'nowrap',
    }}>
      <ShieldCheck size={s.iconSize} />
      {showText && 'Verified Professional'}
    </span>
  );
}
