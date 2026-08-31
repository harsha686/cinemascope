import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, Play, MapPin, Monitor, Sliders, MessageSquare, ChevronRight } from 'lucide-react';
import { useApp } from '../AppContext';
import RatingBreakdown from '../components/reviews/RatingBreakdown';
import ReviewCard from '../components/reviews/ReviewCard';
import ReviewComposer from '../components/reviews/ReviewComposer';

export default function MovieDetailPage() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const {
    getMovie,
    getMovieRating,
    getUserReviewForMovie,
    getMovieReviews,
    getCityTheaters,
    getCity,
    state,
    dispatch,
  } = useApp();

  const movie = getMovie(movieId);
  const currentUser = state.currentUser;
  const currentCity = state.selectedCity || getCity('visakhapatnam');

  const [sortOption, setSortOption] = useState('newest');
  const [showComposer, setShowComposer] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  const ratingInfo = useMemo(() => getMovieRating(movieId), [getMovieRating, movieId]);
  const userExistingReview = useMemo(() => currentUser ? getUserReviewForMovie(currentUser.id, movieId) : null, [getUserReviewForMovie, currentUser, movieId]);
  const allReviews = useMemo(() => getMovieReviews(movieId), [getMovieReviews, movieId]);

  // Theaters showing this movie in the current city
  const localTheaters = useMemo(() => {
    if (!currentCity || !movie) return [];
    const cityTheaters = getCityTheaters(currentCity.id);
    // If admin has pinned specific theaters, show only those; otherwise show all city theaters
    if (movie.theaters && movie.theaters.length > 0) {
      return cityTheaters.filter(t => movie.theaters.includes(t.id));
    }
    return cityTheaters;
  }, [getCityTheaters, currentCity, movie]);

  // Sort reviews
  const sortedReviews = useMemo(() => {
    const list = [...allReviews];
    if (sortOption === 'newest') {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortOption === 'highest') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortOption === 'lowest') {
      list.sort((a, b) => a.rating - b.rating);
    } else if (sortOption === 'helpful') {
      list.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    }
    return list;
  }, [allReviews, sortOption]);

  if (!movie) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>Movie Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>The requested movie could not be found.</p>
        <button onClick={() => navigate('/movies')} className="btn btn-outline" style={{ marginTop: 24 }}>
          ← Back to Movies
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
    setShowComposer(true);
  };

  const handleWriteClick = () => {
    if (!currentUser) {
      navigate('/login', { state: { from: `/movie/${movieId}` } });
      return;
    }
    if (userExistingReview) {
      setEditingReview(userExistingReview);
    } else {
      setEditingReview(null);
    }
    setShowComposer(true);
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
    <div className="page-enter">
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
            <Link to="/movies" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Movies</Link>
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
                alt={`${movie.title} official movie poster`}
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
                {movie.posterSourceType || 'OFFICIAL'} POSTER
              </div>
            </div>

            {/* Movie Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge badge-verified">{movie.status === 'CURRENTLY_SHOWING' ? 'Now Showing' : movie.status === 'COMING_SOON' ? 'Coming Soon' : 'Archived'}</span>
                <span className="badge badge-gold">{movie.language}</span>
                {movie.certificate && <span className="badge badge-dim">{movie.certificate}</span>}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--gold)', lineHeight: 1 }}>
                    {ratingInfo.average > 0 ? ratingInfo.average.toFixed(1) : 'N/A'}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/ 5</span>
                  <span style={{ fontSize: 18, color: 'var(--gold)', letterSpacing: -1 }}>
                    {'★'.repeat(Math.round(ratingInfo.average))}{'☆'.repeat(5 - Math.round(ratingInfo.average))}
                  </span>
                </div>
                <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{ratingInfo.count}</strong> user reviews
                </span>
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
              <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleWriteClick}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <MessageSquare size={16} />
                  {userExistingReview ? 'Edit Your Review' : 'Write a Review'}
                </button>
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
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="container" style={{ padding: '48px 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 48 }} className="detail-layout">
          
          {/* Main Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            
            {/* ABOUT THE MOVIE */}
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 16 }}>
                About the Movie
              </h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.85, whiteSpace: 'pre-line' }}>
                {movie.overview}
              </p>
            </div>

            {/* TRAILER EMBED */}
            {embedTrailer && (
              <div>
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

            {/* CAST & DIRECTOR */}
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 16 }}>
                Cast & Filmmakers
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {movie.director && (
                  <div style={{ padding: 14, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 4 }}>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Director</div>
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

            {/* WHAT PEOPLE THINK (REVIEWS SECTION) */}
            <div id="reviews-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                    What People Think
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Real user reviews & visual presentation feedback
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleWriteClick}
                  className="btn btn-outline btn-sm"
                >
                  {userExistingReview ? 'Edit Your Review' : '+ Add Review'}
                </button>
              </div>

              {/* Review Composer Form Modal / Inline */}
              {showComposer && (
                <div style={{ marginBottom: 32 }}>
                  <ReviewComposer
                    movie={movie}
                    existingReview={editingReview}
                    onClose={() => setShowComposer(false)}
                    onSuccess={() => setShowComposer(false)}
                  />
                </div>
              )}

              {/* Rating Summary + Per-Parameter Breakdown */}
              <div style={{ marginBottom: 32 }}>
                <RatingBreakdown reviews={allReviews} />
              </div>

              {/* User's Own Review Display if Logged In & Reviewed */}
              {userExistingReview && !showComposer && (
                <div style={{ marginBottom: 24, padding: 16, background: 'rgba(220,182,91,0.06)', border: '1px solid var(--gold-dim)', borderRadius: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', color: 'var(--gold)', letterSpacing: '0.15em' }}>Your Published Review</span>
                    <button type="button" onClick={() => handleEditClick(userExistingReview)} className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: 10 }}>Edit</button>
                  </div>
                  <ReviewCard review={userExistingReview} onEdit={handleEditClick} onDelete={handleDeleteOwnReview} />
                </div>
              )}

              {/* Sorting Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)' }}>
                  All Reviews ({sortedReviews.length})
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sliders size={13} color="var(--text-muted)" />
                  <select
                    className="input"
                    style={{ width: 'auto', padding: '4px 12px', fontSize: 12 }}
                    value={sortOption}
                    onChange={e => setSortOption(e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="highest">Highest Rated</option>
                    <option value="lowest">Lowest Rated</option>
                    <option value="helpful">Most Helpful</option>
                  </select>
                </div>
              </div>

              {/* Reviews List */}
              {sortedReviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)' }}>
                  <MessageSquare size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                  <h4 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', marginBottom: 6 }}>No Reviews Yet</h4>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Be the first person to share your thoughts on this movie!</p>
                  <button type="button" onClick={handleWriteClick} className="btn btn-primary btn-sm">
                    Write a Review
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {sortedReviews.map(rev => (
                    <ReviewCard
                      key={rev.id}
                      review={rev}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteOwnReview}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Sidebar: Where to Watch & Screen Tech */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

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

            {/* WHERE TO WATCH (THEATERS IN CURRENT CITY) */}
            <div style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <MapPin size={16} color="var(--gold)" />
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                  Where to Watch
                </h3>
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
                {movie.theaters && movie.theaters.length > 0
                  ? <>Confirmed screening at <strong style={{ color: 'var(--text-primary)' }}>{currentCity?.name}</strong>:</>
                  : <>All theaters in <strong style={{ color: 'var(--text-primary)' }}>{currentCity?.name}</strong>:</>
                }
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

          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .detail-layout { grid-template-columns: 1fr !important; }
          .rating-summary-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
