import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ScreenSimulator from '../simulator/ScreenSimulator';

export default function ComparisonSlider({ screenA, screenB }) {
  const containerRef = useRef(null);
  const [sliderX, setSliderX] = useState(50); // percent
  const [isDragging, setIsDragging] = useState(false);
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

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setSliderX(Math.max(5, Math.min(95, x)));
  }, []);

  const onMouseDown = (e) => { setIsDragging(true); e.preventDefault(); };
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => handleMove(e.touches ? e.touches[0].clientX : e.clientX);
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [isDragging, handleMove]);

  const ratioA = screenA?.aspectRatioNumeric || 2.39;
  const ratioB = screenB?.aspectRatioNumeric || 1.85;
  const screenHpx = containerW / Math.max(ratioA, ratioB);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {['fit', 'crop'].map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`btn btn-sm ${mode === m ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: 9 }}>
            {m === 'fit' ? 'Full Frame' : 'Cinema Crop'}
          </button>
        ))}
      </div>

      {/* Labels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 2 }}>A</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--text-primary)' }}>{screenA?.name || 'Screen A'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{screenA?.aspectRatio} · {screenA?.formatName}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 2 }}>B</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--text-primary)' }}>{screenB?.name || 'Screen B'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{screenB?.aspectRatio} · {screenB?.formatName}</div>
        </div>
      </div>

      {/* Side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} ref={containerRef}>
        <div>
          <ScreenSimulator
            screenRatio={ratioA}
            screenRatioLabel={screenA?.aspectRatio || '2.39:1'}
            screenFormatName={screenA?.formatName || 'Scope'}
            mode={mode}
            onModeChange={setMode}
            containerWidth={(containerW - 12) / 2}
          />
        </div>
        <div>
          <ScreenSimulator
            screenRatio={ratioB}
            screenRatioLabel={screenB?.aspectRatio || '1.85:1'}
            screenFormatName={screenB?.formatName || 'Flat'}
            mode={mode}
            onModeChange={setMode}
            containerWidth={(containerW - 12) / 2}
          />
        </div>
      </div>

      {/* Instruction */}
      <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', letterSpacing: '0.08em' }}>
        Same demo footage · Same source · Different screen shapes
      </p>
    </div>
  );
}
