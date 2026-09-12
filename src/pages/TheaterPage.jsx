import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Monitor, ChevronRight, GitCompare, Edit3, Star, MessageSquare, ShieldCheck, Sliders, PenSquare } from 'lucide-react';
import YoutubeIcon from '../components/shared/YoutubeIcon';
import { useApp } from '../AppContext';
import TheaterMap from '../components/city/TheaterMap';
import AdminTheaterFormModal from '../components/admin/AdminTheaterFormModal';
import { getFormat } from '../data/formats';
import RatingBreakdown from '../components/reviews/RatingBreakdown';
import ReviewCard from '../components/reviews/ReviewCard';
import ProfessionalReviewCard from '../components/reviews/ProfessionalReviewCard';
import ReviewTabs from '../components/reviews/ReviewTabs';
import ReviewComposer from '../components/reviews/ReviewComposer';


function ScreenMiniCard({ screen, theaterId }) {
  const navigate = useNavigate();
  const fmt = getFormat(screen.aspectRatio);
  const screenH = 80 / screen.aspectRatioNumeric;

  return (
    <div
      onClick={() => navigate(`/theater/${theaterId}/screen/${screen.id}`)}
      style={{
        border: '1px solid var(--border-subtle)',
        background: 'var(--bg-card)',
        padding: 20,
        cursor: 'pointer',
        transition: 'all var(--transition-base)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow-gold)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Screen shape preview */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px 0' }}>
        <div style={{
          width: 80,
          height: screenH,
          background: 'rgba(201,168,76,0.08)',
          border: '1px solid var(--gold-dim)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all var(--transition-ratio)',
        }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 8, color: 'var(--gold)', letterSpacing: '0.08em' }}>
            {screen.aspectRatio}
          </span>
        </div>
      </div>

      {/* Info */}
      <div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 4 }}>
          {screen.name}
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--gold)', letterSpacing: '0.05em', marginBottom: 4 }}>
          {screen.aspectRatio}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {screen.formatName}
        </div>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {screen.dolbyAtmos && <span className="badge badge-gold">Dolby Atmos</span>}
        {screen.projection?.includes('Laser') && <span className="badge badge-dim">Laser</span>}
        {screen.resolution?.includes('4096') && <span className="badge badge-dim">4K</span>}
        {screen.capacity && <span className="badge badge-dim">{screen.capacity} seats</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--gold)', fontSize: 10, fontFamily: 'var(--font-serif)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        View Screen <ChevronRight size={11} />
      </div>
    </div>
  );
}

export default function TheaterPage() {
  const { theaterId } = useParams();
  const navigate = useNavigate();
  const {
    getTheater,
    getCity,
    state,
    dispatch,
    allCities,
    getTheaterReviews,
    getTheaterUserReviews,
    getTheaterProfessionalReviews,
    getTheaterRating,
    getTheaterProfessionalRating,
    getUserReviewForTheater,
    isVerifiedPro,
  } = useApp();

  const currentUser = state.currentUser;
  const isAdmin = currentUser && currentUser.role === 'ADMIN';
  const currentUserIsPro = currentUser && isVerifiedPro ? isVerifiedPro(currentUser.id) : false;

  const theater = getTheater(theaterId);
  const city = theater ? getCity(theater.cityId) : null;

  const [activeTab, setActiveTab] = useState('screens');
  const [showEditModal, setShowEditModal] = useState(false);

  // Review states
  const [showComposer, setShowComposer] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewTab, setReviewTab] = useState('all'); // 'all' | 'audience' | 'professional'
  const [sortOption, setSortOption] = useState('newest');
  const [submitAsPro, setSubmitAsPro] = useState(currentUserIsPro);

  const theaterRatingInfo = useMemo(() => getTheaterRating(theaterId), [getTheaterRating, theaterId]);
  const theaterProRatingInfo = useMemo(() => getTheaterProfessionalRating(theaterId), [getTheaterProfessionalRating, theaterId]);
  const allTheaterReviews = useMemo(() => getTheaterReviews(theaterId), [getTheaterReviews, theaterId]);
  const userTheaterReviews = useMemo(() => getTheaterUserReviews(theaterId), [getTheaterUserReviews, theaterId]);
  const proTheaterReviews = useMemo(() => getTheaterProfessionalReviews(theaterId), [getTheaterProfessionalReviews, theaterId]);
  const userExistingReview = useMemo(() => currentUser ? getUserReviewForTheater(currentUser.id, theaterId) : null, [getUserReviewForTheater, currentUser, theaterId]);

  const activeReviews = useMemo(() => {
    if (reviewTab === 'audience') return userTheaterReviews;
    if (reviewTab === 'professional') return proTheaterReviews;
    return allTheaterReviews;
  }, [reviewTab, allTheaterReviews, userTheaterReviews, proTheaterReviews]);

  const sortedReviews = useMemo(() => {
    const list = [...activeReviews];
    if (sortOption === 'newest') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sortOption === 'highest') list.sort((a, b) => b.rating - a.rating);
    else if (sortOption === 'lowest') list.sort((a, b) => a.rating - b.rating);
    else if (sortOption === 'helpful') list.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    return list;
  }, [activeReviews, sortOption]);

  const handleWriteClick = () => {
    if (!currentUser) {
      navigate('/login', { state: { from: `/theater/${theaterId}` } });
      return;
    }
    setActiveTab('reviews');
    if (userExistingReview) {
      setEditingReview(userExistingReview);
      setSubmitAsPro(userExistingReview.reviewType === 'PROFESSIONAL' || (currentUserIsPro && userExistingReview.reviewType !== 'USER'));
    } else {
      setEditingReview(null);
      setSubmitAsPro(currentUserIsPro);
    }
    setShowComposer(true);
    setTimeout(() => {
      const elem = document.getElementById('theater-review-composer') || document.getElementById('theater-reviews-section');
      if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleEditClick = (rev) => {
    setActiveTab('reviews');
    setEditingReview(rev);
    setSubmitAsPro(rev.reviewType === 'PROFESSIONAL' || (currentUserIsPro && rev.reviewType !== 'USER'));
    setShowComposer(true);
    setTimeout(() => {
      const elem = document.getElementById('theater-review-composer') || document.getElementById('theater-reviews-section');
      if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleDeleteOwnReview = (reviewId) => {
    dispatch({ type: 'DELETE_REVIEW', payload: reviewId });
    setEditingReview(null);
  };

  const handleSaveTheater = (theaterObj) => {
    dispatch({ type: 'UPDATE_THEATER', payload: theaterObj });
    setShowEditModal(false);
  };

  if (!theater) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>Theater Not Found</h1>
        <button onClick={() => navigate('/')} className="btn btn-outline" style={{ marginTop: 24 }}>← Back Home</button>
      </div>
    );
  }

  const tabs = [
    { id: 'screens', label: 'Screens' },
    { id: 'reviews', label: `Reviews (${allTheaterReviews.length})` },
    { id: 'about', label: 'About' },
    { id: 'map', label: 'Location' },
  ];

  return (
    <div className="page-enter">
      {/* Hero */}
      <div style={{
        padding: '60px 24px 40px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'linear-gradient(135deg, rgba(201,168,76,0.04) 0%, transparent 60%)',
        position: 'relative',
      }}>
        <div className="container">
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            <Link to="/" style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
            <span style={{ color: 'var(--border)', fontSize: 10 }}>/</span>
            {city && <Link to={`/city/${city.id}`} style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none' }}>{city.name}</Link>}
            <span style={{ color: 'var(--border)', fontSize: 10 }}>/</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{theater.name}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                <span className="badge badge-dim" style={{ fontSize: 9 }}>
                  {theater.type === 'single-screen' ? 'Single Screen' : theater.type === 'multiplex' ? 'Multiplex' : 'Twin Cinema'}
                </span>
                {theater.chain && theater.chain !== 'Independent' && (
                  <span className="badge badge-gold" style={{ fontSize: 9 }}>{theater.chain}</span>
                )}
              </div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(24px, 4vw, 42px)', color: 'var(--text-primary)', letterSpacing: '0.04em', lineHeight: 1.1, marginBottom: 10 }}>
                {theater.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <MapPin size={12} color="var(--text-muted)" />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{theater.address}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Monitor size={12} color="var(--text-muted)" />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{theater.totalScreens} Screen{theater.totalScreens > 1 ? 's' : ''}</span>
                </div>

                {/* Rating Badge in Hero */}
                {theaterRatingInfo.count > 0 ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('reviews')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '3px 10px',
                      background: 'rgba(201,168,76,0.12)',
                      border: '1px solid var(--gold-dim)',
                      borderRadius: 20,
                      cursor: 'pointer',
                      color: 'var(--gold)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Star size={12} fill="var(--gold)" color="var(--gold)" />
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-serif)' }}>
                      {theaterRatingInfo.average}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      ({theaterRatingInfo.count} review{theaterRatingInfo.count !== 1 ? 's' : ''})
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleWriteClick}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '3px 10px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 20,
                      cursor: 'pointer',
                      fontSize: 11,
                      color: 'var(--text-muted)',
                    }}
                  >
                    <Star size={11} color="var(--text-muted)" />
                    <span>No reviews yet · Rate theater</span>
                  </button>
                )}

                {theaterProRatingInfo.count > 0 && (
                  <button
                    type="button"
                    onClick={() => { setActiveTab('reviews'); setReviewTab('professional'); }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '3px 10px',
                      background: 'rgba(16,185,129,0.1)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      borderRadius: 20,
                      cursor: 'pointer',
                      color: '#10b981',
                    }}
                  >
                    <ShieldCheck size={12} color="#10b981" />
                    <span style={{ fontSize: 12, fontWeight: 700 }}>
                      ★ {theaterProRatingInfo.average}
                    </span>
                    <span style={{ fontSize: 11, color: '#10b981' }}>
                      ({theaterProRatingInfo.count} critic{theaterProRatingInfo.count !== 1 ? 's' : ''})
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={handleWriteClick}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <PenSquare size={13} />
                Rate & Review
              </button>

              {isAdmin && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="btn btn-outline btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Edit3 size={13} />
                  Edit Theater
                </button>
              )}
              <button
                onClick={() => navigate('/compare')}
                className="btn btn-outline btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <GitCompare size={13} />
                Compare
              </button>
              {theater.dataSource?.includes('TheatreBabu') && (
                <a
                  href="https://youtube.com/@theatrebabu9796"
                  target="_blank" rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <YoutubeIcon size={13} />
                  Source
                </a>
              )}
            </div>
          </div>

          {/* Feature badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
            {theater.features?.map(f => (
              <span key={f} style={{
                padding: '3px 10px',
                background: 'rgba(201,168,76,0.08)',
                border: '1px solid var(--border-subtle)',
                fontSize: 10,
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-serif)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}>{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.3)' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '14px 24px',
                  fontFamily: 'var(--font-serif)',
                  fontSize: 10,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: activeTab === tab.id ? 'var(--gold)' : 'var(--text-muted)',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid var(--gold)' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all var(--transition-base)',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container" style={{ padding: '32px 24px' }}>
        {/* SCREENS TAB */}
        {activeTab === 'screens' && (
          <div>
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 14, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 4 }}>
                  Choose Your Screen
                </h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Select a screen to view its aspect ratio, projection, and sound specifications</p>
              </div>
            </div>

            {theater.screens?.length === 1 ? (
              // Single screen — auto-redirect
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, fontFamily: 'var(--font-italic)' }}>
                  This is a single-screen theater.
                </p>
                <ScreenMiniCard screen={theater.screens[0]} theaterId={theaterId} />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {theater.screens?.map(screen => (
                  <ScreenMiniCard key={screen.id} screen={screen} theaterId={theaterId} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div id="theater-reviews-section" style={{ maxWidth: 880 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                  Audience & Critic Reviews
                </h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Ratings for screen projection, sound, seating comfort, ambience & overall cinema value
                </p>
              </div>

              {!showComposer && (
                <button
                  type="button"
                  onClick={handleWriteClick}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <PenSquare size={13} />
                  {userExistingReview ? 'Edit Your Review' : 'Write a Review'}
                </button>
              )}
            </div>

            {/* Dual Rating Summary Bar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              {/* Community Rating */}
              <div style={{
                flex: 1, minWidth: 160, padding: '14px 18px',
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  👥 Community Rating
                </div>
                {userTheaterReviews.length > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-serif)' }}>
                      ★ {theaterRatingInfo.average}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      / 5 · {userTheaterReviews.length} review{userTheaterReviews.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No audience reviews yet</div>
                )}
              </div>

              {/* Professional Rating */}
              <div style={{
                flex: 1, minWidth: 160, padding: '14px 18px',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(5,150,105,0.02))',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 'var(--radius-sm)',
              }}>
                <div style={{ fontSize: 11, color: '#10b981', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={13} /> Professional Critic Rating
                </div>
                {theaterProRatingInfo.count > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 26, fontWeight: 700, color: '#10b981', fontFamily: 'var(--font-serif)' }}>
                      ★ {theaterProRatingInfo.average}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      / 5 · {theaterProRatingInfo.count} critic{theaterProRatingInfo.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No critic reviews yet</div>
                )}
              </div>
            </div>

            {/* Review Composer Form */}
            {showComposer && (
              <div id="theater-review-composer" style={{ marginBottom: 32 }}>
                {currentUserIsPro && (
                  <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ShieldCheck size={14} color="#10b981" />
                    <span style={{ fontSize: 12, color: '#10b981', flex: 1 }}>Submit as Professional Theater Review</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input type="checkbox" checked={submitAsPro} onChange={e => setSubmitAsPro(e.target.checked)} />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{submitAsPro ? 'Professional ✓' : 'User Review'}</span>
                    </label>
                  </div>
                )}
                <ReviewComposer
                  theater={theater}
                  existingReview={editingReview}
                  reviewType={submitAsPro && currentUserIsPro ? 'PROFESSIONAL' : 'USER'}
                  onClose={() => setShowComposer(false)}
                  onSuccess={() => setShowComposer(false)}
                />
              </div>
            )}

            {/* Cinema Parameter Breakdown */}
            {allTheaterReviews.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <RatingBreakdown reviews={allTheaterReviews} targetType="THEATER" />
              </div>
            )}

            {/* User's Own Review Display */}
            {userExistingReview && !showComposer && (
              <div style={{ marginBottom: 28, padding: 18, background: 'rgba(220,182,91,0.06)', border: '1px solid var(--gold-dim)', borderRadius: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', color: 'var(--gold)', letterSpacing: '0.15em' }}>Your Published Review</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => handleEditClick(userExistingReview)} className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: 11 }}>Edit</button>
                    <button type="button" onClick={() => handleDeleteOwnReview(userExistingReview.id)} className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: 11, color: '#f87171' }}>Delete</button>
                  </div>
                </div>
                {userExistingReview.reviewType === 'PROFESSIONAL' ? (
                  <ProfessionalReviewCard review={userExistingReview} onEdit={handleEditClick} onDelete={handleDeleteOwnReview} />
                ) : (
                  <ReviewCard review={userExistingReview} onEdit={handleEditClick} onDelete={handleDeleteOwnReview} />
                )}
              </div>
            )}

            {/* Review Tabs (All, Audience, Professional) + Sort Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
              <ReviewTabs
                activeTab={reviewTab}
                onChange={setReviewTab}
                userCount={userTheaterReviews.length}
                proCount={proTheaterReviews.length}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sliders size={13} color="var(--text-muted)" />
                <select
                  className="input"
                  style={{ width: 'auto', padding: '5px 12px', fontSize: 12, background: '#18140e', color: '#ffffff' }}
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

            {/* Review Cards List or Empty State */}
            {sortedReviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: 6 }}>
                <MessageSquare size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                <h4 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  {reviewTab === 'professional' ? 'No Professional Reviews Yet' : 'No Theater Reviews Yet'}
                </h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>
                  {reviewTab === 'professional'
                    ? 'No verified film critics have reviewed this theater yet.'
                    : 'Be the first to share your projection, sound, and seating experience at this theater!'}
                </p>
                {reviewTab !== 'professional' && !showComposer && (
                  <button type="button" onClick={handleWriteClick} className="btn btn-primary btn-sm">Rate This Theater</button>
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

        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <div style={{ maxWidth: 680 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 14, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 16 }}>
              About This Theater
            </h2>
            <p style={{ fontFamily: 'var(--font-italic)', fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.9, marginBottom: 24 }}>
              {theater.description}
            </p>
            <div style={{ border: '1px solid var(--border-subtle)', padding: '16px 20px', background: 'rgba(0,0,0,0.3)' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Data Information</div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Data sourced from: <strong style={{ color: 'var(--text-primary)' }}>{theater.dataSource}</strong><br />
                Confidence level: <strong style={{ color: 'var(--text-primary)' }}>{theater.sourceConfidence}</strong><br />
                Officially verified: <strong style={{ color: 'var(--text-primary)' }}>{theater.verified ? 'Yes' : 'No'}</strong>
              </p>
            </div>
          </div>
        )}

        {/* MAP TAB */}
        {activeTab === 'map' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 14, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 16 }}>
              Location
            </h2>
            <TheaterMap
              theaters={[theater]}
              selectedId={theater.id}
              cityLat={theater.latitude}
              cityLng={theater.longitude}
            />
            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
              {theater.address}
            </div>
          </div>
        )}
      </div>

      {/* Admin Theater Form Modal */}
      {isAdmin && (
        <AdminTheaterFormModal
          key={theater ? `edit-${theater.id}` : 'new-theater'}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveTheater}
          theaterToEdit={theater}
          allCities={allCities}
          defaultCityId={theater.cityId}
        />
      )}
    </div>
  );
}
