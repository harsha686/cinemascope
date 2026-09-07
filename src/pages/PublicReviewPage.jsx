import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, ShieldCheck, ArrowLeft, Calendar, Film, MessageSquare, Heart, Clock } from 'lucide-react';
import { useApp } from '../AppContext';
import ShareButton from '../components/social/ShareButton';
import SocialMetaTags from '../components/social/SocialMetaTags';
import { SOCIAL_CONTENT_TYPES } from '../services/socialSharingService';

export default function PublicReviewPage() {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const { state, isVerifiedPro } = useApp();

  // Find review in state or localStorage
  const review = useMemo(() => {
    return state.reviews?.find(r => r.id === reviewId) || null;
  }, [state.reviews, reviewId]);

  const movie = useMemo(() => {
    if (!review) return null;
    const cleanId = String(review.movieId || '').replace('tmdb-', '');
    return state.movies?.find(m => String(m.id).replace('tmdb-', '') === cleanId) || null;
  }, [state.movies, review]);

  const isPro = review ? isVerifiedPro(review.userId) : false;

  if (!review) {
    return (
      <div className="container page-enter" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)', marginBottom: 12 }}>
          Review Not Found
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          This review may be private or has been moved.
        </p>
        <button onClick={() => navigate('/discover')} className="btn btn-outline">
          Explore Movies
        </button>
      </div>
    );
  }

  const shareData = {
    ...review,
    movieTitle: movie?.title || review.movieTitle || 'Featured Film',
    posterUrl: movie?.posterUrl || review.posterUrl,
    releaseYear: movie?.releaseYear || '',
    isVerifiedPro: isPro,
  };

  const starCount = Math.floor(review.rating || 5);

  return (
    <div className="page-enter" style={{ minHeight: '85vh', padding: '50px 24px 80px' }}>
      <SocialMetaTags
        contentType={SOCIAL_CONTENT_TYPES.REVIEW}
        data={shareData}
      />

      <div className="container" style={{ maxWidth: 760 }}>
        {/* Navigation Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={14} /> Back
          </button>

          {/* Primary Share Action */}
          <ShareButton
            contentType={SOCIAL_CONTENT_TYPES.REVIEW}
            data={shareData}
            variant="primary"
            size="md"
            customLabel="✨ Create Aesthetic Card"
          />
        </div>

        {/* Main Review Presentation Card */}
        <div style={{
          background: 'var(--bg-card, #121218)',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        }}>
          {/* Header with Movie Context */}
          <div style={{
            padding: '24px 28px',
            background: 'linear-gradient(135deg, rgba(201,168,76,0.1) 0%, rgba(10,10,12,0.9) 100%)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: 20,
            alignItems: 'center',
          }}>
            {shareData.posterUrl && (
              <img
                src={shareData.posterUrl}
                alt={shareData.movieTitle}
                style={{
                  width: 70,
                  aspectRatio: '2/3',
                  objectFit: 'cover',
                  borderRadius: 4,
                  border: '1px solid var(--gold-dim, rgba(201,168,76,0.3))',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                }}
                onError={e => { e.target.src = '/demo-frame.jpg'; }}
              />
            )}

            <div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)' }}>
                Film Review & Analysis
              </div>
              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(20px, 3.5vw, 28px)',
                color: 'var(--text-primary)',
                margin: '2px 0 6px',
              }}>
                {shareData.movieTitle}
              </h1>
              {movie?.id && (
                <Link
                  to={`/movie/${movie.id}`}
                  style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <Film size={12} /> View Complete Movie Page →
                </Link>
              )}
            </div>
          </div>

          {/* Review Body */}
          <div style={{ padding: '28px 32px' }}>
            {/* Reviewer Meta Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: 'var(--gold-faint)',
                  border: '1px solid var(--gold-dim)',
                  color: 'var(--gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 16,
                }}>
                  {(review.userDisplayName || 'A').charAt(0).toUpperCase()}
                </div>

                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{review.userDisplayName || 'Anonymous Critic'}</span>
                    {isPro && (
                      <span className="badge badge-verified" style={{ fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <ShieldCheck size={11} /> Verified Critic
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recent'}
                  </div>
                </div>
              </div>

              {/* Star Score */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: 2, color: 'var(--gold)' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      fill={i < starCount ? 'var(--gold)' : 'none'}
                      color="var(--gold)"
                    />
                  ))}
                </div>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {review.rating} <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/ 5</span>
                </span>
              </div>
            </div>

            {/* Review Text */}
            <div style={{
              fontSize: 16,
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-wrap',
              borderLeft: '3px solid var(--gold-dim)',
              paddingLeft: 18,
              margin: '20px 0',
            }}>
              {review.reviewText || review.review || review.content || 'Great experience watching this title.'}
            </div>

            {/* Parameter Ratings if present */}
            {review.parameterRatings && Object.keys(review.parameterRatings).length > 0 && (
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                  Aspect Ratings
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                  {Object.entries(review.parameterRatings).map(([param, val]) => val > 0 && (
                    <div key={param} style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: 4, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{param}</span>
                      <strong style={{ color: 'var(--gold)' }}>{val}/5</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
