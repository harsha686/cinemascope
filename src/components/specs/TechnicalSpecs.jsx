import React from 'react';
import { Tv2, Zap, AlertCircle } from 'lucide-react';
import DataSourceBadge from '../shared/DataSourceBadge';

function SpecRow({ label, value, unit = '', unavailable = false, source, confidence }) {
  const isNA = value === null || value === undefined || value === '' || value === 'Not publicly verified' || value === 'N/A';
  return (
    <div className="spec-card">
      <div className="spec-label">{label}</div>
      {isNA ? (
        <div className="spec-value unavailable">Not publicly verified</div>
      ) : (
        <div className="spec-value">{value}{unit}</div>
      )}
      {confidence && <DataSourceBadge confidence={confidence} source={source} style={{ marginTop: 4 }} />}
    </div>
  );
}

export default function TechnicalSpecs({ screen }) {
  if (!screen) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ padding: '20px 0 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Tv2 size={16} color="var(--gold)" />
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
          Technical Specifications
        </h3>
      </div>

      <div className="spec-grid" style={{ border: '1px solid var(--border-subtle)' }}>
        <SpecRow label="Screen" value={screen.name} />
        <SpecRow label="Aspect Ratio" value={screen.aspectRatio} />
        <SpecRow label="Format" value={screen.formatName} />
        <SpecRow label="Capacity" value={screen.capacity} unit=" seats" confidence={screen.sourceConfidence} source={screen.dataSource} />
        <SpecRow label="Screen Width" value={screen.screenWidthM} unit=" m" confidence={screen.sourceConfidence} />
        <SpecRow label="Screen Height" value={screen.screenHeightM} unit=" m" confidence={screen.sourceConfidence} />
        <SpecRow label="Projection" value={screen.projection} confidence={screen.sourceConfidence} source={screen.dataSource} />
        <SpecRow label="Projector" value={screen.projectorBrand ? `${screen.projectorBrand}${screen.projectorModel ? ' — ' + screen.projectorModel : ''}` : null} confidence={screen.sourceConfidence} />
        <SpecRow label="Resolution" value={screen.resolution} confidence={screen.sourceConfidence} />
        <SpecRow label="Sound System" value={screen.soundSystem} confidence={screen.sourceConfidence} source={screen.dataSource} />
        <SpecRow label="Speakers" value={screen.speakerCount} confidence={screen.sourceConfidence} />
        <SpecRow label="Dolby Atmos" value={screen.dolbyAtmos === true ? 'Yes' : screen.dolbyAtmos === false ? 'No' : null} />
        <SpecRow label="Screen Material" value={screen.screenMaterial === 'Not publicly verified' ? null : screen.screenMaterial} />
        <SpecRow label="Seating Type" value={screen.seatingType?.join(', ')} />
      </div>

      {screen.notes && (
        <div style={{ marginTop: 12, padding: '12px 16px', background: 'rgba(201,168,76,0.05)', border: '1px solid var(--border-subtle)', borderLeft: '2px solid var(--gold)' }}>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7, fontFamily: 'var(--font-italic)' }}>
            {screen.notes}
          </p>
        </div>
      )}

      {/* Overall confidence */}
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <AlertCircle size={12} color="var(--text-muted)" />
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          Data confidence: <strong>{screen.sourceConfidence || 'unknown'}</strong> · Source: {screen.dataSource || 'Unknown'}
        </span>
      </div>
    </div>
  );
}
