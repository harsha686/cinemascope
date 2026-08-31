import React from 'react';
import { Projector, AlertCircle } from 'lucide-react';

export default function ProjectionInfo({ screen }) {
  if (!screen) return null;

  const proj = screen.projection || null;
  const brand = screen.projectorBrand;
  const model = screen.projectorModel;
  const res = screen.resolution;
  const isNA = !proj || proj === 'Not publicly verified';

  const isLaser = proj?.toLowerCase().includes('laser');
  const is4K = res?.includes('4096') || proj?.includes('4K');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Projector size={16} color="var(--gold)" />
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
          Projection
        </h3>
        {isLaser && <span className="badge badge-gold" style={{ marginLeft: 'auto' }}>Laser</span>}
        {is4K && <span className="badge badge-gold">4K</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border-subtle)', border: '1px solid var(--border-subtle)' }}>
        <div className="spec-card">
          <div className="spec-label">Technology</div>
          {isNA ? <div className="spec-value unavailable">Not publicly verified</div> : <div className="spec-value">{proj}</div>}
        </div>
        <div className="spec-card">
          <div className="spec-label">Brand</div>
          {brand ? <div className="spec-value">{brand}</div> : <div className="spec-value unavailable">Not publicly verified</div>}
        </div>
        {model && (
          <div className="spec-card" style={{ gridColumn: '1 / -1' }}>
            <div className="spec-label">Model</div>
            <div className="spec-value" style={{ fontSize: 13 }}>{model}</div>
          </div>
        )}
        <div className="spec-card">
          <div className="spec-label">Resolution</div>
          {res ? <div className="spec-value" style={{ fontSize: 13 }}>{res}</div> : <div className="spec-value unavailable">Not publicly verified</div>}
        </div>
        <div className="spec-card">
          <div className="spec-label">Light Source</div>
          <div className="spec-value" style={{ fontSize: 13 }}>
            {isLaser ? 'Laser' : proj ? 'Xenon Lamp' : 'Not verified'}
          </div>
        </div>
      </div>

      {/* Projector icon visualization */}
      {!isNA && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)' }}>
          {/* Projector icon */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 40, height: 28, background: 'rgba(201,168,76,0.1)', border: '1px solid var(--gold-dim)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: isLaser ? 'var(--gold)' : 'rgba(255,200,100,0.6)', boxShadow: isLaser ? '0 0 8px rgba(201,168,76,0.8)' : 'none' }} />
            </div>
            {/* Beam */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '100%',
              transform: 'translateY(-50%)',
              width: 60,
              height: 0,
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderLeft: `60px solid ${isLaser ? 'rgba(201,168,76,0.2)' : 'rgba(255,200,100,0.1)'}`,
            }} />
          </div>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {isLaser
                ? 'Laser projection provides higher brightness, wider color gamut, and longer operational life compared to xenon lamps.'
                : 'Xenon lamp projection: industry-standard light source for cinema projection.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
