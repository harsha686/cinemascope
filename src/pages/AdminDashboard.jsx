import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Film, MessageSquare, Users, MapPin, Plus, Search, Edit3, Trash2, CheckCircle2, EyeOff, Sparkles, AlertCircle, ArrowLeft, ExternalLink, Check, Image as ImageIcon, Database, RefreshCw, ShieldCheck } from 'lucide-react';
import { useApp } from '../AppContext';
import TMDBImportHelper from '../components/admin/TMDBImportHelper';
import XPosterDiscoveryModal from '../components/admin/XPosterDiscoveryModal';
import { isSupabaseConfigured, setCustomSupabaseCredentials, supabaseService } from '../services/supabase';
import { getApplications, updateApplicationStatus } from '../services/proReviewerService';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { state, dispatch, allCities, allTheaters, getMovieRating } = useApp();

  const currentUser = state.currentUser;
  const isAdmin = currentUser && currentUser.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState('movies'); // 'movies' | 'reviews' | 'users' | 'cities' | 'pro-reviewers'
  const [movieSearch, setMovieSearch] = useState('');
  const [movieStatusFilter, setMovieStatusFilter] = useState('all');

  // Add / Edit Movie Modal & Wizard State
  const [showMovieForm, setShowMovieForm] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState(null);
  const [formStep, setFormStep] = useState(1); // 1: Metadata | 2: Poster & X Discovery | 3: Cities & Status

  // X Discovery Modal state
  const [showXModal, setShowXModal] = useState(false);

  const emptyMovieForm = {
    title: '',
    originalTitle: '',
    posterUrl: '',
    posterSource: 'TMDB',
    posterSourceType: 'OFFICIAL',
    sourcePlatform: 'TMDB',
    sourceAccount: '',
    sourcePostUrl: '',
    sourcePostId: '',
    posterVerified: false,
    backdropUrl: '',
    language: 'Telugu',
    runtime: '2h 30m',
    releaseDate: new Date().toISOString().split('T')[0],
    genres: 'Action, Drama',
    overview: '',
    cast: 'Actor 1, Actor 2',
    director: 'Director Name',
    certificate: 'U/A',
    trailerUrl: '',
    aspectRatio: '2.39:1',
    status: 'CURRENTLY_SHOWING',
    cities: ['visakhapatnam'],
    theaters: [],
    posterHistory: [],
  };

  const [formData, setFormData] = useState(emptyMovieForm);
  const [cityInput, setCityInput] = useState('');
  const [sbUrl, setSbUrl] = useState(localStorage.getItem('cinemascope_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '');
  const [sbKey, setSbKey] = useState(localStorage.getItem('cinemascope_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '');
  const [sbStatusMsg, setSbStatusMsg] = useState('');
  const [sbLoading, setSbLoading] = useState(false);

  // If not admin, render secure login gate
  if (!isAdmin) {
    return (
      <div className="page-enter" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ maxWidth: 440, width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 32, borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#f87171' }}>
            <ShieldAlert size={24} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 22, color: 'var(--text-primary)', marginBottom: 8 }}>Admin Access Restricted</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
            Public access to the Admin Portal is restricted. You must log in with an authorized Administrator account to continue.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => navigate('/login', { state: { from: '/admin' } })}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Log in to Admin Account
            </button>
            <button onClick={() => navigate('/')} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
              ← Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtered movies
  const filteredMovies = state.movies.filter(m => {
    const q = movieSearch.toLowerCase();
    const matchQuery = !q || m.title.toLowerCase().includes(q) || (m.language && m.language.toLowerCase().includes(q));
    const matchStatus = movieStatusFilter === 'all' || m.status === movieStatusFilter;
    return matchQuery && matchStatus;
  });

  const handleOpenAddMovie = () => {
    setEditingMovieId(null);
    setFormData(emptyMovieForm);
    setFormStep(1);
    setShowMovieForm(true);
  };

  const handleOpenEditMovie = (m) => {
    setEditingMovieId(m.id);
    setFormData({
      title: m.title || '',
      originalTitle: m.originalTitle || '',
      posterUrl: m.posterUrl || '',
      posterSource: m.posterSource || 'TMDB',
      posterSourceType: m.posterSourceType || 'OFFICIAL',
      sourcePlatform: m.sourcePlatform || 'TMDB',
      sourceAccount: m.sourceAccount || '',
      sourcePostUrl: m.sourcePostUrl || '',
      sourcePostId: m.sourcePostId || '',
      posterVerified: m.posterVerified || false,
      backdropUrl: m.backdropUrl || '',
      language: m.language || 'Telugu',
      runtime: m.runtime || '2h 30m',
      releaseDate: m.releaseDate || '',
      genres: Array.isArray(m.genres) ? m.genres.join(', ') : m.genres || '',
      overview: m.overview || '',
      cast: Array.isArray(m.cast) ? m.cast.join(', ') : m.cast || '',
      director: m.director || '',
      certificate: m.certificate || 'U/A',
      trailerUrl: m.trailerUrl || '',
      aspectRatio: m.aspectRatio || '2.39:1',
      status: m.status || 'CURRENTLY_SHOWING',
      cities: m.cities || ['visakhapatnam'],
      theaters: m.theaters || [],
      posterHistory: m.posterHistory || [],
    });
    setFormStep(1);
    setShowMovieForm(true);
  };

  const handleTMDBImport = (preset) => {
    setFormData({
      ...formData,
      title: preset.title,
      originalTitle: preset.originalTitle,
      posterUrl: preset.posterUrl,
      posterSource: preset.posterSource,
      posterSourceType: preset.posterSourceType,
      sourcePlatform: 'TMDB',
      sourceAccount: '',
      sourcePostUrl: '',
      posterVerified: true,
      backdropUrl: preset.backdropUrl,
      language: preset.language,
      runtime: preset.runtime,
      releaseDate: preset.releaseDate,
      genres: preset.genres.join(', '),
      overview: preset.overview,
      cast: preset.cast.join(', '),
      director: preset.director,
      certificate: preset.certificate,
      aspectRatio: preset.aspectRatio,
      status: preset.status,
      cities: preset.cities,
    });
  };

  const handleSelectPosterFromX = (xPosterData) => {
    const updatedHistory = [
      ...(formData.posterHistory || []),
      {
        id: xPosterData.id || `post-${Date.now()}`,
        imageUrl: xPosterData.imageUrl,
        sourcePlatform: 'X',
        sourceAccount: xPosterData.sourceAccount,
        sourcePostUrl: xPosterData.sourcePostUrl,
        sourcePostId: xPosterData.sourcePostId,
        sourcePublishedAt: xPosterData.sourcePublishedAt,
        sourceType: 'X_OFFICIAL_POST',
        verified: true,
        status: 'SELECTED',
        createdAt: new Date().toISOString(),
      }
    ];

    setFormData({
      ...formData,
      posterUrl: xPosterData.imageUrl,
      posterSource: `X · ${xPosterData.sourceAccount}`,
      posterSourceType: 'OFFICIAL',
      sourcePlatform: 'X',
      sourceAccount: xPosterData.sourceAccount,
      sourcePostUrl: xPosterData.sourcePostUrl,
      sourcePostId: xPosterData.sourcePostId,
      posterVerified: true,
      posterHistory: updatedHistory,
    });
  };

  const handleSaveMovie = (e) => {
    e.preventDefault();

    if (!formData.title || !formData.posterUrl) {
      alert('Movie Title and Poster URL are required.');
      return;
    }

    const movieObj = {
      id: editingMovieId || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      title: formData.title.trim(),
      originalTitle: formData.originalTitle.trim() || formData.title.trim(),
      posterUrl: formData.posterUrl.trim(),
      posterSource: formData.posterSource.trim() || 'TMDB',
      posterSourceType: formData.posterSourceType || 'OFFICIAL',
      sourcePlatform: formData.sourcePlatform || 'TMDB',
      sourceAccount: formData.sourceAccount || '',
      sourcePostUrl: formData.sourcePostUrl || '',
      sourcePostId: formData.sourcePostId || '',
      posterVerified: formData.posterVerified || false,
      backdropUrl: formData.backdropUrl.trim() || formData.posterUrl.trim(),
      language: formData.language.trim(),
      runtime: formData.runtime.trim(),
      releaseDate: formData.releaseDate,
      genres: typeof formData.genres === 'string' ? formData.genres.split(',').map(g => g.trim()).filter(Boolean) : formData.genres,
      overview: formData.overview.trim(),
      cast: typeof formData.cast === 'string' ? formData.cast.split(',').map(c => c.trim()).filter(Boolean) : formData.cast,
      director: formData.director.trim(),
      certificate: formData.certificate,
      trailerUrl: formData.trailerUrl.trim(),
      aspectRatio: formData.aspectRatio,
      status: formData.status,
      cities: formData.cities,
      theaters: formData.theaters || [],
      posterHistory: formData.posterHistory || [],
    };

    if (editingMovieId) {
      dispatch({ type: 'UPDATE_MOVIE', payload: movieObj });
    } else {
      dispatch({ type: 'ADD_MOVIE', payload: movieObj });
    }

    setShowMovieForm(false);
  };

  const handleToggleCityForMovie = (cityId) => {
    const current = formData.cities || [];
    if (current.includes(cityId)) {
      setFormData({ ...formData, cities: current.filter(c => c !== cityId) });
    } else {
      setFormData({ ...formData, cities: [...current, cityId] });
    }
  };

  const handleToggleTheaterForMovie = (theaterId) => {
    const current = formData.theaters || [];
    if (current.includes(theaterId)) {
      setFormData({ ...formData, theaters: current.filter(t => t !== theaterId) });
    } else {
      setFormData({ ...formData, theaters: [...current, theaterId] });
    }
  };

  const handleDeleteMovie = (id) => {
    if (window.confirm('Delete this movie from the platform?')) {
      dispatch({ type: 'DELETE_MOVIE', payload: id });
    }
  };

  const handleArchiveMovie = (m) => {
    dispatch({ type: 'UPDATE_MOVIE', payload: { ...m, status: 'ARCHIVED' } });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          posterUrl: reader.result,
          posterSource: 'Manual Upload',
          sourcePlatform: 'UPLOAD',
          sourceAccount: '',
          sourcePostUrl: '',
          posterVerified: true,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Stats
  const currentlyShowingCount = state.movies.filter(m => m.status === 'CURRENTLY_SHOWING').length;
  const comingSoonCount = state.movies.filter(m => m.status === 'COMING_SOON').length;
  const archivedCount = state.movies.filter(m => m.status === 'ARCHIVED').length;

  return (
    <div className="page-enter" style={{ minHeight: '90vh' }}>
      {/* Top Admin Banner */}
      <div style={{ padding: '24px 24px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 8, background: 'var(--gold-faint)', border: '1px solid var(--gold-dim)', borderRadius: 4, color: 'var(--gold)' }}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text-primary)' }}>Admin Management Hub</h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Manage movie catalog, official X posters, cities, reviews, and platform users</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" onClick={handleOpenAddMovie} className="btn btn-primary btn-sm">
            <Plus size={14} /> Add New Movie
          </button>
          <button type="button" onClick={() => navigate('/')} className="btn btn-ghost btn-sm">
            <ArrowLeft size={14} /> Back to Site
          </button>
        </div>
      </div>

      {/* Main Admin Dashboard Body */}
      <div className="container" style={{ padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 32 }} className="admin-layout">
          
          {/* Sidebar Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { id: 'movies', label: 'Movies Catalog', icon: Film, count: state.movies.length },
              { id: 'reviews', label: 'Review Moderation', icon: MessageSquare, count: state.reviews.length },
              { id: 'users', label: 'Users', icon: Users, count: state.users.length },
              { id: 'cities', label: 'Cities', icon: MapPin, count: allCities.length },
              { id: 'pro-reviewers', label: 'Pro Reviewers', icon: ShieldCheck, count: getApplications().length },
              { id: 'database', label: 'Cloud Database', icon: Database, count: isSupabaseConfigured() ? 'Live' : 'Local' },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    fontFamily: 'var(--font-serif)',
                    fontSize: 12,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: isActive ? 'var(--gold)' : 'var(--text-secondary)',
                    background: isActive ? 'var(--gold-faint)' : 'var(--bg-card)',
                    border: `1px solid ${isActive ? 'var(--gold-dim)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </div>
                  <span style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Panel */}
          <div>
            
            {/* MOVIES TAB */}
            {activeTab === 'movies' && (
              <div>
                {/* Stats Bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
                  <div style={{ padding: 14, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Currently Showing</div>
                    <div style={{ fontSize: 22, fontFamily: 'var(--font-serif)', color: '#4ade80', fontWeight: 700, marginTop: 2 }}>{currentlyShowingCount}</div>
                  </div>
                  <div style={{ padding: 14, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Coming Soon</div>
                    <div style={{ fontSize: 22, fontFamily: 'var(--font-serif)', color: '#fbbf24', fontWeight: 700, marginTop: 2 }}>{comingSoonCount}</div>
                  </div>
                  <div style={{ padding: 14, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Archived</div>
                    <div style={{ fontSize: 22, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', fontWeight: 700, marginTop: 2 }}>{archivedCount}</div>
                  </div>
                </div>

                {/* Filter & Search Controls */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      className="input"
                      style={{ paddingLeft: 36, fontSize: 12 }}
                      placeholder="Search movies..."
                      value={movieSearch}
                      onChange={e => setMovieSearch(e.target.value)}
                    />
                  </div>

                  <select
                    className="input"
                    style={{ width: 'auto', fontSize: 12 }}
                    value={movieStatusFilter}
                    onChange={e => setMovieStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="CURRENTLY_SHOWING">Currently Showing</option>
                    <option value="COMING_SOON">Coming Soon</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>

                {/* Movies Table */}
                <div style={{ border: '1px solid var(--border-subtle)', overflowX: 'auto', background: 'var(--bg-card)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        <th style={{ padding: '12px 16px' }}>Poster</th>
                        <th style={{ padding: '12px 16px' }}>Title & Lang</th>
                        <th style={{ padding: '12px 16px' }}>Poster Source</th>
                        <th style={{ padding: '12px 16px' }}>Status</th>
                        <th style={{ padding: '12px 16px' }}>Cities</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMovies.map(m => {
                        return (
                          <tr key={m.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '10px 16px' }}>
                              <img src={m.posterUrl} alt={m.title} style={{ width: 36, height: 54, objectFit: 'cover', borderRadius: 2 }} onError={e => e.target.src='/demo-frame.jpg'} />
                            </td>
                            <td style={{ padding: '10px 16px' }}>
                              <div style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', fontWeight: 600 }}>{m.title}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.language} • {m.runtime}</div>
                            </td>
                            <td style={{ padding: '10px 16px' }}>
                              <div style={{ fontSize: 11, color: 'var(--gold)', fontFamily: 'var(--font-serif)' }}>
                                {m.sourcePlatform === 'X' ? `X · ${m.sourceAccount || 'Official'}` : m.posterSource || 'TMDB'}
                              </div>
                              {m.posterVerified && (
                                <div style={{ fontSize: 9, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <CheckCircle2 size={10} /> Admin Verified
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '10px 16px' }}>
                              <span className={`badge ${m.status === 'CURRENTLY_SHOWING' ? 'badge-verified' : m.status === 'COMING_SOON' ? 'badge-estimated' : 'badge-dim'}`} style={{ fontSize: 9 }}>
                                {m.status === 'CURRENTLY_SHOWING' ? 'Showing' : m.status === 'COMING_SOON' ? 'Coming Soon' : 'Archived'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 16px', fontSize: 11, color: 'var(--text-secondary)' }}>
                              {m.cities ? m.cities.join(', ') : 'None'}
                            </td>
                            <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => handleOpenEditMovie(m)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: 11 }}>
                                  <Edit3 size={12} /> Edit
                                </button>
                                {m.status !== 'ARCHIVED' && (
                                  <button type="button" onClick={() => handleArchiveMovie(m)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: 11, color: '#fbbf24' }}>
                                    Archive
                                  </button>
                                )}
                                <button type="button" onClick={() => handleDeleteMovie(m.id)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: 11, color: '#f87171' }}>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REVIEWS MODERATION TAB */}
            {activeTab === 'reviews' && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text-primary)', marginBottom: 16 }}>Review Moderation</h3>
                <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        <th style={{ padding: '12px 16px' }}>User</th>
                        <th style={{ padding: '12px 16px' }}>Movie ID</th>
                        <th style={{ padding: '12px 16px' }}>Rating</th>
                        <th style={{ padding: '12px 16px' }}>Review Snippet</th>
                        <th style={{ padding: '12px 16px' }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.reviews.map(rev => (
                        <tr key={rev.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px 16px', fontWeight: 500, color: 'var(--text-primary)' }}>{rev.userDisplayName}</td>
                          <td style={{ padding: '10px 16px', fontSize: 11, color: 'var(--gold)' }}>{rev.movieId}</td>
                          <td style={{ padding: '10px 16px', color: 'var(--gold)', fontFamily: 'var(--font-serif)' }}>★ {rev.rating}</td>
                          <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {rev.reviewText}
                          </td>
                          <td style={{ padding: '10px 16px' }}>
                            <span className={`badge ${rev.status === 'PUBLISHED' ? 'badge-verified' : 'badge-dim'}`} style={{ fontSize: 9 }}>
                              {rev.status}
                            </span>
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              {rev.status !== 'PUBLISHED' && (
                                <button
                                  type="button"
                                  onClick={() => dispatch({ type: 'MODERATE_REVIEW', payload: { id: rev.id, status: 'PUBLISHED' } })}
                                  className="btn btn-ghost btn-sm"
                                  style={{ padding: '2px 6px', fontSize: 10, color: '#4ade80' }}
                                >
                                  Approve
                                </button>
                              )}
                              {rev.status !== 'HIDDEN' && (
                                <button
                                  type="button"
                                  onClick={() => dispatch({ type: 'MODERATE_REVIEW', payload: { id: rev.id, status: 'HIDDEN' } })}
                                  className="btn btn-ghost btn-sm"
                                  style={{ padding: '2px 6px', fontSize: 10, color: '#fbbf24' }}
                                >
                                  Hide
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => dispatch({ type: 'DELETE_REVIEW', payload: rev.id })}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '2px 6px', fontSize: 10, color: '#f87171' }}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text-primary)', marginBottom: 16 }}>Registered Users</h3>
                <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        <th style={{ padding: '12px 16px' }}>Display Name</th>
                        <th style={{ padding: '12px 16px' }}>Email (Private Admin View)</th>
                        <th style={{ padding: '12px 16px' }}>Role</th>
                        <th style={{ padding: '12px 16px' }}>Reviews Written</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.users.map(u => {
                        const revCount = state.reviews.filter(r => r.userId === u.id).length;
                        return (
                          <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '10px 16px', color: 'var(--text-primary)', fontWeight: 600 }}>{u.displayName}</td>
                            <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{u.email}</td>
                            <td style={{ padding: '10px 16px' }}>
                              <span className={`badge ${u.role === 'ADMIN' ? 'badge-gold' : 'badge-dim'}`} style={{ fontSize: 9 }}>
                                {u.role}
                              </span>
                            </td>
                            <td style={{ padding: '10px 16px', color: 'var(--gold)', fontFamily: 'var(--font-serif)' }}>{revCount}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CITIES TAB */}
            {activeTab === 'cities' && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text-primary)', marginBottom: 16 }}>City Management</h3>
                <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', padding: 20 }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    <input
                      className="input"
                      style={{ maxWidth: 300, fontSize: 13 }}
                      placeholder="Add new city name (e.g. Vijayawada)..."
                      value={cityInput}
                      onChange={e => setCityInput(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!cityInput.trim()) return;
                        const newC = {
                          id: cityInput.toLowerCase().replace(/\s+/g, '-'),
                          name: cityInput.trim(),
                          state: 'India',
                          theaterCount: 0
                        };
                        dispatch({ type: 'ADD_CITY', payload: newC });
                        setCityInput('');
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      Add City
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                    {allCities.map(c => (
                      <div key={c.id} style={{ padding: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-sans)', color: 'var(--gold)', fontWeight: 600 }}>{c.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>ID: {c.id}</div>
                        </div>
                        <button
                          type="button"
                          title={`Delete ${c.name}`}
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove "${c.name}"?`)) {
                              dispatch({ type: 'DELETE_CITY', payload: c.id });
                            }
                          }}
                          style={{
                            padding: '4px 8px',
                            fontSize: 11,
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: 4,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PRO REVIEWERS TAB */}
            {activeTab === 'pro-reviewers' && (
              <ProReviewersPanel dispatch={dispatch} currentUser={currentUser} />
            )}

            {/* DATABASE / SUPABASE TAB */}
            {activeTab === 'database' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text-primary)' }}>Cloud Database (Supabase)</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      Enable real-time shared persistence so all visitors across the internet see the same movies and reviews.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 20, background: isSupabaseConfigured() ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${isSupabaseConfigured() ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: isSupabaseConfigured() ? '#4ade80' : '#f87171' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: isSupabaseConfigured() ? '#4ade80' : '#f87171' }}>
                      {isSupabaseConfigured() ? 'Cloud Live Sync Active' : 'Local Storage Only'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Credentials Box */}
                  <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', padding: 24, borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Supabase Credentials</h4>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                        Project URL
                      </label>
                      <input
                        className="input"
                        placeholder="https://xyzcompany.supabase.co"
                        value={sbUrl}
                        onChange={e => setSbUrl(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                        Anon / Public API Key
                      </label>
                      <input
                        type="password"
                        className="input"
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        value={sbKey}
                        onChange={e => setSbKey(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomSupabaseCredentials(sbUrl, sbKey);
                          setSbStatusMsg('Credentials saved! Reload the page to connect.');
                        }}
                        className="btn btn-primary btn-sm"
                      >
                        Save Cloud Credentials
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomSupabaseCredentials('', '');
                          setSbUrl('');
                          setSbKey('');
                          setSbStatusMsg('Credentials cleared. Reverted to local storage.');
                        }}
                        className="btn btn-ghost btn-sm"
                      >
                        Disconnect Cloud
                      </button>
                    </div>

                    {sbStatusMsg && (
                      <div style={{ padding: '8px 12px', background: 'rgba(220,182,91,0.1)', border: '1px solid var(--gold-dim)', borderRadius: 3, color: 'var(--gold)', fontSize: 12 }}>
                        {sbStatusMsg}
                      </div>
                    )}
                  </div>

                  {/* Sync Tools */}
                  {isSupabaseConfigured() && (
                    <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', padding: 24, borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Data Sync Tools</h4>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        Push your {state.movies.length} local movies or pull remote reviews to verify live sync.
                      </p>

                      <div style={{ display: 'flex', gap: 12 }}>
                        <button
                          type="button"
                          disabled={sbLoading}
                          onClick={async () => {
                            setSbLoading(true);
                            setSbStatusMsg('Pushing local movies to Supabase...');
                            try {
                              for (const m of state.movies) {
                                await supabaseService.saveMovie(m);
                              }
                              setSbStatusMsg(`Successfully pushed ${state.movies.length} movies to Supabase!`);
                            } catch (e) {
                              setSbStatusMsg(`Error pushing movies: ${e.message}`);
                            }
                            setSbLoading(false);
                          }}
                          className="btn btn-outline btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <RefreshCw size={13} /> Push All Local Movies to Supabase
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Schema Quick Guide */}
                  <div style={{ border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.3)', padding: 20, borderRadius: 4 }}>
                    <h5 style={{ fontSize: 12, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 8 }}>
                      Quick Setup: Run SQL in Supabase
                    </h5>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      In your Supabase Dashboard, go to <strong>SQL Editor</strong> and run the contents of <code>supabase-schema.sql</code> (included in your project root). That will create the <code>movies</code> and <code>reviews</code> tables with public read/write policies.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ENHANCED MOVIE CREATION / EDITING WORKFLOW WIZARD MODAL */}
      {showMovieForm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', maxWidth: 780, width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: 28, boxShadow: 'var(--shadow-card)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
              <div>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--gold)' }}>
                  {editingMovieId ? 'Edit Movie Workflow' : 'Add New Movie Workflow'}
                </span>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text-primary)', marginTop: 2 }}>
                  {formData.title || 'Untitled Movie'}
                </h3>
              </div>

              {/* Fast Import Metadata Button */}
              <TMDBImportHelper onImport={handleTMDBImport} />
            </div>

            {/* Step Wizard Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
              {[
                { step: 1, label: '1. Movie Metadata' },
                { step: 2, label: '2. Official Poster & X Discovery' },
                { step: 3, label: '3. Cities & Status' },
              ].map(s => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setFormStep(s.step)}
                  className={`btn btn-sm ${formStep === s.step ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: 11 }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveMovie} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* STEP 1: MOVIE METADATA */}
              {formStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Movie Title *</label>
                      <input className="input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Original Title</label>
                      <input className="input" value={formData.originalTitle} onChange={e => setFormData({ ...formData, originalTitle: e.target.value })} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Language</label>
                      <input className="input" value={formData.language} onChange={e => setFormData({ ...formData, language: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Runtime</label>
                      <input className="input" value={formData.runtime} onChange={e => setFormData({ ...formData, runtime: e.target.value })} placeholder="e.g. 2h 45m" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Release Date</label>
                      <input type="date" className="input" value={formData.releaseDate} onChange={e => setFormData({ ...formData, releaseDate: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Overview / Description</label>
                    <textarea className="input" rows={3} value={formData.overview} onChange={e => setFormData({ ...formData, overview: e.target.value })} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Director</label>
                      <input className="input" value={formData.director} onChange={e => setFormData({ ...formData, director: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Cast (Comma-separated)</label>
                      <input className="input" value={formData.cast} onChange={e => setFormData({ ...formData, cast: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Genres (Comma-separated)</label>
                      <input className="input" value={formData.genres} onChange={e => setFormData({ ...formData, genres: e.target.value })} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                    <button type="button" onClick={() => setFormStep(2)} className="btn btn-primary btn-sm">
                      Next: Poster Discovery →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: POSTER DISCOVERY & OFFICIAL X INTEGRATION */}
              {formStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  
                  {/* Poster Source Action Hub */}
                  <div style={{ padding: 20, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          Official Poster Selection & Verification
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                          Discover current promotional posters on X or import from TMDB
                        </div>
                      </div>

                      {/* Official X Poster Discovery Trigger */}
                      <button
                        type="button"
                        onClick={() => setShowXModal(true)}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '9px 18px' }}
                      >
                        <Sparkles size={15} /> Find Official Poster on X
                      </button>
                    </div>

                    {/* Poster Field Options */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 20, alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                            Poster URL
                          </label>
                          <input className="input" value={formData.posterUrl} onChange={e => setFormData({ ...formData, posterUrl: e.target.value })} placeholder="https://..." required />
                        </div>

                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', fontSize: 11 }}>
                            <ImageIcon size={14} /> Upload Image File
                            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                          </label>

                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            Source: <strong style={{ color: 'var(--gold)' }}>{formData.posterSource || 'TMDB'}</strong>
                          </div>
                        </div>

                        {/* Verified Source Indicator */}
                        {formData.sourcePlatform === 'X' && (
                          <div style={{ padding: '8px 12px', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.25)', borderRadius: 3, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4ade80' }}>
                              <CheckCircle2 size={14} />
                              <span>Poster Source: <strong>X ({formData.sourceAccount})</strong></span>
                            </div>
                            {formData.sourcePostUrl && (
                              <a href={formData.sourcePostUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
                                View Post <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Poster Preview Frame */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                          Current Poster Preview
                        </div>
                        <div style={{ width: 120, height: 180, margin: '0 auto', background: '#000', border: '1px solid var(--border-strong)', overflow: 'hidden', boxShadow: 'var(--shadow-gold)' }}>
                          {formData.posterUrl ? (
                            <img src={formData.posterUrl} alt="Poster preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.src='/demo-frame.jpg'} />
                          ) : (
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', paddingTop: 80 }}>No Poster</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                    <button type="button" onClick={() => setFormStep(1)} className="btn btn-ghost btn-sm">
                      ← Back to Metadata
                    </button>
                    <button type="button" onClick={() => setFormStep(3)} className="btn btn-primary btn-sm">
                      Next: Cities & Status →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: CITIES & STATUS */}
              {formStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  
                  {/* Status Selection */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
                      Movie Listing Status
                    </label>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {[
                        { id: 'CURRENTLY_SHOWING', label: 'Currently Showing' },
                        { id: 'COMING_SOON', label: 'Coming Soon' },
                        { id: 'ARCHIVED', label: 'Archived' },
                      ].map(st => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, status: st.id })}
                          className={`btn btn-sm ${formData.status === st.id ? 'btn-primary' : 'btn-ghost'}`}
                          style={{ fontSize: 11 }}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Assigned Cities (movieCities relationship) */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 6 }}>
                      Assigned Cities (Where this movie is currently listed)
                    </label>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: 16, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)' }}>
                      {allCities.map(c => {
                        const isChecked = (formData.cities || []).includes(c.id);
                        return (
                          <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-primary)', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleCityForMovie(c.id)}
                            />
                            {c.name}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Theater Picker — grouped by selected cities */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                      Screening Theaters <span style={{ color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>(select which theaters are showing this movie)</span>
                    </label>

                    {(() => {
                      // Get theaters in the selected cities
                      const selectedCities = formData.cities || [];
                      const theatersInCities = allTheaters.filter(t => selectedCities.includes(t.cityId));

                      if (selectedCities.length === 0) {
                        return (
                          <div style={{ padding: '14px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                            Select at least one city above to see available theaters.
                          </div>
                        );
                      }

                      if (theatersInCities.length === 0) {
                        return (
                          <div style={{ padding: '14px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                            No theaters found for the selected cities.
                          </div>
                        );
                      }

                      return (
                        <div style={{ padding: 16, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {/* Select All / Clear */}
                          <div style={{ display: 'flex', gap: 10, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, theaters: theatersInCities.map(t => t.id) })}
                              style={{ fontSize: 11, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              ✓ Select All
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, theaters: [] })}
                              style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              ✗ Clear All
                            </button>
                            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
                              {(formData.theaters || []).length} of {theatersInCities.length} selected
                            </span>
                          </div>

                          {/* Theater checkboxes */}
                          {theatersInCities.map(t => {
                            const isChecked = (formData.theaters || []).includes(t.id);
                            return (
                              <label
                                key={t.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 10,
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  borderRadius: 3,
                                  background: isChecked ? 'rgba(220,182,91,0.06)' : 'transparent',
                                  border: `1px solid ${isChecked ? 'rgba(220,182,91,0.25)' : 'transparent'}`,
                                  transition: 'all 150ms ease',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleTheaterForMovie(t.id)}
                                  style={{ accentColor: 'var(--gold)', width: 14, height: 14 }}
                                />
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 13, fontWeight: 500, color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                    {t.name}
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                    {t.totalScreens} screen{t.totalScreens !== 1 ? 's' : ''} • {t.area}
                                  </div>
                                </div>
                                {isChecked && (
                                  <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>✓ Showing</span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Aspect Ratio & Trailer */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Native Aspect Ratio Spec</label>
                      <select className="input" value={formData.aspectRatio} onChange={e => setFormData({ ...formData, aspectRatio: e.target.value })}>
                        <option value="2.39:1">2.39:1 (Scope)</option>
                        <option value="1.90:1">1.90:1 (IMAX Digital)</option>
                        <option value="1.85:1">1.85:1 (Flat)</option>
                        <option value="1.43:1">1.43:1 (Classic IMAX)</option>
                        <option value="1.78:1">1.78:1 (16:9)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>YouTube Trailer URL</label>
                      <input className="input" value={formData.trailerUrl} onChange={e => setFormData({ ...formData, trailerUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                    <button type="button" onClick={() => setFormStep(2)} className="btn btn-ghost btn-sm">
                      ← Back to Poster
                    </button>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="button" onClick={() => setShowMovieForm(false)} className="btn btn-ghost btn-sm">Cancel</button>
                      <button type="submit" className="btn btn-primary">
                        {editingMovieId ? 'Update & Publish Movie' : 'Save & Publish Movie'}
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL X POSTER DISCOVERY MODAL */}
      {showXModal && (
        <XPosterDiscoveryModal
          movieTitle={formData.title}
          currentAccount={formData.sourceAccount || ''}
          onClose={() => setShowXModal(false)}
          onSelectPoster={handleSelectPosterFromX}
        />
      )}
    </div>
  );
}

// ─── Pro Reviewers Panel ───────────────────────────────────────────────────
function ProReviewersPanel({ dispatch, currentUser }) {
  const [apps, setApps] = React.useState(() => getApplications());
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [expandedId, setExpandedId] = React.useState(null);
  const [adminNote, setAdminNote] = React.useState('');
  const [rejectReason, setRejectReason] = React.useState('');

  const reload = () => setApps(getApplications());

  const filtered = statusFilter === 'all' ? apps : apps.filter(a => a.status === statusFilter);

  const handleAction = (appId, status) => {
    updateApplicationStatus(appId, status, adminNote, rejectReason, currentUser?.id || 'admin');
    dispatch({ type: 'UPDATE_PRO_APPLICATION', payload: { id: appId, status, adminNote, rejectionReason: rejectReason, reviewedAt: new Date().toISOString() } });
    reload();
    setAdminNote('');
    setRejectReason('');
  };

  const STATUS_COLORS = {
    SUBMITTED: '#fbbf24',
    UNDER_REVIEW: '#60a5fa',
    MORE_INFO_REQUIRED: '#f97316',
    APPROVED: '#10b981',
    REJECTED: '#f87171',
    REVOKED: '#f87171',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text-primary)' }}>Professional Reviewer Applications</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{apps.length} total application{apps.length !== 1 ? 's' : ''}</p>
        </div>
        <select
          style={{ padding: '6px 12px', borderRadius: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 12 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="MORE_INFO_REQUIRED">More Info Required</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="REVOKED">Revoked</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
          <ShieldCheck size={36} color="var(--text-muted)" style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No applications found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(app => {
            const isExpanded = expandedId === app.id;
            const statusColor = STATUS_COLORS[app.status] || 'var(--text-muted)';
            return (
              <div key={app.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                {/* Summary row */}
                <div
                  onClick={() => { setExpandedId(isExpanded ? null : app.id); setAdminNote(''); setRejectReason(''); }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer', gap: 12, flexWrap: 'wrap' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `rgba(${statusColor === '#10b981' ? '16,185,129' : '255,255,255'},0.08)`, border: `1px solid ${statusColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: statusColor, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                      {(app.fullName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{app.fullName || app.userId}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {[app.profession, app.organization].filter(Boolean).join(' · ')} {app.country ? `· ${app.country}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 12, background: `${statusColor}18`, border: `1px solid ${statusColor}40`, color: statusColor, fontWeight: 600 }}>
                      {app.status.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : ''}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10, paddingTop: 14, marginBottom: 16 }}>
                      {[
                        ['Full Name', app.fullName],
                        ['Profession', app.profession],
                        ['Title', app.professionalTitle],
                        ['Organization', app.organization],
                        ['Experience', app.yearsExperience],
                        ['Country', app.country],
                        ['Specializations', (app.specializations || []).join(', ')],
                        ['LinkedIn', app.linkedinUrl],
                        ['Portfolio', app.portfolioUrl],
                        ['Social Links', app.socialLinks],
                        ['Published Reviews', app.publishedReviewsUrls],
                      ].filter(([, v]) => v).map(([k, v]) => (
                        <div key={k}>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{k}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                            {v.startsWith?.('http') ? <a href={v} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>{v}</a> : v}
                          </div>
                        </div>
                      ))}
                    </div>

                    {app.professionalBio && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Professional Bio</div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{app.professionalBio}</p>
                      </div>
                    )}
                    {app.criticismBackground && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Film Criticism Background</div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{app.criticismBackground}</p>
                      </div>
                    )}
                    {app.adminNote && (
                      <div style={{ marginBottom: 14, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, borderLeft: '2px solid var(--gold)' }}>
                        <div style={{ fontSize: 10, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 3 }}>Previous Admin Note</div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{app.adminNote}</p>
                      </div>
                    )}

                    {/* Admin actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Admin Note (optional)</label>
                        <textarea
                          value={adminNote}
                          onChange={e => setAdminNote(e.target.value)}
                          placeholder="Internal note to the applicant..."
                          style={{ width: '100%', minHeight: 60, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }}
                        />
                      </div>
                      {(app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW' || app.status === 'MORE_INFO_REQUIRED') && (
                        <div>
                          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Rejection Reason (if rejecting)</label>
                          <input
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection..."
                            style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, boxSizing: 'border-box' }}
                          />
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {app.status !== 'APPROVED' && (
                          <button onClick={() => handleAction(app.id, 'APPROVED')} className="btn btn-primary btn-sm" style={{ background: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <ShieldCheck size={13} /> Approve
                          </button>
                        )}
                        {(app.status === 'SUBMITTED' || app.status === 'MORE_INFO_REQUIRED') && (
                          <button onClick={() => handleAction(app.id, 'UNDER_REVIEW')} className="btn btn-outline btn-sm">
                            Mark Under Review
                          </button>
                        )}
                        {app.status !== 'MORE_INFO_REQUIRED' && app.status !== 'APPROVED' && app.status !== 'REJECTED' && (
                          <button onClick={() => handleAction(app.id, 'MORE_INFO_REQUIRED')} className="btn btn-outline btn-sm" style={{ borderColor: '#f97316', color: '#f97316' }}>
                            Request More Info
                          </button>
                        )}
                        {app.status === 'APPROVED' && (
                          <button onClick={() => { if (window.confirm('Revoke this reviewer\'s verified status?')) handleAction(app.id, 'REVOKED'); }} className="btn btn-ghost btn-sm" style={{ color: '#f87171' }}>
                            Revoke
                          </button>
                        )}
                        {app.status !== 'REJECTED' && app.status !== 'APPROVED' && (
                          <button onClick={() => { if (window.confirm('Reject this application?')) handleAction(app.id, 'REJECTED'); }} className="btn btn-ghost btn-sm" style={{ color: '#f87171' }}>
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
