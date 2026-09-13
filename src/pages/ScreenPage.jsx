import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MoreVertical,
  Maximize2,
  GitCompare,
  Star,
  MessageSquare,
  Share2,
  ChevronRight,
  Tv,
  Volume2,
  Projector,
  Armchair,
  CheckCircle,
  Pencil,
  X,
  Play,
  Film,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../AppContext';
import AuditoriumView from '../components/simulator/AuditoriumView';
import ScreenSimulator from '../components/simulator/ScreenSimulator';
import FormatSelector from '../components/simulator/FormatSelector';
import ReviewCard from '../components/reviews/ReviewCard';
import ReviewComposer from '../components/reviews/ReviewComposer';
import { ASPECT_RATIOS, getFormat } from '../data/formats';

export default function ScreenPage() {
  const { theaterId, screenId } = useParams();
  const navigate = useNavigate();
  const {
    getTheater,
    getScreen,
    getCity,
    getTheaterRating,
    getScreenReviews,
    state,
  } = useApp();

  const theater = getTheater(theaterId);
  const screen = getScreen(theaterId, screenId);
  const city = theater ? getCity(theater.cityId) : null;
  const theaterRating = useMemo(() => (getTheaterRating ? getTheaterRating(theaterId) : { average: 0, count: 0 }), [getTheaterRating, theaterId]);
  const screenReviews = useMemo(() => (getScreenReviews ? getScreenReviews(theaterId, screenId) : []), [getScreenReviews, theaterId, screenId]);

  // View mode: 'auditorium' (Image 2 style) or 'simulator' (Image 1 style)
  const [viewMode, setViewMode] = useState('auditorium');
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'reviews' | 'logs'
  const [simMode, setSimMode] = useState('fit'); // 'fit' | 'crop'
  const [showOptions, setShowOptions] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [showReviewComposer, setShowReviewComposer] = useState(false);

  const [selectedFormat, setSelectedFormat] = useState(
    screen ? getFormat(screen.aspectRatio) || ASPECT_RATIOS.find(r => r.ratio === '1.89:1' || r.ratio === '1.85:1' || r.ratio === '2.39:1') : null
  );

  if (!theater || !screen) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>Screen Not Found</h1>
        <button onClick={() => navigate('/')} className="btn btn-outline" style={{ marginTop: 24 }}>← Back Home</button>
      </div>
    );
  }

  // Dimension Calculations in Feet
  const hasPhysical = Boolean(screen.screenWidthM && Number(screen.screenWidthM) > 0);
  const widthFt = hasPhysical
    ? (Number(screen.screenWidthM) * 3.28084).toFixed(1)
    : (20 * (screen.aspectRatioNumeric || 1.89)).toFixed(1);
  const heightFt = hasPhysical
    ? (screen.screenHeightM ? (Number(screen.screenHeightM) * 3.28084).toFixed(1) : ((Number(screen.screenWidthM) / (screen.aspectRatioNumeric || 1.89)) * 3.28084).toFixed(1))
    : (20).toFixed(1);

  const displayRatio = selectedFormat?.numeric || screen.aspectRatioNumeric || 1.89;
  const displayRatioLabel = selectedFormat?.ratio || screen.aspectRatio || '1.89:1';
  const displayFormatName = selectedFormat?.name || screen.formatName || 'FLAT';

  // Subtitle matching Image 2: "PRASADS MULTIPLEX, KHAIRATABAD"
  const headerSubtitle = `${theater.name}, ${theater.area || city?.name || ''}`.toUpperCase();

  // Mock cinema screening logs
  const screenLogs = [
    { id: 'log-1', movieTitle: 'Dune: Part Two', format: screen.aspectRatio, date: 'Mar 2024', user: 'CinemaScope Auditor', note: 'Flawless 1.89:1 projection with reference-grade Atmos sound.' },
    { id: 'log-2', movieTitle: 'Oppenheimer', format: screen.aspectRatio, date: 'Jul 2023', user: 'Harsha K.', note: 'Incredible black levels and powerful sound separation.' },
    { id: 'log-3', movieTitle: 'Avatar: The Way of Water', format: screen.aspectRatio, date: 'Dec 2022', user: 'VizagCinephile', note: 'High frame rate presentation looked remarkably sharp.' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#04070b',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: 90,
    }}>
      {/* ================= 1. HEADER BAR (MATCHING IMAGE 2) ================= */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(4, 7, 11, 0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        {/* Left: Back Button & Screen Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => navigate(`/theater/${theaterId}`)}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 150ms ease',
            }}
            aria-label="Back to theater"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h1 style={{
              fontSize: 'clamp(18px, 4vw, 22px)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              margin: 0,
              lineHeight: 1.2,
              color: '#ffffff',
            }}>
              {screen.name}
            </h1>
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: '#94a3b8',
              marginTop: 2,
            }}>
              {headerSubtitle}
            </div>
          </div>
        </div>

        {/* Right: Options Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowOptions(!showOptions)}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: showOptions ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.06)',
              border: showOptions ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            aria-label="More options"
          >
            <MoreVertical size={18} />
          </button>

          {showOptions && (
            <div
              style={{
                position: 'absolute',
                top: 46,
                right: 0,
                width: 210,
                background: '#0d131d',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12,
                padding: '6px 0',
                boxShadow: '0 12px 30px rgba(0,0,0,0.8)',
                zIndex: 60,
              }}
              onMouseLeave={() => setShowOptions(false)}
            >
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  alert('Screen link copied to clipboard!');
                  setShowOptions(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#e2e8f0',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Share2 size={15} color="#38bdf8" /> Share Screen
              </button>
              <button
                onClick={() => {
                  navigate('/compare');
                  setShowOptions(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#e2e8f0',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <GitCompare size={15} color="#38bdf8" /> Compare with Other Screens
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ================= 2. HERO SECTION (AUDITORIUM / SIMULATOR TOGGLE) ================= */}
      <main style={{ maxWidth: 840, margin: '0 auto', padding: '16px 16px 0' }}>
        {/* View Switcher: Auditorium vs Aspect Simulator */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 14,
        }}>
          <div style={{
            display: 'inline-flex',
            background: 'rgba(15, 23, 42, 0.7)',
            padding: 3,
            borderRadius: 24,
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <button
              onClick={() => setViewMode('auditorium')}
              style={{
                padding: '6px 18px',
                borderRadius: 20,
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                border: 'none',
                background: viewMode === 'auditorium' ? '#0284c7' : 'transparent',
                color: viewMode === 'auditorium' ? '#ffffff' : '#94a3b8',
                transition: 'all 150ms ease',
              }}
            >
              🏛️ Auditorium View
            </button>
            <button
              onClick={() => setViewMode('simulator')}
              style={{
                padding: '6px 18px',
                borderRadius: 20,
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                border: 'none',
                background: viewMode === 'simulator' ? '#f59e0b' : 'transparent',
                color: viewMode === 'simulator' ? '#000000' : '#94a3b8',
                transition: 'all 150ms ease',
              }}
            >
              📐 Aspect Simulator
            </button>
          </div>
        </div>

        {/* Dynamic Hero View */}
        {viewMode === 'auditorium' ? (
          /* 3D Auditorium View (Matching Image 2) */
          <AuditoriumView
            screenWidthFt={widthFt}
            screenHeightFt={heightFt}
            aspectRatio={displayRatioLabel}
            formatName={displayFormatName}
            onOpenTrailers={() => setShowTrailerModal(true)}
          />
        ) : (
          /* Aspect Ratio Simulator View (Matching Image 1) */
          <div style={{
            background: 'rgba(12, 16, 24, 0.7)',
            padding: '24px 16px',
            borderRadius: 16,
            border: '1px solid rgba(245, 158, 11, 0.25)',
          }}>
            <div style={{ marginBottom: 14 }}>
              <FormatSelector
                selectedRatio={displayRatioLabel}
                onSelect={setSelectedFormat}
              />
            </div>
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
        )}

        {/* ================= 3. NAVIGATION TABS (MATCHING IMAGE 2) ================= */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          margin: '22px 0 16px',
          overflowX: 'auto',
          paddingBottom: 4,
        }}>
          {[
            { id: 'details', label: 'Details' },
            { id: 'reviews', label: `Reviews (${screenReviews.length || 31})` },
            { id: 'logs', label: 'Logs (569)' },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 22px',
                  borderRadius: 24,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isActive ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                  background: isActive ? '#1c2433' : 'transparent',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  transition: 'all 150ms ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ================= 4. TAB CONTENTS ================= */}
        {activeTab === 'details' && (
          <div>
            {/* Quick Stat Cards: Seats & Size (Matching Image 2) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12,
              marginBottom: 24,
            }}>
              {/* Card 1: Seats */}
              <div style={{
                background: '#0d131f',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14,
                padding: '16px 18px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  color: '#38bdf8',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}>
                  <Armchair size={15} color="#38bdf8" />
                  <span>SEATS</span>
                </div>
                <div style={{
                  fontSize: 'clamp(22px, 4.5vw, 30px)',
                  fontWeight: 800,
                  color: '#ffffff',
                  lineHeight: 1.1,
                }}>
                  {screen.capacity || 364}
                </div>
              </div>

              {/* Card 2: Size */}
              <div style={{
                background: '#0d131f',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14,
                padding: '16px 18px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  color: '#38bdf8',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}>
                  <Maximize2 size={15} color="#38bdf8" />
                  <span>SIZE</span>
                </div>
                <div style={{
                  fontSize: 'clamp(18px, 3.8vw, 24px)',
                  fontWeight: 800,
                  color: '#ffffff',
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                }}>
                  {widthFt}ft x {heightFt}ft
                </div>
              </div>
            </div>

            {/* TECH SPECS Section (Matching Image 2) */}
            <div style={{ marginBottom: 28 }}>
              {/* Section Header with Blue Vertical Indicator */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 14,
              }}>
                <div style={{
                  width: 3.5,
                  height: 18,
                  borderRadius: 2,
                  background: '#0284c7',
                }} />
                <h2 style={{
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: '#ffffff',
                  margin: 0,
                }}>
                  TECH SPECS
                </h2>
              </div>

              {/* 2-Column Grid of Tech Spec Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
              }}>
                {/* 1. Projection */}
                <div style={{
                  background: '#0d131f',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  padding: '14px 16px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    color: '#38bdf8',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}>
                    <Projector size={13} color="#38bdf8" />
                    <span>PROJECTION</span>
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#f8fafc', lineHeight: 1.3 }}>
                    {screen.projectorBrand
                      ? `${screen.projectorBrand} ${screen.projectorModel || ''}`
                      : screen.projection || 'Barco LS4K-20 HDR'}
                  </div>
                </div>

                {/* 2. Resolution */}
                <div style={{
                  background: '#0d131f',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  padding: '14px 16px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    color: '#38bdf8',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}>
                    <Tv size={13} color="#38bdf8" />
                    <span>RESOLUTION</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', lineHeight: 1.3 }}>
                    {screen.resolution?.includes('4K') || screen.resolution?.includes('4096') ? '4K' : screen.resolution || '4K'}
                  </div>
                </div>

                {/* 3. Sound */}
                <div style={{
                  background: '#0d131f',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  padding: '14px 16px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    color: '#38bdf8',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}>
                    <Volume2 size={13} color="#38bdf8" />
                    <span>SOUND</span>
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#f8fafc', lineHeight: 1.3 }}>
                    {screen.soundSystem || 'Dolby Atmos'}
                  </div>
                </div>

                {/* 4. Audio Channels */}
                <div style={{
                  background: '#0d131f',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  padding: '14px 16px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    color: '#38bdf8',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}>
                    <Volume2 size={13} color="#38bdf8" />
                    <span>AUDIO CHANNELS</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', lineHeight: 1.3 }}>
                    {screen.speakerCount ? `${screen.speakerCount} Channel` : '40 Channel'}
                  </div>
                </div>

                {/* 5. Aspect Ratio */}
                <div style={{
                  background: '#0d131f',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  padding: '14px 16px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    color: '#38bdf8',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}>
                    <Maximize2 size={13} color="#38bdf8" />
                    <span>ASPECT RATIO</span>
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#f8fafc', lineHeight: 1.3 }}>
                    {screen.aspectRatio} ({screen.formatName?.toUpperCase() || 'FLAT'})
                  </div>
                </div>

                {/* 6. Screen Type */}
                <div style={{
                  background: '#0d131f',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  padding: '14px 16px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    color: '#38bdf8',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}>
                    <Tv size={13} color="#38bdf8" />
                    <span>SCREEN TYPE</span>
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#f8fafc', lineHeight: 1.3 }}>
                    {screen.screenType || 'Curved Screen'}
                  </div>
                </div>
              </div>
            </div>

            {/* Other Screens in this Theater */}
            {theater.screens && theater.screens.length > 1 && (
              <div style={{
                marginTop: 24,
                padding: '20px 0',
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  marginBottom: 12,
                }}>
                  Other Screens at {theater.name}
                </div>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
                  {theater.screens.filter(s => s.id !== screenId).map(s => (
                    <Link
                      key={s.id}
                      to={`/theater/${theaterId}/screen/${s.id}`}
                      style={{
                        padding: '10px 16px',
                        background: '#0d131f',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10,
                        textDecoration: 'none',
                        color: '#ffffff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span>{s.name}</span>
                      <span style={{ color: '#38bdf8', fontSize: 11 }}>{s.aspectRatio}</span>
                      <ChevronRight size={12} color="#64748b" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= REVIEWS TAB ================= */}
        {activeTab === 'reviews' && (
          <div style={{ padding: '8px 0 32px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: '#fff' }}>
                  Screen Experience Reviews
                </h3>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  Audience feedback for picture, sound, and seat comfort
                </div>
              </div>
              <button
                onClick={() => setShowReviewComposer(!showReviewComposer)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  background: '#0284c7',
                  border: 'none',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Pencil size={13} /> Write Review
              </button>
            </div>

            {showReviewComposer && (
              <div style={{ marginBottom: 20 }}>
                <ReviewComposer
                  theaterId={theaterId}
                  screenId={screenId}
                  onComplete={() => setShowReviewComposer(false)}
                />
              </div>
            )}

            {screenReviews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {screenReviews.map(r => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            ) : (
              <div style={{
                padding: '36px 20px',
                textAlign: 'center',
                background: '#0d131f',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <MessageSquare size={28} color="#38bdf8" style={{ marginBottom: 10, opacity: 0.8 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
                  No screen-specific reviews yet
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', maxWidth: 320, margin: '0 auto 16px' }}>
                  Be the first to review the projection, acoustics, and seating at {screen.name}!
                </div>
                <button
                  onClick={() => setShowReviewComposer(true)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 20,
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#38bdf8',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Write the First Review
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= LOGS TAB ================= */}
        {activeTab === 'logs' && (
          <div style={{ padding: '8px 0 32px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: '#fff' }}>
                  Screening Logs ({screenLogs.length})
                </h3>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  Films presented and verified on this auditorium
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {screenLogs.map(log => (
                <div
                  key={log.id}
                  style={{
                    background: '#0d131f',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 14,
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14.5, fontWeight: 800, color: '#f8fafc' }}>{log.movieTitle}</span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 12,
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                    }}>
                      {log.format}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#cbd5e1', fontStyle: 'italic', margin: '4px 0' }}>
                    “{log.note}”
                  </div>
                  <div style={{ fontSize: 10.5, color: '#64748b' }}>
                    Logged by {log.user} · {log.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ================= 5. FLOATING BLUE ACTION BUTTON (MATCHING IMAGE 2) ================= */}
      <button
        onClick={() => {
          if (activeTab !== 'reviews') setActiveTab('reviews');
          setShowReviewComposer(true);
        }}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 20,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 8px 24px rgba(2, 132, 199, 0.45), 0 2px 6px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 90,
          transition: 'transform 150ms ease, box-shadow 150ms ease',
        }}
        title="Write Screen Review / Log"
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <Pencil size={22} color="#ffffff" />
      </button>

      {/* ================= 6. TRAILER MODAL ================= */}
      {showTrailerModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: 720,
            background: '#0d131f',
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.9)',
          }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: '#38bdf8' }}>
                <Film size={16} />
                <span>{screen.name} · Cinema Trailer Preview</span>
              </div>
              <button
                onClick={() => setShowTrailerModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ aspectRatio: '16 / 9', background: '#000', width: '100%' }}>
              <video
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                controls
                autoPlay
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
