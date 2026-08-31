import React, { useState } from 'react';
import { ASPECT_RATIOS } from '../data/formats';
import FormatSelector from '../components/simulator/FormatSelector';
import ScreenSimulator from '../components/simulator/ScreenSimulator';
import AspectRatioVisualizer from '../components/simulator/AspectRatioVisualizer';

export default function FormatsPage() {
  const [selectedFormat, setSelectedFormat] = useState(ASPECT_RATIOS.find(r => r.ratio === '2.39:1'));
  const [simMode, setSimMode] = useState('fit');

  return (
    <div className="page-enter">
      {/* Hero */}
      <div style={{ padding: '60px 24px 40px', borderBottom: '1px solid var(--border-subtle)', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ height: 1, width: 30, background: 'var(--gold-dim)' }} />
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)' }}>Cinema Formats</span>
            <div style={{ height: 1, width: 30, background: 'var(--gold-dim)' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(26px, 4vw, 42px)', color: 'var(--text-primary)', letterSpacing: '0.05em', marginBottom: 12 }}>
            Why Aspect Ratios Matter
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.9, fontFamily: 'var(--font-italic)' }}>
            When you watch a movie in different theaters, the same film can look dramatically different depending on the screen's aspect ratio. A 2.39:1 scope screen presents a wider image, while a 1.43:1 IMAX screen reveals more of the top and bottom of the frame.
          </p>
        </div>
      </div>

      {/* Interactive Format Explorer */}
      <div style={{ padding: '40px 24px', background: 'rgba(0,0,0,0.2)' }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 20, textAlign: 'center' }}>
            Interactive Format Explorer
          </h2>
          <FormatSelector selectedRatio={selectedFormat?.ratio} onSelect={setSelectedFormat} />
          <div style={{ marginTop: 24 }}>
            <ScreenSimulator
              screenRatio={selectedFormat?.numeric || 2.39}
              screenRatioLabel={selectedFormat?.ratio || '2.39:1'}
              screenFormatName={selectedFormat?.name || 'Scope'}
              mode={simMode}
              onModeChange={setSimMode}
            />
          </div>
          {selectedFormat && (
            <div style={{ marginTop: 20, padding: '16px 20px', border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.3)' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 6 }}>
                {selectedFormat.fullName}
              </div>
              <p style={{ fontFamily: 'var(--font-italic)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                {selectedFormat.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* All formats grid */}
      <div style={{ padding: '40px 24px' }}>
        <div className="container">
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 24 }}>
            All Supported Formats
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2, background: 'var(--border-subtle)', border: '1px solid var(--border-subtle)' }}>
            {ASPECT_RATIOS.map(r => {
              const width = 120;
              const height = Math.round(width / r.numeric);
              return (
                <div key={r.ratio} style={{ background: 'var(--bg-card)', padding: '24px 20px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                  {/* Shape preview */}
                  <div style={{ flexShrink: 0 }}>
                    <div style={{
                      width: Math.min(width, 80),
                      height: Math.min(height, 80),
                      background: 'rgba(201,168,76,0.08)',
                      border: '1px solid var(--gold-dim)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: 7, color: 'var(--gold)', letterSpacing: '0.05em' }}>{r.ratio}</span>
                    </div>
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--gold)', letterSpacing: '0.05em', marginBottom: 2 }}>
                      {r.ratio}
                    </div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 6 }}>
                      {r.name}
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                      {r.description}
                    </p>
                    <div style={{ marginTop: 8 }}>
                      <span className={`badge badge-dim`} style={{ fontSize: 8 }}>{r.category}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Shape comparison diagram */}
      <div style={{ padding: '40px 24px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)' }}>
        <div className="container" style={{ maxWidth: 700, textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
            Format Shape Comparison
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 24 }}>
            All key cinema formats overlaid at the same center point
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <AspectRatioVisualizer showAll={true} />
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { label: '1.43:1 IMAX', color: 'rgba(201,168,76,0.6)' },
              { label: '1.78:1 HDTV', color: 'rgba(96,165,250,0.4)' },
              { label: '1.85:1 Flat', color: 'rgba(134,239,172,0.4)' },
              { label: '1.90:1 IMAX Digital', color: 'rgba(251,191,36,0.4)' },
              { label: '2.39:1 Scope', color: 'rgba(248,113,113,0.4)' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 12, height: 2, background: l.color, borderRadius: 1 }} />
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
