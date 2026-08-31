import React from 'react';
import { Waves, AlertCircle } from 'lucide-react';

function Speaker({ label, active = true, style }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      ...style,
    }}>
      <div style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: active ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${active ? 'var(--gold-dim)' : 'var(--border-subtle)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: active ? 'var(--gold)' : 'var(--text-muted)' }} />
      </div>
      <span style={{ fontSize: 7, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' }}>{label}</span>
    </div>
  );
}

export default function SoundInfo({ screen }) {
  if (!screen) return null;

  const hasAtmos = screen.dolbyAtmos;
  const sound = screen.soundSystem;
  const speakers = screen.speakerCount;
  const isNA = !sound || sound === 'Not publicly verified';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Waves size={16} color="var(--gold)" />
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
          Audio System
        </h3>
      </div>

      {/* Main sound info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border-subtle)', border: '1px solid var(--border-subtle)' }}>
        <div className="spec-card">
          <div className="spec-label">Sound System</div>
          {isNA ? <div className="spec-value unavailable">Not publicly verified</div> : <div className="spec-value">{sound}</div>}
        </div>
        <div className="spec-card">
          <div className="spec-label">Speakers</div>
          {speakers ? <div className="spec-value">{speakers}</div> : <div className="spec-value unavailable">Not publicly verified</div>}
        </div>
        <div className="spec-card">
          <div className="spec-label">Dolby Atmos</div>
          <div className="spec-value" style={{ color: hasAtmos ? 'var(--gold)' : 'var(--text-secondary)' }}>
            {hasAtmos === true ? 'Yes' : hasAtmos === false ? 'No' : 'Unknown'}
          </div>
        </div>
        {screen.subwooferCount && (
          <div className="spec-card">
            <div className="spec-label">Subwoofers</div>
            <div className="spec-value">{screen.subwooferCount}</div>
          </div>
        )}
        {screen.dolbyAtmosProcessor && (
          <div className="spec-card">
            <div className="spec-label">Processor</div>
            <div className="spec-value">{screen.dolbyAtmosProcessor}</div>
          </div>
        )}
      </div>

      {/* Speaker placement diagram */}
      {hasAtmos && (
        <div>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
            Speaker Layout (Illustrative)
          </p>
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid var(--border-subtle)',
            padding: '24px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            alignItems: 'center',
          }}>
            {/* Screen */}
            <div style={{ width: '85%', height: 8, background: 'rgba(201,168,76,0.3)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 7, fontFamily: 'var(--font-serif)', letterSpacing: '0.2em', color: 'var(--gold)', textTransform: 'uppercase' }}>SCREEN</span>
            </div>
            {/* Front speakers */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '90%' }}>
              <Speaker label="L" />
              <Speaker label="LC" />
              <Speaker label="C" />
              <Speaker label="RC" />
              <Speaker label="R" />
            </div>
            {/* Side surround */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '8px 0' }}>
              <Speaker label="SL" />
              <Speaker label="SR" />
            </div>
            {/* Rear */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '80%' }}>
              <Speaker label="SBL" />
              <Speaker label="SBR" />
            </div>
            {/* Ceiling/Height */}
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 8, width: '100%' }}>
              + Overhead height channels (Dolby Atmos object-based)
            </div>
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
            Diagram is illustrative. Actual speaker placement may vary.
          </p>
        </div>
      )}

      {!hasAtmos && isNA && (
        <div style={{ display: 'flex', gap: 8, padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)' }}>
          <AlertCircle size={14} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Detailed audio specifications for this auditorium are not publicly verified. Visit the TheatreBabu YouTube channel for reviews.
          </p>
        </div>
      )}
    </div>
  );
}
