import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Search, Navigation, ChevronRight, Monitor, Film, Star, MessageSquare, Sparkles } from 'lucide-react';
import { useApp } from '../AppContext';
import DustParticles from '../components/shared/DustParticles';
import FormatSelector from '../components/simulator/FormatSelector';
import ScreenSimulator from '../components/simulator/ScreenSimulator';
import MovieCard from '../components/movies/MovieCard';
import StarRating from '../components/reviews/StarRating';
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

  // Currently showing movies in active city
  const currentMovies = useMemo(() => {
    return getCityMovies(activeCity?.id, 'CURRENTLY_SHOWING');
  }, [getCityMovies, activeCity]);

  // Coming soon movies
  const comingSoonMovies = useMemo(() => {
    return getCityMovies(activeCity?.id, 'COMING_SOON');
  }, [getCityMovies, activeCity]);

  // Top rated movies (calculated dynamically from reviews)
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

  // Recent published reviews
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
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }
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
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
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
        <section style={{ minHeight: '88vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px 48px', textAlign: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ height: 1, width: 40, background: 'var(--gold-dim)' }} />
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)' }}>
              Cinema Discovery & Review Platform
            </span>
            <div style={{ height: 1, width: 40, background: 'var(--gold-dim)' }} />
          </div>

          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(34px, 7vw, 84px)', color: 'var(--text-primary)', letterSpacing: '0.04em', lineHeight: 1.08, marginBottom: 20, maxWidth: 960 }}>
            EXPLORE MOVIES.<br />
            <span style={{ color: 'var(--gold)' }}>UNDERSTAND THE SCREEN.</span><br />
            SHARE YOUR OPINION.
          </h1>
          
          <p style={{ fontFamily: 'var(--font-italic)', fontSize: 'clamp(15px, 2vw, 20px)', color: 'var(--text-secondary)', maxWidth: 640, lineHeight: 1.8, marginBottom: 44 }}>
            Discover current movies in <strong style={{ color: 'var(--gold)', fontStyle: 'normal' }}>{activeCity?.name}</strong>, inspect screen aspect ratios, projection tech, and read authentic community reviews.
          </p>

          {/* City Location Search Selector */}
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
                ) : (
                  <><Navigation size={16} /> Explore Movies in {activeCity?.name}</>
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', letterSpacing: '0.15em' }}>CHANGE CITY</span>
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
                  aria-label="Search city"
                />
              </div>
            </div>

            {/* City Dropdown */}
            {showCityList && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                background: 'var(--bg-card)', border: '1px solid var(--border)', zIndex: 50,
                maxHeight: 220, overflowY: 'auto', boxShadow: 'var(--shadow-gold)',
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
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14 }}>{city.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{city.state}</div>
                    </div>
                    {activeCity?.id === city.id && (
                      <span style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'var(--font-serif)' }}>Selected</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* City Chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 16 }}>
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

        {/* ========== CURRENT MOVIES SECTION ========== */}
        <section style={{ padding: '60px 24px 80px', borderTop: '1px solid var(--border-subtle)' }}>
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span className="badge badge-verified">Admin Listed</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    {activeCity?.name} Catalog
                  </span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(24px, 3.5vw, 36px)', color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                  Currently Showing Movies
                </h2>
              </div>

              <Link to="/movies" className="btn btn-outline btn-sm">
                View Full Catalog →
              </Link>
            </div>

            {currentMovies.length === 0 ? (
              <div style={{ padding: '60px 0', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <Film size={36} color="var(--gold-dim)" style={{ marginBottom: 12 }} />
                <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)' }}>No movies listed for {activeCity?.name} right now</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Select another city above or log in as Admin to assign movies to this city.</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 24,
              }}>
                {currentMovies.map(movie => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ========== COMING SOON SECTION ========== */}
        {comingSoonMovies.length > 0 && (
          <section style={{ padding: '60px 24px', background: 'rgba(0,0,0,0.25)', borderTop: '1px solid var(--border-subtle)' }}>
            <div className="container">
              <div style={{ marginBottom: 28 }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-serif)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                  Upcoming Theatrical Releases
                </span>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: 'var(--text-primary)', marginTop: 4 }}>
                  Coming Soon
                </h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 20 }}>
                {comingSoonMovies.map(movie => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ========== TOP RATED BY USERS ========== */}
        {topRatedMovies.length > 0 && (
          <section style={{ padding: '60px 24px 80px', borderTop: '1px solid var(--border-subtle)' }}>
            <div className="container">
              <div style={{ marginBottom: 28 }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-serif)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                  Community Favorites
                </span>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: 'var(--text-primary)', marginTop: 4 }}>
                  Top Rated by Moviegoers
                </h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 20 }}>
                {topRatedMovies.map(movie => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ========== RECENT USER REVIEWS ========== */}
        {recentReviews.length > 0 && (
          <section style={{ padding: '60px 24px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-serif)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                    Community Feedback
                  </span>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: 'var(--text-primary)', marginTop: 4 }}>
                    Recent User Reviews
                  </h2>
                </div>
                <Link to="/movies" className="btn btn-ghost btn-sm">
                  Write Your Review →
                </Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                {recentReviews.map(rev => {
                  const targetM = state.movies.find(m => m.id === rev.movieId);
                  return (
                    <div key={rev.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: 20, borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Link to={`/movie/${rev.movieId}`} style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>
                          {targetM?.title || rev.movieId}
                        </Link>
                        <StarRating rating={rev.rating} readOnly size={13} />
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        "{rev.reviewText}"
                      </p>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>— {rev.userDisplayName}</span>
                        <Link to={`/movie/${rev.movieId}`} style={{ color: 'var(--gold)', textDecoration: 'none' }}>Read Full Review →</Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ========== HOW IT WORKS ========== */}
        <section style={{ padding: '80px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
                <div style={{ height: 1, width: 30, background: 'var(--gold-dim)' }} />
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)' }}>Platform Journey</span>
                <div style={{ height: 1, width: 30, background: 'var(--gold-dim)' }} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, letterSpacing: '0.05em', color: 'var(--text-primary)' }}>Cinema Discovery + Technical Excellence</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, background: 'var(--border-subtle)', border: '1px solid var(--border-subtle)' }}>
              {STEPS.map((step) => (
                <div key={step.num} style={{ background: 'var(--bg-card)', padding: '32px 24px' }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 36, color: 'rgba(220,182,91,0.15)', letterSpacing: '0.05em', marginBottom: 12 }}>{step.num}</div>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--text-primary)', letterSpacing: '0.03em', lineHeight: 1.5 }}>{step.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== LIVE ASPECT RATIO SIMULATOR PREVIEW ========== */}
        <section style={{ padding: '80px 24px' }}>
          <div className="container" style={{ maxWidth: 900 }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
                <div style={{ height: 1, width: 30, background: 'var(--gold-dim)' }} />
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)' }}>Technical Cinema Engine</span>
                <div style={{ height: 1, width: 30, background: 'var(--gold-dim)' }} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: 8 }}>
                Simulate Screen Ratios
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                Select a format to see how real movie content fills or crops on different theater screens
              </p>
            </div>

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
