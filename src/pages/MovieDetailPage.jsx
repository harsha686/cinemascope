import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, Play, MapPin, Monitor, Sliders, MessageSquare, ChevronRight, Globe, ShieldCheck, Tv, Film, Users, Layers } from 'lucide-react';
import { useApp } from '../AppContext';
import RatingBreakdown from '../components/reviews/RatingBreakdown';
import ReviewCard from '../components/reviews/ReviewCard';
import ProfessionalReviewCard from '../components/reviews/ProfessionalReviewCard';
import ReviewTabs from '../components/reviews/ReviewTabs';
import ProfessionalRatingBadge from '../components/reviews/ProfessionalRatingBadge';
import ReviewComposer from '../components/reviews/ReviewComposer';
import MovieStatusBar from '../components/library/MovieStatusBar';
import OttStreamingInfo from '../components/movies/OttStreamingInfo';
import WeekendWinnerBadge from '../components/weekend/WeekendWinnerBadge';
import ShareButton from '../components/social/ShareButton';
import SocialMetaTags from '../components/social/SocialMetaTags';
import { SOCIAL_CONTENT_TYPES } from '../services/socialSharingService';
import { getMovieWinningHistory } from '../services/weekendPickService';
import { fetchFullTmdbMovieDetails } from '../services/tmdbService';

export default function MovieDetailPage() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const {
    getMovie,
    getMovieRating,
    getUserReviewForMovie,
    getMovieReviews,
    getMovieUserReviews,
    getMovieProfessionalReviews,
    getProfessionalRating,
    isVerifiedPro,
    getCityTheaters,
    getCity,
    state,
    dispatch,
  } = useApp();

  const isTmdbTv = movieId?.startsWith('tmdb-tv-') || movieId?.startsWith('tv-');
  const isTmdbMovie = movieId?.startsWith('tmdb-') || movieId?.startsWith('tv-');
  const tmdbId = isTmdbTv 
    ? (movieId.startsWith('tmdb-tv-') ? movieId.replace('tmdb-tv-', 'tv-') : (movieId.startsWith('tv-') ? movieId : `tv-${movieId}`))
    : (isTmdbMovie ? movieId.replace('tmdb-', '') : null);

  const [tmdbMovie, setTmdbMovie] = useState(null);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [tmdbError, setTmdbError] = useState(null);

  const mainContentRef = useRef(null);
  const reviewsSectionRef = useRef(null);

  // Fetch TMDB data when ID starts with "tmdb-" or "tv-"
  useEffect(() => {
    if (!isTmdbMovie || !tmdbId) return;
    setTmdbLoading(true);
    fetchFullTmdbMovieDetails(tmdbId)
      .then(m => { setTmdbMovie(m); setTmdbLoading(false); })
      .catch(err => { setTmdbError(err.message); setTmdbLoading(false); });
  }, [isTmdbMovie, tmdbId]);

  const adminMovie = getMovie(movieId);
  const movie = isTmdbMovie ? tmdbMovie : adminMovie;
  const currentUser = state.currentUser;
  const currentCity = state.selectedCity || getCity('visakhapatnam');
  const currentUserIsPro = currentUser ? isVerifiedPro(currentUser.id) : false;

  const [sortOption, setSortOption] = useState('newest');
  const [showComposer, setShowComposer] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewTab, setReviewTab] = useState('all'); // 'all' | 'audience' | 'professional'
  const [submitAsPro, setSubmitAsPro] = useState(currentUserIsPro);
  const [activeSectionTab, setActiveSectionTab] = useState('reviews'); // 'reviews' | 'about' | 'cast' | 'all'

  // Auto-scroll directly to reviews section after clicking a movie
  useEffect(() => {
    const timer = setTimeout(() => {
      if (reviewsSectionRef.current) {
        reviewsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (mainContentRef.current) {
        mainContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        const target = document.getElementById('main-content-tabs') || document.getElementById('reviews-section');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [movieId, tmdbLoading]);

  useEffect(() => {
    if (currentUserIsPro) {
      setSubmitAsPro(true);
    }
  }, [currentUserIsPro]);

  const ratingInfo = useMemo(() => getMovieRating(movieId), [getMovieRating, movieId]);
  const proRatingInfo = useMemo(() => getProfessionalRating(movieId), [getProfessionalRating, movieId]);
  const userExistingReview = useMemo(() => currentUser ? getUserReviewForMovie(currentUser.id, movieId) : null, [getUserReviewForMovie, currentUser, movieId]);
  const allReviews = useMemo(() => getMovieReviews(movieId), [getMovieReviews, movieId]);
  const userReviewsList = useMemo(() => getMovieUserReviews(movieId), [getMovieUserReviews, movieId]);
  const proReviewsList = useMemo(() => getMovieProfessionalReviews(movieId), [getMovieProfessionalReviews, movieId]);
  const userRatingInfo = useMemo(() => {
    if (!userReviewsList || userReviewsList.length === 0) return { average: 0, count: 0 };
    const sum = userReviewsList.reduce((acc, r) => acc + (r.rating || 0), 0);
    return { average: Math.round((sum / userReviewsList.length) * 10) / 10, count: userReviewsList.length };
  }, [userReviewsList]);

  const winningHistory = useMemo(() => {
    const list = getMovieWinningHistory(movieId);
    if (list && list.length > 0) return list;
    if (movie?.title) return getMovieWinningHistory(movie.title);
    return [];
  }, [movieId, movie?.title]);

  // Check if this is an old / archive / catalog movie
  const isOldMovie = useMemo(() => {
    if (!movie) return false;
    if (movie.status === 'ARCHIVED') return true;

    const now = new Date();

    // Past digital / OTT release (e.g. Apr 28, 2022)
    const ottDateStr = movie.ottReleaseDate || (movie.ottRelease && movie.ottRelease.date);
    if (ottDateStr) {
      const ottDate = new Date(ottDateStr);
      if (!isNaN(ottDate.getTime()) && ottDate < now) {
        if (movie.status !== 'CURRENTLY_SHOWING' || !movie.theaters || movie.theaters.length === 0) {
          return true;
        }
      }
    }

    // Past theatrical release (older than 60 days)
    if (movie.releaseDate) {
      const relDate = new Date(movie.releaseDate);
      if (!isNaN(relDate.getTime())) {
        const daysSinceRelease = (now.getTime() - relDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceRelease > 60) {
          return true;
        }
      }
    }

    // TMDB movies (global catalog / archive) without active local theater assignment
    if (isTmdbMovie) {
      return true;
    }

    return false;
  }, [movie, isTmdbMovie]);

  // Theaters showing this movie in the current city
  const localTheaters = useMemo(() => {
    if (!currentCity || !movie || isTmdbMovie || isOldMovie) return [];
    if (movie.status !== 'CURRENTLY_SHOWING') return [];
    const cityTheaters = getCityTheaters(currentCity.id);
    if (movie.theaters && Array.isArray(movie.theaters) && movie.theaters.length > 0) {
      return cityTheaters.filter(t => movie.theaters.includes(t.id));
    }
    return [];
  }, [getCityTheaters, currentCity, movie, isTmdbMovie, isOldMovie]);

  // Active review list based on tab
  const activeReviews = useMemo(() => {
    if (reviewTab === 'audience') return userReviewsList;
    if (reviewTab === 'professional') return proReviewsList;
    return allReviews;
  }, [reviewTab, allReviews, userReviewsList, proReviewsList]);

  // Sort reviews
  const sortedReviews = useMemo(() => {
    const list = [...activeReviews];
    if (sortOption === 'newest') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sortOption === 'highest') list.sort((a, b) => b.rating - a.rating);
    else if (sortOption === 'lowest') list.sort((a, b) => a.rating - b.rating);
    else if (sortOption === 'helpful') list.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    return list;
  }, [activeReviews, sortOption]);

  // Loading state for TMDB movies & TV series
  if (isTmdbMovie && tmdbLoading) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)', fontSize: 18, marginBottom: 12 }}>
          {isTmdbTv ? 'Loading series…' : 'Loading movie…'}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          {isTmdbTv ? 'Fetching from global TV & series archive' : 'Fetching from global movie archive'}
        </p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>
          {isTmdbTv ? 'Series Not Found' : 'Movie Not Found'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>
          {tmdbError ? `Error: ${tmdbError}` : `The requested ${isTmdbTv ? 'series' : 'movie'} could not be found.`}
        </p>
        <button onClick={() => navigate('/discover')} className="btn btn-outline" style={{ marginTop: 24 }}>
          ← Explore Discover
        </button>
      </div>
    );
  }

  const handleDeleteOwnReview = (reviewId) => {
    dispatch({ type: 'DELETE_REVIEW', payload: reviewId });
    setEditingReview(null);
  };

  const handleEditClick = (rev) => {
    setEditingReview(rev);
    setSubmitAsPro(rev.reviewType === 'PROFESSIONAL' || (currentUserIsPro && rev.reviewType !== 'USER'));
    setShowComposer(true);
  };

  const handleWriteClick = () => {
    if (!currentUser) {
      navigate('/login', { state: { from: `/movie/${movieId}` } });
      return;
    }
    setActiveSectionTab('reviews');
    if (userExistingReview) {
      setEditingReview(userExistingReview);
      setSubmitAsPro(userExistingReview.reviewType === 'PROFESSIONAL' || (currentUserIsPro && userExistingReview.reviewType !== 'USER'));
    } else {
      setEditingReview(null);
      setSubmitAsPro(currentUserIsPro);
    }
    setShowComposer(true);
    setTimeout(() => {
      const elem = document.getElementById('reviews-section');
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  // YouTube embed helper
  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes('embed')) return url;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const embedTrailer = getEmbedUrl(movie.trailerUrl);

  return (
    <div className="page-enter" style={{ minHeight: '100vh', paddingBottom: 60 }}>
      {/* Dynamic Open Graph Meta Tags */}
      <SocialMetaTags
        contentType={SOCIAL_CONTENT_TYPES.MOVIE}
        data={movie}
      />
      {/* Backdrop Hero Header */}
      <div style={{
        position: 'relative',
        minHeight: 480,
        background: `linear-gradient(to bottom, rgba(10,8,6,0.5) 0%, rgba(10,8,6,0.95) 90%, #0a0806 100%), url(${movie.backdropUrl || movie.posterUrl}) center/cover no-repeat`,
        padding: '60px 24px 40px',
        display: 'flex',
        alignItems: 'flex-end',
      }}>
        <div className="container" style={{ position: 'relative', zIndex: 2, width: '100%' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
            <Link to="/" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Home</Link>
            <span style={{ color: 'var(--border)', fontSize: 10 }}>/</span>
            {movie.isTv ? (
              <Link to="/discover?type=tv" style={{ fontSize: 11, color: 'var(--text-muted)' }}>TV Series</Link>
            ) : (
              <Link to="/movies" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Movies</Link>
            )}
            <span style={{ color: 'var(--border)', fontSize: 10 }}>/</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{movie.title}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 32, alignItems: 'end' }} className="hero-grid">
            {/* Real Official Poster */}
            <div style={{
              width: 220,
              aspectRatio: '2/3',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card), 0 0 30px rgba(0,0,0,0.8)',
              border: '1px solid var(--border)',
              flexShrink: 0,
              position: 'relative',
            }}>
              <img
                src={movie.posterUrl}
                alt={`${movie.title} official poster`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.src = '/demo-frame.jpg'; }}
              />
              <div style={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                fontSize: 9,
                fontFamily: 'var(--font-serif)',
                background: 'rgba(0,0,0,0.75)',
                color: 'var(--gold)',
                padding: '2px 6px',
                borderRadius: 2,
              }}>
                {movie.isTv ? 'OFFICIAL SERIES POSTER' : (movie.posterSourceType || 'OFFICIAL') + ' POSTER'}
              </div>
            </div>

            {/* Movie Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {winningHistory.length > 0 && (
                  <WeekendWinnerBadge
                    genreName={winningHistory[0].genreName}
                    roundName={winningHistory[0].roundName}
                    size="sm"
                  />
                )}
                {movie.isTv ? (
                  <span className="badge" style={{ background: 'linear-gradient(135deg, #9333ea, #6b21a8)', color: '#ffffff', fontWeight: 700 }}>
                    SERIES
                  </span>
                ) : (
                  (movie.status === 'CURRENTLY_SHOWING' || movie.status === 'COMING_SOON') && (
                    <span className="badge badge-verified">
                      {movie.status === 'CURRENTLY_SHOWING' ? 'Now Showing' : 'Coming Soon'}
                    </span>
                  )
                )}
                {movie.network && <span className="badge badge-dim">{movie.network}</span>}
                <span className="badge badge-gold">{movie.language}</span>
                {movie.certificate && <span className="badge badge-dim">{movie.certificate}</span>}
                {(movie.ottPlatform || movie.ottReleaseDate || (movie.ottPlatforms && movie.ottPlatforms.length > 0)) && (
                  <span
                    onClick={() => {
                      const el = document.getElementById('streaming-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="badge"
                    style={{
                      background: 'rgba(16,185,129,0.12)',
                      color: '#10b981',
                      border: '1px solid rgba(16,185,129,0.3)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                    title="Jump to Streaming details"
                  >
                    <Tv size={11} /> {movie.ottPlatform ? `Streaming on ${movie.ottPlatform}` : 'OTT Available'}
                  </span>
                )}
                {movie.aspectRatio && (
                  <span className="badge badge-dim" style={{ marginLeft: 'auto' }}>
                    Ratio: {movie.aspectRatio}
                  </span>
                )}
              </div>

              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 4.5vw, 52px)', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                {movie.title}
              </h1>

              {movie.originalTitle && movie.originalTitle !== movie.title && (
                <div style={{ fontFamily: 'var(--font-italic)', fontSize: 16, color: 'var(--text-secondary)' }}>
                  Original Title: {movie.originalTitle}
                </div>
              )}

              {/* Score & Counts */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 4 }}>
                {(() => {
                  const hasUserReviews = (userRatingInfo.count || ratingInfo.count) > 0;
                  const userAvg = userRatingInfo.average > 0 ? userRatingInfo.average : ratingInfo.average;

                  // Normalize TMDB archive rating to 5-star scale
                  const rawTmdbRating = movie.voteAverage || 0;
                  const tmdbAvg5 = rawTmdbRating > 5 ? Math.round((rawTmdbRating / 2) * 10) / 10 : rawTmdbRating;
                  const tmdbAvg10 = movie.voteAverage10 || (rawTmdbRating > 5 ? rawTmdbRating : Math.round(rawTmdbRating * 20) / 10);
                  const tmdbVoteCount = movie.voteCount || 0;

                  const displayScore = hasUserReviews ? userAvg : (tmdbAvg5 > 0 ? tmdbAvg5 : null);
                  const starCount = displayScore ? Math.round(displayScore) : 0;

                  return (
                    <>
                      {/* User / Audience Rating */}
                      <div
                        onClick={() => {
                          setActiveSectionTab('reviews');
                          setReviewTab('audience');
                          const elem = document.getElementById('reviews-section');
                          if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                        title={hasUserReviews ? "Jump to audience reviews" : (tmdbAvg10 > 0 ? `TMDb Global Rating: ${tmdbAvg10.toFixed(1)}/10` : 'Reviews')}
                      >
                        <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--gold)', lineHeight: 1 }}>
                          {displayScore !== null ? displayScore.toFixed(1) : 'N/A'}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/ 5</span>
                        <span style={{ fontSize: 18, color: 'var(--gold)', letterSpacing: -1 }}>
                          {'★'.repeat(starCount)}{'☆'.repeat(5 - starCount)}
                        </span>
                      </div>
                      <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
                      <span
                        onClick={() => {
                          setActiveSectionTab('reviews');
                          setReviewTab('audience');
                          const elem = document.getElementById('reviews-section');
                          if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}
                        title="Jump to audience reviews"
                      >
                        {hasUserReviews ? (
                          <>
                            <strong style={{ color: 'var(--text-primary)' }}>{userRatingInfo.count || ratingInfo.count}</strong> user reviews
                          </>
                        ) : tmdbVoteCount > 0 ? (
                          <>
                            <strong style={{ color: 'var(--text-primary)' }}>{tmdbVoteCount.toLocaleString()}</strong> global ratings{' '}
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(TMDb: {tmdbAvg10.toFixed(1)}/10)</span>
                          </>
                        ) : (
                          <span>No reviews yet</span>
                        )}
                      </span>

                      {/* If movie has both user reviews and global TMDb rating, show TMDb score badge */}
                      {hasUserReviews && tmdbAvg5 > 0 && (
                        <>
                          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '3px 10px',
                              borderRadius: 4,
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid var(--border-subtle)',
                              fontSize: 12,
                              color: 'var(--text-secondary)'
                            }}
                            title={`TMDb Global Rating: ${tmdbAvg10.toFixed(1)} / 10 based on ${tmdbVoteCount.toLocaleString()} votes`}
                          >
                            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>★ {tmdbAvg5.toFixed(1)}/5</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>TMDb ({tmdbAvg10.toFixed(1)}/10)</span>
                          </div>
                        </>
                      )}
                    </>
                  );
                })()}

                {/* Professional Critic Rating */}
                <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
                <div
                  onClick={() => {
                    setActiveSectionTab('reviews');
                    setReviewTab('professional');
                    const elem = document.getElementById('reviews-section');
                    if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    padding: '3px 10px',
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.06))',
                    border: '1px solid rgba(16,185,129,0.3)',
                    transition: 'border-color 0.15s ease',
                  }}
                  title="Jump to professional critic reviews"
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(16,185,129,0.6)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'}
                >
                  <ShieldCheck size={16} color="#10b981" />
                  {proRatingInfo.count > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: '#10b981', lineHeight: 1 }}>
                        {proRatingInfo.average.toFixed(1)}
                      </span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>/ 5</span>
                      <span style={{ fontSize: 14, color: '#10b981', letterSpacing: -1 }}>
                        {'★'.repeat(Math.round(proRatingInfo.average))}{'☆'.repeat(5 - Math.round(proRatingInfo.average))}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        · <strong style={{ color: '#10b981' }}>{proRatingInfo.count}</strong> critic{proRatingInfo.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#10b981' }}>
                      <span style={{ fontWeight: 600 }}>Critics</span>
                      <span style={{ color: 'var(--text-muted)' }}>· No reviews yet</span>
                    </div>
                  )}
                </div>
                {movie.runtime && (
                  <>
                    <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={13} color="var(--gold)" /> {movie.runtime}
                    </span>
                  </>
                )}
                {movie.releaseDate && (
                  <>
                    <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={13} color="var(--gold)" /> {movie.releaseDate}
                    </span>
                  </>
                )}
              </div>

              {/* Genres */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {movie.genres?.map(g => (
                  <span key={g} style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-secondary)', borderRadius: 2 }}>
                    {g}
                  </span>
                ))}
              </div>

              {/* Primary Action Button */}
              <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleWriteClick}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <MessageSquare size={16} />
                  {userExistingReview ? 'Edit Your Review' : 'Write a Review'}
                </button>

                {/* Aesthetic Social Card Generator Button */}
                <ShareButton
                  contentType={SOCIAL_CONTENT_TYPES.MOVIE}
                  data={{
                    ...movie,
                    personalRating: userExistingReview?.rating || movie.personalRating || null,
                  }}
                  variant="outline"
                  size="md"
                  customLabel="✨ Create Aesthetic"
                />

                {movie.trailerUrl && (
                  <a
                    href={movie.trailerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <Play size={16} /> Watch Trailer
                  </a>
                )}
              </div>

              {/* Personal Movie Status Bar */}
              <div style={{ marginTop: 16 }}>
                <MovieStatusBar
                  tmdbId={isTmdbMovie ? tmdbId : movieId}
                  movieMeta={{ title: movie.title, posterUrl: movie.posterUrl }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="container" style={{ padding: '48px 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 48 }} className="detail-layout">
          
          {/* Main Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

            {/* Sub-Navigation Tabs */}
            <div id="main-content-tabs" ref={mainContentRef} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderBottom: '1px solid var(--border-subtle)',
              padding: '10px 0 14px',
              flexWrap: 'wrap',
              position: 'sticky',
              top: 'var(--nav-height)',
              background: 'rgba(10, 8, 6, 0.95)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              zIndex: 15,
            }}>
              {[
                { id: 'reviews', label: 'What People Think', icon: <MessageSquare size={14} />, count: allReviews.length },
                { id: 'about', label: movie.isTv ? 'About Series' : 'About Movie', icon: movie.isTv ? <Tv size={14} /> : <Film size={14} /> },
                { id: 'cast', label: movie.isTv ? 'Cast & Creators' : 'Cast & Filmmakers', icon: <Users size={14} />, count: (movie.cast?.length || 0) + (movie.director ? 1 : 0) },
                { id: 'all', label: 'All Info', icon: <Layers size={14} /> },
              ].map(tab => {
                const isActive = activeSectionTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveSectionTab(tab.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '8px 16px',
                      borderRadius: 20,
                      fontSize: 13,
                      fontFamily: 'var(--font-serif)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      letterSpacing: '0.04em',
                      transition: 'all 0.15s ease',
                      background: isActive ? 'var(--gold-faint)' : 'rgba(255,255,255,0.02)',
                      color: isActive ? 'var(--gold)' : 'var(--text-muted)',
                      border: isActive ? '1px solid var(--gold-dim)' : '1px solid var(--border-subtle)',
                    }}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span style={{
                        fontSize: 11,
                        padding: '1px 7px',
                        borderRadius: 10,
                        background: isActive ? 'rgba(220,182,91,0.25)' : 'rgba(255,255,255,0.06)',
                        color: isActive ? 'var(--gold)' : 'var(--text-muted)',
                      }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ABOUT THE MOVIE */}
            {(activeSectionTab === 'about' || activeSectionTab === 'all') && (
              <div id="about-section" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                {winningHistory.length > 0 && (
                  <div style={{
                    padding: '20px 24px',
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, rgba(220,182,91,0.12), rgba(220,182,91,0.02))',
                    border: '1px solid rgba(220,182,91,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>🏆</span>
                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>
                          Community Weekend Winner Honors
                        </span>
                      </div>
                      <Link to="/weekend-winners" style={{ fontSize: 12, color: 'var(--gold)', textDecoration: 'underline' }}>
                        View all winners archive →
                      </Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {winningHistory.map((win, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 10,
                          padding: '10px 14px',
                          background: 'rgba(0,0,0,0.35)',
                          borderRadius: 6,
                          border: '1px solid rgba(220,182,91,0.15)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="badge badge-gold" style={{ fontSize: 11 }}>
                              {win.genreName} Winner
                            </span>
                            <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                              {win.roundName}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {win.votesCount?.toLocaleString()} votes ({win.voteShare || win.votePercentage || 0}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 16 }}>
                    {movie.isTv ? 'About the Series' : 'About the Movie'}
                  </h2>
                  <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.85, whiteSpace: 'pre-line' }}>
                    {movie.overview || (movie.isTv ? 'No overview available for this series.' : 'No overview available for this movie.')}
                  </p>
                </div>

                {/* TRAILER EMBED */}
                {embedTrailer && (
                  <div id="trailer-section">
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 16 }}>
                      Official Trailer
                    </h2>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#000' }}>
                      <iframe
                        src={embedTrailer}
                        title={`${movie.title} Official Trailer`}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CAST & DIRECTOR */}
            {(activeSectionTab === 'cast' || activeSectionTab === 'all') && (
              <div id="cast-section">
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 16 }}>
                  {movie.isTv ? 'Cast & Creators' : 'Cast & Filmmakers'}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                  {movie.director && (
                    <div style={{ padding: 14, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 4 }}>
                      <div style={{ fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {movie.isTv ? 'Creator / Showrunner' : 'Director'}
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, marginTop: 2 }}>{movie.director}</div>
                    </div>
                  )}
                  {movie.cast?.map(actor => (
                    <div key={actor} style={{ padding: 14, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 4 }}>
                      <div style={{ fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cast</div>
                      <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, marginTop: 2 }}>{actor}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WHAT PEOPLE THINK (REVIEWS SECTION) */}
            {(activeSectionTab === 'reviews' || activeSectionTab === 'all') && (
              <div id="reviews-section" ref={reviewsSectionRef}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                    What People Think
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Real user reviews & visual presentation feedback
                  </p>
                </div>
              </div>

              {/* Dual Rating Summary Bar */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                {/* Community Rating */}
                <div style={{
                  flex: 1, minWidth: 140, padding: '12px 16px',
                  background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                    👥 Community Rating
                  </div>
                  {userRatingInfo.count > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-serif)' }}>★ {userRatingInfo.average}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ 5 · {userRatingInfo.count} review{userRatingInfo.count !== 1 ? 's' : ''}</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No reviews yet</div>
                  )}
                </div>
                {/* Professional Rating */}
                <div style={{
                  flex: 1, minWidth: 140, padding: '12px 16px',
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(5,150,105,0.02))',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <div style={{ fontSize: 11, color: '#10b981', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <ShieldCheck size={11} /> Professional Rating
                  </div>
                  {proRatingInfo.count > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 24, fontWeight: 700, color: '#10b981', fontFamily: 'var(--font-serif)' }}>★ {proRatingInfo.average}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ 5 · {proRatingInfo.count} critic{proRatingInfo.count !== 1 ? 's' : ''}</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No critics yet</div>
                  )}
                </div>
              </div>

              {/* Review Composer */}
              {showComposer && (
                <div style={{ marginBottom: 32 }}>
                  {/* Pro toggle for verified reviewers */}
                  {currentUserIsPro && (
                    <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <ShieldCheck size={14} color="#10b981" />
                      <span style={{ fontSize: 12, color: '#10b981', flex: 1 }}>Submit as Professional Review</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input type="checkbox" checked={submitAsPro} onChange={e => setSubmitAsPro(e.target.checked)} />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{submitAsPro ? 'Professional ✓' : 'User Review'}</span>
                      </label>
                    </div>
                  )}
                  <ReviewComposer
                    movie={movie || { id: movieId, title: adminMovie?.title || movieId }}
                    existingReview={editingReview}
                    reviewType={submitAsPro && currentUserIsPro ? 'PROFESSIONAL' : 'USER'}
                    onClose={() => { setShowComposer(false); }}
                    onSuccess={() => { setShowComposer(false); }}
                  />
                </div>
              )}

              {/* Rating Summary + Per-Parameter Breakdown */}
              <div style={{ marginBottom: 24 }}>
                <RatingBreakdown reviews={allReviews} />
              </div>

              {/* User's Own Review Display */}
              {userExistingReview && !showComposer && (
                <div style={{ marginBottom: 24, padding: 16, background: 'rgba(220,182,91,0.06)', border: '1px solid var(--gold-dim)', borderRadius: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', color: 'var(--gold)', letterSpacing: '0.15em' }}>Your Published Review</span>
                    <button type="button" onClick={() => handleEditClick(userExistingReview)} className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: 10 }}>Edit</button>
                  </div>
                  {userExistingReview.reviewType === 'PROFESSIONAL' ? (
                    <ProfessionalReviewCard review={userExistingReview} onEdit={handleEditClick} onDelete={handleDeleteOwnReview} />
                  ) : (
                    <ReviewCard review={userExistingReview} onEdit={handleEditClick} onDelete={handleDeleteOwnReview} />
                  )}
                </div>
              )}

              {/* Review Tabs + Sort */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
                <ReviewTabs
                  activeTab={reviewTab}
                  onChange={setReviewTab}
                  userCount={userReviewsList.length}
                  proCount={proReviewsList.length}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sliders size={13} color="var(--text-muted)" />
                  <select
                    className="input"
                    style={{ width: 'auto', padding: '4px 12px', fontSize: 12, background: '#18140e', color: '#ffffff' }}
                    value={sortOption}
                    onChange={e => setSortOption(e.target.value)}
                  >
                    <option value="newest" style={{ background: '#18140e', color: '#ffffff' }}>Newest First</option>
                    <option value="highest" style={{ background: '#18140e', color: '#ffffff' }}>Highest Rated</option>
                    <option value="lowest" style={{ background: '#18140e', color: '#ffffff' }}>Lowest Rated</option>
                    <option value="helpful" style={{ background: '#18140e', color: '#ffffff' }}>Most Helpful</option>
                  </select>
                </div>
              </div>

              {/* Reviews List */}
              {sortedReviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)' }}>
                  <MessageSquare size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                  <h4 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', marginBottom: 6 }}>
                    {reviewTab === 'professional' ? 'No Professional Reviews Yet' : 'No Reviews Yet'}
                  </h4>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                    {reviewTab === 'professional'
                      ? `No verified critics have reviewed this ${movie.isTv ? 'series' : 'film'} yet.`
                      : `Be the first to share your thoughts on this ${movie.isTv ? 'series' : 'movie'}!`}
                  </p>
                  {reviewTab !== 'professional' && (
                    <button type="button" onClick={handleWriteClick} className="btn btn-primary btn-sm">Write a Review</button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {sortedReviews.map(rev =>
                    rev.reviewType === 'PROFESSIONAL' ? (
                      <ProfessionalReviewCard
                        key={rev.id}
                        review={rev}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteOwnReview}
                      />
                    ) : (
                      <ReviewCard
                        key={rev.id}
                        review={rev}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteOwnReview}
                      />
                    )
                  )}
                </div>
              )}
            </div>
            )}

          </div>

          {/* Right Sidebar: Where to Watch & Screen Tech */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

            {/* OTT STREAMING & RELEASE DETAILS */}
            <div id="streaming-section">
              <OttStreamingInfo movie={movie} />
            </div>

            {/* SCREEN EXPERIENCE & ASPECT RATIO TECH */}
            {movie.aspectRatio && (
              <div style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Monitor size={16} color="var(--gold)" />
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                    Screen Format Spec
                  </h3>
                </div>

                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Target Native Ratio: <strong style={{ color: 'var(--gold)', fontFamily: 'var(--font-serif)' }}>{movie.aspectRatio}</strong>
                </div>

                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
                  Check how this movie's native {movie.aspectRatio} aspect ratio presents on local screens in your city.
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/compare')}
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Compare Cinema Screens →
                </button>
              </div>
            )}

            {/* WHERE TO WATCH (THEATERS IN CURRENT CITY) - Only for active current movies screening locally */}
            {!isOldMovie && movie.status === 'CURRENTLY_SHOWING' && localTheaters.length > 0 && (
              <div style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <MapPin size={16} color="var(--gold)" />
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                    Where to Watch
                  </h3>
                </div>

                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Confirmed screening at <strong style={{ color: 'var(--text-primary)' }}>{currentCity?.name}</strong>:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {localTheaters.map(t => (
                    <Link
                      key={t.id}
                      to={`/theater/${t.id}`}
                      style={{
                        padding: '10px 12px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textDecoration: 'none',
                        transition: 'border-color 150ms ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold-dim)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                    >
                      <div>
                        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 12, color: 'var(--text-primary)' }}>{t.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t.totalScreens} screens • {t.area}</div>
                      </div>
                      <ChevronRight size={13} color="var(--gold)" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Mobile Quick Action Sticky Floating Bar */}
      <div className="mobile-detail-quick-bar" style={{
        display: 'none',
        position: 'fixed',
        bottom: '64px',
        left: '12px',
        right: '12px',
        zIndex: 90,
        backgroundColor: 'rgba(24, 20, 14, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '8px 12px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.85)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <button
            type="button"
            onClick={handleWriteClick}
            className="btn btn-primary btn-sm"
            style={{ flex: 1, justifyContent: 'center', fontSize: '11px', padding: '6px 8px' }}
          >
            <MessageSquare size={13} /> {userExistingReview ? 'Edit Review' : 'Rate & Review'}
          </button>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('streaming-section');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '11px', padding: '6px 10px', color: '#10b981', borderColor: 'rgba(16,185,129,0.4)' }}
          >
            <Tv size={13} /> Watch
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .detail-layout { grid-template-columns: 1fr !important; }
          .rating-summary-grid { grid-template-columns: 1fr !important; }
          .mobile-detail-quick-bar { display: block !important; }
        }
      `}</style>
    </div>
  );
}
