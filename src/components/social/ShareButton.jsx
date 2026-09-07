import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Share2, Copy, Check, MessageCircle, MoreHorizontal } from 'lucide-react';
import AestheticImageModal from './AestheticImageModal';
import { SOCIAL_CONTENT_TYPES, trackShareEvent } from '../../services/socialSharingService';

function XIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function ShareButton({
  contentType = SOCIAL_CONTENT_TYPES.MOVIE,
  data = {},
  variant = 'primary', // 'primary' | 'outline' | 'ghost' | 'icon'
  size = 'md', // 'sm' | 'md' | 'lg'
  customLabel = '',
  className = '',
  style = {},
}) {
  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCanonicalUrl = () => {
    const origin = window.location.origin;
    if (contentType === SOCIAL_CONTENT_TYPES.REVIEW && data.id) {
      return `${origin}/#/review/${data.id}`;
    }
    if (contentType === SOCIAL_CONTENT_TYPES.COLLECTION && data.id) {
      return `${origin}/#/collection/${data.id}`;
    }
    if (contentType === SOCIAL_CONTENT_TYPES.WEEKEND_WINNER) {
      return `${origin}/#/weekend`;
    }
    if (data.id || data.tmdbId) {
      return `${origin}/#/movie/${data.id || data.tmdbId}`;
    }
    return window.location.href;
  };

  const handleCopyLink = (e) => {
    e.stopPropagation();
    const url = getCanonicalUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    trackShareEvent({
      contentType,
      format: 'link',
      templateId: 'none',
      method: 'COPY_LINK',
    });
    setTimeout(() => {
      setCopied(false);
      setShowMenu(false);
    }, 2000);
  };

  const handleTwitterShare = (e) => {
    e.stopPropagation();
    const url = getCanonicalUrl();
    const title = data.title || data.movieTitle || 'CinemaScope';
    const tweet = `Check out "${title}" on @CinemaScope:\n\n${url}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`, '_blank', 'noopener,noreferrer');
    setShowMenu(false);
  };

  const handleWhatsAppShare = (e) => {
    e.stopPropagation();
    const url = getCanonicalUrl();
    const title = data.title || data.movieTitle || 'CinemaScope';
    const text = `🎬 *${title}* on CinemaScope\n${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    setShowMenu(false);
  };

  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    ...style,
  };

  const btnClass = variant === 'primary'
    ? `btn btn-primary ${size === 'sm' ? 'btn-sm' : ''}`
    : variant === 'outline'
    ? `btn btn-outline ${size === 'sm' ? 'btn-sm' : ''}`
    : `btn btn-ghost ${size === 'sm' ? 'btn-sm' : ''}`;

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={() => setShowMenu(!showMenu)}
          title="Share / Create Aesthetic Card"
          className="btn btn-ghost btn-sm"
          style={{ padding: '6px', color: 'var(--text-secondary)', ...style }}
        >
          <Share2 size={15} />
        </button>
      ) : (
        <div style={{ display: 'inline-flex', borderRadius: 4, overflow: 'hidden' }}>
          {/* Main action: Opens Aesthetic Studio */}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className={`${btnClass} ${className}`}
            style={{
              ...buttonStyle,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              fontSize: size === 'sm' ? 11 : 13,
            }}
          >
            <Sparkles size={size === 'sm' ? 13 : 15} />
            <span>{customLabel || '✨ Create Aesthetic'}</span>
          </button>

          {/* Sub-menu trigger: Copy Link / Social options */}
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className={btnClass}
            style={{
              padding: size === 'sm' ? '0 7px' : '0 10px',
              borderLeft: '1px solid rgba(255,255,255,0.15)',
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
            }}
            title="More share options"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      )}

      {/* Dropdown Menu */}
      {showMenu && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          background: 'var(--bg-card, #16161c)',
          border: '1px solid var(--gold-dim, rgba(201,168,76,0.3))',
          borderRadius: 6,
          minWidth: 200,
          boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
          zIndex: 100,
          overflow: 'hidden',
          animation: 'fadeIn 150ms ease',
        }}>
          <button
            type="button"
            onClick={() => { setShowModal(true); setShowMenu(false); }}
            style={{
              width: '100%',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: 'none',
              color: 'var(--gold)',
              fontSize: 12,
              fontWeight: 600,
              textAlign: 'left',
              cursor: 'pointer',
              borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <Sparkles size={14} />
            <span>✨ Make a Share Card</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            style={{
              width: '100%',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 12,
              textAlign: 'left',
              cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copied ? 'Link Copied!' : 'Copy Canonical Link'}</span>
          </button>

          <button
            type="button"
            onClick={handleTwitterShare}
            style={{
              width: '100%',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: 12,
              textAlign: 'left',
              cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <XIcon size={14} />
            <span>Share to X</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            style={{
              width: '100%',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: 12,
              textAlign: 'left',
              cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <MessageCircle size={14} />
            <span>Share to WhatsApp</span>
          </button>
        </div>
      )}

      {/* Aesthetic Image Modal */}
      <AestheticImageModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        contentType={contentType}
        data={data}
      />
    </div>
  );
}
