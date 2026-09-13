import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Search, Navigation, ChevronRight, Monitor, Film, Star, MessageSquare, Sparkles, Play, Bookmark, Check, ArrowRight, SlidersHorizontal } from 'lucide-react';
import { useApp } from '../AppContext';
import DustParticles from '../components/shared/DustParticles';
import FormatSelector from '../components/simulator/FormatSelector';
import ScreenSimulator from '../components/simulator/ScreenSimulator';
import MovieCard from '../components/movies/MovieCard';
import StarRating from '../components/reviews/StarRating';
import WeekendRecommendationHero from '../components/weekend/WeekendRecommendationHero';
import { ASPECT_RATIOS } from '../data/formats';
import { getMovieStatusSync, toggleWatchlist } from '../services/movieLibraryService';

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
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [activeGenreFilter, setActiveGenreFilter] = useState('ALL');
  const [watchlistRefresh, setWatchlistRefresh] = useState(0);
  const searchRef = useRef(null);

  const currentUser = state.currentUser;
  const activeCity = state.selectedCity || allCities[0];

  // Currently showing movies in active city
  const currentMovies = useMemo(() => {
    return getCityMovies(activeCity?.id, 'CURRENTLY_SHOWING');
  }, [getCityMovies, activeCity]);

  // Featured spotlight candidates
  const spotlightMovies = useMemo(() => {
    if (state.movies && state.movies.length > 0) {
      return state.movies.slice(0, 5);
    }
    return [];
  }, [state.movies]);

  const featuredMovie = spotlightMovies[featuredIndex] || spotlightMovies[0] || null;

  // Watchlist status of current featured movie
  const isFeaturedWatchlisted = useMemo(() => {
    if (!featuredMovie) return false;
    const s = getMovieStatusSync(featuredMovie.id, currentUser?.id);
    return s.inWatchlist;
  }, [featuredMovie, currentUser, watchlistRefresh]);

  const handleToggleFeaturedWatchlist = (e) => {
    e.preventDefault();
    if (!featuredMovie) return;
    toggleWatchlist(featuredMovie.id, featuredMovie, currentUser?.id);
    setWatchlistRefresh(r => r + 1);
  };

  // Genre options from current movies
  const availableGenres = useMemo(() => {
    const set = new Set();
    currentMovies.forEach(m => {
      (m.genres || []).forEach(g => set.add(g));
    });
    return Array.from(set);
  }, [currentMovies]);

  // Filtered currently showing movies
  const displayedCurrentMovies = useMemo(() => {
    if (activeGenreFilter === 'ALL') return currentMovies;
    return currentMovies.filter(m => (m.genres || []).includes(activeGenreFilter));
  }, [currentMovies, activeGenreFilter]);

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
      {/* Background Ambience */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse 80% 50% at 50% 20%, rgba(220,182,91,0.05) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 50% 80%, rgba(139,94,26,0.06) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />
      <DustParticles />
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', boxShadow: 'inset 0 0 200px 80px rgba(0,0,0,0.75)' }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        
        {/* ========== CINEMATIC SPOTLIGHT HERO ========== */}
        <section style={{
          position: 'relative',
          minHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '100px 24px 60px',
          overflow: 'hidden',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          {/* Backdrop Image with gradient mask */}
          {featuredMovie?.backdropUrl && (
            <div style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              backgroundImage: `url(${featuredMovie.backdropUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 20%',
              filter: 'brightness(0.38) saturate(1.15)',
              transform: 'scale(1.02)',
              transition: 'background-image 0.6s ease',
            }} />
          )}

          {/* Gradients Overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            background: 'linear-gradient(to right, rgba(10,8,6,0.95) 20%, rgba(10,8,6,0.75) 55%, rgba(10,8,6,0.4) 100%), linear-gradient(to top, rgba(10,8,6,1) 0%, rgba(10,8,6,0.5) 40%, transparent 80%)',
          }} />

          {/* Foreground Hero Content */}
          <div className="container" style={{ position: 'relative', zIndex: 2, width: '100%' }}>
            
            {/* Top Bar: Spotlight Pill & City Quick Pill */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, letterSpacing: '0.12em' }}>
                  <Sparkles size={12} /> SPOTLIGHT CINEMA
                </span>
                {featuredMovie?.aspectRatio && (
                  <span className="badge badge-format" style={{ fontSize: 11 }}>
                    {featuredMovie.aspectRatio} Presentation
                  </span>
                )}
              </div>

              {/* Active City Selector Pill */}
              <div ref={searchRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowCityList(!showCityList)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 14px',
                    background: 'rgba(20, 16, 12, 0.85)',
                    border: '1px solid var(--border)',
                    borderRadius: 20,
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    fontFamily: 'var(--font-serif)',
                    cursor: 'pointer',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <MapPin size={13} color="var(--gold)" />
                  <span>City: <strong style={{ color: 'var(--gold)' }}>{activeCity?.name}</strong></span>
                  <ChevronRight size={13} color="var(--text-muted)" style={{ transform: showCityList ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 0.2s' }} />
                </button>

                {/* City Dropdown Menu */}
                {showCityList && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 280,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-gold)',
                    zIndex: 100,
                    overflow: 'hidden',
                  }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 6, alignItems: 'center' }}>
                      <Search size={13} color="var(--text-muted)" />
                      <input
                        className="input"
                        style={{ padding: '4px 8px', fontSize: 12, height: 30 }}
                        placeholder="Search city..."
                        value={citySearch}
                        onChange={e => setCitySearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                      {filteredCities.map(city => (
                        <button
                          key={city.id}
                          onClick={() => handleCitySelect(city)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '8px 14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: activeCity?.id === city.id ? 'var(--gold-faint)' : 'none',
                            border: 'none',
                            borderBottom: '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)',
                            fontSize: 12,
                            fontFamily: 'var(--font-serif)',
                            cursor: 'pointer',
                          }}
                        >
                          <span>{city.name}</span>
                          {activeCity?.id === city.id && <span style={{ color: 'var(--gold)', fontSize: 11 }}>Active</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Spotlight Details */}
            {featuredMovie && (
              <div style={{ maxWidth: 780 }}>
                <h1 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(32px, 5.5vw, 64px)',
                  color: 'var(--text-primary)',
                  letterSpacing: '0.02em',
                  lineHeight: 1.1,
                  marginBottom: 14,
                  textShadow: '0 2px 16px rgba(0,0,0,0.8)',
                }}>
                  {featuredMovie.title}
                </h1>

                {/* Metadata Row */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px 16px', marginBottom: 18, fontSize: 13, color: 'var(--text-secondary)' }}>
                  {featuredMovie.releaseDate && <span>{featuredMovie.releaseDate.split('-')[0]}</span>}
                  {featuredMovie.runtime && <span>• {featuredMovie.runtime}</span>}
                  {featuredMovie.language && <span>• {featuredMovie.language}</span>}
                  {featuredMovie.director && <span>• Dir. {featuredMovie.director}</span>}
                  {(featuredMovie.genres || []).map(g => (
                    <span key={g} style={{
                      padding: '2px 8px',
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: 12,
                      fontSize: 11,
                      color: 'var(--text-primary)',
                    }}>
                      {g}
                    </span>
                  ))}
                </div>

                {/* Synopsis */}
                {featuredMovie.overview && (
                  <p style={{
                    fontSize: 'clamp(14px, 1.4vw, 16px)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                    marginBottom: 28,
                    maxWidth: 680,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textShadow: '0 1px 8px rgba(0,0,0,0.6)',
                  }}>
                    {featuredMovie.overview}
                  </p>
                )}

                {/* Hero CTAs */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
                  <Link
                    to={`/movie/${featuredMovie.id}`}
                    className="btn btn-primary btn-lg"
                    style={{ gap: 8, padding: '12px 24px' }}
                  >
                    <span>Explore Screen Specs</span>
                    <ArrowRight size={16} />
                  </Link>

                  <button
                    type="button"
                    onClick={handleToggleFeaturedWatchlist}
                    className={`btn ${isFeaturedWatchlisted ? 'btn-secondary' : 'btn-outline'} btn-lg`}
                    style={{ gap: 8, padding: '12px 20px' }}
                  >
                    {isFeaturedWatchlisted ? (
                      <><Check size={16} color="var(--gold)" /> Watchlisted</>
                    ) : (
                      <><Bookmark size={16} /> + Watchlist</>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const match = ASPECT_RATIOS.find(r => r.ratio === featuredMovie.aspectRatio);
                      if (match) setSelectedFormat(match);
                      const el = document.getElementById('screen-simulator-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="btn btn-ghost btn-lg"
                    style={{ gap: 8, padding: '12px 18px', color: 'var(--text-secondary)' }}
                  >
                    <Monitor size={16} /> Simulator
                  </button>
                </div>

                {/* Carousel indicators */}
                {spotlightMovies.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-serif)', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Spotlight
                    </span>
                    {spotlightMovies.map((m, idx) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setFeaturedIndex(idx)}
                        aria-label={`Spotlight movie ${idx + 1}: ${m.title}`}
                        style={{
                          width: idx === featuredIndex ? 24 : 8,
                          height: 6,
                          borderRadius: 3,
                          background: idx === featuredIndex ? 'var(--gold)' : 'rgba(255,255,255,0.2)',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          padding: 0,
                        }}
                      />
                    ))}
                  </div>
                )}

              </div>
            )}

          </div>
        </section>

        {/* ========== WEEKEND COMMUNITY RECOMMENDATION HERO ========== */}
        <div className="container" style={{ paddingTop: 32 }}>
          <WeekendRecommendationHero />
        </div>

        {/* ========== CURRENT MOVIES SECTION (WITH GENRE FILTERS) ========== */}
        <section style={{ padding: '50px 24px 80px', borderTop: '1px solid var(--border-subtle)' }}>
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span className="badge badge-verified">Active Theater Screens</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    {activeCity?.name} Theaters
                  </span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(24px, 3.5vw, 36px)', color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                  Currently Showing Movies
                </h2>
              </div>

              <Link to="/movies" className="btn btn-outline btn-sm">
                View Full Catalog ({state.movies.length}) →
              </Link>
            </div>

            {/* Genre Filter Pills */}
            {availableGenres.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 24 }}>
                <button
                  type="button"
                  onClick={() => setActiveGenreFilter('ALL')}
                  className={`btn btn-sm ${activeGenreFilter === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: 11, borderRadius: 20 }}
                >
                  All ({currentMovies.length})
                </button>
                {availableGenres.map(genre => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => setActiveGenreFilter(genre)}
                    className={`btn btn-sm ${activeGenreFilter === genre ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: 11, borderRadius: 20 }}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            )}

            {displayedCurrentMovies.length === 0 ? (
              <div style={{ padding: '60px 0', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <Film size={36} color="var(--gold-dim)" style={{ marginBottom: 12 }} />
                <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)' }}>No movies found for {activeCity?.name}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Try selecting another city or reset your genre filters.</p>
                <button
                  onClick={() => setActiveGenreFilter('ALL')}
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: 12 }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                gap: 24,
              }}>
                {displayedCurrentMovies.map(movie => (
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 20 }}>
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
        <section id="screen-simulator-section" style={{ padding: '80px 24px' }}>
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
