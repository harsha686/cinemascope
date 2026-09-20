import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Trophy,
  Clock,
  Check,
  Archive,
  Info,
  Plus,
} from 'lucide-react';
import {
  getActiveRound,
  calculateGenreResults,
  submitVote,
  hasUserVotedInGenre,
  getUserVoteInGenre,
  getUserVotes,
  getGenreOptions,
  syncWeekendPickDataFromCloud,
  formatMediaDetailUrl,
} from '../services/weekendPickService';
import { useApp } from '../AppContext';
import CandidateVoteCard from '../components/weekend/CandidateVoteCard';
import PickMyWeekendModal from '../components/weekend/PickMyWeekendModal';
import SocialShareModal from '../components/weekend/SocialShareModal';
import UserAddCandidateModal from '../components/weekend/UserAddCandidateModal';

export default function WeekendPickPage() {
  const navigate = useNavigate();
  const { state } = useApp();
  const currentUser = state.currentUser;

  const [genres, setGenres] = useState(() => getGenreOptions());
  const [activeRound, setActiveRound] = useState(() => getActiveRound());
  const [selectedGenre, setSelectedGenre] = useState(() => getGenreOptions()[0]?.id || 'action');
  const [showPickModal, setShowPickModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [shareModalData, setShareModalData] = useState(null);
  const [voteConfirmationMsg, setVoteConfirmationMsg] = useState('');

  const reloadRoundData = () => {
    setActiveRound(getActiveRound());
    setGenres(getGenreOptions());
  };

  useEffect(() => {
    syncWeekendPickDataFromCloud();
    const syncData = () => {
      setActiveRound(getActiveRound());
      setGenres(getGenreOptions());
    };
    window.addEventListener('storage', syncData);
    window.addEventListener('focus', () => { syncData(); syncWeekendPickDataFromCloud(); });
    window.addEventListener('cinemascope_genres_updated', syncData);
    window.addEventListener('cinemascope_round_updated', syncData);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncData();
        syncWeekendPickDataFromCloud();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', syncData);
      window.removeEventListener('focus', syncData);
      window.removeEventListener('cinemascope_genres_updated', syncData);
      window.removeEventListener('cinemascope_round_updated', syncData);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (genres.length > 0 && !genres.some(g => g.id === selectedGenre)) {
      setSelectedGenre(genres[0].id);
    }
  }, [genres, selectedGenre]);

  const isRoundActive = activeRound?.status === 'ACTIVE';
  const isWinnersDeclared = activeRound?.status === 'WINNER_DECLARED';

  // Calculate live results for currently selected genre
  const genreResults = activeRound ? calculateGenreResults(activeRound.id, selectedGenre) : null;

  // Check user vote status in selected genre
  const userVote = currentUser && activeRound
    ? getUserVoteInGenre(currentUser.id, activeRound.id, selectedGenre)
    : null;
  const userAllVotes = currentUser && activeRound
    ? getUserVotes(currentUser.id, activeRound.id)
    : [];

  const handleVoteSubmit = (candidate) => {
    if (!currentUser) {
      alert('Please log in or sign up to cast your vote for the Weekend Pick.');
      navigate('/login');
      return;
    }

    try {
      submitVote({
        roundId: activeRound.id,
        genreId: selectedGenre,
        candidateId: candidate.id,
        titleId: candidate.titleId,
        title: candidate.title,
        userId: currentUser.id,
        userEmail: currentUser.email,
      });

      setVoteConfirmationMsg(`🎉 Vote confirmed! You chose "${candidate.title}" in ${genres.find(g => g.id === selectedGenre)?.name || selectedGenre}.`);
      reloadRoundData();

      setTimeout(() => {
        setVoteConfirmationMsg('');
      }, 5000);
    } catch (err) {
      alert(err.message || 'Error recording vote.');
    }
  };

  const genreObj = genres.find(g => g.id === selectedGenre) || genres[0] || { id: selectedGenre, name: selectedGenre, emoji: '🎬' };

  return (
    <div className="page-enter" style={{ minHeight: '90vh', paddingBottom: 60 }}>
      {/* Top Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(10,10,14,0.98) 60%)',
        borderBottom: '1px solid var(--border)',
        padding: '50px 24px 40px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          {/* Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 11, color: 'var(--text-muted)' }}>
            <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <span style={{ color: 'var(--gold)' }}>Weekend Pick</span>
          </div>

          <div className="weekend-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span className="badge badge-gold" style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Trophy size={11} /> WEEKEND COMMUNITY POLL
                </span>
                {isRoundActive && (
                  <span className="badge badge-verified" style={{ fontSize: 10 }}>
                    ● Voting Live Now
                  </span>
                )}
                {isWinnersDeclared && (
                  <span className="badge" style={{ background: '#10b981', color: '#fff', fontSize: 10 }}>
                    🏆 Winners Declared
                  </span>
                )}
              </div>

              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(28px, 4.5vw, 44px)',
                color: 'var(--text-primary)',
                letterSpacing: '0.03em',
                margin: '0 0 10px',
                lineHeight: 1.15,
              }}>
                Weekend Pick 🎬
              </h1>

              <p style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                maxWidth: 640,
                lineHeight: 1.6,
                margin: 0,
              }}>
                The community chooses what's worth watching. Vote for your top movie or TV series across 8 genres. The title with the most votes becomes this weekend's official recommendation!
              </p>

              <div style={{ marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => navigate('/weekend-winners')}
                  className="btn btn-ghost btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    color: 'var(--gold)',
                    padding: '7px 14px',
                    borderRadius: 6,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--gold-faint)';
                    e.currentTarget.style.borderColor = 'var(--gold)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  <Archive size={14} /> Winner Archive →
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="weekend-page-quick-actions" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowPickModal(true)}
                title="Roll Random Pick"
                style={{
                  width: '5cm',
                  height: '5cm',
                  minWidth: '5cm',
                  minHeight: '5cm',
                  maxWidth: '100%',
                  aspectRatio: '1 / 1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  padding: '14px',
                  borderRadius: 16,
                  background: 'linear-gradient(145deg, rgba(245, 158, 11, 0.22) 0%, rgba(20, 16, 12, 0.96) 100%)',
                  border: '2px solid rgba(250, 204, 21, 0.85)',
                  boxShadow: '0 0 25px rgba(245, 158, 11, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
                  e.currentTarget.style.boxShadow = '0 0 35px rgba(245, 158, 11, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.borderColor = '#fbbf24';
                  const dice = e.currentTarget.querySelector('.random-pick-dice');
                  if (dice) dice.style.transform = 'rotate(-10deg) scale(1.12)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 0 25px rgba(245, 158, 11, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(250, 204, 21, 0.85)';
                  const dice = e.currentTarget.querySelector('.random-pick-dice');
                  if (dice) dice.style.transform = 'none';
                }}
              >
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(circle at 50% 35%, rgba(245, 158, 11, 0.25) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }} />
                <span
                  className="random-pick-dice"
                  style={{
                    fontSize: 64,
                    lineHeight: 1,
                    filter: 'drop-shadow(0 4px 14px rgba(245, 158, 11, 0.5))',
                    transition: 'transform 0.3s ease',
                    display: 'inline-block',
                  }}
                >
                  🎲
                </span>
                <span style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 16,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: '#ffffff',
                  textAlign: 'center',
                  textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                }}>
                  Random Pick
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container" style={{ marginTop: 32 }}>
        {/* Vote confirmation alert toast */}
        {voteConfirmationMsg && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(74,222,128,0.15) 0%, rgba(16,185,129,0.08) 100%)',
            border: '1px solid #4ade80',
            borderRadius: 4,
            padding: '14px 18px',
            color: '#4ade80',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'fadeIn 200ms ease',
          }}>
            <Check size={18} />
            <span>{voteConfirmationMsg}</span>
          </div>
        )}

        {/* Round Lifecycle Info Bar */}
        {activeRound && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 4,
            padding: '14px 18px',
            marginBottom: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={15} color="var(--gold)" />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                <strong>{activeRound.name}</strong> · Polling window: <strong>Sunday 9:00 PM</strong> to <strong>Friday 11:00 PM</strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
              <span>Strictly <strong>1 vote per genre</strong></span>
              <span>·</span>
              {userVote ? (
                <span>Total Genre Votes: <strong style={{ color: 'var(--text-primary)' }}>{genreResults?.totalVotes?.toLocaleString() || 0}</strong></span>
              ) : (
                <span>Genre Standings: <strong style={{ color: 'var(--gold)' }}>🔒 Vote to Reveal</strong></span>
              )}
            </div>
          </div>
        )}

        {/* Genre Selector Pills */}
        <div className="weekend-genre-pills" style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 12,
          marginBottom: 24,
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          {genres.map(g => {
            const isSelected = selectedGenre === g.id;
            const hasVoted = currentUser && activeRound && hasUserVotedInGenre(currentUser.id, activeRound.id, g.id);

            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGenre(g.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontFamily: 'var(--font-sans)',
                  letterSpacing: '0.03em',
                  background: isSelected ? 'rgba(255,255,255,0.14)' : 'var(--bg-card)',
                  border: `1px solid ${isSelected ? 'rgba(255,255,255,0.3)' : 'var(--border-subtle)'}`,
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  whiteSpace: 'nowrap',
                  transition: 'all 150ms ease',
                }}
              >
                <span>{g.emoji}</span>
                <span style={{ fontWeight: isSelected ? 600 : 400 }}>{g.name}</span>
                {hasVoted && (
                  <span style={{
                    fontSize: 9,
                    background: 'var(--color-success-bg)',
                    color: 'var(--color-success)',
                    border: '1px solid var(--color-success-border)',
                    padding: '2px 6px',
                    borderRadius: 10,
                    fontWeight: 700,
                  }}>
                    ✓ VOTED
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Genre Banner */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{genreObj.emoji}</span>
              <span>{genreObj.name} Contenders</span>
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              {userVote
                ? `You voted for "${userVote.title}". Results will be finalized at the end of the round.`
                : 'Select one candidate to cast your vote for this weekend.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {userVote && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--gold-faint)',
                border: '1px solid var(--gold)',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 11,
                color: 'var(--gold)',
                fontWeight: 600,
              }}>
                <Check size={13} />
                <span>Your Choice: <strong>{userVote.title}</strong></span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="btn btn-outline btn-sm"
              style={{
                fontSize: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderColor: 'rgba(212, 175, 55, 0.4)',
                color: 'var(--gold)',
                background: 'rgba(212, 175, 55, 0.05)',
              }}
            >
              <Plus size={14} /> Add Movie / Series
            </button>
          </div>
        </div>

        {/* Candidates Grid */}
        {genreResults?.candidates?.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 24px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 4,
          }}>
            <Info size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)' }}>
              No candidates in {genreObj.name} for this round
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Be the first to nominate a movie or series to compete in this genre!
            </p>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={14} /> Add First Movie to {genreObj.name}
            </button>
          </div>
        ) : (
          <div className="weekend-candidates-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: 20,
          }}>
            {genreResults?.candidates?.map((candidate, idx) => (
              <CandidateVoteCard
                key={candidate.id}
                candidate={candidate}
                genreId={selectedGenre}
                hasVotedInGenre={!!userVote}
                userVotedCandidateId={userVote?.candidateId}
                onVote={handleVoteSubmit}
                isRoundActive={isRoundActive}
                showLiveResults={activeRound.showLiveResults || !!userVote}
                rank={idx + 1}
              />
            ))}

            {/* "Add Movie / Series" Card at the end of every genre */}
            <div
              onClick={() => setShowAddModal(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '2px dashed rgba(212, 175, 55, 0.35)',
                borderRadius: 6,
                padding: '32px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                cursor: 'pointer',
                minHeight: 340,
                transition: 'all 200ms ease',
                position: 'relative',
                boxShadow: 'inset 0 0 24px rgba(212, 175, 55, 0.03)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold)';
                e.currentTarget.style.background = 'rgba(212, 175, 55, 0.06)';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.35)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  background: 'rgba(212, 175, 55, 0.12)',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gold)',
                  marginBottom: 16,
                  boxShadow: '0 0 16px rgba(212, 175, 55, 0.15)',
                }}
              >
                <Plus size={26} />
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--gold)',
                  marginBottom: 6,
                }}
              >
                Add Movie or Series
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  margin: '0 0 18px',
                  maxWidth: 220,
                  lineHeight: 1.4,
                }}
              >
                Nominate any movie or series to compete in <strong>{genreObj.name}</strong> this weekend
              </p>
              <span
                className="btn btn-outline btn-sm"
                style={{
                  fontSize: 11,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  pointerEvents: 'none',
                  borderColor: 'rgba(212, 175, 55, 0.4)',
                  color: 'var(--gold)',
                }}
              >
                <Plus size={13} /> Nominate Contender
              </span>
            </div>
          </div>
        )}

        {/* Winners Section if round is declared */}
        {isWinnersDeclared && (
          <div style={{ marginTop: 48, borderTop: '1px solid var(--border-subtle)', paddingTop: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--gold)', margin: 0 }}>
                  🏆 Declared Weekend Winners
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  The community crowned these titles as this weekend's top recommendations.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/weekend-winners')}
                className="btn btn-outline btn-sm"
              >
                Browse Full Archive →
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 16,
            }}>
              {genres.map(g => {
                const res = calculateGenreResults(activeRound.id, g.id);
                const winner = res.leadingCandidate;
                if (!winner) return null;

                return (
                  <div
                    key={g.id}
                    onClick={() => navigate(`/movie/${formatMediaDetailUrl(winner)}`)}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 4,
                      padding: 14,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--gold)', textTransform: 'uppercase' }}>
                        {g.emoji} {g.name}
                      </span>
                      <span className="badge badge-gold" style={{ fontSize: 8 }}>WINNER</span>
                    </div>

                    {winner.posterUrl && (
                      <img
                        src={winner.posterUrl}
                        alt={winner.title}
                        style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 3 }}
                      />
                    )}

                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {winner.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {winner.totalVotes.toLocaleString()} votes ({winner.votePercentage}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Pick My Weekend Modal */}
      <PickMyWeekendModal
        isOpen={showPickModal}
        onClose={() => setShowPickModal(false)}
      />

      {/* Social Share Modal */}
      {shareModalData && (
        <SocialShareModal
          isOpen={!!shareModalData}
          onClose={() => setShareModalData(null)}
          {...shareModalData}
        />
      )}

      {/* User Add Candidate Modal */}
      {activeRound && (
        <UserAddCandidateModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          roundId={activeRound.id}
          genreId={selectedGenre}
          genreName={genreObj.name}
          existingCandidates={genreResults?.candidates || []}
          onCandidateAdded={() => reloadRoundData()}
        />
      )}
    </div>
  );
}
