import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Film, MessageSquare, Users, MapPin, Plus, Search, Edit3, Trash2, CheckCircle2, EyeOff, Sparkles, AlertCircle, ArrowLeft, ExternalLink, Check, Image as ImageIcon, Database, RefreshCw, ShieldCheck, Building2, Trophy, Share2 } from 'lucide-react';
import { useApp } from '../AppContext';
import TMDBImportHelper from '../components/admin/TMDBImportHelper';
import XPosterDiscoveryModal from '../components/admin/XPosterDiscoveryModal';
import AdminTheaterFormModal from '../components/admin/AdminTheaterFormModal';
import WeekendVotingAdminTab from '../components/admin/WeekendVotingAdminTab';
import SocialPreviewTestPage from './SocialPreviewTestPage';
import { isSupabaseConfigured, setCustomSupabaseCredentials, supabaseService, getSupabaseClient } from '../services/supabase';
import { getApplications, updateApplicationStatus } from '../services/proReviewerService';
import CloudSyncButton from '../components/common/CloudSyncButton';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { state, dispatch, allCities, allTheaters, getMovieRating, refreshData, syncCloudData, isRefreshing, lastSyncedAt } = useApp();

  const currentUser = state.currentUser;
  const isAdmin = currentUser && currentUser.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState('movies'); // 'movies' | 'reviews' | 'users' | 'cities' | 'pro-reviewers'
  const [movieSearch, setMovieSearch] = useState('');
  const [movieStatusFilter, setMovieStatusFilter] = useState('all');
  const [refreshFeedback, setRefreshFeedback] = useState('');

  const handleFullRefresh = async () => {
    if (refreshData) {
      setRefreshFeedback('Syncing with database...');
      const res = await refreshData();
      if (res?.success) {
        setRefreshFeedback('✓ All data in sync!');
      } else {
        setRefreshFeedback('Synced local data');
      }
      setTimeout(() => setRefreshFeedback(''), 3000);
    }
  };

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
    ottPlatform: '',
    ottReleaseDate: '',
    ottUrl: '',
  };

  const [formData, setFormData] = useState(emptyMovieForm);
  const [cityInput, setCityInput] = useState('');
  const [sbUrl, setSbUrl] = useState(localStorage.getItem('cinemascope_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '');
  const [sbKey, setSbKey] = useState(localStorage.getItem('cinemascope_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '');
  const [sbStatusMsg, setSbStatusMsg] = useState('');
  const [sbLoading, setSbLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Theater Management State
  const [theaterSearch, setTheaterSearch] = useState('');
  const [theaterCityFilter, setTheaterCityFilter] = useState('all');
  const [showTheaterModal, setShowTheaterModal] = useState(false);
  const [editingTheater, setEditingTheater] = useState(null);

  const handleOpenAddTheater = () => {
    setEditingTheater(null);
    setShowTheaterModal(true);
  };

  const handleOpenEditTheater = (theater) => {
    setEditingTheater(theater);
    setShowTheaterModal(true);
  };

  const handleDeleteTheater = (theaterId, theaterName) => {
    if (window.confirm(`Are you sure you want to delete "${theaterName}"?`)) {
      dispatch({ type: 'DELETE_THEATER', payload: theaterId });
    }
  };

  const handleSaveTheater = (theaterObj) => {
    if (editingTheater) {
      dispatch({ type: 'UPDATE_THEATER', payload: theaterObj });
    } else {
      dispatch({ type: 'ADD_THEATER', payload: theaterObj });
    }
    setEditingTheater(null);
    setShowTheaterModal(false);
  };

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
      ottPlatform: m.ottPlatform || '',
      ottReleaseDate: m.ottReleaseDate || '',
      ottUrl: m.ottUrl || '',
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
      ottPlatform: preset.ottPlatform || '',
      ottReleaseDate: preset.ottReleaseDate || '',
      ottUrl: preset.ottWatchUrl || preset.ottUrl || '',
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
      ottPlatform: formData.ottPlatform ? formData.ottPlatform.trim() : '',
      ottReleaseDate: formData.ottReleaseDate || '',
      ottUrl: formData.ottUrl ? formData.ottUrl.trim() : '',
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

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {refreshFeedback && (
            <span style={{ fontSize: 11, color: refreshFeedback.includes('✓') ? '#4ade80' : 'var(--gold)', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-serif)', fontWeight: 600 }}>
              {refreshFeedback}
            </span>
          )}
          <CloudSyncButton variant="pill" />
          <button type="button" onClick={handleOpenAddTheater} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Building2 size={14} /> Add Theater
          </button>
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
              { id: 'weekend-picks', label: 'Weekend Picks', icon: Trophy, count: 'Live' },
              { id: 'theaters', label: 'Theaters', icon: Building2, count: allTheaters.length },
              { id: 'reviews', label: 'Review Moderation', icon: MessageSquare, count: state.reviews.length },
              { id: 'users', label: 'Users', icon: Users, count: state.users.length },
              { id: 'cities', label: 'Cities', icon: MapPin, count: allCities.length },
              { id: 'social-preview', label: 'Social & OG Previews', icon: Share2, count: 'Live' },
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

            {/* THEATERS TAB */}
            {activeTab === 'theaters' && (
              <div>
                {/* Header & Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--text-primary)' }}>Theaters & Screens Directory</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Manage theaters, auditoriums, aspect ratios, sound processors, and formats</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddTheater}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Plus size={14} /> Add New Theater
                  </button>
                </div>

                {/* Filter & Search Bar */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      className="input"
                      style={{ paddingLeft: 36, fontSize: 12 }}
                      placeholder="Search theaters by name, chain, or area..."
                      value={theaterSearch}
                      onChange={e => setTheaterSearch(e.target.value)}
                    />
                  </div>

                  <select
                    className="input"
                    style={{ width: 'auto', fontSize: 12 }}
                    value={theaterCityFilter}
                    onChange={e => setTheaterCityFilter(e.target.value)}
                  >
                    <option value="all">All Cities ({allTheaters.length})</option>
                    {allCities.map(c => {
                      const count = allTheaters.filter(t => t.cityId === c.id).length;
                      return (
                        <option key={c.id} value={c.id}>
                          {c.name} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Theaters Table */}
                {(() => {
                  const filteredTheaters = allTheaters.filter(t => {
                    const q = theaterSearch.toLowerCase();
                    const matchesSearch = !q ||
                      t.name.toLowerCase().includes(q) ||
                      (t.chain && t.chain.toLowerCase().includes(q)) ||
                      (t.area && t.area.toLowerCase().includes(q));
                    const matchesCity = theaterCityFilter === 'all' || t.cityId === theaterCityFilter;
                    return matchesSearch && matchesCity;
                  });

                  if (filteredTheaters.length === 0) {
                    return (
                      <div style={{ padding: 48, textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 4 }}>
                        <Building2 size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                        <h4 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', marginBottom: 6 }}>No theaters found</h4>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Try adjusting your search query or city filter</p>
                        <button type="button" onClick={handleOpenAddTheater} className="btn btn-primary btn-sm">
                          <Plus size={13} /> Add Theater Now
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div style={{ border: '1px solid var(--border-subtle)', overflowX: 'auto', background: 'var(--bg-card)', borderRadius: 4 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            <th style={{ padding: '12px 16px' }}>Theater</th>
                            <th style={{ padding: '12px 16px' }}>City & Area</th>
                            <th style={{ padding: '12px 16px' }}>Chain</th>
                            <th style={{ padding: '12px 16px' }}>Screens</th>
                            <th style={{ padding: '12px 16px' }}>Highlights</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTheaters.map(t => {
                            const cityObj = allCities.find(c => c.id === t.cityId);
                            return (
                              <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                <td style={{ padding: '12px 16px' }}>
                                  <Link
                                    to={`/theater/${t.id}`}
                                    style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}
                                  >
                                    {t.name}
                                  </Link>
                                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>ID: {t.id}</div>
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{cityObj ? cityObj.name : t.cityId}</div>
                                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t.area || 'Town Center'}</div>
                                </td>
                                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 12 }}>
                                  {t.chain || 'Independent'}
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  <span className="badge badge-dim" style={{ fontSize: 10 }}>
                                    {t.screens?.length || t.totalScreens || 1} Screen{(t.screens?.length || t.totalScreens || 1) !== 1 ? 's' : ''}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 220 }}>
                                    {(t.features || []).slice(0, 3).map(f => (
                                      <span key={f} style={{ fontSize: 9, padding: '1px 6px', background: 'rgba(255,255,255,0.04)', borderRadius: 2, color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                                        {f}
                                      </span>
                                    ))}
                                    {(t.features || []).length > 3 && (
                                      <span style={{ fontSize: 9, color: 'var(--text-muted)', alignSelf: 'center' }}>+{(t.features || []).length - 3}</span>
                                    )}
                                  </div>
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditTheater(t)}
                                      className="btn btn-ghost btn-sm"
                                      style={{ padding: '4px 8px', fontSize: 11, color: 'var(--gold)' }}
                                    >
                                      <Edit3 size={12} /> Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTheater(t.id, t.name)}
                                      className="btn btn-ghost btn-sm"
                                      style={{ padding: '4px 8px', fontSize: 11, color: '#f87171' }}
                                    >
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
                  );
                })()}
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
                        <th style={{ padding: '12px 16px' }}>Target (Movie / Theater)</th>
                        <th style={{ padding: '12px 16px' }}>Rating</th>
                        <th style={{ padding: '12px 16px' }}>Review Snippet</th>
                        <th style={{ padding: '12px 16px' }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.reviews.map(rev => {
                        const isTheater = !!rev.theaterId;
                        return (
                        <tr key={rev.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px 16px', fontWeight: 500, color: 'var(--text-primary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{rev.userDisplayName}</span>
                              {rev.reviewType === 'PROFESSIONAL' && (
                                <span className="badge badge-gold" style={{ fontSize: 8 }}>PRO</span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '10px 16px', fontSize: 11 }}>
                            {isTheater ? (
                              <Link to={`/theater/${rev.theaterId}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38bdf8', textDecoration: 'none' }}>
                                <Building2 size={12} />
                                <span>{rev.theaterName || rev.theaterId}</span>
                                {rev.screenName && (
                                  <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>· {rev.screenName}</span>
                                )}
                              </Link>
                            ) : (
                              <Link to={`/movie/${rev.movieId}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold)', textDecoration: 'none' }}>
                                <Film size={12} />
                                <span>{rev.movieId}</span>
                              </Link>
                            )}
                          </td>
                          <td style={{ padding: '10px 16px', color: 'var(--gold)', fontFamily: 'var(--font-serif)' }}>★ {rev.rating}</td>
                          <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {rev.reviewText || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No comment</span>}
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
                      );
                    })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (() => {
              const userMap = new Map();
              (state.users || []).forEach(u => {
                const key = u.email ? u.email.toLowerCase() : u.id;
                userMap.set(key, u);
              });
              // Also ensure any reviewer in state.reviews is displayed
              (state.reviews || []).forEach(r => {
                const key = r.userEmail ? r.userEmail.toLowerCase() : (r.userId || r.userDisplayName);
                if (key && !Array.from(userMap.values()).some(u => 
                  (u.id && r.userId && u.id === r.userId) || 
                  (u.email && r.userEmail && u.email.toLowerCase() === r.userEmail.toLowerCase()) || 
                  (u.displayName && r.userDisplayName && u.displayName.trim().toLowerCase() === r.userDisplayName.trim().toLowerCase())
                )) {
                  userMap.set(key, {
                    id: r.userId || `user-${Date.now()}`,
                    displayName: r.userDisplayName || 'User',
                    email: r.userEmail || '—',
                    role: 'USER',
                    createdAt: r.createdAt || new Date().toISOString(),
                  });
                }
              });
              const displayUsersList = Array.from(userMap.values());

              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text-primary)', margin: 0 }}>Registered Users ({displayUsersList.length})</h3>
                  </div>
                  <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          <th style={{ padding: '12px 16px', textAlign: 'left' }}>Display Name</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left' }}>Email (Private Admin View)</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left' }}>Role</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left' }}>Reviews Written</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayUsersList.map(u => {
                          const revCount = (state.reviews || []).filter(r => 
                            (r.userId && u.id && r.userId === u.id) || 
                            (r.userDisplayName && u.displayName && r.userDisplayName.trim().toLowerCase() === u.displayName.trim().toLowerCase()) ||
                            (u.email && r.userEmail && r.userEmail.toLowerCase() === u.email.toLowerCase())
                          ).length;
                          return (
                            <tr key={u.id || u.email} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                              <td style={{ padding: '10px 16px', color: 'var(--text-primary)', fontWeight: 600 }}>{u.displayName}</td>
                              <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{u.email}</td>
                              <td style={{ padding: '10px 16px' }}>
                                <span className={`badge ${u.role === 'ADMIN' ? 'badge-gold' : 'badge-dim'}`} style={{ fontSize: 9 }}>
                                  {u.role}
                                </span>
                              </td>
                              <td style={{ padding: '10px 16px', color: 'var(--gold)', fontFamily: 'var(--font-serif)', fontWeight: 700 }}>{revCount}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

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
                      Real-time cloud database synchronization for movies, reviews, users, weekend picks, and personal diaries.
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
                  {/* Test Connection Alert if tested */}
                  {testResult && (
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: 4,
                      fontSize: 12,
                      background: testResult.success ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `1px solid ${testResult.success ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      color: testResult.success ? '#4ade80' : '#f87171',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}>
                      {testResult.success ? <Check size={16} /> : <AlertCircle size={16} />}
                      <div style={{ flex: 1 }}>{testResult.message}</div>
                      <button type="button" onClick={() => setTestResult(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 14 }}>×</button>
                    </div>
                  )}

                  {/* Sync Tools Card */}
                  <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', padding: 24, borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Live Cloud Data Synchronization</h4>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {lastSyncedAt ? `Last synchronized at ${new Date(lastSyncedAt).toLocaleString()}` : 'Never synced in this session.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={testingConnection}
                        onClick={async () => {
                          setTestingConnection(true);
                          setTestResult(null);
                          try {
                            const client = getSupabaseClient();
                            if (!client) {
                              setTestResult({ success: false, message: 'Supabase client is not configured.' });
                              return;
                            }
                            const { error } = await client.from('movies').select('id').limit(1);
                            if (error) {
                              setTestResult({ success: false, message: `Connected to Supabase endpoint, but table error: ${error.message}` });
                            } else {
                              setTestResult({ success: true, message: 'Connection Verified! Connected to live Supabase project.' });
                            }
                          } catch (e) {
                            setTestResult({ success: false, message: `Connection failed: ${e.message}` });
                          } finally {
                            setTestingConnection(false);
                          }
                        }}
                        className="btn btn-outline btn-sm"
                      >
                        {testingConnection ? 'Testing...' : 'Test Connection'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        disabled={isRefreshing || sbLoading}
                        onClick={async () => {
                          setSbLoading(true);
                          setSbStatusMsg('Running bidirectional 2-way sync with Supabase...');
                          const res = await syncCloudData({ forcePush: false });
                          if (res?.success) {
                            setSbStatusMsg(`✓ Cloud sync complete! Synced ${state.movies.length} movies & ${state.reviews.length} reviews.`);
                          } else {
                            setSbStatusMsg(`Sync issue: ${res?.error?.message || 'Check database settings'}`);
                          }
                          setSbLoading(false);
                        }}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}
                      >
                        <RefreshCw size={14} style={{ animation: isRefreshing || sbLoading ? 'spin 1s linear infinite' : 'none' }} />
                        {isRefreshing || sbLoading ? 'Synchronizing...' : '⚡ Sync All Data (2-Way Merge)'}
                      </button>

                      <button
                        type="button"
                        disabled={isRefreshing || sbLoading}
                        onClick={async () => {
                          setSbLoading(true);
                          setSbStatusMsg('Force pushing all local movies, reviews, and weekend votes to Supabase...');
                          const res = await syncCloudData({ forcePush: true });
                          if (res?.success) {
                            setSbStatusMsg(`✓ Successfully pushed all local data (${state.movies.length} movies) to Supabase!`);
                          } else {
                            setSbStatusMsg(`Push issue: ${res?.error?.message || 'Check database connection'}`);
                          }
                          setSbLoading(false);
                        }}
                        className="btn btn-outline"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}
                      >
                        <RefreshCw size={14} /> Force Push Local to Cloud
                      </button>
                    </div>

                    {sbStatusMsg && (
                      <div style={{ padding: '8px 12px', background: 'rgba(220,182,91,0.1)', border: '1px solid var(--gold-dim)', borderRadius: 3, color: 'var(--gold)', fontSize: 12 }}>
                        {sbStatusMsg}
                      </div>
                    )}
                  </div>

                  {/* Credentials Box */}
                  <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', padding: 24, borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Supabase Credentials & Configuration</h4>

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
                          setSbStatusMsg('Credentials saved! You can now sync or test connection.');
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
                          setSbStatusMsg('Credentials reset to default configuration.');
                        }}
                        className="btn btn-ghost btn-sm"
                      >
                        Reset to Default
                      </button>
                    </div>
                  </div>

                  {/* Schema Quick Guide & Copy Button */}
                  <div style={{ border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.3)', padding: 20, borderRadius: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <h5 style={{ fontSize: 12, color: 'var(--gold)', textTransform: 'uppercase', margin: 0 }}>
                        Database SQL Schema (v3)
                      </h5>
                      <button
                        type="button"
                        onClick={() => {
                          const sql = `CREATE TABLE IF NOT EXISTS public.movies (id TEXT PRIMARY KEY, title TEXT NOT NULL, original_title TEXT, poster_url TEXT, poster_source TEXT DEFAULT 'TMDB', poster_source_type TEXT DEFAULT 'OFFICIAL', backdrop_url TEXT, language TEXT DEFAULT 'Telugu', runtime TEXT DEFAULT '2h 30m', release_date DATE, genres JSONB DEFAULT '[]'::jsonb, overview TEXT, cast_list JSONB DEFAULT '[]'::jsonb, director TEXT, certificate TEXT DEFAULT 'U/A', trailer_url TEXT, aspect_ratio TEXT DEFAULT '2.39:1', status TEXT DEFAULT 'CURRENTLY_SHOWING', cities JSONB DEFAULT '["visakhapatnam"]'::jsonb, theaters JSONB DEFAULT '[]'::jsonb, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.reviews (id TEXT PRIMARY KEY, movie_id TEXT, theater_id TEXT, theater_name TEXT, screen_id TEXT, screen_name TEXT, target_type TEXT DEFAULT 'MOVIE', user_id TEXT NOT NULL, user_display_name TEXT DEFAULT 'Anonymous', rating NUMERIC(3,1) NOT NULL, parameter_ratings JSONB DEFAULT '{}'::jsonb, review_text TEXT, review_type TEXT DEFAULT 'USER', status TEXT DEFAULT 'PUBLISHED', likes_count INT DEFAULT 0, report_count INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.users (id TEXT PRIMARY KEY, email TEXT UNIQUE, display_name TEXT, role TEXT DEFAULT 'USER', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.user_movies (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, tmdb_id TEXT NOT NULL, in_watchlist BOOLEAN DEFAULT false, is_watched BOOLEAN DEFAULT false, is_favorite BOOLEAN DEFAULT false, personal_rating NUMERIC(3,1), notes TEXT, watch_count INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id, tmdb_id));
CREATE TABLE IF NOT EXISTS public.diary_entries (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, tmdb_id TEXT NOT NULL, movie_title TEXT, poster_url TEXT, watched_on DATE DEFAULT CURRENT_DATE, personal_rating NUMERIC(3,1), review_text TEXT, is_rewatch BOOLEAN DEFAULT false, tags JSONB DEFAULT '[]'::jsonb, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.collections (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT, visibility TEXT DEFAULT 'public', movie_ids JSONB DEFAULT '[]'::jsonb, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public all movies" ON public.movies;
CREATE POLICY "Public all movies" ON public.movies FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public all reviews" ON public.reviews;
CREATE POLICY "Public all reviews" ON public.reviews FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public all users" ON public.users;
CREATE POLICY "Public all users" ON public.users FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public all user_movies" ON public.user_movies;
CREATE POLICY "Public all user_movies" ON public.user_movies FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public all diary_entries" ON public.diary_entries;
CREATE POLICY "Public all diary_entries" ON public.diary_entries FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public all collections" ON public.collections;
CREATE POLICY "Public all collections" ON public.collections FOR ALL USING (true) WITH CHECK (true);`;
                          navigator.clipboard.writeText(sql);
                          setCopiedSql(true);
                          setTimeout(() => setCopiedSql(false), 2000);
                        }}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: 11 }}
                      >
                        {copiedSql ? '✓ SQL Copied!' : 'Copy SQL Script'}
                      </button>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      In your Supabase Dashboard, open <strong>SQL Editor</strong>, paste the copied script, and click <strong>Run</strong>. That will create all 6 tables (<code>movies</code>, <code>reviews</code>, <code>users</code>, <code>user_movies</code>, <code>diary_entries</code>, <code>collections</code>) with permissive public RLS policies.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* WEEKEND PICKS TAB */}
            {activeTab === 'weekend-picks' && (
              <WeekendVotingAdminTab />
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

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                    <button type="button" onClick={() => setShowMovieForm(false)} className="btn btn-ghost btn-sm">
                      Cancel
                    </button>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="submit" className="btn btn-outline btn-sm">
                        {editingMovieId ? 'Save & Close' : 'Quick Save'}
                      </button>
                      <button type="button" onClick={() => setFormStep(2)} className="btn btn-primary btn-sm">
                        Next: Poster Discovery →
                      </button>
                    </div>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                    <button type="button" onClick={() => setFormStep(1)} className="btn btn-ghost btn-sm">
                      ← Back to Metadata
                    </button>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="button" onClick={() => setShowMovieForm(false)} className="btn btn-ghost btn-sm">
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-outline btn-sm">
                        {editingMovieId ? 'Save & Close' : 'Quick Save'}
                      </button>
                      <button type="button" onClick={() => setFormStep(3)} className="btn btn-primary btn-sm">
                        Next: Cities & Status →
                      </button>
                    </div>
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

                    {/* OTT & Streaming Release Details */}
                    <div style={{ marginTop: 14, padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 4 }}>
                      <div style={{ fontSize: 12, fontFamily: 'var(--font-serif)', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>📺</span> OTT &amp; Streaming Release Details
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                            OTT Platform(s)
                          </label>
                          <input
                            className="input"
                            value={formData.ottPlatform}
                            onChange={e => setFormData({ ...formData, ottPlatform: e.target.value })}
                            placeholder="e.g. Netflix, Amazon Prime Video, Aha"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                            OTT Release Date
                          </label>
                          <input
                            type="date"
                            className="input"
                            value={formData.ottReleaseDate}
                            onChange={e => setFormData({ ...formData, ottReleaseDate: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                          Direct Streaming URL (optional)
                        </label>
                        <input
                          className="input"
                          value={formData.ottUrl}
                          onChange={e => setFormData({ ...formData, ottUrl: e.target.value })}
                          placeholder="https://www.netflix.com/title/..."
                        />
                      </div>
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

      {/* ADMIN THEATER FORM MODAL */}
      <AdminTheaterFormModal
        key={editingTheater ? `edit-${editingTheater.id}` : 'new-theater'}
        isOpen={showTheaterModal}
        onClose={() => {
          setShowTheaterModal(false);
          setEditingTheater(null);
        }}
        onSave={handleSaveTheater}
        theaterToEdit={editingTheater}
        allCities={allCities}
        defaultCityId={allCities[0]?.id || 'visakhapatnam'}
      />
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

      {/* SOCIAL PREVIEW & OG DEBUGGER TAB */}
      {activeTab === 'social-preview' && (
        <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
          <SocialPreviewTestPage />
        </div>
      )}
    </div>
  );
}
