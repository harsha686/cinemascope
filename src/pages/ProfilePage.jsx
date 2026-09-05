import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, LogOut, ShieldAlert, Star, Film, MessageSquare, ChevronRight, Bookmark, Heart, BookOpen, Folder } from 'lucide-react';
import { useApp } from '../AppContext';
import ReviewCard from '../components/reviews/ReviewCard';
import * as LibService from '../services/movieLibraryService';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { state, dispatch, getMovie } = useApp();
  const currentUser = state.currentUser;

  const [libStats, setLibStats] = useState({ totalWatchlist: 0, totalWatched: 0, totalFavorites: 0, totalRated: 0, avgRating: 0 });
  const [diaryStats, setDiaryStats] = useState({ totalEntries: 0, thisYearCount: 0, thisMonthCount: 0, rewatches: 0 });
  const [collectionsCount, setCollectionsCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      const [ls, ds, cols] = await Promise.all([
        LibService.getLibraryStats(),
        LibService.getDiaryStats(),
        LibService.getCollections(),
      ]);
      setLibStats(ls);
      setDiaryStats(ds);
      setCollectionsCount(cols.length);
    };
    load();
  }, [currentUser]);

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
    try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch (e) { return 'Recent Member'; }
  };

  const statCards = [
    { label: 'Movies Watched', value: libStats.totalWatched, icon: <Film size={18} color="var(--gold)" />, link: '/library/watched' },
    { label: 'Watchlist', value: libStats.totalWatchlist, icon: <Bookmark size={18} color="var(--gold)" />, link: '/watchlist' },
    { label: 'Favorites', value: libStats.totalFavorites, icon: <Heart size={18} color="var(--gold)" />, link: '/library/favorites' },
    { label: 'Movies Rated', value: libStats.totalRated, icon: <Star size={18} color="var(--gold)" />, link: '/library' },
    { label: 'Diary Entries', value: diaryStats.totalEntries, icon: <BookOpen size={18} color="var(--gold)" />, link: '/diary' },
    { label: 'Collections', value: collectionsCount, icon: <Folder size={18} color="var(--gold)" />, link: '/library/collections' },
    { label: 'Reviews Written', value: userReviews.length, icon: <MessageSquare size={18} color="var(--gold)" />, link: '/profile' },
  ];

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ padding: '60px 24px 40px', borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(to bottom, rgba(220,182,91,0.03), transparent)' }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'var(--gold-faint)', border: '2px solid var(--gold-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--gold)',
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
                  Member since {formatDate(currentUser.createdAt)} · <span style={{ color: 'var(--text-secondary)' }}>{currentUser.email}</span>
                </div>
                {libStats.avgRating > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    Avg rating: <span style={{ color: 'var(--gold)' }}>★ {libStats.avgRating}</span>
                    {diaryStats.rewatches > 0 && ` · ${diaryStats.rewatches} rewatches`}
                    {diaryStats.thisYearCount > 0 && ` · ${diaryStats.thisYearCount} films this year`}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/library" className="btn btn-outline btn-sm">
                <Film size={14} /> My Library
              </Link>
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

      {/* Stats Grid */}
      <div className="container" style={{ maxWidth: 900, padding: '32px 24px 0' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 14, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
          My Movie Archive
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 40 }}>
          {statCards.map(card => (
            <Link key={card.label} to={card.link} style={{ padding: '16px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', textAlign: 'center', textDecoration: 'none', borderRadius: 4, transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold-dim)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
            >
              <div style={{ marginBottom: 6 }}>{card.icon}</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--gold)', fontWeight: 700 }}>
                {card.value}
              </div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>
                {card.label}
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
          <Link to="/discover" className="btn btn-primary btn-sm">Discover Movies</Link>
          <Link to="/library" className="btn btn-outline btn-sm">My Library</Link>
          <Link to="/diary" className="btn btn-outline btn-sm">Movie Diary</Link>
          <Link to="/watchlist" className="btn btn-outline btn-sm">Watchlist</Link>
        </div>

        {/* User Reviews List */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--text-primary)', marginBottom: 20 }}>
            Your Reviews &amp; Ratings
          </h2>

          {userReviews.length === 0 ? (
            <div style={{ padding: '48px 24px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <MessageSquare size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
              <h4 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', marginBottom: 6 }}>You haven't written any reviews yet</h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Browse movies to rate and share your thoughts!</p>
              <button onClick={() => navigate('/discover')} className="btn btn-primary btn-sm">
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

      <div style={{ height: 80 }} />
    </div>
  );
}
