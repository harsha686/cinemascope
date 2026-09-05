import React from 'react';
import { Star } from 'lucide-react';

export default function PersonalRatingPicker({ value = 0, onChange, size = 'md' }) {
  const sizeMap = { sm: 16, md: 24, lg: 32 };
  const iconSize = sizeMap[size] || 24;

  const handleClick = (e, starIndex, isLeftHalf) => {
    e.stopPropagation();
    const newValue = isLeftHalf ? starIndex - 0.5 : starIndex;
    if (value === newValue) {
      onChange(0);
    } else {
      onChange(newValue);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ display: 'flex' }}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = value >= star;
          const isHalf = value === star - 0.5;
          const isEmpty = value < star - 0.5;

          return (
            <div key={star} style={{ position: 'relative', width: `${iconSize}px`, height: `${iconSize}px`, cursor: 'pointer' }}>
              {/* Background empty star */}
              <Star size={iconSize} color="var(--text-muted)" style={{ position: 'absolute', top: 0, left: 0 }} />
              
              {/* Half filled */}
              {isHalf && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', overflow: 'hidden' }}>
                  <Star size={iconSize} color="var(--gold)" fill="var(--gold)" />
                </div>
              )}
              
              {/* Full filled */}
              {isFilled && (
                <Star size={iconSize} color="var(--gold)" fill="var(--gold)" style={{ position: 'absolute', top: 0, left: 0 }} />
              )}

              {/* Click targets */}
              <div 
                style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', zIndex: 10 }}
                onClick={(e) => handleClick(e, star, true)}
                title={`${star - 0.5} stars`}
              />
              <div 
                style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', zIndex: 10 }}
                onClick={(e) => handleClick(e, star, false)}
                title={`${star} stars`}
              />
            </div>
          );
        })}
      </div>
      {value > 0 && <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 'bold' }}>{value}</span>}
    </div>
  );
}
