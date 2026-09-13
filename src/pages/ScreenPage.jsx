import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronRight,
  Maximize2,
  GitCompare,
  X,
  Star,
  MessageSquare,
  ArrowLeft,
  Tv,
  Film,
  Speaker,
  Layers,
  Sliders,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../AppContext';
import AuditoriumView from '../components/simulator/AuditoriumView';
import ScreenSimulator from '../components/simulator/ScreenSimulator';
import FormatSelector from '../components/simulator/FormatSelector';
import TechnicalSpecs from '../components/specs/TechnicalSpecs';
import ProjectionInfo from '../components/specs/ProjectionInfo';
import SoundInfo from '../components/specs/SoundInfo';
import ReviewCard from '../components/reviews/ReviewCard';
import RatingBreakdown from '../components/reviews/RatingBreakdown';
import { ASPECT_RATIOS, getFormat } from '../data/formats';

export default function ScreenPage() {
  const { theaterId, screenId } = useParams();
  const navigate = useNavigate();
  const { getTheater, getScreen, getCity, getTheaterRating, getScreenReviews, state } = useApp();

  const theater = getTheater(theaterId);
  const screen = getScreen(theaterId, screenId);
  const city = theater ? getCity(theater.cityId) : null;
  const theaterRating = useMemo(() => (getTheaterRating ? getTheaterRating(theaterId) : { average: 0, count: 0 }), [getTheaterRating, theaterId]);
  const screenReviews = useMemo(() => (getScreenReviews ? getScreenReviews(theaterId, screenId) : []), [getScreenReviews, theaterId, screenId]);

  const [simMode, setSimMode] = useState('fit');
  const [isExperience, setIsExperience] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'simulator' | 'reviews'
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

  // Physical or aspect ratio dimensions in feet
  const hasPhysical = Boolean(screen?.screenWidthM && Number(screen.screenWidthM) > 0);
  const widthFt = hasPhysical
    ? (Math.round(Number(screen.screenWidthM) * 3.28084 * 10) / 10).toFixed(1)
    : (Math.round(20 * (screen?.aspectRatioNumeric || 2.39) * 10) / 10).toFixed(1);
  const heightFt = hasPhysical
    ? (screen.screenHeightM
        ? (Math.round(Number(screen.screenHeightM) * 3.28084 * 10) / 10).toFixed(1)
        : (Math.round((Number(screen.screenWidthM) / (screen.aspectRatioNumeric || 2.39)) * 3.28084 * 10) / 10).toFixed(1))
    : '20.0';

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
          padding: 20,
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
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4 }}>
              {theater.name}
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text-primary)', letterSpacing: '0.08em' }}>
              {screen.name} · {displayRatioLabel} ({displayFormatName})
            </div>
          </div>

          <div style={{ width: '100%', maxWidth: 1000 }}>
            <AuditoriumView
              screenRatio={displayRatio}
              screenRatioLabel={displayRatioLabel}
              screenFormatName={displayFormatName}
              screenWidthM={screen?.screenWidthM}
              screenHeightM={screen?.screenHeightM}
              theaterName={theater.name}
              screenName={screen.name}
              isTrailerPlaying={true}
            />
          </div>
        </div>
      )}

      {/* ========== NORMAL SCREEN PAGE ========== */}
      <div className="page-enter" style={{ minHeight: '100vh', background: 'var(--bg-primary, #09090b)' }}>
        {/* ================= 1. TOP APP BAR (MATCHING SCREENSHOT) ================= */}
        <div style={{
          padding: '24px 20px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'linear-gradient(180deg, rgba(18,18,24,0.95) 0%, rgba(10,10,14,0.95) 100%)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          backdropFilter: 'blur(12px)',
        }}>
          <div className="container" style={{ maxWidth: 960 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              {/* Back Button & Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                <button
                  onClick={() => navigate(`/theater/${theaterId}`)}
                  className="btn btn-ghost btn-sm"
                  style={{
                    padding: 8,
                    borderRadius: '50%',
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-primary)',
                    flexShrink: 0,
                  }}
                  title={`Back to ${theater.name}`}
                >
                  <ArrowLeft size={16} />
                </button>

                <div style={{ minWidth: 0 }}>
                  <h1 style={{
                    fontSize: 'clamp(18px, 3.2vw, 24px)',
                    fontWeight: 800,
                    letterSpacing: '0.02em',
                    color: '#ffffff',
                    margin: 0,
                    lineHeight: 1.15,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {screen.name}
                  </h1>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginTop: 2,
                  }}>
                    {theater.name}
                    {theater.area ? `, ${theater.area}` : city ? `, ${city.name}` : ''}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => setIsExperience(true)}
                  className="btn btn-outline btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    borderRadius: 20,
                  }}
                  title="Fullscreen Cinema Experience"
                >
                  <Maximize2 size={13} />
                  <span className="hide-mobile">Experience</span>
                </button>

                <button
                  onClick={() => navigate('/compare')}
                  className="btn btn-ghost btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    borderRadius: 20,
                  }}
                  title="Compare with another screen"
                >
                  <GitCompare size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 2. MAIN 3D AUDITORIUM STAGE ================= */}
        <div style={{
          padding: '24px 20px 28px',
          background: 'radial-gradient(ellipse 70% 60% at 50% 30%, rgba(30,58,138,0.12) 0%, rgba(0,0,0,0) 80%)',
        }}>
          <div className="container" style={{ maxWidth: 960 }}>
            {/* The Realistic 3D Auditorium View */}
            <AuditoriumView
              screenRatio={displayRatio}
              screenRatioLabel={displayRatioLabel}
              screenFormatName={displayFormatName}
              screenWidthM={screen?.screenWidthM}
              screenHeightM={screen?.screenHeightM}
              theaterName={theater.name}
              screenName={screen.name}
            />
          </div>
        </div>

        {/* ================= 3. SEGMENTED TABS (MATCHING SCREENSHOT) ================= */}
        <div style={{
          padding: '0 20px 20px',
        }}>
          <div className="container" style={{ maxWidth: 960 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: 4,
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 30,
              border: '1px solid rgba(255,255,255,0.08)',
              maxWidth: 480,
              margin: '0 auto',
            }}>
              <button
                onClick={() => setActiveTab('details')}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  borderRadius: 24,
                  border: 'none',
                  background: activeTab === 'details' ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: activeTab === 'details' ? '#ffffff' : 'var(--text-muted)',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  boxShadow: activeTab === 'details' ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
                }}
              >
                Details
              </button>

              <button
                onClick={() => setActiveTab('simulator')}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  borderRadius: 24,
                  border: 'none',
                  background: activeTab === 'simulator' ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: activeTab === 'simulator' ? '#ffffff' : 'var(--text-muted)',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  boxShadow: activeTab === 'simulator' ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
                }}
              >
                Simulator
              </button>

              <button
                onClick={() => setActiveTab('reviews')}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  borderRadius: 24,
                  border: 'none',
                  background: activeTab === 'reviews' ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: activeTab === 'reviews' ? '#ffffff' : 'var(--text-muted)',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  boxShadow: activeTab === 'reviews' ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
                }}
              >
                Reviews {screenReviews.length > 0 ? `(${screenReviews.length})` : ''}
              </button>
            </div>
          </div>
        </div>

        {/* ================= TAB 1: DETAILS & TECH SPECS ================= */}
        {activeTab === 'details' && (
          <div style={{ padding: '0 20px 48px' }}>
            <div className="container" style={{ maxWidth: 960 }}>
              {/* Quick Stat Cards (matching screenshot: SEATS 364, SIZE 59.2ft x 31.3ft) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
                marginBottom: 28,
              }}>
                {/* Seats Card */}
                <div style={{
                  background: '#111218',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#38bdf8' }}>
                    <span style={{ fontSize: 16 }}>💺</span>
                    <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      SEATS
                    </span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em' }}>
                    {screen.capacity ? `${screen.capacity}` : '210'}
                  </div>
                </div>

                {/* Size Card */}
                <div style={{
                  background: '#111218',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#38bdf8' }}>
                    <Tv size={15} />
                    <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      SIZE
                    </span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em' }}>
                    {widthFt}ft × {heightFt}ft
                  </div>
                </div>

                {/* Sound System Card */}
                <div style={{
                  background: '#111218',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#38bdf8' }}>
                    <Speaker size={15} />
                    <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      SOUND SYSTEM
                    </span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {screen.soundSystem || 'Dolby Atmos'}
                  </div>
                </div>
              </div>

              {/* TECH SPECS Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 3, height: 18, background: '#38bdf8', borderRadius: 2 }} />
                <h2 style={{
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#ffffff',
                  margin: 0,
                }}>
                  TECH SPECS
                </h2>
              </div>

              {/* TECH SPECS Grid Cards (Matching User Screenshot Layout) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 12,
                marginBottom: 36,
              }}>
                {/* 1. Projection */}
                <div style={{
                  background: '#111218',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.07)',
                  padding: '16px 18px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <Film size={14} color="#38bdf8" />
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      PROJECTION
                    </span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                    {screen.projectorModel || screen.projection || 'Barco Laser'}
                  </div>
                </div>

                {/* 2. Resolution */}
                <div style={{
                  background: '#111218',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.07)',
                  padding: '16px 18px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <Tv size={14} color="#38bdf8" />
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      RESOLUTION
                    </span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                    {screen.resolution || '4K'}
                  </div>
                </div>

                {/* 3. Sound System */}
                <div style={{
                  background: '#111218',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.07)',
                  padding: '16px 18px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <Speaker size={14} color="#38bdf8" />
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      SOUND
                    </span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                    {screen.soundSystem || 'Dolby Atmos'}
                  </div>
                </div>

                {/* 4. Audio Channels */}
                <div style={{
                  background: '#111218',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.07)',
                  padding: '16px 18px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <Sliders size={14} color="#38bdf8" />
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      AUDIO CHANNELS
                    </span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                    {screen.speakerCount ? `${screen.speakerCount} Channel` : screen.dolbyAtmos ? '64 Channel (Atmos)' : '7.1 Surround'}
                  </div>
                </div>

                {/* 5. Aspect Ratio */}
                <div style={{
                  background: '#111218',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.07)',
                  padding: '16px 18px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <Layers size={14} color="#38bdf8" />
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      ASPECT RATIO
                    </span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                    {screen.aspectRatio} ({screen.formatName?.toUpperCase() || 'SCOPE'})
                  </div>
                </div>

                {/* 6. Screen Type */}
                <div style={{
                  background: '#111218',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.07)',
                  padding: '16px 18px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <Tv size={14} color="#38bdf8" />
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      SCREEN TYPE
                    </span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                    {screen.screenType || screen.screenMaterial || 'Curved Screen'}
                  </div>
                </div>

                {/* 7. Seating Type */}
                <div style={{
                  background: '#111218',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.07)',
                  padding: '16px 18px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <span style={{ fontSize: 13 }}>🪑</span>
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      SEATING TYPE
                    </span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                    {Array.isArray(screen.seatingType) ? screen.seatingType.join(', ') : 'Standard & Recliners'}
                  </div>
                </div>

                {/* 8. Data Source & Confidence */}
                <div style={{
                  background: '#111218',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.07)',
                  padding: '16px 18px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <CheckCircle2 size={14} color="#10b981" />
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      DATA VERIFICATION
                    </span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                    {screen.dataSource || 'TheatreBabu & Verified Reviews'}
                  </div>
                </div>
              </div>

              {/* Additional Technical Spec Breakdowns */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 28 }}>
                <TechnicalSpecs screen={screen} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
                  <ProjectionInfo screen={screen} />
                  <SoundInfo screen={screen} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: FORMAT SIMULATOR ================= */}
        {activeTab === 'simulator' && (
          <div style={{ padding: '0 20px 48px' }}>
            <div className="container" style={{ maxWidth: 960 }}>
              {/* Format selector */}
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  Select film aspect ratio to test fit & cropping
                </span>
                <div style={{ marginTop: 8 }}>
                  <FormatSelector
                    selectedRatio={displayRatioLabel}
                    onSelect={setSelectedFormat}
                  />
                </div>
              </div>

              {/* 2D Precise Simulator */}
              <div style={{ padding: '24px 0' }}>
                <ScreenSimulator
                  screenRatio={displayRatio}
                  screenRatioLabel={displayRatioLabel}
                  screenFormatName={displayFormatName}
                  screenWidthM={screen?.screenWidthM}
                  screenHeightM={screen?.screenHeightM}
                  mode={simMode}
                  onModeChange={setSimMode}
                />
              </div>

              {/* Format description box */}
              {selectedFormat && (
                <div style={{
                  padding: '16px 20px',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.03)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  marginTop: 20,
                }}>
                  <div style={{ padding: '4px 14px', border: '1px solid var(--border)', borderRadius: 6, flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--gold)' }}>{selectedFormat.ratio}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 4 }}>
                      {selectedFormat.fullName}
                    </div>
                    <p style={{ fontFamily: 'var(--font-italic)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                      {selectedFormat.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: SCREEN REVIEWS ================= */}
        {activeTab === 'reviews' && (
          <div style={{ padding: '0 20px 48px' }}>
            <div className="container" style={{ maxWidth: 960 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>
                    Audience & Expert Reviews
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                    Real projection, acoustics, and seat comfort reviews for {screen.name}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/theater/${theaterId}`)}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <MessageSquare size={13} />
                  Write Review
                </button>
              </div>

              {screenReviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {screenReviews.map((r) => (
                    <ReviewCard key={r.id} review={r} />
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  background: '#111218',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🎬</div>
                  <h3 style={{ fontSize: 16, color: '#fff', margin: '0 0 6px' }}>No screen-specific reviews yet</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 16px' }}>
                    Be the first to share your experience with {screen.name} regarding projection sharpness, Dolby Atmos punch, and seating comfort.
                  </p>
                  <button
                    onClick={() => navigate(`/theater/${theaterId}`)}
                    className="btn btn-outline btn-sm"
                  >
                    Rate & Review this Theater
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= 4. OTHER SCREENS IN THEATER ================= */}
        {theater.screens && theater.screens.length > 1 && (
          <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '32px 20px 48px', background: 'rgba(0,0,0,0.3)' }}>
            <div className="container" style={{ maxWidth: 960 }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>
                Other Screens in {theater.name}
              </h3>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {theater.screens.filter(s => s.id !== screenId).map(s => (
                  <Link
                    key={s.id}
                    to={`/theater/${theaterId}/screen/${s.id}`}
                    className="btn btn-ghost btn-sm"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      textDecoration: 'none',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '8px 14px',
                      borderRadius: 8,
                    }}
                  >
                    <span style={{ fontWeight: 700, color: '#ffffff' }}>{s.name}</span>
                    <span style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'monospace' }}>{s.aspectRatio}</span>
                    <ChevronRight size={12} style={{ opacity: 0.6 }} />
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

