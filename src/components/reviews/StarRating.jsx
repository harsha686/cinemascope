import React, { useState } from 'react';
import { Star } from 'lucide-react';

export default function StarRating({
  rating = 0,
  onChange = null,
  size = 16,
  readOnly = false,
  showScore = false,
  count = null,
  style = {}
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = hoverRating || rating;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, ...style }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          return (
            <button
              key={star}
              type="button"
              disabled={readOnly}
              onClick={() => !readOnly && onChange && onChange(star)}
              onMouseEnter={() => !readOnly && setHoverRating(star)}
              onMouseLeave={() => !readOnly && setHoverRating(0)}
              style={{
                background: 'none',
                border: 'none',
                padding: readOnly ? 0 : 2,
                cursor: readOnly ? 'default' : 'pointer',
                color: isFilled ? 'var(--gold)' : 'rgba(255,255,255,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 100ms ease, color 150ms ease',
                transform: !readOnly && hoverRating === star ? 'scale(1.2)' : 'scale(1)',
              }}
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
            >
              <Star
                size={size}
                fill={isFilled ? 'var(--gold)' : 'none'}
                stroke={isFilled ? 'var(--gold)' : 'currentColor'}
              />
            </button>
          );
        })}
      </div>

      {showScore && (
        <span style={{
          fontFamily: 'var(--font-serif)',
          fontSize: Math.max(12, size - 3),
          fontWeight: 600,
          color: rating > 0 ? 'var(--gold)' : 'var(--text-muted)',
          marginLeft: 4
        }}>
          {rating > 0 ? rating.toFixed(1) : 'Unrated'}
        </span>
      )}

      {count !== null && count !== undefined && (
        <span style={{ fontSize: Math.max(11, size - 4), color: 'var(--text-muted)', marginLeft: 2 }}>
          ({count} {count === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
}
