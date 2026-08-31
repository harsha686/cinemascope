import React from 'react';
import { ASPECT_RATIOS, calcAspectFit } from '../../data/formats';

const SOURCE_RATIO = 1.78;

export default function AspectRatioVisualizer({ selectedRatio = 2.39, showAll = false }) {
  const containerW = 300;
  const containerH = 200;
  const selected = ASPECT_RATIOS.find(r => r.numeric === selectedRatio) || ASPECT_RATIOS.find(r => r.numeric === 2.39);

  const ratios = showAll
    ? [1.43, 1.78, 1.85, 1.90, 2.39]
    : [ASPECT_RATIOS.find(r => r.numeric === selectedRatio)?.numeric || 2.39];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* All ratios overlaid */}
      {showAll && (
        <div style={{ position: 'relative', width: containerW, height: containerH, background: '#000', border: '1px solid var(--border-subtle)', margin: '0 auto' }}>
          {ASPECT_RATIOS.filter(r => [1.43,1.78,1.85,1.90,2.39].includes(r.numeric)).map((r, i) => {
            const maxW = containerW * 0.9;
            const maxH = containerH * 0.9;
            let w, h;
            if (r.numeric > 1) {
              w = Math.min(maxW, maxH * r.numeric);
              h = w / r.numeric;
            } else {
              h = maxH;
              w = h * r.numeric;
            }
            const colors = ['rgba(201,168,76,0.6)', 'rgba(96,165,250,0.4)', 'rgba(134,239,172,0.4)', 'rgba(251,191,36,0.4)', 'rgba(248,113,113,0.4)'];
            return (
              <div key={r.ratio} style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%,-50%)',
                width: w,
                height: h,
                border: `1px solid ${colors[i]}`,
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'flex-end',
                padding: '2px 4px',
              }}>
                <span style={{ fontSize: 8, fontFamily: 'var(--font-serif)', color: colors[i], letterSpacing: '0.05em' }}>{r.ratio}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected ratio shape */}
      {!showAll && selected && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          {(() => {
            const maxW = 220;
            const h = Math.round(maxW / selected.numeric);
            return (
              <div style={{
                width: maxW,
                height: h,
                background: 'rgba(201,168,76,0.08)',
                border: '1px solid var(--gold-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 11, color: 'var(--gold)', letterSpacing: '0.1em' }}>
                  {selected.ratio}
                </span>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'var(--border-subtle)', transform: 'translateY(-50%)' }} />
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: 'var(--border-subtle)', transform: 'translateX(-50%)' }} />
                {/* Dimension arrows */}
                <div style={{ position: 'absolute', bottom: -18, left: 0, right: 0, height: 1, background: 'var(--gold-dim)' }} />
                <div style={{ position: 'absolute', right: -18, top: 0, bottom: 0, width: 1, background: 'var(--gold-dim)' }} />
              </div>
            );
          })()}
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 240, lineHeight: 1.6 }}>
            {selected.description}
          </p>
        </div>
      )}
    </div>
  );
}
