import React from 'react';

function Row({ label, valA, valB, highlight }) {
  const isBetter = (v1, v2, higherIsBetter = true) => {
    const n1 = parseFloat(v1);
    const n2 = parseFloat(v2);
    if (isNaN(n1) || isNaN(n2)) return null;
    return higherIsBetter ? (n1 > n2 ? 'a' : n1 < n2 ? 'b' : 'tie') : (n1 < n2 ? 'a' : n1 > n2 ? 'b' : 'tie');
  };

  const na = '—';
  const dispA = valA ?? na;
  const dispB = valB ?? na;

  return (
    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <td style={{ padding: '10px 16px', fontFamily: 'var(--font-serif)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', width: '25%' }}>
        {label}
      </td>
      <td style={{ padding: '10px 16px', fontSize: 12, color: highlight === 'a' ? 'var(--gold)' : 'var(--text-primary)', textAlign: 'center', width: '37.5%' }}>
        {String(dispA)}
        {highlight === 'a' && <span style={{ marginLeft: 6, fontSize: 9, color: 'var(--gold)' }}>★</span>}
      </td>
      <td style={{ padding: '10px 16px', fontSize: 12, color: highlight === 'b' ? 'var(--gold)' : 'var(--text-primary)', textAlign: 'center', width: '37.5%' }}>
        {String(dispB)}
        {highlight === 'b' && <span style={{ marginLeft: 6, fontSize: 9, color: 'var(--gold)' }}>★</span>}
      </td>
    </tr>
  );
}

export default function ComparisonTable({ theaterA, screenA, theaterB, screenB }) {
  if (!screenA || !screenB) return null;

  // Smart labels
  const ratioA = screenA.aspectRatioNumeric || 0;
  const ratioB = screenB.aspectRatioNumeric || 0;
  const widerScreen = ratioA > ratioB ? 'a' : ratioA < ratioB ? 'b' : 'tie';
  const tallerScreen = ratioA < ratioB ? 'a' : ratioA > ratioB ? 'b' : 'tie';
  const moreSeats = (screenA.capacity || 0) > (screenB.capacity || 0) ? 'a' : (screenA.capacity || 0) < (screenB.capacity || 0) ? 'b' : null;
  const moreSpeakers = (screenA.speakerCount || 0) > (screenB.speakerCount || 0) ? 'a' : (screenA.speakerCount || 0) < (screenB.speakerCount || 0) ? 'b' : null;

  return (
    <div style={{ border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
      {/* Header */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: '12px 16px', fontFamily: 'var(--font-serif)', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'left', width: '25%' }}>
              Specification
            </th>
            <th style={{ padding: '12px 16px', fontFamily: 'var(--font-serif)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--gold)', textAlign: 'center', width: '37.5%' }}>
              A — {screenA.name}
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{theaterA?.name}</div>
            </th>
            <th style={{ padding: '12px 16px', fontFamily: 'var(--font-serif)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--gold)', textAlign: 'center', width: '37.5%' }}>
              B — {screenB.name}
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{theaterB?.name}</div>
            </th>
          </tr>
        </thead>
        <tbody>
          <Row label="Aspect Ratio" valA={screenA.aspectRatio} valB={screenB.aspectRatio} />
          <Row label="Format" valA={screenA.formatName} valB={screenB.formatName} />
          <Row label="Screen Width" valA={screenA.screenWidthM ? `${screenA.screenWidthM} m` : null} valB={screenB.screenWidthM ? `${screenB.screenWidthM} m` : null} highlight={screenA.screenWidthM > screenB.screenWidthM ? 'a' : 'b'} />
          <Row label="Screen Height" valA={screenA.screenHeightM ? `${screenA.screenHeightM} m` : null} valB={screenB.screenHeightM ? `${screenB.screenHeightM} m` : null} />
          <Row label="Projection" valA={screenA.projection} valB={screenB.projection} />
          <Row label="Projector" valA={screenA.projectorBrand} valB={screenB.projectorBrand} />
          <Row label="Resolution" valA={screenA.resolution} valB={screenB.resolution} />
          <Row label="Sound" valA={screenA.soundSystem} valB={screenB.soundSystem} />
          <Row label="Speakers" valA={screenA.speakerCount} valB={screenB.speakerCount} highlight={moreSpeakers} />
          <Row label="Dolby Atmos" valA={screenA.dolbyAtmos === true ? 'Yes' : screenA.dolbyAtmos === false ? 'No' : '?'} valB={screenB.dolbyAtmos === true ? 'Yes' : screenB.dolbyAtmos === false ? 'No' : '?'} />
          <Row label="Seating" valA={screenA.capacity} valB={screenB.capacity} highlight={moreSeats} />
          <Row label="Screen Type" valA={screenA.screenMaterial === 'Not publicly verified' ? null : screenA.screenMaterial} valB={screenB.screenMaterial === 'Not publicly verified' ? null : screenB.screenMaterial} />
        </tbody>
      </table>

      {/* Smart notes */}
      <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {widerScreen !== 'tie' && (
          <span style={{ fontSize: 10, padding: '3px 10px', background: 'rgba(201,168,76,0.08)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
            {widerScreen === 'a' ? 'A' : 'B'} → Better for wider scope films (2.39:1)
          </span>
        )}
        {ratioA > 1.85 && ratioA < 2.0 && (
          <span style={{ fontSize: 10, padding: '3px 10px', background: 'rgba(201,168,76,0.08)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
            A → Optimized for tall-format content (IMAX)
          </span>
        )}
        {ratioB > 1.85 && ratioB < 2.0 && (
          <span style={{ fontSize: 10, padding: '3px 10px', background: 'rgba(201,168,76,0.08)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
            B → Optimized for tall-format content (IMAX)
          </span>
        )}
        {moreSpeakers && (
          <span style={{ fontSize: 10, padding: '3px 10px', background: 'rgba(201,168,76,0.08)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
            {moreSpeakers === 'a' ? 'A' : 'B'} → More immersive sound setup
          </span>
        )}
      </div>
    </div>
  );
}
