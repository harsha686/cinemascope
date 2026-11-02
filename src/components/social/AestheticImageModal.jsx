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
  Star,
  Upload,
  Link,
  Plus,
} from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import {
  SOCIAL_FORMATS,
  TEMPLATE_STYLES,
  SOCIAL_CONTENT_TYPES,
  normalizeShareableContent,
  saveCreationToHistory,
  trackShareEvent,
} from '../../services/socialSharingService';
import AestheticCardRenderer from './AestheticCardRenderer';
import { useApp } from '../../AppContext';
import {
  getUserFavoritePoster,
  setUserFavoritePoster,
  removeUserFavoritePoster,
  fetchAvailablePostersForMovie,
} from '../../services/userPosterService';

export default function AestheticImageModal({
  isOpen,
  onClose,
  contentType,
  data,
}) {
  const { state } = useApp();
  const currentUser = state.currentUser;
  const cardRef = useRef(null);
  const cardContainerRef = useRef(null);

  const [selectedFormat, setSelectedFormat] = useState(SOCIAL_FORMATS[0]); // 9:16 Story
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATE_STYLES[0]); // Cinematic
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [dragOffsets, setDragOffsets] = useState({});
  const [hiddenElements, setHiddenElements] = useState({});
  const [hasCustomEdits, setHasCustomEdits] = useState(false);

  const hasCustomDrags = Object.keys(dragOffsets).some(
    k => (dragOffsets[k]?.x || 0) !== 0 || (dragOffsets[k]?.y || 0) !== 0
  );
  const hasHiddenElements = Object.keys(hiddenElements).some(k => hiddenElements[k]);
  const hiddenCount = Object.values(hiddenElements).filter(Boolean).length;

  const handleUpdateDragOffset = (id, offset) => {
    setDragOffsets(prev => ({
      ...prev,
      [id]: offset,
    }));
  };

  const handleRemoveElement = (id) => {
    setHiddenElements(prev => ({
      ...prev,
      [id]: true,
    }));
    setToastMessage('🗑️ Element removed. Click "Restore" or "Reset" anytime to bring it back.');
  };

  const handleRestoreHidden = () => {
    setHiddenElements({});
    setToastMessage('All removed elements restored to poster.');
  };

  const handleUpdateText = (field, val) => {
    setHasCustomEdits(true);
    if (field === 'title') setCustomTitle(val);
    else if (field === 'subtitle') setCustomSubtitle(val);
    else if (field === 'headline') setCustomHeadline(val);
    else if (field === 'quote') setCustomQuote(val);
    else if (field === 'rating') setCustomRating(val);
    else if (field === 'appName') setCustomAppName(val);
    else if (field === 'genreBadge') setCustomGenreBadge(val);
    else if (field === 'bottomLeft') setCustomBottomLeft(val);
    else if (field === 'bottomRight') setCustomBottomRight(val);
  };

  const handleResetPosterEdits = () => {
    setDragOffsets({});
    setHiddenElements({});
    setCustomHeadline(normalized?.headline || '');
    setCustomQuote(normalized?.quote || '');
    setCustomTitle(normalized?.title || '');
    setCustomSubtitle(normalized?.subtitle || '');
    const resetRatingStr = contentType === SOCIAL_CONTENT_TYPES.REVIEW
      ? (normalized?.userRating != null ? String(normalized.userRating) : (normalized?.rating != null ? String(normalized.rating) : '5.0'))
      : (normalized?.rating != null ? String(normalized.rating) : (normalized?.userRating != null ? String(normalized.userRating) : '5.0'));
    setCustomRating(resetRatingStr);
    setCustomAppName('CINEMASCOPE');
    setCustomGenreBadge(normalized?.genres && normalized.genres.length > 0 ? normalized.genres.join(' · ') : 'CINEMASCOPE SELECTION');
    setCustomBottomLeft('CINEMASCOPE EXCLUSIVE');
    setCustomBottomRight('NOW STREAMING');
    setHasCustomEdits(false);
    setToastMessage('↺ Poster edits, positions, and removed elements reset to default');
  };

  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(''), 4500);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // Auto-scroll the share card into clear view on mount or format switch
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (cardContainerRef.current) {
          cardContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedFormat]);

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

  // Movie Poster Selection & Customization
  const [availablePosters, setAvailablePosters] = useState([]);
  const [activePosterUrl, setActivePosterUrl] = useState('');
  const [loadingPosters, setLoadingPosters] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualPosterUrl, setManualPosterUrl] = useState('');

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
      setCustomAppName('CINEMASCOPE');
      setCustomTitle(normalized.title || '');
      setCustomSubtitle(normalized.subtitle || '');
      const initialRatingStr = contentType === SOCIAL_CONTENT_TYPES.REVIEW
        ? (normalized.userRating != null ? String(normalized.userRating) : (normalized.rating != null ? String(normalized.rating) : '5.0'))
        : (normalized.rating != null ? String(normalized.rating) : (normalized.userRating != null ? String(normalized.userRating) : '5.0'));
      setCustomRating(initialRatingStr);
      setCustomBottomLeft('CINEMASCOPE EXCLUSIVE');
      setCustomBottomRight('NOW STREAMING');

      const favPoster = getUserFavoritePoster(data?.id || data?.tmdbId);
      const effectivePosterToUse = favPoster || normalized.posterUrl;

      setResolvedContent({
        ...normalized,
        ...(effectivePosterToUse ? { posterUrl: effectivePosterToUse, selectedPosterUrl: effectivePosterToUse } : {})
      });

      // Pre-convert poster and backdrop to base64 Data URLs
      let isCancelled = false;
      const convertImages = async () => {
        const posterPromise = effectivePosterToUse ? urlToDataUrl(effectivePosterToUse) : Promise.resolve(null);
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
            ...(posterUrl ? { posterUrl, selectedPosterUrl: posterUrl } : {}),
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

  // Load and discover alternative posters for movie
  useEffect(() => {
    if (!isOpen || !data) return;
    const movieId = data.id || data.tmdbId;
    const fav = getUserFavoritePoster(movieId);
    const initialPoster = fav || data.posterUrl || normalized?.posterUrl || '';
    setActivePosterUrl(initialPoster);

    setLoadingPosters(true);
    fetchAvailablePostersForMovie(data)
      .then(posters => {
        setAvailablePosters(posters);
        setLoadingPosters(false);
      })
      .catch(() => setLoadingPosters(false));
  }, [isOpen, data]);

  const handleSelectPoster = async (posterUrl) => {
    if (!posterUrl) return;
    setActivePosterUrl(posterUrl);
    const dataUrl = await urlToDataUrl(posterUrl);
    setResolvedContent(prev => ({
      ...prev,
      posterUrl: dataUrl,
      selectedPosterUrl: dataUrl,
    }));
  };

  const handleSaveAsFavorite = () => {
    const movieId = data?.id || data?.tmdbId;
    if (!movieId || !activePosterUrl) return;
    setUserFavoritePoster(movieId, activePosterUrl);
    setToastMessage('★ Saved as your favorite poster for this movie!');
  };

  const handleResetToDefault = () => {
    const movieId = data?.id || data?.tmdbId;
    if (!movieId) return;
    removeUserFavoritePoster(movieId);
    const defaultUrl = data.posterUrl || normalized?.posterUrl;
    if (defaultUrl) handleSelectPoster(defaultUrl);
    setToastMessage('Reverted to official theatrical poster.');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const customItem = {
        id: `custom-${Date.now()}`,
        url: dataUrl,
        label: 'Uploaded Poster',
        type: 'custom',
      };
      setAvailablePosters(prev => [customItem, ...prev]);
      handleSelectPoster(dataUrl);
      setToastMessage('Custom poster uploaded! Click "Keep as Favorite" to save it.');
    };
    reader.readAsDataURL(file);
  };

  const handleAddUrl = () => {
    if (!manualPosterUrl.trim()) return;
    const url = manualPosterUrl.trim();
    const customItem = {
      id: `url-${Date.now()}`,
      url,
      label: 'Custom Link Poster',
      type: 'custom',
    };
    setAvailablePosters(prev => [customItem, ...prev]);
    handleSelectPoster(url);
    setManualPosterUrl('');
    setShowUrlInput(false);
    setToastMessage('Custom poster applied! Click "Keep as Favorite" to save it.');
  };

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
    const shareText = `🎬 *${normalized.title}* on CinemaScope\n${normalized.canonicalUrl}`;
    try {
      const blob = await toBlob(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'share.png', { type: 'image/png' })] })) {
        const file = new File([blob], `cinemascope-${normalized.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`, { type: 'image/png' });
        await navigator.share({
          title: `${normalized.title} - CinemaScope`,
          text: shareText,
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
      if (e.name !== 'AbortError') {
        console.warn('Native share failed, downloading instead:', e);
        handleDownload();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Share to X (Twitter)
  const handleShareToTwitter = () => {
    const text = `🎬 Check out "${normalized.title}" on CinemaScope:\n\n${normalized.canonicalUrl}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    trackShareEvent({
      contentType,
      format: selectedFormat.id,
      templateId: selectedTemplate.id,
      method: 'X_SHARE',
    });
  };

  // 4. Share to WhatsApp (Direct Image + Link, No "About" text)
  const handleShareToWhatsApp = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    const shareText = `🎬 *${normalized.title}* on CinemaScope\n${normalized.canonicalUrl}`;

    try {
      const blob = await toBlob(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const file = blob ? new File([blob], `cinemascope-${normalized.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`, { type: 'image/png' }) : null;

      // 1. If native file share is supported (mobile devices / supported browsers)
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${normalized.title} on CinemaScope`,
          text: shareText,
          files: [file],
        });
        trackShareEvent({
          contentType,
          format: selectedFormat.id,
          templateId: selectedTemplate.id,
          method: 'WHATSAPP_SHARE',
        });
        return;
      }

      // 2. Desktop fallback: Copy rendered poster image to clipboard & download for easy WhatsApp paste
      if (blob) {
        try {
          if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
            setToastMessage('📋 Poster copied to clipboard! Paste (Ctrl+V) in WhatsApp to attach.');
          }
        } catch (clipErr) {
          console.warn('Clipboard image write failed:', clipErr);
        }
      }

      // Open WhatsApp with clean link (without about text)
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(url, '_blank', 'noopener,noreferrer');

      trackShareEvent({
        contentType,
        format: selectedFormat.id,
        templateId: selectedTemplate.id,
        method: 'WHATSAPP_SHARE',
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Failed to share to WhatsApp:', err);
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setIsGenerating(false);
    }
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
            {hasHiddenElements && (
              <button
                type="button"
                onClick={handleRestoreHidden}
                className="btn btn-ghost btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  color: '#ffffff',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  padding: '5px 10px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
                title="Restore removed elements"
              >
                <RefreshCw size={12} />
                <span>Restore ({hiddenCount})</span>
              </button>
            )}
            {(hasCustomEdits || hasCustomDrags || hasHiddenElements) && (
              <button
                type="button"
                onClick={handleResetPosterEdits}
                className="btn btn-ghost btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  color: 'var(--gold)',
                  background: 'rgba(201,168,76,0.1)',
                  border: '1px solid rgba(201,168,76,0.3)',
                  padding: '5px 10px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
                title="Reset direct text edits and element positions back to default"
              >
                <RefreshCw size={12} />
                <span>Reset Layout</span>
              </button>
            )}
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

            {/* Interactive Canvas Tip Pill */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 6,
              marginBottom: 10,
              fontSize: 11,
              color: 'rgba(255,255,255,0.7)',
              background: 'rgba(220,182,91,0.08)',
              border: '1px solid rgba(220,182,91,0.25)',
              padding: '4px 12px',
              borderRadius: 14,
            }}>
              <span style={{ color: 'var(--gold)', fontWeight: 700 }}>✦ Direct Canvas:</span>
              <span>Click text to edit · Drag to move · Click red bin 🗑️ to delete</span>
              {hasHiddenElements && (
                <button
                  type="button"
                  onClick={handleRestoreHidden}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    color: '#ffffff',
                    borderRadius: 10,
                    padding: '1px 8px',
                    fontSize: 10,
                    cursor: 'pointer',
                    marginLeft: 4,
                    fontWeight: 700,
                  }}
                  title="Restore removed elements to poster"
                >
                  ↺ Restore ({hiddenCount})
                </button>
              )}
              {(hasCustomEdits || hasCustomDrags || hasHiddenElements) && (
                <button
                  type="button"
                  onClick={handleResetPosterEdits}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--gold)',
                    textDecoration: 'underline',
                    fontSize: 10.5,
                    cursor: 'pointer',
                    marginLeft: 4,
                    fontWeight: 600,
                  }}
                  title="Reset all edits, positions, and restored items"
                >
                  Reset All
                </button>
              )}
            </div>

            {/* Live Interactive Card Container */}
            <div
              ref={cardContainerRef}
              className="modal-studio-card-wrapper"
              style={{
                width: '100%',
                maxWidth: selectedFormat.id === 'landscape' ? 560 : selectedFormat.id === 'story' ? 310 : 380,
                aspectRatio: selectedFormat.aspectRatio,
                minHeight: selectedFormat.id === 'story' ? 480 : selectedFormat.id === 'portrait' ? 380 : selectedFormat.id === 'square' ? 280 : 180,
                boxShadow: '0 16px 48px rgba(0,0,0,0.9)',
                borderRadius: 6,
                overflow: 'hidden',
                transition: 'max-width 200ms ease, min-height 200ms ease',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
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
                  dragOffsets,
                  hiddenElements,
                  onUpdateDragOffset: handleUpdateDragOffset,
                  onRemoveElement: handleRemoveElement,
                  onUpdateText: handleUpdateText,
                  isExporting: isGenerating,
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
              {/* Choose Poster / Artwork & Set Favorite */}
              <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold)', fontWeight: 700, margin: 0 }}>
                    <ImageIcon size={13} color="var(--gold)" />
                    <span>Choose Poster Artwork ({availablePosters.length || 1})</span>
                  </label>
                  {activePosterUrl && activePosterUrl === getUserFavoritePoster(data?.id || data?.tmdbId) && (
                    <span style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Star size={11} fill="var(--gold)" /> Favorite
                    </span>
                  )}
                </div>

                {/* Posters Carousel Strip */}
                <div style={{
                  display: 'flex',
                  gap: 8,
                  overflowX: 'auto',
                  paddingBottom: 6,
                  scrollbarWidth: 'thin',
                }}>
                  {availablePosters.map((p, idx) => {
                    const isSelected = activePosterUrl === p.url;
                    const isFav = p.url === getUserFavoritePoster(data?.id || data?.tmdbId);
                    return (
                      <button
                        key={p.id || idx}
                        type="button"
                        onClick={() => handleSelectPoster(p.url)}
                        title={p.label || 'Select poster'}
                        style={{
                          position: 'relative',
                          width: 52,
                          height: 78,
                          flexShrink: 0,
                          borderRadius: 4,
                          overflow: 'hidden',
                          border: isSelected ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.15)',
                          padding: 0,
                          background: '#000',
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 0 10px rgba(201,168,76,0.5)' : 'none',
                          transform: isSelected ? 'scale(1.04)' : 'none',
                          transition: 'all 150ms ease',
                        }}
                      >
                        <img
                          src={p.url}
                          alt={p.label}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => e.target.src = '/demo-frame.jpg'}
                        />
                        {isFav && (
                          <span style={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            background: 'rgba(0,0,0,0.85)',
                            color: 'var(--gold)',
                            borderRadius: '50%',
                            width: 14,
                            height: 14,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 9,
                          }}>
                            ★
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* Upload button thumbnail */}
                  <label
                    title="Upload custom image from your device"
                    style={{
                      width: 52,
                      height: 78,
                      flexShrink: 0,
                      borderRadius: 4,
                      border: '1px dashed var(--gold)',
                      background: 'rgba(201,168,76,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      gap: 4,
                      color: 'var(--gold)',
                      fontSize: 9,
                      textAlign: 'center',
                      padding: 2,
                    }}
                  >
                    <Upload size={14} />
                    <span>Upload</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                </div>

                {/* Favorite Actions & Paste Link */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleSaveAsFavorite}
                    className="btn btn-outline btn-sm"
                    style={{
                      fontSize: 11,
                      padding: '4px 10px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      borderColor: 'var(--gold)',
                      color: 'var(--gold)',
                      background: activePosterUrl === getUserFavoritePoster(data?.id || data?.tmdbId) ? 'rgba(201,168,76,0.18)' : 'transparent',
                    }}
                  >
                    <Star size={12} fill={activePosterUrl === getUserFavoritePoster(data?.id || data?.tmdbId) ? 'var(--gold)' : 'none'} />
                    <span>{activePosterUrl === getUserFavoritePoster(data?.id || data?.tmdbId) ? '✓ Saved as Favorite' : 'Keep as My Favorite Poster'}</span>
                  </button>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {getUserFavoritePoster(data?.id || data?.tmdbId) && (
                      <button
                        type="button"
                        onClick={handleResetToDefault}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 10, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Reset
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 10, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      {showUrlInput ? 'Cancel' : 'Paste Link'}
                    </button>
                  </div>
                </div>

                {showUrlInput && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <input
                      type="text"
                      className="input"
                      style={{ flex: 1, fontSize: 11, padding: '4px 8px' }}
                      value={manualPosterUrl}
                      onChange={e => setManualPosterUrl(e.target.value)}
                      placeholder="https://... image URL"
                    />
                    <button type="button" onClick={handleAddUrl} className="btn btn-primary btn-sm" style={{ fontSize: 11, padding: '4px 10px' }}>
                      Apply
                    </button>
                  </div>
                )}
              </div>

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

              {/* Direct Canvas Editing Helper Card */}
              <div style={{
                marginBottom: 16,
                padding: '12px 14px',
                background: 'rgba(201,168,76,0.07)',
                border: '1px solid rgba(201,168,76,0.25)',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} color="var(--gold)" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                    <strong style={{ color: 'var(--gold)' }}>Direct Poster Canvas:</strong> Click text to edit · Drag to move · Click red bin 🗑️ to delete
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  {hasHiddenElements && (
                    <button
                      type="button"
                      onClick={handleRestoreHidden}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 10, padding: '3px 8px', color: '#ffffff', background: 'rgba(239, 68, 68, 0.25)', border: '1px solid rgba(239, 68, 68, 0.5)' }}
                      title="Restore removed elements"
                    >
                      ↺ Restore ({hiddenCount})
                    </button>
                  )}
                  {(hasCustomEdits || hasCustomDrags || hasHiddenElements) && (
                    <button
                      type="button"
                      onClick={handleResetPosterEdits}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 10, padding: '3px 8px', color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.3)' }}
                      title="Reset all edits, positions, and restored items"
                    >
                      Reset All
                    </button>
                  )}
                </div>
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

              {/* In-Modal Feedback Notification */}
              {toastMessage && (
                <div style={{
                  padding: '8px 12px',
                  background: 'rgba(201, 168, 76, 0.15)',
                  border: '1px solid var(--accent-border)',
                  borderRadius: 4,
                  color: '#ffffff',
                  fontSize: 12,
                  textAlign: 'center',
                  fontWeight: 500,
                  animation: 'fadeIn 150ms ease',
                }}>
                  {toastMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
