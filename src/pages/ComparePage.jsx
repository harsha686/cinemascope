import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Monitor } from 'lucide-react';
import { useApp } from '../AppContext';
import ComparisonSlider from '../components/comparison/ComparisonSlider';
import ComparisonTable from '../components/comparison/ComparisonTable';

function ScreenPicker({ label, selectedTheater, selectedScreen, onSelect, theaters }) {
  const [theaterOpen, setTheaterOpen] = useState(false);
  const [screenOpen, setScreenOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)' }}>
        {label}
      </div>

      {/* Theater selector */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => { setTheaterOpen(!theaterOpen); setScreenOpen(false); }}
          style={{
            width: '100%',
            padding: '10px 16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            color: selectedTheater ? 'var(--text-primary)' : 'var(--text-muted)',
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'border-color var(--transition-base)',
          }}
        >
          <span>{selectedTheater?.name || 'Select theater...'}</span>
          <ChevronDown size={14} color="var(--text-muted)" />
        </button>
        {theaterOpen && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', zIndex: 30, maxHeight: 240, overflowY: 'auto' }}>
            {theaters.map(t => (
              <button
                key={t.id}
                onClick={() => { onSelect({ theater: t, screen: null }); setTheaterOpen(false); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--text-primary)', fontSize: 13,
                  borderBottom: '1px solid var(--border-subtle)',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 12 }}>{t.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{t.totalScreens} screens · {t.type}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Screen selector */}
      {selectedTheater && (
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setScreenOpen(!screenOpen); setTheaterOpen(false); }}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: selectedScreen ? 'var(--text-primary)' : 'var(--text-muted)',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{selectedScreen?.name || 'Select screen...'}</span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>
          {screenOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', zIndex: 30, maxHeight: 240, overflowY: 'auto' }}>
              {selectedTheater.screens?.map(s => (
                <button
                  key={s.id}
                  onClick={() => { onSelect({ theater: selectedTheater, screen: s }); setScreenOpen(false); }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none',
                    cursor: 'pointer', color: 'var(--text-primary)', fontSize: 13,
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Monitor size={12} color="var(--text-muted)" />
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: 12 }}>{s.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--gold)' }}>{s.aspectRatio}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.formatName}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected info */}
      {selectedScreen && (
        <div style={{ padding: '12px', background: 'rgba(201,168,76,0.05)', border: '1px solid var(--border-subtle)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 9, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Ratio</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--gold)' }}>{selectedScreen.aspectRatio}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Format</div>
            <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>{selectedScreen.formatName}</div>
          </div>
          {selectedScreen.projection && (
            <div>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Projection</div>
              <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>{selectedScreen.projection}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  const { allTheaters } = useApp();
  const [selA, setSelA] = useState({ theater: null, screen: null });
  const [selB, setSelB] = useState({ theater: null, screen: null });

  // Preselect defaults for demo
  const defaultA = allTheaters.find(t => t.id === 'varun-inox');
  const defaultB = allTheaters.find(t => t.id === 'kameswari-kinnera');

  const theaterA = selA.theater || defaultA;
  const screenA = selA.screen || defaultA?.screens?.find(s => s.screenNumber === 4);
  const theaterB = selB.theater || defaultB;
  const screenB = selB.screen || defaultB?.screens?.[0];

  const canCompare = theaterA && screenA && theaterB && screenB;

  return (
    <div className="page-enter">
      {/* Hero */}
      <div style={{ padding: '60px 24px 40px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, justifyContent: 'center', flexDirection: 'column', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ height: 1, width: 30, background: 'var(--gold-dim)' }} />
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)' }}>Screen Comparison</span>
              <div style={{ height: 1, width: 30, background: 'var(--gold-dim)' }} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(24px, 4vw, 40px)', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
              Compare Screens
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 480, lineHeight: 1.8 }}>
              See exactly how the same movie will appear on two different cinema screens. Select theaters and screens below.
            </p>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px' }}>
        {/* Screen pickers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'start', marginBottom: 32 }} className="compare-pickers">
          <ScreenPicker
            label="Screen A"
            selectedTheater={theaterA}
            selectedScreen={screenA}
            onSelect={setSelA}
            theaters={allTheaters}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 40 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.2em' }}>VS</div>
          </div>
          <ScreenPicker
            label="Screen B"
            selectedTheater={theaterB}
            selectedScreen={screenB}
            onSelect={setSelB}
            theaters={allTheaters}
          />
        </div>

        <hr className="divider" style={{ marginBottom: 32 }} />

        {/* Visual comparison */}
        {canCompare ? (
          <>
            <ComparisonSlider screenA={screenA} screenB={screenB} />

            <div style={{ marginTop: 48 }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
                Technical Comparison
              </h2>
              <ComparisonTable theaterA={theaterA} screenA={screenA} theaterB={theaterB} screenB={screenB} />
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎬</div>
            <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', fontSize: 14, letterSpacing: '0.05em' }}>
              Select two screens to begin comparison
            </p>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .compare-pickers { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
