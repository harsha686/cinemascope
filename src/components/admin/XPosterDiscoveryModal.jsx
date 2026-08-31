import React, { useState, useEffect } from 'react';
import { Search, ExternalLink, Check, Sparkles, AlertCircle, RefreshCw, X, ShieldCheck } from 'lucide-react';
import {
  fetchXPostersForAccount,
  searchXAccounts,
  normalizeXUsername,
  POPULAR_MOVIE_X_ACCOUNTS
} from '../../services/xApiService';

export default function XPosterDiscoveryModal({ movieTitle, currentAccount, onClose, onSelectPoster }) {
  const [xAccountInput, setXAccountInput] = useState(currentAccount || '');
  const [isLoading, setIsLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState('');
  
  // Account discovery state
  const [showAccountFinder, setShowAccountFinder] = useState(false);
  const [accountQuery, setAccountQuery] = useState(movieTitle || '');
  const [discoveredAccounts, setDiscoveredAccounts] = useState(POPULAR_MOVIE_X_ACCOUNTS);

  // Auto-fetch if account was passed in
  useEffect(() => {
    if (currentAccount) {
      handleFetchPosters(currentAccount);
    } else if (movieTitle) {
      handleFindAccount();
    }
  }, []);

  const handleFetchPosters = async (accountToFetch) => {
    const target = accountToFetch || xAccountInput;
    if (!target) {
      setError('Please enter an official X handle (e.g., @SunPictures) or profile link.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const posts = await fetchXPostersForAccount(target, movieTitle);
      setCandidates(posts);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Failed to fetch posts from X. Please check the account username.');
    }
  };

  const handleFindAccount = async () => {
    setShowAccountFinder(true);
    const results = await searchXAccounts(accountQuery || movieTitle);
    setDiscoveredAccounts(results);
  };

  const handleSelectAccountFromFinder = (acc) => {
    const handle = `@${acc.username}`;
    setXAccountInput(handle);
    setShowAccountFinder(false);
    handleFetchPosters(handle);
  };

  const handleConfirmPosterSelection = (candidate) => {
    // Only mark Verified after explicitly selected by Admin
    const selectedPosterData = {
      ...candidate,
      sourceAccount: xAccountInput.startsWith('@') ? xAccountInput : `@${xAccountInput}`,
      verified: true,
      status: 'SELECTED',
      selectedAt: new Date().toISOString(),
    };
    onSelectPoster(selectedPosterData);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2200,
      background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-sm)',
        maxWidth: 820,
        width: '100%',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-card), 0 0 50px rgba(0,0,0,0.9)',
      }}>
        
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(to bottom, rgba(220,182,91,0.05), transparent)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge badge-gold" style={{ fontSize: 9 }}>Official X Poster Discovery</span>
              {movieTitle && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>• Movie: <strong style={{ color: 'var(--text-primary)' }}>{movieTitle}</strong></span>}
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text-primary)', marginTop: 4 }}>
              Discover Promotional Art on X
            </h2>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Account Input & Discovery Bar */}
          <div style={{ padding: 16, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Official X Account Handle / Profile
              </label>
              <button
                type="button"
                onClick={() => setShowAccountFinder(!showAccountFinder)}
                style={{ fontSize: 11, color: 'var(--text-gold)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-serif)' }}
              >
                {showAccountFinder ? 'Close Account Finder' : '🔍 Find Official Account'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <input
                className="input"
                style={{ flex: 1, fontSize: 13 }}
                placeholder="Enter handle e.g. @SunPictures or profile URL..."
                value={xAccountInput}
                onChange={e => setXAccountInput(e.target.value)}
              />
              <button
                type="button"
                onClick={() => handleFetchPosters()}
                disabled={isLoading}
                className="btn btn-primary"
                style={{ fontSize: 12, padding: '8px 20px' }}
              >
                {isLoading ? <><RefreshCw size={14} className="spin" /> Fetching...</> : <><Sparkles size={14} /> Fetch Posters</>}
              </button>
            </div>

            {/* Account Finder Drawer */}
            {showAccountFinder && (
              <div style={{ marginTop: 12, padding: 14, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 4 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Search candidate official accounts:</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input
                    className="input"
                    style={{ fontSize: 12, padding: '6px 12px' }}
                    placeholder="Search account name or production company..."
                    value={accountQuery}
                    onChange={e => { setAccountQuery(e.target.value); handleFindAccount(); }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                  {discoveredAccounts.map(acc => (
                    <div
                      key={acc.username}
                      onClick={() => handleSelectAccountFromFinder(acc)}
                      style={{
                        padding: 10,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 3,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        transition: 'border-color 150ms ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold-dim)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>@{acc.username}</span>
                        {acc.verified && <span style={{ fontSize: 9, color: '#60a5fa' }}>✓ Verified</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>{acc.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{acc.followers} followers</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ padding: 12, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Candidates Grid */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-serif)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Candidate Posters & Artwork ({candidates.length})
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Select an image to verify as official poster
              </span>
            </div>

            {isLoading ? (
              <div style={{ padding: '60px 0', textAlign: 'center' }}>
                <RefreshCw size={28} color="var(--gold)" style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', fontSize: 14 }}>
                  Fetching promotional posts from X API...
                </p>
              </div>
            ) : candidates.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)' }}>
                <Sparkles size={32} color="var(--gold-dim)" style={{ marginBottom: 12 }} />
                <h4 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', marginBottom: 4 }}>No candidate posters loaded</h4>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Enter an official X handle above and click <strong>Fetch Posters</strong>.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {candidates.map(c => (
                  <div
                    key={c.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Poster Candidate Image */}
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '2/3', background: '#000' }}>
                      <img src={c.imageUrl} alt="X Promotional Candidate" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.src='/demo-frame.jpg'} />
                      {c.isPosterKeywordMatch && (
                        <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(74, 222, 128, 0.9)', color: '#000', fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 2 }}>
                          POSTER MATCH
                        </div>
                      )}
                    </div>

                    {/* Metadata & Caption */}
                    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', flex: 1, gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 10, color: 'var(--gold)' }}>{c.sourceAccount}</span>
                        <a href={c.sourcePostUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
                          Post <ExternalLink size={9} />
                        </a>
                      </div>

                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {c.sourceCaption}
                      </p>

                      <button
                        type="button"
                        onClick={() => handleConfirmPosterSelection(c)}
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: 'auto', width: '100%', justifyContent: 'center', fontSize: 11, padding: '6px 12px' }}
                      >
                        <Check size={12} /> Use This Poster
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Official X source attribution & post URL will be permanently linked with Admin Verification status.
          </span>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">Close</button>
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
