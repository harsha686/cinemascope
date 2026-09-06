import React, { useState } from 'react';
import { X, Trophy, Share2, Copy, Check, MessageSquare } from 'lucide-react';

export default function SocialShareModal({
  isOpen,
  onClose,
  title = '',
  genreName = '',
  voteCount = 0,
  votePercentage = 0,
  edition = 'September 2026',
  posterUrl = '',
  type = 'MOVIE',
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const pageUrl = window.location.href;
  const shareText = `🏆 "${title}" was voted as this weekend's Community Pick in ${genreName || 'Cinema'} on Cinemascope! Check it out:`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${shareText}\n${pageUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${pageUrl}`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 3000,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--gold)',
        borderRadius: 'var(--radius-sm)',
        maxWidth: 480,
        width: '100%',
        padding: 24,
        boxShadow: 'var(--shadow-card)',
        color: 'var(--text-primary)',
        position: 'relative',
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(201,168,76,0.15)',
            border: '1px solid var(--gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold)',
          }}>
            <Trophy size={18} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--gold)' }}>
              Share Weekend Winner
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--text-primary)' }}>
              {title}
            </h3>
          </div>
        </div>

        {/* Card Preview */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(15,15,18,0.9) 100%)',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 6,
          padding: 16,
          display: 'flex',
          gap: 16,
          marginBottom: 20,
          alignItems: 'center',
        }}>
          {posterUrl && (
            <img
              src={posterUrl}
              alt={title}
              style={{ width: 64, height: 96, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border)' }}
            />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
              <span className="badge badge-gold" style={{ fontSize: 9 }}>🏆 WEEKEND WINNER</span>
              <span className="badge badge-dim" style={{ fontSize: 9 }}>{genreName}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              {title}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {voteCount > 0 ? `${voteCount.toLocaleString()} votes` : 'Community Pick'} {votePercentage > 0 ? `(${votePercentage}%)` : ''} · {edition}
            </div>
          </div>
        </div>

        {/* Share Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              onClick={handleTwitterShare}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, padding: '10px 14px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text-primary)' }}>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Post on X
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, padding: '10px 14px' }}
            >
              <MessageSquare size={15} color="#25d366" /> WhatsApp
            </button>
          </div>

          <button
            onClick={handleCopyLink}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, padding: '10px 14px' }}
          >
            {copied ? <Check size={15} color="#4ade80" /> : <Copy size={15} />}
            {copied ? 'Link Copied to Clipboard!' : 'Copy Shareable Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
