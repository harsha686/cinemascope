import React, { useState } from 'react';
import { X, Copy, Check, Share2, Sparkles, MessageCircle, Send, Globe, Folder, Film } from 'lucide-react';
import { getCollectionShareUrl } from '../../services/movieLibraryService';
import AestheticImageModal from '../social/AestheticImageModal';
import { SOCIAL_CONTENT_TYPES } from '../../services/socialSharingService';

export default function ShareCollectionModal({
  isOpen,
  onClose,
  collection,
  movies = [],
  currentUser = null,
}) {
  const [copied, setCopied] = useState(false);
  const [showAestheticModal, setShowAestheticModal] = useState(false);

  if (!isOpen || !collection) return null;

  const shareUrl = getCollectionShareUrl(collection, currentUser);
  const movieCount = collection.movie_ids?.length || movies.length || 0;
  const creator = collection.creatorName || currentUser?.displayName || 'Cinemascope Member';

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${collection.name} — Cinemascope Collection`,
          text: `Check out my movie collection "${collection.name}" (${movieCount} films) on Cinemascope:`,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Error sharing:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`🎬 Check out my movie collection "${collection.name}" (${movieCount} titles) on Cinemascope: ${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleTwitter = () => {
    const text = encodeURIComponent(`🍿 Curated a movie collection "${collection.name}" (${movieCount} films) on @Cinemascope:`);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,noreferrer');
  };

  const handleTelegram = () => {
    const text = encodeURIComponent(`🎬 Check out "${collection.name}" (${movieCount} films) on Cinemascope`);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer');
  };

  // Up to 4 preview posters
  const previewPosters = movies
    .map(m => m?.posterUrl || m?.poster_url)
    .filter(Boolean)
    .slice(0, 4);

  return (
    <>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2500,
          backgroundColor: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          animation: 'fadeIn 180ms ease',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            width: '100%',
            maxWidth: 500,
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            position: 'relative',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--gold-faint)',
                  border: '1px solid var(--gold-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gold)',
                }}
              >
                <Share2 size={16} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--text-primary)' }}>
                  Share Collection
                </h3>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Anyone with this link can view this curated collection
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: '20px' }}>
            {/* Collection Preview Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(20,20,26,0.95) 100%)',
                border: '1px solid var(--gold-dim)',
                borderRadius: 6,
                padding: '16px',
                marginBottom: 20,
                display: 'flex',
                gap: 14,
                alignItems: 'center',
              }}
            >
              {/* Poster Grid / Icon */}
              {previewPosters.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: previewPosters.length > 1 ? 'repeat(2, 1fr)' : '1fr',
                    gap: 3,
                    width: 72,
                    height: 72,
                    borderRadius: 4,
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: '#111',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {previewPosters.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="film"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.src = '/demo-frame.jpg'; }}
                    />
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--gold)',
                    flexShrink: 0,
                  }}
                >
                  <Folder size={28} />
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span className="badge badge-gold" style={{ fontSize: 9 }}>
                    📁 COLLECTION
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {movieCount} {movieCount === 1 ? 'movie' : 'movies'}
                  </span>
                </div>
                <h4
                  style={{
                    margin: '0 0 4px',
                    fontFamily: 'var(--font-serif)',
                    fontSize: 16,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {collection.name}
                </h4>
                {collection.description && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {collection.description}
                  </p>
                )}
                <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 4 }}>
                  Curated by <strong>{creator}</strong>
                </div>
              </div>
            </div>

            {/* Link Copy Box */}
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontFamily: 'var(--font-serif)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: 8,
                }}
              >
                Collection Share Link
              </label>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    position: 'relative',
                    background: '#0d0d11',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    overflow: 'hidden',
                  }}
                >
                  <Globe size={14} color="var(--gold)" style={{ marginRight: 8, flexShrink: 0 }} />
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    onClick={e => e.target.select()}
                    style={{
                      background: 'none',
                      border: 'none',
                      outline: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: 12,
                      width: '100%',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap',
                    padding: '8px 16px',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {copied ? <Check size={14} color="#000" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>

              {copied && (
                <div
                  style={{
                    fontSize: 11,
                    color: '#4ade80',
                    marginTop: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Check size={12} />
                  <span>Link copied to clipboard! Ready to share with friends.</span>
                </div>
              )}
            </div>

            {/* Quick 1-Click Social Shares */}
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontFamily: 'var(--font-serif)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: 10,
                }}
              >
                Share Directly To
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="btn btn-outline btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    fontSize: 12,
                    padding: '8px 10px',
                    color: '#25d366',
                    borderColor: 'rgba(37, 211, 102, 0.3)',
                  }}
                >
                  <MessageCircle size={14} />
                  <span>WhatsApp</span>
                </button>

                {/* X (Twitter) */}
                <button
                  type="button"
                  onClick={handleTwitter}
                  className="btn btn-outline btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    fontSize: 12,
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span>Post on X</span>
                </button>

                {/* Telegram */}
                <button
                  type="button"
                  onClick={handleTelegram}
                  className="btn btn-outline btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    fontSize: 12,
                    padding: '8px 10px',
                    color: '#229ed9',
                    borderColor: 'rgba(34, 158, 217, 0.3)',
                  }}
                >
                  <Send size={13} />
                  <span>Telegram</span>
                </button>
              </div>
            </div>

            {/* Aesthetic Card Option */}
            <div
              style={{
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={13} color="var(--gold)" />
                  <span>Aesthetic Story Card</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Render an Instagram-ready visual card of this collection
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAestheticModal(true)}
                className="btn btn-ghost btn-sm"
                style={{
                  fontSize: 11,
                  color: 'var(--gold)',
                  border: '1px solid var(--gold-dim)',
                  padding: '5px 10px',
                }}
              >
                Create Card →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Aesthetic Image Generator Modal if opened */}
      {showAestheticModal && (
        <AestheticImageModal
          isOpen={showAestheticModal}
          onClose={() => setShowAestheticModal(false)}
          contentType={SOCIAL_CONTENT_TYPES.COLLECTION}
          data={{
            id: collection.id,
            name: collection.name,
            description: collection.description,
            movies: movies,
          }}
        />
      )}
    </>
  );
}
