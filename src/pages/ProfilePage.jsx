import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, LogOut, ShieldAlert, Star, Film, MessageSquare, ChevronRight } from 'lucide-react';
import { useApp } from '../AppContext';
import ReviewCard from '../components/reviews/ReviewCard';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { state, dispatch, getMovie } = useApp();
  const currentUser = state.currentUser;

  const userReviews = useMemo(() => {
    if (!currentUser) return [];
    return state.reviews.filter(r => r.userId === currentUser.id);
  }, [state.reviews, currentUser]);

  if (!currentUser) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>Access Restricted</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>Please log in to view your profile.</p>
        <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ marginTop: 24 }}>
          Log In
        </button>
      </div>
    );
  }

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/');
  };

  const formatDate = (iso) => {
    if (!iso) return 'Recent Member';
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return 'Recent Member';
    }
  };

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ padding: '60px 24px 40px', borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(to bottom, rgba(220,182,91,0.03), transparent)' }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--gold-faint)',
                border: '2px solid var(--gold-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontFamily: 'var(--font-serif)',
                fontWeight: 700,
                color: 'var(--gold)',
              }}>
                {currentUser.displayName.charAt(0).toUpperCase()}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--text-primary)' }}>
                    {currentUser.displayName}
                  </h1>
                  {currentUser.role === 'ADMIN' && (
                    <span className="badge badge-gold" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ShieldAlert size={10} /> ADMIN
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Member since {formatDate(currentUser.createdAt)} • Email: <span style={{ color: 'var(--text-secondary)' }}>{currentUser.email}</span> (Private)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              {currentUser.role === 'ADMIN' && (
                <Link to="/admin" className="btn btn-outline btn-sm">
                  <ShieldAlert size={14} /> Admin Dashboard
                </Link>
              )}
              <button type="button" onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ color: '#f87171' }}>
                <LogOut size={14} /> Log Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats & Reviews */}
      <div className="container" style={{ padding: '40px 24px 80px', maxWidth: 900 }}>
        
        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 40 }}>
          <div style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 32, color: 'var(--gold)', fontWeight: 700 }}>
              {userReviews.length}
            </div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>
              Reviews Written
            </div>
          </div>
        </div>

        {/* User Reviews List */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--text-primary)', marginBottom: 20 }}>
            Your Reviews & Ratings
          </h2>

          {userReviews.length === 0 ? (
            <div style={{ padding: '48px 24px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <MessageSquare size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
              <h4 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', marginBottom: 6 }}>You haven't written any reviews yet</h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Browse currently showing movies to rate and share your thoughts!</p>
              <button onClick={() => navigate('/movies')} className="btn btn-primary btn-sm">
                Explore Movies
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {userReviews.map(rev => {
                const targetMovie = getMovie(rev.movieId);
                return (
                  <div key={rev.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: 20, borderRadius: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
                      <Link to={`/movie/${rev.movieId}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                        <Film size={16} color="var(--gold)" />
                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text-primary)', fontWeight: 600 }}>
                          {targetMovie?.title || rev.movieId}
                        </span>
                        <ChevronRight size={14} color="var(--gold)" />
                      </Link>
                      <span className="badge badge-verified" style={{ fontSize: 9 }}>{rev.status}</span>
                    </div>

                    <ReviewCard
                      review={rev}
                      onEdit={() => navigate(`/movie/${rev.movieId}`)}
                      onDelete={(id) => dispatch({ type: 'DELETE_REVIEW', payload: id })}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
