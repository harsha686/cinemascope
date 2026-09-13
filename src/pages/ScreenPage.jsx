import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Maximize2, GitCompare, X, Star, MessageSquare } from 'lucide-react';
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
  const { getTheater, getScreen, getCity, getTheaterRating, getScreenReviews, dispatch, state } = useApp();

  const theater = getTheater(theaterId);
  const screen = getScreen(theaterId, screenId);
  const city = theater ? getCity(theater.cityId) : null;
  const theaterRating = useMemo(() => getTheaterRating ? getTheaterRating(theaterId) : { average: 0, count: 0 }, [getTheaterRating, theaterId]);
  const screenReviews = useMemo(() => getScreenReviews ? getScreenReviews(theaterId, screenId) : [], [getScreenReviews, theaterId, screenId]);


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
      {/* ========== CINEMA EXPERIENCE MODE (REALISTIC LAST-ROW AUDITORIUM) ========== */}
      {isExperience && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 250,
          background: '#030205',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          overflow: 'hidden',
        }}>
          {/* Subtle Ambient Auditorium Lighting & Glow from Screen */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 80% 50% at 50% 35%, rgba(201,168,76,0.08) 0%, rgba(5,3,8,0.95) 80%)',
            pointerEvents: 'none',
          }} />

          {/* Projector Light Beam Cone Haze */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60vw',
            height: '45vh',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(201,168,76,0.03) 60%, transparent 100%)',
            clipPath: 'polygon(45% 0%, 55% 0%, 100% 100%, 0% 100%)',
            filter: 'blur(10px)',
            pointerEvents: 'none',
            zIndex: 1,
          }} />

          {/* Top Bar: Controls & Exit */}
          <div style={{
            position: 'relative',
            zIndex: 10,
            width: '100%',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, transparent 100%)',
          }}>
            {/* Theatre & Screen Identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 10,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--gold)',
                background: 'rgba(201,168,76,0.12)',
                padding: '4px 10px',
                border: '1px solid rgba(201,168,76,0.25)',
                borderRadius: 20,
              }}>
                🍿 LAST ROW PERSPECTIVE
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13, letterSpacing: '0.04em' }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>{theater.name}</span> · {screen.name} ({displayRatioLabel})
              </div>
            </div>

            {/* Exit Button */}
            <button
              onClick={() => setIsExperience(false)}
              className="btn btn-ghost btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
              }}
            >
              <X size={14} /> Exit Experience
            </button>
          </div>

          {/* Central Area: Massive Screen in Auditorium */}
          <div style={{
            position: 'relative',
            zIndex: 3,
            width: '100%',
            maxWidth: 1180,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '0 20px',
          }}>
            {/* Format selector inside experience */}
            <div style={{ marginBottom: 16 }}>
              <FormatSelector
                selectedRatio={displayRatioLabel}
                onSelect={setSelectedFormat}
              />
            </div>

            {/* The Big Projected Screen Simulator */}
            <div style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              position: 'relative',
            }}>
              <ScreenSimulator
                screenRatio={displayRatio}
                screenRatioLabel={displayRatioLabel}
                screenFormatName={displayFormatName}
                screenWidthM={screen?.screenWidthM}
                screenHeightM={screen?.screenHeightM}
                mode={simMode}
                onModeChange={setSimMode}
                isExperience={true}
              />
            </div>
          </div>

          {/* Bottom Foreground Cinema Auditorium Seats */}
          <div style={{
            position: 'relative',
            width: '100%',
            zIndex: 4,
            pointerEvents: 'none',
            marginTop: -50,
          }}>
            {/* Gradient shadow separating seats from floor */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 120,
              background: 'linear-gradient(0deg, #020104 0%, rgba(2,1,4,0.95) 45%, transparent 100%)',
              pointerEvents: 'none',
            }} />

            {/* Detailed Realistic Velvet Cinema Seat Backs Silhouette with Screen Glow Reflections */}
            <svg
              viewBox="0 0 1440 180"
              preserveAspectRatio="none"
              style={{
                width: '100%',
                height: '140px',
                display: 'block',
                filter: 'drop-shadow(0 -8px 24px rgba(0,0,0,0.9))',
              }}
            >
              <defs>
                {/* Velvet seat lighting gradient */}
                <linearGradient id="seatGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3d151c" />
                  <stop offset="25%" stopColor="#240c12" />
                  <stop offset="100%" stopColor="#080305" />
                </linearGradient>
                <linearGradient id="seatHighlight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,200,120,0.25)" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>

              {/* Row 2 (Mid-distance seats) */}
              <g opacity="0.6" transform="translate(0, 10)">
                {Array.from({ length: 14 }).map((_, i) => {
                  const x = i * 105 + 15;
                  return (
                    <g key={`mid-${i}`}>
                      <rect x={x} y={35} width={75} height={60} rx={10} fill="#14060a" stroke="#2a0e14" strokeWidth="1" />
                      <rect x={x + 10} y={28} width={55} height={20} rx={8} fill="#1d0a10" />
                    </g>
                  );
                })}
              </g>

              {/* Central Aisle Guide Glow */}
              <polygon points="660,180 780,180 740,60 700,60" fill="rgba(201,168,76,0.025)" />

              {/* Row 1 (Immediate Foreground / Last Row Viewer Seats) */}
              {Array.from({ length: 10 }).map((_, i) => {
                const x = i * 150 + 8;
                // Leave a gap for the center aisle
                if (i === 4 || i === 5) {
                  return (
                    <g key={`front-${i}`}>
                      <rect x={x + (i === 4 ? -15 : 15)} y={55} width={105} height={125} rx={14} fill="url(#seatGradient)" stroke="#451821" strokeWidth="1.5" />
                      {/* Headrest */}
                      <rect x={x + (i === 4 ? -5 : 25)} y={42} width={85} height={32} rx={10} fill="url(#seatGradient)" stroke="#521f2a" strokeWidth="1" />
                      {/* Headrest Top Rim Screen Reflection */}
                      <path d={`M${x + (i === 4 ? -3 : 27)},44 Q${x + (i === 4 ? 37 : 67)},41 ${x + (i === 4 ? 77 : 107)},44`} stroke="url(#seatHighlight)" strokeWidth="2.5" fill="none" />
                    </g>
                  );
                }
                return (
                  <g key={`front-${i}`}>
                    <rect x={x} y={55} width={115} height={125} rx={14} fill="url(#seatGradient)" stroke="#38131b" strokeWidth="1.5" />
                    {/* Headrest */}
                    <rect x={x + 10} y={42} width={95} height={32} rx={10} fill="url(#seatGradient)" stroke="#451821" strokeWidth="1" />
                    {/* Top Rim Screen Glow Reflection */}
                    <path d={`M${x + 12},44 Q${x + 57},41 ${x + 102},44`} stroke="url(#seatHighlight)" strokeWidth="2.5" fill="none" />
                  </g>
                );
              })}
            </svg>
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
                  <Link
                    to={`/theater/${theaterId}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      textDecoration: 'none',
                      padding: '3px 9px',
                      background: 'rgba(201,168,76,0.1)',
                      border: '1px solid var(--gold-dim)',
                      borderRadius: 20,
                    }}
                  >
                    <Star size={11} fill="var(--gold)" color="var(--gold)" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-serif)' }}>
                      {theaterRating.average > 0 ? theaterRating.average : 'Rate'}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {screenReviews.length > 0 ? `(${screenReviews.length} screen review${screenReviews.length !== 1 ? 's' : ''})` : `(${theaterRating.count})`}
                    </span>
                  </Link>
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
                  onClick={() => navigate(`/theater/${theaterId}`)}
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <MessageSquare size={14} />
                  Reviews
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
              screenWidthM={screen?.screenWidthM}
              screenHeightM={screen?.screenHeightM}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 32 }}>
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
