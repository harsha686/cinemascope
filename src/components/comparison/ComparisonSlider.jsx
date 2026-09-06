import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ScreenSimulator from '../simulator/ScreenSimulator';

export default function ComparisonSlider({ screenA, screenB }) {
  const containerRef = useRef(null);
  const [mode, setMode] = useState('fit');
  const [containerW, setContainerW] = useState(800);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setContainerW(e.contentRect.width);
    });
    ro.observe(el);
    setContainerW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const ratioA = screenA?.aspectRatioNumeric || 2.39;
  const ratioB = screenB?.aspectRatioNumeric || 1.85;

  // Calculate equal column width and unified stage height so both sides align with 100% precision
  const isSingleCol = containerW && containerW < 640;
  const colW = containerW ? (isSingleCol ? containerW : Math.max(280, (containerW - 16) / 2)) : 400;
  const maxDisplayW = Math.min(colW * 0.86, 840);
  // The screen with the smaller ratio has the larger height (e.g. 1.85 is taller than 2.39)
  const commonStageHeight = Math.ceil(maxDisplayW / Math.min(ratioA, ratioB));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Global mode toggle */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {['fit', 'crop'].map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`btn btn-sm ${mode === m ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: 10, letterSpacing: '0.1em' }}
          >
            {m === 'fit' ? 'Full Frame (Fit)' : 'Cinema Crop (Fill)'}
          </button>
        ))}
      </div>

      {/* Screen Headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="compare-labels-grid">
        <div style={{ textAlign: 'center', padding: '0 8px' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 2 }}>Screen A</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>{screenA?.name || 'Screen A'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{screenA?.aspectRatio} · {screenA?.formatName}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '0 8px' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 2 }}>Screen B</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>{screenB?.name || 'Screen B'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{screenB?.aspectRatio} · {screenB?.formatName}</div>
        </div>
      </div>

      {/* Side by side screen simulators */}
      <div
        ref={containerRef}
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}
        className="compare-simulators-grid"
      >
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <ScreenSimulator
            screenRatio={ratioA}
            screenRatioLabel={screenA?.aspectRatio || '2.39:1'}
            screenFormatName={screenA?.formatName || 'Scope'}
            screenWidthM={screenA?.screenWidthM}
            screenHeightM={screenA?.screenHeightM}
            mode={mode}
            onModeChange={setMode}
            containerWidth={colW}
            stageHeight={commonStageHeight}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <ScreenSimulator
            screenRatio={ratioB}
            screenRatioLabel={screenB?.aspectRatio || '1.85:1'}
            screenFormatName={screenB?.formatName || 'Flat'}
            screenWidthM={screenB?.screenWidthM}
            screenHeightM={screenB?.screenHeightM}
            mode={mode}
            onModeChange={setMode}
            containerWidth={colW}
            stageHeight={commonStageHeight}
          />
        </div>
      </div>

      {/* Instruction */}
      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', letterSpacing: '0.08em', marginTop: 4 }}>
        Same demo footage · Same source · Different screen shapes
      </p>

      <style>{`
        @media (max-width: 640px) {
          .compare-labels-grid,
          .compare-simulators-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
