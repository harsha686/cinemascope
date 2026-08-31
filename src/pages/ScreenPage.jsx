import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Maximize2, GitCompare, X } from 'lucide-react';
import { useApp } from '../AppContext';
import ScreenSimulator from '../components/simulator/ScreenSimulator';
import FormatSelector from '../components/simulator/FormatSelector';
import TechnicalSpecs from '../components/specs/TechnicalSpecs';
import ProjectionInfo from '../components/specs/ProjectionInfo';
import SoundInfo from '../components/specs/SoundInfo';
import { ASPECT_RATIOS, getFormat } from '../data/formats';

export default function ScreenPage() {
  const { theaterId, screenId } = useParams();
  const navigate = useNavigate();
  const { getTheater, getScreen, getCity, dispatch, state } = useApp();

  const theater = getTheater(theaterId);
  const screen = getScreen(theaterId, screenId);
  const city = theater ? getCity(theater.cityId) : null;

  const [simMode, setSimMode] = useState('fit');
  const [isExperience, setIsExperience] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(
    screen ? getFormat(screen.aspectRatio) || ASPECT_RATIOS.find(r => r.ratio === '2.39:1') : null
  );

  if (!theater || !screen) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>Screen Not Found</h1>
        <button onClick={() => navigate('/')} className="btn btn-outline" style={{ marginTop: 24 }}>← Back Home</button>
      </div>
    );
  }

  const displayRatio = selectedFormat?.numeric || screen.aspectRatioNumeric;
  const displayRatioLabel = selectedFormat?.ratio || screen.aspectRatio;
  const displayFormatName = selectedFormat?.name || screen.formatName;

  return (
    <>
      {/* ========== CINEMA EXPERIENCE MODE ========== */}
      {isExperience && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          background: '#000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}>
          {/* Exit */}
          <button
            onClick={() => setIsExperience(false)}
            className="btn btn-ghost btn-sm"
            style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <X size={14} /> Exit Experience
          </button>

          {/* Theater / screen info */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 6 }}>
              {theater.name}
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text-primary)', letterSpacing: '0.08em' }}>
              {screen.name} · {displayRatioLabel}
            </div>
          </div>

          {/* Format selector */}
          <FormatSelector
            selectedRatio={displayRatioLabel}
            onSelect={setSelectedFormat}
          />

          {/* Big simulator */}
          <div style={{ width: '100%', maxWidth: 1100, marginTop: 16 }}>
            <ScreenSimulator
              screenRatio={displayRatio}
              screenRatioLabel={displayRatioLabel}
              screenFormatName={displayFormatName}
              mode={simMode}
              onModeChange={setSimMode}
              isExperience={true}
            />
          </div>
        </div>
      )}

      {/* ========== NORMAL PAGE ========== */}
      <div className="page-enter">
        {/* Header */}
        <div style={{ padding: '48px 24px 32px', borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(135deg, rgba(201,168,76,0.03) 0%, transparent 60%)' }}>
          <div className="container">
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              <Link to="/" style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
              <span style={{ color: 'var(--border)', fontSize: 10 }}>/</span>
              {city && <Link to={`/city/${city.id}`} style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none' }}>{city.name}</Link>}
              <span style={{ color: 'var(--border)', fontSize: 10 }}>/</span>
              <Link to={`/theater/${theaterId}`} style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none' }}>{theater.name}</Link>
              <span style={{ color: 'var(--border)', fontSize: 10 }}>/</span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{screen.name}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>
                  {theater.name}
                </div>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(22px, 3.5vw, 36px)', color: 'var(--text-primary)', letterSpacing: '0.04em', marginBottom: 8, lineHeight: 1.1 }}>
                  {screen.name}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: 'var(--gold)', letterSpacing: '0.05em' }}>
                    {screen.aspectRatio}
                  </span>
                  <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    {screen.formatName}
                  </span>
                  {screen.screenType && (
                    <>
                      <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
                      <span className="badge badge-dim">{screen.screenType}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setIsExperience(true)}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Maximize2 size={14} />
                  Cinema Experience
                </button>
                <button
                  onClick={() => navigate('/compare')}
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <GitCompare size={14} />
                  Compare
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Format selector */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.3)' }}>
          <div className="container">
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 9, fontFamily: 'var(--font-serif)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Try different formats on this screen
              </span>
            </div>
            <FormatSelector
              selectedRatio={displayRatioLabel}
              onSelect={setSelectedFormat}
            />
          </div>
        </div>

        {/* Simulator */}
        <div style={{ padding: '40px 24px', background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(201,168,76,0.03) 0%, transparent 70%)' }}>
          <div className="container" style={{ maxWidth: 900 }}>
            <ScreenSimulator
              screenRatio={displayRatio}
              screenRatioLabel={displayRatioLabel}
              screenFormatName={displayFormatName}
              mode={simMode}
              onModeChange={setSimMode}
            />
          </div>
        </div>

        {/* Format description */}
        {selectedFormat && (
          <div style={{ padding: '0 24px 40px' }}>
            <div className="container" style={{ maxWidth: 900 }}>
              <div style={{ padding: '16px 20px', border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ padding: '4px 14px', border: '1px solid var(--border)', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--gold)' }}>{selectedFormat.ratio}</span>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 4 }}>
                    {selectedFormat.fullName}
                  </div>
                  <p style={{ fontFamily: 'var(--font-italic)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    {selectedFormat.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Specs */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '40px 24px' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48 }}>
              <TechnicalSpecs screen={screen} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
                <ProjectionInfo screen={screen} />
                <SoundInfo screen={screen} />
              </div>
            </div>
          </div>
        </div>

        {/* Other screens in theater */}
        {theater.screens && theater.screens.length > 1 && (
          <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '32px 24px' }}>
            <div className="container">
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
                Other Screens in {theater.name}
              </h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {theater.screens.filter(s => s.id !== screenId).map(s => (
                  <Link
                    key={s.id}
                    to={`/theater/${theaterId}/screen/${s.id}`}
                    className="btn btn-ghost btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                  >
                    {s.name} · {s.aspectRatio}
                    <ChevronRight size={11} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
