import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Search, Navigation, ChevronRight, Monitor, Film, Star, MessageSquare } from 'lucide-react';
import { useApp } from '../AppContext';
import DustParticles from '../components/shared/DustParticles';
import FormatSelector from '../components/simulator/FormatSelector';
import ScreenSimulator from '../components/simulator/ScreenSimulator';
import MovieCard from '../components/movies/MovieCard';
import StarRating from '../components/reviews/StarRating';
import WeekendRecommendationHero from '../components/weekend/WeekendRecommendationHero';
import SectionHeader from '../components/shared/SectionHeader';
import EmptyState from '../components/shared/EmptyState';
import { ASPECT_RATIOS } from '../data/formats';

const STEPS = [
  { num: '01', label: 'Choose your city & browse movies', icon: MapPin },
  { num: '02', label: 'Explore theater screens & specs', icon: Monitor },
  { num: '03', label: 'Simulate aspect ratios in real time', icon: Film },
  { num: '04', label: 'Read & share community reviews', icon: MessageSquare },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { allCities, getCityMovies, getMovieRating, state, dispatch } = useApp();
  const [citySearch, setCitySearch] = useState('');
  const [showCityList, setShowCityList] = useState(false);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [selectedFormat, setSelectedFormat] = useState(ASPECT_RATIOS.find(r => r.ratio === '2.39:1'));
  const [simMode, setSimMode] = useState('fit');
  const searchRef = useRef(null);

  const activeCity = state.selectedCity || allCities[0];

  const currentMovies = useMemo(() => getCityMovies(activeCity?.id, 'CURRENTLY_SHOWING'), [getCityMovies, activeCity]);
  const comingSoonMovies = useMemo(() => getCityMovies(activeCity?.id, 'COMING_SOON'), [getCityMovies, activeCity]);

  const topRatedMovies = useMemo(() => {
    return [...state.movies]
      .map(m => {
        const rating = getMovieRating(m.id);
        return { ...m, ratingAverage: rating.average, ratingCount: rating.count };
      })
      .filter(m => m.ratingCount > 0)
      .sort((a, b) => b.ratingAverage - a.ratingAverage)
      .slice(0, 4);
  }, [state.movies, getMovieRating]);

  const recentReviews = useMemo(() => {
    return [...state.reviews]
      .filter(r => r.status === 'PUBLISHED')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);
  }, [state.reviews]);

  const filteredCities = allCities.filter(c =>
    c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
    (c.alias || []).some(a => a.toLowerCase().includes(citySearch.toLowerCase()))
  );

  const handleCitySelect = (city) => {
    dispatch({ type: 'SET_CITY', payload: city });
    setShowCityList(false);
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) { setLocationStatus('error'); return; }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        dispatch({ type: 'SET_USER_LOCATION', payload: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
        dispatch({ type: 'SET_LOCATION_PERMISSION', payload: 'granted' });
        setLocationStatus('idle');
        dispatch({ type: 'SET_CITY', payload: allCities[0] });
      },
      () => {
        setLocationStatus('error');
        dispatch({ type: 'SET_LOCATION_PERMISSION', payload: 'denied' });
      },
      { timeout: 8000 }
    );
  };

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowCityList(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="page-enter" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse 80% 50% at 50% 20%, rgba(220,182,91,0.05) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 50% 80%, rgba(139,94,26,0.06) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />
      <DustParticles />
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', boxShadow: 'inset 0 0 200px 80px rgba(0,0,0,0.75)' }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>

        {/* ========== HERO ========== */}
        <section style={{
          minHeight: '85vh',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 'clamp(48px, 8vw, 80px) 24px clamp(32px, 5vw, 48px)',
          textAlign: 'center',
        }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ height: 1, width: 36, background: 'var(--gold-dim)' }} />
            <span style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600 }}>
              Cinema Discovery & Review Platform
            </span>
            <div style={{ height: 1, width: 36, background: 'var(--gold-dim)' }} />
          </div>

          <h1 style={{
            fontSize: 'clamp(30px, 6.5vw, 78px)',
            color: 'var(--text-primary)',
            letterSpacing: '0.04em',
            lineHeight: 1.08,
            marginBottom: 18,
            maxWidth: 960,
            fontWeight: 700,
          }}>
            EXPLORE MOVIES.<br />
            <span style={{ color: 'var(--gold)' }}>EXPERIENCE THE SCREEN.</span><br />
            SHARE YOUR VOICE.
          </h1>

          <p style={{
            fontSize: 'clamp(14px, 1.8vw, 18px)',
            color: 'var(--text-secondary)',
            maxWidth: 600,
            lineHeight: 1.8,
            marginBottom: 40,
          }}>
            Discover current movies in <strong style={{ color: 'var(--gold)', fontWeight: 600 }}>{activeCity?.name}</strong>, inspect screen aspect ratios, projection tech, and read authentic community reviews.
          </p>

          {/* City Search */}
          <div ref={searchRef} style={{ width: '100%', maxWidth: 480, position: 'relative', marginBottom: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={handleGeolocate}
                disabled={locationStatus === 'loading'}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center', gap: 10 }}
              >
                {locationStatus === 'loading' ? (
                  <><div className="loading-spinner" style={{ width: 16, height: 16 }} /> Locating...</>
                ) : locationStatus === 'error' ? (
                  <><Navigation size={16} /> Explore Movies in {activeCity?.name}</>
                ) : (
                  <><Navigation size={16} /> Explore Movies in {activeCity?.name}</>
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.15em', fontWeight: 600 }}>CHANGE CITY</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
              </div>

              <div style={{ position: 'relative' }}>
                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  className="input"
                  style={{ paddingLeft: 38 }}
                  placeholder="Search city (e.g. Visakhapatnam, Hyderabad)..."
                  value={citySearch}
                  onChange={e => { setCitySearch(e.target.value); setShowCityList(true); }}
                  onFocus={() => setShowCityList(true)}
                  aria-label="Search and select a city"
                  aria-autocomplete="list"
                  aria-expanded={showCityList}
                />
              </div>
            </div>

            {/* City Dropdown */}
            {showCityList && filteredCities.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                background: 'var(--bg-card)', border: '1px solid var(--border)', zIndex: 50,
                maxHeight: 220, overflowY: 'auto', boxShadow: 'var(--shadow-gold)',
                borderRadius: 'var(--radius-sm)',
              }}>
                {filteredCities.map(city => (
                  <button
                    key={city.id}
                    onClick={() => handleCitySelect(city)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '12px 16px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: activeCity?.id === city.id ? 'var(--gold-faint)' : 'none',
                      border: 'none', cursor: 'pointer',
                      borderBottom: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={e => { if (activeCity?.id !== city.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { if (activeCity?.id !== city.id) e.currentTarget.style.background = 'none'; }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{city.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{city.state}</div>
                    </div>
                    {activeCity?.id === city.id && (
                      <span style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 600 }}>Selected</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* City Chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
            {allCities.map(city => (
              <button
                key={city.id}
                onClick={() => handleCitySelect(city)}
                className={`btn btn-sm ${activeCity?.id === city.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: 11 }}
              >
                {city.name}
              </button>
            ))}
          </div>
        </section>

        {/* ========== WEEKEND COMMUNITY RECOMMENDATION ========== */}
        <div className="container">
          <WeekendRecommendationHero />
        </div>

        {/* ========== CURRENT MOVIES SECTION ========== */}
        <section style={{ padding: '48px 24px 72px', borderTop: '1px solid var(--border-subtle)' }}>
          <div className="container">
            <SectionHeader
              eyebrow={`${activeCity?.name} Catalog`}
              title="Currently Showing Movies"
              action={{
                label: 'View Full Catalog →',
                to: '/movies',
                onClick: () => navigate('/movies'),
              }}
            />
            {currentMovies.length === 0 ? (
              <EmptyState
                icon={Film}
                title={`No movies listed for ${activeCity?.name} right now`}
                subtitle="Select another city above or log in as Admin to assign movies to this city."
                action={{ label: 'Explore All Movies', to: '/discover' }}
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
                {currentMovies.map(movie => <MovieCard key={movie.id} movie={movie} />)}
              </div>
            )}
          </div>
        </section>

        {/* ========== COMING SOON ========== */}
        {comingSoonMovies.length > 0 && (
          <section style={{ padding: '48px 24px 64px', background: 'rgba(0,0,0,0.25)', borderTop: '1px solid var(--border-subtle)' }}>
            <div className="container">
              <SectionHeader eyebrow="Upcoming Theatrical Releases" title="Coming Soon" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 18 }}>
                {comingSoonMovies.map(movie => <MovieCard key={movie.id} movie={movie} />)}
              </div>
            </div>
          </section>
        )}

        {/* ========== TOP RATED BY USERS ========== */}
        {topRatedMovies.length > 0 && (
          <section style={{ padding: '48px 24px 64px', borderTop: '1px solid var(--border-subtle)' }}>
            <div className="container">
              <SectionHeader eyebrow="Community Favorites" title="Top Rated by Moviegoers" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 18 }}>
                {topRatedMovies.map(movie => <MovieCard key={movie.id} movie={movie} />)}
              </div>
            </div>
          </section>
        )}

        {/* ========== RECENT USER REVIEWS ========== */}
        {recentReviews.length > 0 && (
          <section style={{ padding: '48px 24px 64px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="container">
              <SectionHeader
                eyebrow="Community Feedback"
                title="Recent Reviews"
                action={{
                  label: 'Discover & Review →',
                  to: '/discover',
                  onClick: () => navigate('/discover'),
                }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
                {recentReviews.map(rev => {
                  const targetM = state.movies.find(m => m.id === rev.movieId);
                  return (
                    <div
                      key={rev.id}
                      className="card"
                      style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10, borderRadius: 'var(--radius-sm)' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <Link
                          to={`/movie/${rev.movieId}`}
                          style={{ fontSize: 14, color: 'var(--gold)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'opacity var(--transition-fast)' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          {targetM?.title || rev.movieId}
                        </Link>
                        <StarRating rating={rev.rating} readOnly size={12} />
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        "{rev.reviewText}"
                      </p>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>— {rev.userDisplayName}</span>
                        <Link to={`/movie/${rev.movieId}`} style={{ color: 'var(--gold)', transition: 'opacity var(--transition-fast)' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >Read →</Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ========== HOW IT WORKS ========== */}
        <section style={{ padding: '72px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="container">
            <SectionHeader eyebrow="Platform Journey" title="Cinema Discovery + Technical Excellence" align="center" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, background: 'var(--border-subtle)', border: '1px solid var(--border-subtle)' }}>
              {STEPS.map((step) => (
                <div key={step.num} style={{ background: 'var(--bg-card)', padding: '28px 22px', transition: 'background var(--transition-fast)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
                >
                  <div style={{ fontSize: 32, color: 'rgba(220,182,91,0.15)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: 10 }}>{step.num}</div>
                  <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.55 }}>{step.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== ASPECT RATIO SIMULATOR PREVIEW ========== */}
        <section style={{ padding: '72px 24px' }}>
          <div className="container" style={{ maxWidth: 900 }}>
            <SectionHeader
              eyebrow="Technical Cinema Engine"
              title="Simulate Screen Ratios"
              subtitle="Select a format to see how real movie content fills or crops on different theater screens"
              align="center"
            />
            <FormatSelector
              selectedRatio={selectedFormat?.ratio}
              onSelect={setSelectedFormat}
              availableRatios={['1.43:1', '1.90:1', '1.85:1', '2.39:1', '2.20:1', '1.78:1']}
            />
            <div style={{ marginTop: 24 }}>
              <ScreenSimulator
                screenRatio={selectedFormat?.numeric || 2.39}
                screenRatioLabel={selectedFormat?.ratio || '2.39:1'}
                screenFormatName={selectedFormat?.name || 'Scope'}
                mode={simMode}
                onModeChange={setSimMode}
              />
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
