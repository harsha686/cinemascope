import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Trophy,
  Sparkles,
  Dices,
  Clock,
  Check,
  Flame,
  Archive,
  Share2,
  Lock,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  getActiveRound,
  calculateGenreResults,
  submitVote,
  hasUserVotedInGenre,
  getUserVoteInGenre,
  getUserVotes,
  GENRE_OPTIONS,
  getAllWinners,
} from '../services/weekendPickService';
import { useApp } from '../AppContext';
import CandidateVoteCard from '../components/weekend/CandidateVoteCard';
import PickMyWeekendModal from '../components/weekend/PickMyWeekendModal';
import SocialShareModal from '../components/weekend/SocialShareModal';
import WeekendWinnerBadge from '../components/weekend/WeekendWinnerBadge';

export default function WeekendPickPage() {
  const navigate = useNavigate();
  const { state } = useApp();
  const currentUser = state.currentUser;

  const [activeRound, setActiveRound] = useState(() => getActiveRound());
  const [selectedGenre, setSelectedGenre] = useState('action');
  const [showPickModal, setShowPickModal] = useState(false);
  const [shareModalData, setShareModalData] = useState(null);
  const [voteConfirmationMsg, setVoteConfirmationMsg] = useState('');

  const reloadRoundData = () => {
    setActiveRound(getActiveRound());
  };

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

      setVoteConfirmationMsg(`🎉 Vote confirmed! You chose "${candidate.title}" in ${GENRE_OPTIONS.find(g => g.id === selectedGenre)?.name || selectedGenre}.`);
      reloadRoundData();

      setTimeout(() => {
        setVoteConfirmationMsg('');
      }, 5000);
    } catch (err) {
      alert(err.message || 'Error recording vote.');
    }
  };

  const genreObj = GENRE_OPTIONS.find(g => g.id === selectedGenre) || GENRE_OPTIONS[0];

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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
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
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowPickModal(true)}
                  className="btn btn-outline btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Dices size={14} /> 🎲 Pick My Weekend
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/weekend-winners')}
                  className="btn btn-ghost btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold)' }}
                >
                  <Archive size={14} /> Winner Archive →
                </button>
              </div>

              {/* User Voting Status */}
              {currentUser && activeRound && (
                <div style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  background: 'rgba(255,255,255,0.04)',
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: '1px solid var(--border-subtle)',
                }}>
                  You have voted in <strong style={{ color: 'var(--gold)' }}>{userAllVotes.length}</strong> of {Object.keys(activeRound.genreRounds || {}).length} genres
                </div>
              )}
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
                <strong>{activeRound.name}</strong> · Voting closes Sunday night
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
              <span>Strictly <strong>1 vote per genre</strong></span>
              <span>·</span>
              <span>Total Genre Votes: <strong style={{ color: 'var(--text-primary)' }}>{genreResults?.totalVotes?.toLocaleString() || 0}</strong></span>
            </div>
          </div>
        )}

        {/* Genre Selector Pills */}
        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 12,
          marginBottom: 24,
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          {GENRE_OPTIONS.map(g => {
            const isSelected = selectedGenre === g.id;
            const hasVoted = currentUser && activeRound && hasUserVotedInGenre(currentUser.id, activeRound.id, g.id);

            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGenre(g.id)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 24,
                  fontSize: 12,
                  fontFamily: 'var(--font-serif)',
                  letterSpacing: '0.04em',
                  background: isSelected ? 'var(--gold-faint)' : 'var(--bg-card)',
                  border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border-subtle)'}`,
                  color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? '0 2px 10px rgba(201,168,76,0.15)' : 'none',
                  transition: 'all 150ms ease',
                }}
              >
                <span>{g.emoji}</span>
                <span style={{ fontWeight: isSelected ? 700 : 500 }}>{g.name}</span>
                {hasVoted && (
                  <span style={{
                    fontSize: 9,
                    background: 'rgba(74,222,128,0.2)',
                    color: '#4ade80',
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
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Check out other active genres or pick from the winner archive.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
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
              {GENRE_OPTIONS.map(g => {
                const res = calculateGenreResults(activeRound.id, g.id);
                const winner = res.leadingCandidate;
                if (!winner) return null;

                return (
                  <div
                    key={g.id}
                    onClick={() => navigate(`/movie/${winner.titleId.startsWith('tmdb-') ? winner.titleId : `tmdb-${winner.titleId}`}`)}
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
    </div>
  );
}
