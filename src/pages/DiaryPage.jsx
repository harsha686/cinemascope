import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Star, Trash2, Calendar, Film, RefreshCw } from 'lucide-react';
import { useApp } from '../AppContext';
import * as LibService from '../services/movieLibraryService';
import { fetchFullTmdbMovieDetails } from '../services/tmdbService';

export default function DiaryPage() {
  const { state } = useApp();
  const currentUser = state.currentUser;
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState({ totalEntries: 0, rewatches: 0, thisMonthCount: 0, thisYearCount: 0 });
  const [moviesData, setMoviesData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('all');

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      const d = await LibService.getDiary();
      setEntries(d);
      const s = await LibService.getDiaryStats();
      setStats(s);
      setLoading(false);
    };
    load();
  }, [currentUser]);

  useEffect(() => {
    if (entries.length === 0) return;
    const idsToFetch = [...new Set(entries.map(e => e.tmdb_id).filter(id => id && !moviesData[id]))];
    if (idsToFetch.length === 0) return;
    Promise.all(idsToFetch.map(id => fetchFullTmdbMovieDetails(id).catch(() => null))).then(results => {
      const map = {};
      results.forEach(m => { if (m) map[m.tmdbId] = m; });
      setMoviesData(prev => ({ ...prev, ...map }));
    });
  }, [entries]);

  const handleDelete = async (entryId) => {
    if (!window.confirm('Delete this diary entry?')) return;
    await LibService.deleteDiaryEntry(entryId);
    setEntries(prev => prev.filter(e => e.id !== entryId));
  };

  if (!currentUser) {
    return (
      <div className="container page-enter" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <BookOpen size={48} color="var(--gold)" style={{ marginBottom: 16 }} />
        <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: '1rem', color: 'var(--text-primary)' }}>My Movie Diary</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Your movie diary starts here. Log movies as you watch them to build your personal cinema history.</p>
        <button className="btn btn-primary" onClick={() => navigate('/login')}>Log In</button>
      </div>
    );
  }

  const filteredEntries = selectedYear === 'all'
    ? entries
    : entries.filter(e => {
        const d = new Date(e.watched_on || e.created_at);
        return d.getFullYear() === parseInt(selectedYear);
      });

  const years = [...new Set(entries.map(e => {
    const d = new Date(e.watched_on || e.created_at);
    return d.getFullYear();
  }))].filter(Boolean).sort((a, b) => b - a);

  // Group by month-year
  const grouped = {};
  filteredEntries.forEach(entry => {
    const d = new Date(entry.watched_on || entry.created_at);
    const key = isNaN(d) ? 'Unknown Date' : d.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(entry);
  });

  const formatDate = (iso) => {
    try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return iso; }
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    return (
      <span style={{ color: 'var(--gold)', fontSize: 14 }}>
        {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(5 - full - (half ? 1 : 0))}
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>{rating}/5</span>
      </span>
    );
  };

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ padding: '60px 24px 40px', borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(to bottom, rgba(220,182,91,0.03), transparent)' }}>
        <div className="container" style={{ maxWidth: 960 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <BookOpen size={28} color="var(--gold)" />
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--text-primary)' }}>My Movie Diary</h1>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 13 }}>
                {stats.totalEntries} entries · {stats.thisYearCount} this year · {stats.rewatches} rewatches
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <select
                className="input"
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                style={{ minWidth: 120, fontSize: 12, background: '#18140e', color: '#ffffff' }}
              >
                <option value="all" style={{ background: '#18140e', color: '#ffffff' }}>All Years</option>
                {years.map(y => <option key={y} value={y} style={{ background: '#18140e', color: '#ffffff' }}>{y}</option>)}
              </select>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/discover')}>
                <Film size={14} /> Discover Movies
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="container" style={{ maxWidth: 960, padding: '24px 24px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {[
            { label: 'Total Entries', value: stats.totalEntries },
            { label: 'This Year', value: stats.thisYearCount },
            { label: 'This Month', value: stats.thisMonthCount },
            { label: 'Rewatches', value: stats.rewatches },
          ].map(s => (
            <div key={s.label} style={{ padding: '14px 18px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', textAlign: 'center', borderRadius: 4 }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--gold)', fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Diary Entries */}
      <div className="container" style={{ maxWidth: 960, padding: '32px 24px 80px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
            <p>Loading your diary…</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 4 }}>
            <BookOpen size={40} color="var(--text-muted)" style={{ marginBottom: 16 }} />
            <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', marginBottom: 8 }}>Your movie diary starts here</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 13 }}>Record the movies you've watched and build your personal cinema history.</p>
            <button className="btn btn-primary" onClick={() => navigate('/discover')}>Explore Movies</button>
          </div>
        ) : (
          Object.entries(grouped).map(([monthYear, monthEntries]) => (
            <div key={monthYear} style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border-subtle)' }}>
                <Calendar size={14} color="var(--gold)" />
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--text-primary)', letterSpacing: '0.08em' }}>{monthYear}</h3>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '2px 8px', borderRadius: 20, border: '1px solid var(--border-subtle)' }}>
                  {monthEntries.length} {monthEntries.length === 1 ? 'film' : 'films'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {monthEntries.map(entry => {
                  const movie = moviesData[entry.tmdb_id];
                  return (
                    <div key={entry.id} style={{ display: 'flex', gap: 16, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: 16, alignItems: 'flex-start' }}>
                      {/* Poster */}
                      <div style={{ flexShrink: 0, width: 60, height: 90, background: 'rgba(0,0,0,0.3)', borderRadius: 3, overflow: 'hidden' }}>
                        {movie?.posterUrl ? (
                          <img src={movie.posterUrl} alt={entry.movie_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Film size={20} color="var(--text-muted)" />
                          </div>
                        )}
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                          <div>
                            <Link to={`/movie/tmdb-${entry.tmdb_id}`} style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'none' }}>
                              {entry.movie_title || movie?.title || 'Unknown Movie'}
                            </Link>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Calendar size={10} /> {formatDate(entry.watched_on)}
                              </span>
                              {entry.is_rewatch && (
                                <span style={{ fontSize: 10, background: 'rgba(220,182,91,0.15)', color: 'var(--gold)', border: '1px solid var(--gold-dim)', padding: '1px 6px', borderRadius: 10 }}>
                                  Rewatch
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                            title="Delete entry"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {entry.personal_rating && <div style={{ marginTop: 6 }}>{renderStars(entry.personal_rating)}</div>}
                        {entry.review_text && (
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6 }}>
                            "{entry.review_text}"
                          </p>
                        )}
                        {entry.tags && entry.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                            {(Array.isArray(entry.tags) ? entry.tags : entry.tags.split(',')).map(tag => (
                              <span key={tag} style={{ fontSize: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: 10 }}>
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
