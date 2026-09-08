import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sparkles,
  Download,
  Share2,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Eye,
  Send,
  MessageCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import {
  SOCIAL_FORMATS,
  TEMPLATE_STYLES,
  normalizeShareableContent,
  saveCreationToHistory,
  trackShareEvent,
} from '../../services/socialSharingService';
import AestheticCardRenderer from './AestheticCardRenderer';
import { useApp } from '../../AppContext';

export default function AestheticImageModal({
  isOpen,
  onClose,
  contentType,
  data,
}) {
  const { state } = useApp();
  const currentUser = state.currentUser;
  const cardRef = useRef(null);

  const [selectedFormat, setSelectedFormat] = useState(SOCIAL_FORMATS[0]); // 9:16 Story
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATE_STYLES[0]); // Cinematic
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Customization Options
  const [customHeadline, setCustomHeadline] = useState('');
  const [customQuote, setCustomQuote] = useState('');
  const [showRating, setShowRating] = useState(true);
  const [showAuthor, setShowAuthor] = useState(true);
  const [showBranding, setShowBranding] = useState(true);
  const [showMeta, setShowMeta] = useState(true);

  // Key-Art poster text customization
  const [customAppName, setCustomAppName] = useState('');
  const [customRating, setCustomRating] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customSubtitle, setCustomSubtitle] = useState('');
  const [customGenreBadge, setCustomGenreBadge] = useState('');
  const [customBottomLeft, setCustomBottomLeft] = useState('');
  const [customBottomRight, setCustomBottomRight] = useState('');

  // Helper to convert an image URL to Data URL (base64) using fetch with CORS
  const urlToDataUrl = async (url) => {
    if (!url || typeof url !== 'string' || url.startsWith('data:')) return url;
    try {
      // Append a cache-buster so browser doesn't return non-CORS cached response
      const separator = url.includes('?') ? '&' : '?';
      const corsUrl = `${url}${separator}cors_ts=${Date.now()}`;
      const response = await fetch(corsUrl, { mode: 'cors' });
      if (!response.ok) return url;
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(url);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn('Could not convert image to Data URL:', e);
      return url;
    }
  };

  // Normalized Shareable Content
  const normalized = React.useMemo(() => {
    if (!data) return null;
    return normalizeShareableContent({
      type: contentType,
      data,
      user: currentUser,
    });
  }, [contentType, data, currentUser]);

  const [resolvedContent, setResolvedContent] = useState(null);

  useEffect(() => {
    if (normalized) {
      setCustomHeadline(normalized.headline || '');
      setCustomQuote(normalized.quote || '');
      setResolvedContent(normalized);

      // Pre-convert poster and backdrop to base64 Data URLs
      let isCancelled = false;
      const convertImages = async () => {
        const posterPromise = normalized.posterUrl ? urlToDataUrl(normalized.posterUrl) : Promise.resolve(null);
        const backdropPromise = normalized.backdropUrl ? urlToDataUrl(normalized.backdropUrl) : Promise.resolve(null);
        const postersPromises = (normalized.posters && normalized.posters.length > 0)
          ? Promise.all(normalized.posters.map(p => urlToDataUrl(p)))
          : Promise.resolve(null);

        const [posterUrl, backdropUrl, posters] = await Promise.all([
          posterPromise,
          backdropPromise,
          postersPromises,
        ]);

        if (!isCancelled) {
          setResolvedContent(prev => ({
            ...(prev || normalized),
            ...(posterUrl ? { posterUrl } : {}),
            ...(backdropUrl ? { backdropUrl } : {}),
            ...(posters ? { posters } : {}),
          }));
        }
      };

      convertImages();
      return () => {
        isCancelled = true;
      };
    }
  }, [normalized]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !normalized) return null;

  // Next style cycle helper ("↻ Try Another Style")
  const handleCycleStyle = () => {
    const currentIndex = TEMPLATE_STYLES.findIndex(t => t.id === selectedTemplate.id);
    const nextIndex = (currentIndex + 1) % TEMPLATE_STYLES.length;
    setSelectedTemplate(TEMPLATE_STYLES[nextIndex]);
  };

  // 1. Download High-Res Image
  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2, // High DPI render
      });

      const link = document.createElement('a');
      link.download = `cinemascope-${normalized.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${selectedFormat.id}.png`;
      link.href = dataUrl;
      link.click();

      trackShareEvent({
        contentType,
        format: selectedFormat.id,
        templateId: selectedTemplate.id,
        method: 'DOWNLOAD',
      });

      saveCreationToHistory({
        title: normalized.title,
        type: contentType,
        format: selectedFormat.id,
        templateId: selectedTemplate.id,
        dataUrl,
      });
    } catch (err) {
      console.error('Failed to generate image:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Share Image (Web Share API)
  const handleWebShare = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const blob = await toBlob(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'share.png', { type: 'image/png' })] })) {
        const file = new File([blob], `cinemascope-${normalized.title}.png`, { type: 'image/png' });
        await navigator.share({
          title: normalized.title,
          text: customQuote || `Check out ${normalized.title} on CinemaScope!`,
          files: [file],
        });
        trackShareEvent({
          contentType,
          format: selectedFormat.id,
          templateId: selectedTemplate.id,
          method: 'NATIVE_SHARE',
        });
      } else {
        handleDownload();
      }
    } catch (e) {
      console.warn('Native share failed, downloading instead:', e);
      handleDownload();
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Share to X (Twitter)
  const handleShareToTwitter = () => {
    const text = `Just experienced ${normalized.title} on @CinemaScope!\n\n${customQuote ? `"${customQuote}"\n\n` : ''}${normalized.canonicalUrl}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    trackShareEvent({
      contentType,
      format: selectedFormat.id,
      templateId: selectedTemplate.id,
      method: 'X_SHARE',
    });
  };

  // 4. Share to WhatsApp
  const handleShareToWhatsApp = () => {
    const text = `🎬 ${normalized.title} on CinemaScope\n\n${customQuote ? `"${customQuote}"\n\n` : ''}${normalized.canonicalUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    trackShareEvent({
      contentType,
      format: selectedFormat.id,
      templateId: selectedTemplate.id,
      method: 'WHATSAPP_SHARE',
    });
  };

  // 5. Copy Dynamic Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(normalized.canonicalUrl);
    setCopiedLink(true);
    trackShareEvent({
      contentType,
      format: selectedFormat.id,
      templateId: selectedTemplate.id,
      method: 'COPY_LINK',
    });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return createPortal(
    <div
      className="modal-studio-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        className="modal-studio-dialog"
        style={{
          background: 'var(--bg-card, #121216)',
          border: '1px solid var(--gold)',
          borderRadius: 8,
          maxWidth: 1040,
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.85)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'rgba(201,168,76,0.15)',
              border: '1px solid var(--gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold)',
            }}>
              <Sparkles size={16} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--gold)' }}>
                Aesthetic Share Studio
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--text-primary)', margin: 0 }}>
                {normalized.title}
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => setShowControls(!showControls)}
              className="btn btn-ghost btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: showControls ? 'var(--gold)' : 'var(--text-secondary)' }}
            >
              <Sliders size={14} /> {showControls ? 'Hide Options' : 'Customize Content'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                borderRadius: 4,
                padding: '6px',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body: Split into Preview & Controls */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 1fr) 340px',
          flex: 1,
          overflowY: 'auto',
        }} className="modal-studio-grid">
          {/* Left Canvas Preview Area */}
          <div
            className="modal-studio-preview"
            style={{
              padding: '24px',
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflowY: 'auto',
            }}
          >
            {/* Format Pills */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              {SOCIAL_FORMATS.map(f => {
                const isSelected = selectedFormat.id === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFormat(f)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 16,
                      fontSize: 11,
                      fontWeight: 600,
                      background: isSelected ? 'var(--gold)' : 'rgba(255,255,255,0.05)',
                      color: isSelected ? '#000' : 'var(--text-secondary)',
                      border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                  >
                    {f.badge}
                  </button>
                );
              })}
            </div>

            {/* Live Interactive Card Container */}
            <div style={{
              width: '100%',
              maxWidth: selectedFormat.id === 'landscape' ? 560 : selectedFormat.id === 'story' ? 320 : 380,
              boxShadow: '0 16px 48px rgba(0,0,0,0.9)',
              borderRadius: 6,
              overflow: 'hidden',
              transition: 'max-width 200ms ease',
            }}>
              <AestheticCardRenderer
                cardRef={cardRef}
                content={resolvedContent || normalized}
                format={selectedFormat}
                template={selectedTemplate}
                options={{
                  showRating,
                  showAuthor,
                  showBranding,
                  showMeta,
                  customHeadline,
                  customQuote,
                  customAppName,
                  customRating,
                  customTitle,
                  customSubtitle,
                  customGenreBadge,
                  customBottomLeft,
                  customBottomRight,
                }}
              />
            </div>

            {/* Style Switcher Quick Button below Card */}
            <button
              type="button"
              onClick={handleCycleStyle}
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--gold)' }}
            >
              <RefreshCw size={13} /> ↻ Try Another Style ({selectedTemplate.name})
            </button>
          </div>

          {/* Right Controls & Actions Sidebar */}
          <div
            className="modal-studio-sidebar"
            style={{
              padding: '24px',
              borderLeft: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 20,
              overflowY: 'auto',
            }}
          >
            <div>
              {/* Template Style Selector */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>
                  Visual Design Template
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                  {TEMPLATE_STYLES.map(t => {
                    const isSelected = selectedTemplate.id === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTemplate(t)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 4,
                          fontSize: 11,
                          background: isSelected ? 'var(--gold-faint)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border-subtle)'}`,
                          color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          textAlign: 'left',
                        }}
                      >
                        <span>{t.emoji}</span>
                        <span style={{ fontWeight: isSelected ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ---- Text Customization Controls ---- */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>
                  Headline / Accolade
                </label>
                <input
                  type="text"
                  className="input"
                  style={{ width: '100%', fontSize: 12, marginBottom: 10 }}
                  value={customHeadline}
                  onChange={e => setCustomHeadline(e.target.value)}
                  placeholder="e.g. FEATURE FILM OF THE YEAR"
                />

                <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>
                  Quote / Review Excerpt
                </label>
                <textarea
                  className="input"
                  rows={2}
                  style={{ width: '100%', fontSize: 12, lineHeight: 1.5, resize: 'none', marginBottom: 10 }}
                  value={customQuote}
                  onChange={e => setCustomQuote(e.target.value)}
                  placeholder="Add your thoughts or tagline..."
                />

                {/* Studio Accolade extra fields */}
                {selectedTemplate.isKeyArt && (
                  <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 6, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold)', marginBottom: 2 }}>
                      🏆 Poster Text Fields
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>App Name (top center)</label>
                      <input type="text" className="input" style={{ width: '100%', fontSize: 11 }}
                        value={customAppName} onChange={e => setCustomAppName(e.target.value)}
                        placeholder="CINEMASCOPE" />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Movie Title</label>
                      <input type="text" className="input" style={{ width: '100%', fontSize: 11 }}
                        value={customTitle} onChange={e => setCustomTitle(e.target.value)}
                        placeholder={normalized?.title || 'Movie Title'} />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Subtitle (year · language)</label>
                      <input type="text" className="input" style={{ width: '100%', fontSize: 11 }}
                        value={customSubtitle} onChange={e => setCustomSubtitle(e.target.value)}
                        placeholder={normalized?.subtitle || '2026 · ENGLISH'} />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Genre Badge</label>
                      <input type="text" className="input" style={{ width: '100%', fontSize: 11 }}
                        value={customGenreBadge} onChange={e => setCustomGenreBadge(e.target.value)}
                        placeholder="ACTION · ADVENTURE" />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Rating (your score)</label>
                      <input type="text" className="input" style={{ width: '100%', fontSize: 11 }}
                        value={customRating} onChange={e => setCustomRating(e.target.value)}
                        placeholder={String(normalized?.userRating ?? normalized?.rating ?? '4.5')} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Bottom Left</label>
                        <input type="text" className="input" style={{ width: '100%', fontSize: 11 }}
                          value={customBottomLeft} onChange={e => setCustomBottomLeft(e.target.value)}
                          placeholder="CINEMASCOPE EXCLUSIVE" />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Bottom Right</label>
                        <input type="text" className="input" style={{ width: '100%', fontSize: 11 }}
                          value={customBottomRight} onChange={e => setCustomBottomRight(e.target.value)}
                          placeholder="NOW STREAMING" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle Switches */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, cursor: 'pointer' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Show Star Rating</span>
                  <input type="checkbox" checked={showRating} onChange={e => setShowRating(e.target.checked)} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, cursor: 'pointer' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Show Reviewer Name</span>
                  <input type="checkbox" checked={showAuthor} onChange={e => setShowAuthor(e.target.checked)} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, cursor: 'pointer' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Include App Watermark</span>
                  <input type="checkbox" checked={showBranding} onChange={e => setShowBranding(e.target.checked)} />
                </label>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              {/* Primary Download Button */}
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleDownload}
                className="btn btn-primary"
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <Download size={16} />
                {isGenerating ? 'Rendering Image...' : `Download ${selectedFormat.label} (PNG)`}
              </button>

              {/* Native Mobile Share / Story */}
              {navigator.share && (
                <button
                  type="button"
                  onClick={handleWebShare}
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12 }}
                >
                  <Share2 size={14} /> Share Directly (Instagram / Apps)
                </button>
              )}

              {/* Quick Social Share Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <button
                  type="button"
                  onClick={handleShareToTwitter}
                  className="btn btn-ghost btn-sm"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, border: '1px solid var(--border-subtle)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span>Post to X</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareToWhatsApp}
                  className="btn btn-ghost btn-sm"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, border: '1px solid var(--border-subtle)' }}
                >
                  <MessageCircle size={12} /> WhatsApp
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="btn btn-ghost btn-sm"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, border: '1px solid var(--border-subtle)' }}
                >
                  {copiedLink ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
