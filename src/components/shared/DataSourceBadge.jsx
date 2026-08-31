import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function DataSourceBadge({ source, confidence, style }) {
  const conf = confidence || 'unknown';
  const badgeClass = {
    verified: 'badge-verified',
    reported: 'badge-reported',
    estimated: 'badge-estimated',
  }[conf] || 'badge-dim';

  const label = conf.charAt(0).toUpperCase() + conf.slice(1);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...style }}>
      <span className={`badge ${badgeClass}`}>{label}</span>
      {source && (
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          Source: {source}
        </span>
      )}
    </div>
  );
}
