import React from 'react';

/**
 * Animated shimmering skeleton block
 */
export function SkeletonBlock({ width = '100%', height = '16px', borderRadius = '4px', className = '', style = {} }) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.03) 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-glow 1.5s infinite ease-in-out',
        ...style,
      }}
    />
  );
}

/**
 * Skeleton placeholder for GlobalMovieCard / MovieCard
 */
export function MovieCardSkeleton({ width = '180px' }) {
  return (
    <div
      style={{
        width,
        flexShrink: 0,
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ position: 'relative', width: '100%', paddingBottom: '150%' }}>
        <SkeletonBlock
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: 0,
          }}
        />
      </div>
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SkeletonBlock width="80%" height="14px" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SkeletonBlock width="35%" height="11px" />
          <SkeletonBlock width="25%" height="11px" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder for a horizontal cinema shelf
 */
export function MovieShelfSkeleton({ count = 6 }) {
  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
        <SkeletonBlock width="200px" height="24px" borderRadius="4px" />
      </div>
      <div
        style={{
          display: 'flex',
          gap: '1.25rem',
          overflowX: 'hidden',
          paddingBottom: '0.5rem',
        }}
      >
        {Array.from({ length: count }).map((_, idx) => (
          <MovieCardSkeleton key={idx} width="170px" />
        ))}
      </div>
    </div>
  );
}
