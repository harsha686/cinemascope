import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  Archive,
  Search,
  Sparkles,
  Users,
  Eye,
  RefreshCw,
  Film,
  Tv,
  RotateCcw,
  X,
  Check,
  Settings,
} from 'lucide-react';
import {
  getAllRounds,
  createRound,
  updateRound,
  deleteRound,
  declareWinnersForRound,
  getLiveAdminAnalytics,
  calculateGenreResults,
  TIE_BREAKER_OPTIONS,
  resetRoundPolling,
  resetGenrePolling,
  factoryResetWeekendData,
  getGenreOptions,
  updateGenreOption,
  addGenreOption,
  deleteGenreOption,
  resetGenreOptionsToDefault,
  reorderGenreOptions,
  pushWeekendPickDataToCloud,
  syncWeekendPickDataFromCloud,
} from '../../services/weekendPickService';
import { searchTmdbMovies, fetchFullTmdbMovieDetails } from '../../services/tmdbService';

export default function WeekendVotingAdminTab() {
  const [rounds, setRounds] = useState(() => getAllRounds());
  const [selectedRoundId, setSelectedRoundId] = useState(() => rounds[0]?.id || null);
  const [genres, setGenres] = useState(() => getGenreOptions());
  const [activeGenreTab, setActiveGenreTab] = useState(() => getGenreOptions()[0]?.id || 'action');

  // Modal / Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [showManageGenresModal, setShowManageGenresModal] = useState(false);
  const [editingGenreId, setEditingGenreId] = useState(null);
  const [editGenreForm, setEditGenreForm] = useState({ name: '', emoji: '', color: '' });
  const [newGenreForm, setNewGenreForm] = useState({ name: '', emoji: '🍿', color: '#f59e0b' });
  const [genreActionMsg, setGenreActionMsg] = useState('');

  // Candidate TMDB Search
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');
  const [candidateSearchResults, setCandidateSearchResults] = useState([]);
  const [isSearchingTmdb, setIsSearchingTmdb] = useState(false);

  useEffect(() => {
    const handleSync = () => {
      const g = getGenreOptions();
      setGenres(g);
      setRounds(getAllRounds());
      if (!g.some(item => item.id === activeGenreTab) && g[0]) {
        setActiveGenreTab(g[0].id);
      }
    };
    window.addEventListener('cinemascope_genres_updated', handleSync);
    window.addEventListener('cinemascope_round_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('cinemascope_genres_updated', handleSync);
      window.removeEventListener('cinemascope_round_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [activeGenreTab]);

  useEffect(() => {
    syncWeekendPickDataFromCloud().then(synced => {
      if (synced) reloadData();
    });
  }, []);

  const reloadData = () => {
    const updated = getAllRounds();
    setRounds(updated);
    setGenres(getGenreOptions());
    if (!selectedRoundId && updated[0]) {
      setSelectedRoundId(updated[0].id);
    }
  };

  const currentRound = rounds.find(r => r.id === selectedRoundId) || rounds[0];
  const analytics = currentRound ? getLiveAdminAnalytics(currentRound.id) : null;
  const genreResults = currentRound ? calculateGenreResults(currentRound.id, activeGenreTab) : null;

  // New Round Form
  const [newRoundForm, setNewRoundForm] = useState({
    name: 'Weekend Pick — Next Weekend',
    edition: 'Weekly Edition',
    description: 'Vote for this weekend\'s top picks across multiple genres!',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    votingClosesAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'ACTIVE',
    tieBreakerRule: 'highest_percentage',
    showLiveResults: true,
  });

  const handleCreateRoundSubmit = (e) => {
    e.preventDefault();
    const activeGenresObj = {};
    genres.forEach(g => {
      activeGenresObj[g.id] = {
        genreId: g.id,
        genreName: g.name,
        candidates: [],
      };
    });

    const created = createRound({
      ...newRoundForm,
      genreRounds: activeGenresObj,
    });
    reloadData();
    setSelectedRoundId(created.id);
    setShowCreateModal(false);
  };

  const handleStatusChange = (roundId, newStatus) => {
    if (newStatus === 'WINNER_DECLARED') {
      if (window.confirm('Calculate results and declare winners for all active genres in this round?')) {
        declareWinnersForRound(roundId, currentRound.tieBreakerRule);
        reloadData();
      }
      return;
    }

    updateRound(roundId, { status: newStatus });
    reloadData();
  };

  const handleDeleteRound = (roundId) => {
    if (window.confirm('Are you sure you want to delete this voting round and all its candidate data?')) {
      deleteRound(roundId);
      reloadData();
    }
  };

  const handleResetPolling = (roundId) => {
    if (!currentRound) return;
    const isConfirmed = window.confirm(
      `Are you sure you want to RESET POLLING for "${currentRound.name}"?\n\n` +
      `• All submitted user votes for this round will be cleared to 0.\n` +
      `• Any declared winners for this round will be reset.\n` +
      `• Round status will be reset back to ACTIVE.\n\n` +
      `Do you want to proceed?`
    );
    if (!isConfirmed) return;

    const resetSeedsToo = window.confirm(
      `Do you also want to reset candidate baseline seed votes to 0?\n\n` +
      `• Click [OK] to reset candidate initial votes to 0 (true zero baseline).\n` +
      `• Click [Cancel] to keep the default baseline counts.`
    );

    resetRoundPolling(roundId, resetSeedsToo);
    reloadData();
    alert(`Polling for "${currentRound.name}" has been successfully reset!`);
  };

  const handleResetGenrePolling = (genreId) => {
    if (!currentRound) return;
    const genreName = genres.find(g => g.id === genreId)?.name || genreId;
    if (window.confirm(`Reset all votes and winner status for "${genreName}" in "${currentRound.name}"?`)) {
      resetGenrePolling(currentRound.id, genreId);
      reloadData();
      alert(`Votes for "${genreName}" have been reset.`);
    }
  };

  const handleFactoryReset = () => {
    if (window.confirm('⚠️ FACTORY RESET WEEKEND PICKS:\n\nThis will restore all default seed rounds, clear all user votes, and reset winners archive to default.\n\nAre you sure you want to continue?')) {
      factoryResetWeekendData();
      reloadData();
      alert('Weekend Pick system has been restored to default seeds!');
    }
  };

  // Genre Management Handlers
  const handleStartEditGenre = (g) => {
    setEditingGenreId(g.id);
    setEditGenreForm({ name: g.name, emoji: g.emoji || '🎬', color: g.color || '#eab308' });
  };

  const handleSaveEditGenre = (genreId) => {
    if (!editGenreForm.name.trim()) return;
    updateGenreOption(genreId, {
      name: editGenreForm.name.trim(),
      emoji: editGenreForm.emoji || '🎬',
      color: editGenreForm.color || '#eab308',
    });
    setEditingGenreId(null);
    reloadData();
    setGenreActionMsg(`Genre "${editGenreForm.name.trim()}" updated successfully!`);
    setTimeout(() => setGenreActionMsg(''), 3000);
  };

  const handleAddNewGenre = (e) => {
    e.preventDefault();
    if (!newGenreForm.name.trim()) return;
    try {
      const added = addGenreOption({
        name: newGenreForm.name.trim(),
        emoji: newGenreForm.emoji || '🎬',
        color: newGenreForm.color || '#eab308',
      });
      setNewGenreForm({ name: '', emoji: '🍿', color: '#f59e0b' });
      reloadData();
      setActiveGenreTab(added.id);
      setGenreActionMsg(`Added new genre: ${added.emoji} ${added.name}!`);
      setTimeout(() => setGenreActionMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteGenre = (genreId) => {
    const genre = genres.find(g => g.id === genreId);
    if (!genre) return;
    if (genres.length <= 1) {
      alert('You must have at least 1 voting genre.');
      return;
    }
    const candCount = currentRound?.genreRounds?.[genreId]?.candidates?.length || 0;
    if (window.confirm(`Delete the "${genre.name}" genre?${candCount > 0 ? ` (${candCount} candidates in active round will also be archived)` : ''}`)) {
      deleteGenreOption(genreId);
      reloadData();
      const remaining = getGenreOptions();
      if (activeGenreTab === genreId && remaining[0]) {
        setActiveGenreTab(remaining[0].id);
      }
      setGenreActionMsg(`Deleted genre "${genre.name}".`);
      setTimeout(() => setGenreActionMsg(''), 3000);
    }
  };

  const handleMoveGenre = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= genres.length) return;
    const reordered = [...genres];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    reorderGenreOptions(reordered);
    reloadData();
  };

  const handleResetGenresDefault = () => {
    if (window.confirm('Reset all genres to the default 8 categories (Action, Comedy, Horror, Sci-Fi, Thriller, Romance, Animation, Drama)?')) {
      resetGenreOptionsToDefault();
      reloadData();
      setActiveGenreTab('action');
      setGenreActionMsg('Genres reset to default 8 categories!');
      setTimeout(() => setGenreActionMsg(''), 3000);
    }
  };

  // Add Candidate handler
  const handleAddCandidate = (movieData) => {
    if (!currentRound) return;
    const currentGenreObj = genres.find(g => g.id === activeGenreTab);
    const genreRound = currentRound.genreRounds?.[activeGenreTab] || {
      genreId: activeGenreTab,
      genreName: currentGenreObj?.name || activeGenreTab,
      candidates: [],
    };

    const newCandidate = {
      id: `cand-${activeGenreTab}-${Date.now()}`,
      titleId: String(movieData.tmdbId || movieData.id),
      title: movieData.title || movieData.name,
      type: movieData.isTv || movieData.type === 'SERIES' ? 'SERIES' : 'MOVIE',
      releaseYear: movieData.releaseYear || (movieData.releaseDate ? movieData.releaseDate.split('-')[0] : 2024),
      rating: movieData.voteAverage ? Math.round((movieData.voteAverage / 2) * 10) / 10 : 4.5,
      language: movieData.language || 'English',
      posterUrl: movieData.posterUrl || '',
      backdropUrl: movieData.backdropUrl || '',
      overview: movieData.overview || '',
      initialVoteSeed: 0,
    };

    const updatedCandidates = [...(genreRound.candidates || []), newCandidate];
    const updatedGenreRounds = {
      ...(currentRound.genreRounds || {}),
      [activeGenreTab]: {
        ...genreRound,
        candidates: updatedCandidates,
      }
    };

    updateRound(currentRound.id, { genreRounds: updatedGenreRounds });
    reloadData();
    setShowAddCandidateModal(false);
    setCandidateSearchQuery('');
    setCandidateSearchResults([]);
  };

  const handleRemoveCandidate = (candId) => {
    if (!currentRound) return;
    const genreRound = currentRound.genreRounds?.[activeGenreTab];
    if (!genreRound) return;

    const updatedCandidates = genreRound.candidates.filter(c => c.id !== candId);
    const updatedGenreRounds = {
      ...currentRound.genreRounds,
      [activeGenreTab]: {
        ...genreRound,
        candidates: updatedCandidates,
      }
    };

    updateRound(currentRound.id, { genreRounds: updatedGenreRounds });
    reloadData();
  };

  const handleSearchTmdbForCandidate = async (e) => {
    e?.preventDefault();
    if (!candidateSearchQuery.trim()) return;
    setIsSearchingTmdb(true);
    try {
      const res = await searchTmdbMovies(candidateSearchQuery);
      setCandidateSearchResults(res.results || []);
    } catch (err) {
      console.error(err);
    }
    setIsSearchingTmdb(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text-primary)', margin: 0 }}>
            Weekend Voting Manager
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Configure weekly voting rounds, select candidates across 8 genres, resolve ties, and declare community winners.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={async () => {
              const res = await syncWeekendPickDataFromCloud({ force: true });
              reloadData();
              alert(res ? 'Successfully fetched latest weekend data from cloud!' : 'Cloud data is already up to date.');
            }}
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
            title="Download latest weekend round and candidate data from cloud database"
          >
            <RefreshCw size={13} /> Sync from Cloud
          </button>

          <button
            type="button"
            onClick={() => {
              pushWeekendPickDataToCloud();
              alert('Pushed local weekend data to Cloud! All mobile and desktop devices will now see these modifications.');
            }}
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, borderColor: 'var(--gold)', color: 'var(--gold)' }}
            title="Upload local modifications to cloud database so mobile view and other devices update immediately"
          >
            ☁️ Push to Cloud / Mobile
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={14} /> Create New Round
          </button>
        </div>
      </div>

      {/* Rounds Selector & Status Bar */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Active Round:
          </span>
          <select
            className="input"
            style={{ width: 'auto', fontSize: 12, padding: '6px 12px' }}
            value={currentRound?.id || ''}
            onChange={e => setSelectedRoundId(e.target.value)}
          >
            {rounds.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} [{r.status}]
              </option>
            ))}
          </select>
          {currentRound && (
            <span className={`badge ${
              currentRound.status === 'ACTIVE'
                ? 'badge-verified'
                : currentRound.status === 'WINNER_DECLARED'
                ? 'badge-gold'
                : 'badge-dim'
            }`} style={{ fontSize: 10 }}>
              {currentRound.status}
            </span>
          )}
        </div>

        {/* Round lifecycle action buttons */}
        {currentRound && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {currentRound.status !== 'ACTIVE' && (
              <button
                type="button"
                onClick={() => handleStatusChange(currentRound.id, 'ACTIVE')}
                className="btn btn-outline btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#4ade80' }}
              >
                <Play size={12} /> Open Voting
              </button>
            )}

            {currentRound.status === 'ACTIVE' && (
              <button
                type="button"
                onClick={() => handleStatusChange(currentRound.id, 'CLOSED')}
                className="btn btn-outline btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#fbbf24' }}
              >
                <Square size={12} /> Close Voting
              </button>
            )}

            <button
              type="button"
              onClick={() => handleStatusChange(currentRound.id, 'WINNER_DECLARED')}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}
            >
              <Trophy size={12} /> Declare Winners
            </button>

            <button
              type="button"
              onClick={() => handleResetPolling(currentRound.id)}
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, borderColor: '#f97316', color: '#f97316' }}
              title="Reset all user votes and winner status for this round"
            >
              <RotateCcw size={12} /> Reset Polling
            </button>

            {currentRound.status !== 'ARCHIVED' && (
              <button
                type="button"
                onClick={() => handleStatusChange(currentRound.id, 'ARCHIVED')}
                className="btn btn-ghost btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}
              >
                <Archive size={12} /> Archive
              </button>
            )}

            <button
              type="button"
              onClick={() => handleDeleteRound(currentRound.id)}
              className="btn btn-ghost btn-sm"
              style={{ color: '#f87171', padding: '4px 8px' }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Live Analytics Bar */}
      {analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div style={{ padding: 14, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 4 }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Valid Votes
            </div>
            <div style={{ fontSize: 22, fontFamily: 'var(--font-serif)', color: 'var(--gold)', fontWeight: 700, marginTop: 4 }}>
              {analytics.totalVotes.toLocaleString()}
            </div>
          </div>

          <div style={{ padding: 14, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 4 }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Unique Voters
            </div>
            <div style={{ fontSize: 22, fontFamily: 'var(--font-serif)', color: '#60a5fa', fontWeight: 700, marginTop: 4 }}>
              {analytics.uniqueVoters.toLocaleString()}
            </div>
          </div>

          <div style={{ padding: 14, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 4 }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Anti-Fraud Status
            </div>
            <div style={{ fontSize: 14, fontFamily: 'var(--font-serif)', color: analytics.suspiciousVotesCount > 0 ? '#f87171' : '#4ade80', fontWeight: 700, marginTop: 8 }}>
              {analytics.suspiciousVotesCount === 0 ? '✓ No Anomalies' : `⚠️ ${analytics.suspiciousVotesCount} Flags Detected`}
            </div>
          </div>

          <div style={{ padding: 14, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 4 }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Tie-Breaker Rule
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, textTransform: 'capitalize' }}>
              {currentRound?.tieBreakerRule?.replace(/_/g, ' ')}
            </div>
          </div>
        </div>
      )}

      {/* Genre Candidate Manager */}
      {currentRound && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 4, padding: 20 }}>
          {/* Genre Tabs & Management */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', alignItems: 'center' }}>
              {genres.map(g => {
                const isSelected = activeGenreTab === g.id;
                const candidateCount = currentRound.genreRounds?.[g.id]?.candidates?.length || 0;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setActiveGenreTab(g.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontFamily: 'var(--font-serif)',
                      background: isSelected ? 'var(--gold-faint)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border-subtle)'}`,
                      color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span>{g.emoji}</span>
                    <span>{g.name}</span>
                    <span style={{ fontSize: 9, opacity: 0.7 }}>({candidateCount})</span>
                  </button>
                );
              })}

              {/* Quick Manage Genres Button on the tab bar */}
              <button
                type="button"
                onClick={() => setShowManageGenresModal(true)}
                className="btn btn-outline btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  padding: '5px 12px',
                  borderRadius: 20,
                  borderColor: 'var(--gold)',
                  color: 'var(--gold)',
                  background: 'rgba(201,168,76,0.08)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
                title="Add, rename, delete or reorder genres"
              >
                <Edit3 size={12} /> Edit Genres
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  const currentG = genres.find(g => g.id === activeGenreTab);
                  if (currentG) {
                    setEditingGenreId(currentG.id);
                    setEditGenreForm({ name: currentG.name, emoji: currentG.emoji, color: currentG.color });
                    setShowManageGenresModal(true);
                  }
                }}
                className="btn btn-ghost btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--gold)' }}
                title="Edit name, emoji or color of this genre"
              >
                <Edit3 size={12} /> Edit "{genres.find(g => g.id === activeGenreTab)?.name || activeGenreTab}"
              </button>

              <button
                type="button"
                onClick={() => handleResetGenrePolling(activeGenreTab)}
                className="btn btn-ghost btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}
                title={`Reset votes for ${genreResults?.genreName || activeGenreTab}`}
              >
                <RotateCcw size={11} /> Reset {genreResults?.genreName || activeGenreTab} Votes
              </button>

              <button
                type="button"
                onClick={() => setShowAddCandidateModal(true)}
                className="btn btn-outline btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}
              >
                <Plus size={13} /> Add Candidate in {genres.find(g => g.id === activeGenreTab)?.name}
              </button>
            </div>
          </div>

          {/* Candidate Table / Cards */}
          {genreResults?.candidates?.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <Film size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>No candidates added in this genre yet.</p>
              <button
                type="button"
                onClick={() => setShowAddCandidateModal(true)}
                className="btn btn-primary btn-sm"
                style={{ marginTop: 8 }}
              >
                + Add First Candidate
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: 10 }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Candidate</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Type</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Year / Rating</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Total Votes</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Vote Share</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {genreResults?.candidates?.map((cand, idx) => (
                    <tr key={cand.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        {cand.posterUrl && (
                          <img
                            src={cand.posterUrl}
                            alt={cand.title}
                            style={{ width: 32, height: 48, objectFit: 'cover', borderRadius: 2 }}
                          />
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {idx === 0 && <span style={{ color: 'var(--gold)', marginRight: 4 }}>🏆</span>}
                            {cand.title}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>ID: {cand.titleId}</div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span className="badge badge-dim" style={{ fontSize: 9 }}>
                          {cand.type === 'SERIES' ? 'TV Series' : 'Movie'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                        {cand.releaseYear} · ★ {cand.rating || 4.7}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--gold)' }}>
                        {cand.totalVotes.toLocaleString()}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 80, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${cand.votePercentage}%`, height: '100%', background: idx === 0 ? 'var(--gold)' : 'var(--text-muted)' }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cand.votePercentage}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveCandidate(cand.id)}
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#f87171', padding: '4px 6px' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ADMIN MAINTENANCE & POLLING DATA TOOLS */}
      <div style={{
        marginTop: 12,
        padding: 20,
        background: 'rgba(239,68,68,0.03)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 4,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: '#f87171', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={15} /> Admin Polling Maintenance &amp; Reset Tools
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Clear community user votes for this round, reset candidate seed baselines, or restore default seed database.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {currentRound && (
            <button
              type="button"
              onClick={() => handleResetPolling(currentRound.id)}
              className="btn btn-outline btn-sm"
              style={{ borderColor: '#f97316', color: '#f97316', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <RotateCcw size={12} /> Reset Current Round Polling
            </button>
          )}
          <button
            type="button"
            onClick={handleFactoryReset}
            className="btn btn-ghost btn-sm"
            style={{ color: '#f87171', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5, border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <RefreshCw size={12} /> Factory Reset All Weekend Data
          </button>
        </div>
      </div>

      {/* CREATE ROUND MODAL */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2500,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 4, maxWidth: 540, width: '100%', padding: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--gold)', marginBottom: 16 }}>
              Create Weekend Voting Round
            </h3>
            <form onSubmit={handleCreateRoundSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Round Name *</label>
                <input
                  required
                  className="input"
                  value={newRoundForm.name}
                  onChange={e => setNewRoundForm({ ...newRoundForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Edition Label</label>
                  <input
                    className="input"
                    value={newRoundForm.edition}
                    onChange={e => setNewRoundForm({ ...newRoundForm, edition: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Tie-Breaker Rule</label>
                  <select
                    className="input"
                    value={newRoundForm.tieBreakerRule}
                    onChange={e => setNewRoundForm({ ...newRoundForm, tieBreakerRule: e.target.value })}
                  >
                    {TIE_BREAKER_OPTIONS.map(tb => (
                      <option key={tb.id} value={tb.id}>{tb.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Start Date</label>
                  <input
                    type="date"
                    className="input"
                    value={newRoundForm.startDate}
                    onChange={e => setNewRoundForm({ ...newRoundForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Voting Closes Date</label>
                  <input
                    type="date"
                    className="input"
                    value={newRoundForm.votingClosesAt}
                    onChange={e => setNewRoundForm({ ...newRoundForm, votingClosesAt: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Description</label>
                <textarea
                  className="input"
                  rows={2}
                  value={newRoundForm.description}
                  onChange={e => setNewRoundForm({ ...newRoundForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-ghost btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Create Round</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CANDIDATE MODAL */}
      {showAddCandidateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2500,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 4, maxWidth: 580, width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--gold)', marginBottom: 8 }}>
              Add Candidate in {genres.find(g => g.id === activeGenreTab)?.name || activeGenreTab}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Search TMDB to select an official movie or TV series candidate.
            </p>

            {/* Search form */}
            <form onSubmit={handleSearchTmdbForCandidate} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                className="input"
                placeholder="Search movie or TV series title..."
                value={candidateSearchQuery}
                onChange={e => setCandidateSearchQuery(e.target.value)}
                autoFocus
              />
              <button type="submit" disabled={isSearchingTmdb} className="btn btn-primary btn-sm">
                {isSearchingTmdb ? 'Searching...' : 'Search'}
              </button>
            </form>

            {/* Results */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
              {candidateSearchResults.map(m => (
                <div
                  key={m.id || m.tmdbId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 8,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 4,
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {m.posterUrl && (
                      <img
                        src={m.posterUrl}
                        alt={m.title}
                        style={{ width: 36, height: 52, objectFit: 'cover', borderRadius: 2 }}
                      />
                    )}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{m.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {m.releaseYear || m.releaseDate?.split('-')[0]} · {m.language} · ★ {m.voteAverage || 0}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddCandidate(m)}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: 11 }}
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" onClick={() => setShowAddCandidateModal(false)} className="btn btn-ghost btn-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage / Edit Genres Modal */}
      {showManageGenresModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 4000,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            maxWidth: 640,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: 24,
            boxShadow: 'var(--shadow-card)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Category Configuration
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text-primary)', margin: '4px 0 0' }}>
                  Manage & Edit Genres
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowManageGenresModal(false);
                  setEditingGenreId(null);
                }}
                className="btn btn-ghost btn-sm"
                style={{ padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {genreActionMsg && (
              <div style={{
                padding: '8px 12px',
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: 4,
                color: '#4ade80',
                fontSize: 12,
                marginBottom: 16,
              }}>
                {genreActionMsg}
              </div>
            )}

            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
              Rename genres, customize their emoji and accent color, add new voting categories, or reorder them. Changes immediately apply to the Weekend Poll, Discover Hero, and Winner Archives.
            </p>

            {/* List of Genres */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {genres.map((g, idx) => {
                const isEditing = editingGenreId === g.id;
                const candCount = currentRound?.genreRounds?.[g.id]?.candidates?.length || 0;

                if (isEditing) {
                  return (
                    <div
                      key={g.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: 10,
                        background: 'rgba(201,168,76,0.08)',
                        border: '1px solid var(--gold)',
                        borderRadius: 4,
                        flexWrap: 'wrap',
                      }}
                    >
                      <input
                        type="text"
                        value={editGenreForm.emoji}
                        onChange={e => setEditGenreForm({ ...editGenreForm, emoji: e.target.value })}
                        style={{
                          width: 44,
                          textAlign: 'center',
                          fontSize: 16,
                          background: '#18140e',
                          color: '#fff',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 4,
                          padding: '6px 4px',
                        }}
                        placeholder="Emoji"
                        title="Emoji icon"
                      />
                      <input
                        type="text"
                        value={editGenreForm.name}
                        onChange={e => setEditGenreForm({ ...editGenreForm, name: e.target.value })}
                        className="input"
                        style={{ flex: 1, minWidth: 140, fontSize: 13, padding: '6px 10px' }}
                        placeholder="Genre Name"
                        autoFocus
                      />
                      <input
                        type="color"
                        value={editGenreForm.color}
                        onChange={e => setEditGenreForm({ ...editGenreForm, color: e.target.value })}
                        style={{ width: 36, height: 34, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4 }}
                        title="Accent Color"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditGenre(g.id)}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                      >
                        <Check size={13} /> Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingGenreId(null)}
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 11 }}
                      >
                        Cancel
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={g.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 4,
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{g.emoji}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{g.name}</span>
                          <span
                            style={{
                              display: 'inline-block',
                              width: 9,
                              height: 9,
                              borderRadius: '50%',
                              backgroundColor: g.color || '#eab308',
                            }}
                            title={`Color: ${g.color}`}
                          />
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          ID: <code style={{ color: 'var(--text-secondary)' }}>{g.id}</code> · {candCount} candidates in active round
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveGenre(idx, -1)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 6px', fontSize: 11, opacity: idx === 0 ? 0.3 : 1 }}
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={idx === genres.length - 1}
                        onClick={() => handleMoveGenre(idx, 1)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 6px', fontSize: 11, opacity: idx === genres.length - 1 ? 0.3 : 1 }}
                        title="Move Down"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEditGenre(g)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 8px', fontSize: 11, color: 'var(--gold)' }}
                        title="Edit Genre"
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGenre(g.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 8px', fontSize: 11, color: '#f87171' }}
                        title="Delete Genre"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add New Genre Section */}
            <div style={{
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 4,
              padding: 14,
              marginBottom: 20,
            }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 10, fontWeight: 600 }}>
                + Add New Genre
              </div>

              <form onSubmit={handleAddNewGenre} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={newGenreForm.emoji}
                  onChange={e => setNewGenreForm({ ...newGenreForm, emoji: e.target.value })}
                  style={{
                    width: 44,
                    textAlign: 'center',
                    fontSize: 16,
                    background: '#18140e',
                    color: '#fff',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 4,
                    padding: '6px 4px',
                  }}
                  placeholder="Emoji"
                  title="Emoji"
                />
                <input
                  type="text"
                  value={newGenreForm.name}
                  onChange={e => setNewGenreForm({ ...newGenreForm, name: e.target.value })}
                  className="input"
                  style={{ flex: 1, minWidth: 150, fontSize: 12, padding: '6px 10px' }}
                  placeholder="Genre Name (e.g. Anime, Documentary, Classics...)"
                />
                <input
                  type="color"
                  value={newGenreForm.color}
                  onChange={e => setNewGenreForm({ ...newGenreForm, color: e.target.value })}
                  style={{ width: 36, height: 34, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4 }}
                  title="Pick Color"
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                >
                  <Plus size={13} /> Add Genre
                </button>
              </form>

              {/* Quick emoji suggestions */}
              <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Quick icons:</span>
                {['🍿', '🎬', '🎌', '🛸', '🤠', '🦇', '🎸', '🏆', '📚', '🧩', '⚡', '💣'].map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewGenreForm(f => ({ ...f, emoji }))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 2 }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 14, flexWrap: 'wrap', gap: 8 }}>
              <button
                type="button"
                onClick={handleResetGenresDefault}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11, color: 'var(--text-muted)' }}
              >
                Reset to Default 8 Genres
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowManageGenresModal(false);
                  setEditingGenreId(null);
                }}
                className="btn btn-primary btn-sm"
                style={{ fontSize: 11 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
