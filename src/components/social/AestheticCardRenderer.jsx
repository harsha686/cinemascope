import React, { useState, useRef, useEffect } from 'react';
import { Star, Trophy, Film, Sparkles, Heart, Bookmark, ShieldCheck, Check, Trash2 } from 'lucide-react';
import { SOCIAL_CONTENT_TYPES } from '../../services/socialSharingService';

/**
 * DraggableBox: Allows any element on the poster canvas to be freely dragged and repositioned.
 * Also renders a Bin (Trash) icon on hover so users can easily delete unwanted elements.
 * When exporting (isExporting = true), all drag handles, bin buttons, and hover borders are completely hidden.
 */
export function DraggableBox({
  id,
  children,
  offset = { x: 0, y: 0 },
  onOffsetChange,
  onRemove,
  isExporting = false,
  style = {},
  className = '',
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const startPos = useRef({ x: 0, y: 0, initialOffsetX: 0, initialOffsetY: 0 });
  const hasMoved = useRef(false);

  const handlePointerDown = (e) => {
    if (isExporting) return;
    // Don't drag if user clicked directly on a button (like the trash bin) or active editable text
    if (e.target.closest('button')) {
      return;
    }
    if (e.target.isContentEditable && document.activeElement === e.target) {
      return;
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}

    startPos.current = {
      x: e.clientX,
      y: e.clientY,
      initialOffsetX: offset?.x || 0,
      initialOffsetY: offset?.y || 0,
    };
    hasMoved.current = false;
    setIsDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || isExporting) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMoved.current = true;
      if (document.activeElement && document.activeElement.blur && document.activeElement.isContentEditable) {
        document.activeElement.blur();
      }
    }
    if (hasMoved.current && onOffsetChange) {
      onOffsetChange(id, {
        x: Math.round(startPos.current.initialOffsetX + dx),
        y: Math.round(startPos.current.initialOffsetY + dy),
      });
    }
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
      setIsDragging(false);
    }
  };

  const currentX = offset?.x || 0;
  const currentY = offset?.y || 0;

  return (
    <div
      className={`draggable-poster-item ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => !isExporting && setIsHovered(true)}
      onMouseLeave={() => !isExporting && setIsHovered(false)}
      style={{
        ...style,
        position: style.position || 'relative',
        transform: `translate3d(${currentX}px, ${currentY}px, 0)`,
        cursor: isExporting ? 'default' : (isDragging ? 'grabbing' : 'grab'),
        touchAction: 'none',
        userSelect: isDragging ? 'none' : 'auto',
        outline: !isExporting && (isHovered || isDragging) ? '1px dashed rgba(220,182,91,0.65)' : 'none',
        outlineOffset: 3,
        borderRadius: 4,
        boxShadow: !isExporting && isDragging ? '0 8px 24px rgba(0,0,0,0.6)' : 'none',
        transition: isDragging ? 'none' : 'outline 150ms ease, box-shadow 150ms ease',
      }}
    >
      {/* Floating Drag & Bin Actions on Hover */}
      {!isExporting && (isHovered || isDragging) && (
        <div
          style={{
            position: 'absolute',
            top: -22,
            right: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            zIndex: 9999,
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              background: 'rgba(20,17,13,0.95)',
              border: '1px solid var(--gold, #dcb65b)',
              color: 'var(--gold, #dcb65b)',
              borderRadius: 3,
              padding: '1px 5px',
              fontSize: 8.5,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              pointerEvents: 'none',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            ⠿ Drag
          </div>

          {onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onRemove(id);
              }}
              title="Remove this element from poster"
              style={{
                background: 'rgba(220, 38, 38, 0.95)',
                border: '1px solid #ef4444',
                color: '#ffffff',
                borderRadius: 3,
                width: 19,
                height: 17,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
                boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
                transition: 'transform 100ms ease, background 100ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.15)';
                e.currentTarget.style.background = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'rgba(220, 38, 38, 0.95)';
              }}
            >
              <Trash2 size={10} />
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * EditableText: Renders inline text that can be clicked and edited directly on the poster.
 * Strips all focus/editing indicators when exporting so the image output is pristine.
 */
export function EditableText({
  value = '',
  onChange,
  placeholder = 'Click to edit...',
  multiline = false,
  isExporting = false,
  style = {},
  className = '',
  tag: Tag = 'span',
}) {
  const contentRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (contentRef.current && !isFocused) {
      if (contentRef.current.innerText !== (value || '')) {
        contentRef.current.innerText = value || '';
      }
    }
  }, [value, isFocused]);

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onChange) {
      onChange(e.currentTarget.innerText.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  return (
    <Tag
      ref={contentRef}
      contentEditable={!isExporting}
      suppressContentEditableWarning={true}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      title={isExporting ? undefined : 'Click to edit text directly'}
      className={`editable-poster-text ${className}`}
      style={{
        ...style,
        display: style.display || (Tag === 'span' ? 'inline-block' : 'block'),
        outline: !isExporting && isFocused ? '1.5px solid var(--gold, #dcb65b)' : 'none',
        borderRadius: 2,
        padding: !isExporting ? '1px 3px' : 0,
        margin: !isExporting ? '-1px -3px' : 0,
        cursor: isExporting ? 'inherit' : 'text',
        minWidth: 16,
        background: !isExporting && isFocused ? 'rgba(220,182,91,0.2)' : 'transparent',
        transition: 'background 120ms ease, outline 120ms ease',
      }}
    >
      {value || (isExporting ? '' : placeholder)}
    </Tag>
  );
}

export default function AestheticCardRenderer({
  cardRef,
  content,
  format,
  template,
  options = {},
}) {
  const {
    showRating = true,
    showAuthor = true,
    showBranding = true,
    showMeta = true,
    customHeadline = '',
    customQuote = '',
    customAppName = '',
    customRating = '',
    customTitle = '',
    customSubtitle = '',
    customGenreBadge = '',
    customBottomLeft = '',
    customBottomRight = '',
    dragOffsets = {},
    hiddenElements = {},
    onUpdateDragOffset,
    onRemoveElement,
    onUpdateText,
    isExporting = false,
  } = options;

  if (!content) return null;

  const isStory = format.id === 'story';
  const isLandscape = format.id === 'landscape';
  const isSquare = format.id === 'square';
  const isPortrait = format.id === 'portrait';

  const headline = customHeadline !== undefined ? customHeadline : (content.headline || '');
  const quote = customQuote !== undefined ? customQuote : (content.quote || '');
  // For reviews, prioritize personal userRating; for movies and other content, prioritize content.rating
  const effectiveRating = customRating !== ''
    ? customRating
    : (content.type === SOCIAL_CONTENT_TYPES.REVIEW
        ? (content.userRating ?? content.rating ?? 5)
        : (content.rating ?? content.userRating ?? 5));
  const ratingNum = Math.round((Number(effectiveRating) || content.rating || 5) * 10) / 10;
  const fullStars = Math.floor(ratingNum);
  const formattedRatingStr = !isNaN(Number(effectiveRating)) && Number(effectiveRating) > 0
    ? Number(effectiveRating).toFixed(1)
    : String(effectiveRating);

  // Dynamic layout adaptation for multi-movie collections or lists
  const hasMultiplePosters = content.posters && content.posters.length > 1;
  const isStats = content.type === SOCIAL_CONTENT_TYPES.USER_STATS;
  const isWeekendWinner = content.type === SOCIAL_CONTENT_TYPES.WEEKEND_WINNER;
  const isKeyArt = template.isKeyArt;

  // Background image source priority for full-bleed key-art mode (prioritizes active selected/favorite poster)
  const keyArtImage = content.selectedPosterUrl || content.posterUrl || content.backdropUrl;

  if (isKeyArt) {
    return (
      <div
        ref={cardRef}
        className="modal-studio-rendered-card"
        style={{
          width: '100%',
          height: '100%',
          flex: 1,
          aspectRatio: format.aspectRatio,
          minHeight: isStory ? 480 : isPortrait ? 380 : isSquare ? 280 : 180,
          background: '#000000',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: isStory ? '36px 20px' : isLandscape ? '24px 36px' : '28px 22px',
          boxSizing: 'border-box',
          fontFamily: 'var(--font-sans, "Montserrat", -apple-system, sans-serif)',
          border: '1px solid rgba(255,255,255,0.15)',
          flexShrink: 0,
        }}
      >
        {/* Full Bleed Movie Key-Art / Backdrop Image */}
        {keyArtImage && (
          <img
            src={keyArtImage}
            alt={content.title}
            crossOrigin={keyArtImage.startsWith('data:') ? undefined : 'anonymous'}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
            }}
          />
        )}

        {/* Cinematic Vignette Gradients for Legibility */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.92) 100%)',
          pointerEvents: 'none',
        }} />

        {/* ================= TOP SECTION: STUDIO ACCOLADE MASTHEAD (DRAGGABLE & INLINE EDITABLE) ================= */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', width: '100%', flexShrink: 0 }}>
          {/* App Name — centered, smaller */}
          {!hiddenElements.appName && (
            <DraggableBox
              id="appName"
              offset={dragOffsets.appName}
              onOffsetChange={onUpdateDragOffset}
              onRemove={onRemoveElement}
              isExporting={isExporting}
              style={{ display: 'inline-block' }}
            >
              <h1 style={{
                fontSize: isStory ? 15 : isLandscape ? 13 : 14,
                fontWeight: 800,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                margin: '0 0 8px',
                color: '#ffffff',
                textAlign: 'center',
                textShadow: '0 2px 10px rgba(0,0,0,0.95)',
              }}>
                <EditableText
                  value={customAppName !== undefined ? customAppName : 'CINEMASCOPE'}
                  onChange={v => onUpdateText && onUpdateText('appName', v)}
                  isExporting={isExporting}
                />
              </h1>
            </DraggableBox>
          )}

          {/* Underline Rule */}
          {!hiddenElements.appName && !hiddenElements.headline && (
            <div style={{
              width: '80%',
              height: 2,
              margin: '0 auto 10px',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.95) 20%, rgba(255,255,255,0.95) 80%, transparent 100%)',
            }} />
          )}

          {/* Headline / Award Category */}
          {!hiddenElements.headline && (headline || !isExporting) && (
            <div style={{ display: 'block', margin: '0 auto 6px' }}>
              <DraggableBox
                id="headline"
                offset={dragOffsets.headline}
                onOffsetChange={onUpdateDragOffset}
                onRemove={onRemoveElement}
                isExporting={isExporting}
                style={{ display: 'inline-block' }}
              >
                <p style={{
                  fontSize: isStory ? 12 : 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: '#ffffff',
                  margin: 0,
                  textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                }}>
                  <EditableText
                    value={headline || (isExporting ? '' : 'FEATURE FILM OF THE YEAR')}
                    onChange={v => onUpdateText && onUpdateText('headline', v)}
                    isExporting={isExporting}
                  />
                </p>
              </DraggableBox>
            </div>
          )}

          {/* Review excerpt / Quote line (Draggable & with Bin Icon!) */}
          {!hiddenElements.quote && (quote || !isExporting) && (
            <div style={{ display: 'block', margin: '0 auto', maxWidth: '90%' }}>
              <DraggableBox
                id="quote"
                offset={dragOffsets.quote}
                onOffsetChange={onUpdateDragOffset}
                onRemove={onRemoveElement}
                isExporting={isExporting}
                style={{ display: 'inline-block' }}
              >
                <p style={{
                  fontSize: isStory ? 11 : 10,
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  color: 'rgba(255,255,255,0.88)',
                  margin: 0,
                  textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                  lineHeight: 1.5,
                  fontStyle: 'italic',
                }}>
                  {quote ? (
                    <>
                      “<EditableText
                        value={quote}
                        multiline
                        onChange={v => onUpdateText && onUpdateText('quote', v)}
                        isExporting={isExporting}
                      />”
                    </>
                  ) : !isExporting ? (
                    <EditableText
                      value=""
                      placeholder="Click to add quote..."
                      multiline
                      onChange={v => onUpdateText && onUpdateText('quote', v)}
                      isExporting={isExporting}
                    />
                  ) : null}
                </p>
              </DraggableBox>
            </div>
          )}
        </div>

        {/* ================= CENTER ACCENT: RATING PILL (DRAGGABLE & INLINE EDITABLE) ================= */}
        {showRating && !hiddenElements.rating && (
          <DraggableBox
            id="rating"
            offset={dragOffsets.rating}
            onOffsetChange={onUpdateDragOffset}
            onRemove={onRemoveElement}
            isExporting={isExporting}
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              justifyContent: 'center',
              margin: 'auto 0',
              flexShrink: 0,
            }}
          >
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 16px',
              borderRadius: 20,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(252,224,139,0.5)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.8)',
            }}>
              <span style={{ color: '#fce08b', fontSize: 13 }}>★</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', letterSpacing: '0.05em' }}>
                <EditableText
                  value={formattedRatingStr}
                  onChange={v => onUpdateText && onUpdateText('rating', v)}
                  isExporting={isExporting}
                />
                <span style={{ fontSize: 10, opacity: 0.65, marginLeft: 2 }}> / 5.0</span>
              </span>
            </div>
          </DraggableBox>
        )}

        {/* ================= BOTTOM SECTION: STUDIO TITLE & BRANDING (DRAGGABLE & INLINE EDITABLE) ================= */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', width: '100%', flexShrink: 0, boxSizing: 'border-box' }}>
          {/* Genre / Studio Mini Badge */}
          {!hiddenElements.genreBadge && (
            <div style={{ display: 'block', marginBottom: 10 }}>
              <DraggableBox
                id="genreBadge"
                offset={dragOffsets.genreBadge}
                onOffsetChange={onUpdateDragOffset}
                onRemove={onRemoveElement}
                isExporting={isExporting}
                style={{ display: 'inline-block' }}
              >
                <div style={{
                  padding: '3px 12px',
                  border: '1px solid rgba(255,255,255,0.85)',
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: '#ffffff',
                  backdropFilter: 'blur(6px)',
                }}>
                  <EditableText
                    value={customGenreBadge || (content.genres && content.genres.length > 0 ? content.genres[0] : 'CINEMASCOPE SELECTION')}
                    onChange={v => onUpdateText && onUpdateText('genreBadge', v)}
                    isExporting={isExporting}
                  />
                </div>
              </DraggableBox>
            </div>
          )}

          {/* Movie Title */}
          {!hiddenElements.title && (
            <DraggableBox
              id="title"
              offset={dragOffsets.title}
              onOffsetChange={onUpdateDragOffset}
              onRemove={onRemoveElement}
              isExporting={isExporting}
              style={{ display: 'block' }}
            >
              <h2 style={{
                fontSize: isStory ? 'clamp(18px, 4.8vw, 28px)' : isLandscape ? '22px' : '24px',
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-serif, "Cinzel", Georgia, serif)',
                color: '#ffffff',
                margin: '0 0 6px',
                lineHeight: 1.15,
                textShadow: '0 2px 16px rgba(0,0,0,0.95)',
              }}>
                <EditableText
                  value={customTitle !== undefined ? customTitle : (content.title || '')}
                  onChange={v => onUpdateText && onUpdateText('title', v)}
                  isExporting={isExporting}
                />
              </h2>

              <div style={{
                width: '65%',
                height: 1,
                margin: '0 auto 8px',
                background: 'rgba(255,255,255,0.7)',
              }} />
            </DraggableBox>
          )}

          {/* Subtitle / Release Info */}
          {!hiddenElements.subtitle && (
            <div style={{ display: 'block' }}>
              <DraggableBox
                id="subtitle"
                offset={dragOffsets.subtitle}
                onOffsetChange={onUpdateDragOffset}
                onRemove={onRemoveElement}
                isExporting={isExporting}
                style={{ display: 'inline-block' }}
              >
                <p style={{
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.85)',
                  margin: 0,
                  fontWeight: 600,
                }}>
                  <EditableText
                    value={customSubtitle !== undefined ? customSubtitle : (content.subtitle || '')}
                    onChange={v => onUpdateText && onUpdateText('subtitle', v)}
                    isExporting={isExporting}
                  />
                </p>
              </DraggableBox>
            </div>
          )}

          {/* Bottom Bar: Left & Right labels (Draggable & Editable) */}
          {!hiddenElements.footer && (
            <DraggableBox
              id="footer"
              offset={dragOffsets.footer}
              onOffsetChange={onUpdateDragOffset}
              onRemove={onRemoveElement}
              isExporting={isExporting}
              style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 16,
                paddingTop: 10,
                borderTop: '1px solid rgba(255,255,255,0.2)',
                fontSize: 9,
                fontWeight: 800,
                width: '100%',
              }}
            >
              <span style={{ letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)' }}>
                <EditableText
                  value={customBottomLeft || 'CINEMASCOPE EXCLUSIVE'}
                  onChange={v => onUpdateText && onUpdateText('bottomLeft', v)}
                  isExporting={isExporting}
                />
              </span>
              <span style={{ letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fce08b' }}>
                <EditableText
                  value={customBottomRight || 'NOW STREAMING'}
                  onChange={v => onUpdateText && onUpdateText('bottomRight', v)}
                  isExporting={isExporting}
                />
              </span>
            </DraggableBox>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className="modal-studio-rendered-card"
      style={{
        width: '100%',
        height: '100%',
        flex: 1,
        aspectRatio: format.aspectRatio,
        minHeight: isStory ? 480 : isPortrait ? 380 : isSquare ? 280 : 180,
        background: template.bg,
        color: template.textColor,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isStory
          ? (template.isFilmRoll ? '26px 28px' : '26px 18px')
          : isLandscape
          ? (template.isFilmRoll ? '20px 42px' : '20px 32px')
          : isSquare
          ? (template.isFilmRoll ? '22px 34px' : '22px 20px')
          : (template.isFilmRoll ? '22px 28px' : '22px 18px'),
        boxSizing: 'border-box',
        fontFamily: template.fontFamily === 'serif'
          ? 'var(--font-serif, "Cinzel", Georgia, serif)'
          : template.fontFamily === 'monospace'
          ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
          : 'var(--font-sans, "Inter", sans-serif)',
        border: `1px solid ${template.borderColor}`,
        flexShrink: 0,
      }}
    >
      {/* Background Ambience / Backdrop if available */}
      {content.backdropUrl && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${content.backdropUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.18,
          filter: 'blur(10px) brightness(0.6)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Film Roll Sprocket Holes Decoration */}
      {template.isFilmRoll && (
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: 22,
          background: '#000',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '6px 0',
          zIndex: 3,
        }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ width: 10, height: 14, background: 'rgba(255,255,255,0.22)', borderRadius: 2 }} />
          ))}
        </div>
      )}
      {template.isFilmRoll && (
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: 22,
          background: '#000',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '6px 0',
          zIndex: 3,
        }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ width: 10, height: 14, background: 'rgba(255,255,255,0.22)', borderRadius: 2 }} />
          ))}
        </div>
      )}

      {/* Scrapbook Tape Accent */}
      {template.isScrapbook && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%) rotate(-2deg)',
          width: 90,
          height: 20,
          background: 'rgba(255, 235, 180, 0.45)',
          border: '1px dashed rgba(200, 180, 120, 0.5)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          zIndex: 1,
          pointerEvents: 'none',
        }} />
      )}

      {/* ================= HEADER SECTION (DRAGGABLE & INLINE EDITABLE) ================= */}
      {!hiddenElements.card_header && (
        <DraggableBox
          id="card_header"
          offset={dragOffsets.card_header}
          onOffsetChange={onUpdateDragOffset}
          onRemove={onRemoveElement}
          isExporting={isExporting}
          style={{ position: 'relative', zIndex: 2, flexShrink: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: isStory ? 8 : 4 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 10px',
              borderRadius: template.isScrapbook ? 0 : 20,
              background: template.badgeBg,
              border: `1px solid ${template.borderColor}`,
              fontSize: isStory ? 10.5 : 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: template.accentColor,
              maxWidth: '75%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {isWeekendWinner ? <Trophy size={12} style={{ flexShrink: 0 }} /> : <Film size={12} style={{ flexShrink: 0 }} />}
              <EditableText
                value={headline}
                onChange={v => onUpdateText && onUpdateText('headline', v)}
                isExporting={isExporting}
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              />
            </div>

            {content.dateStr && (
              <span style={{ fontSize: 10, opacity: 0.6, letterSpacing: '0.05em', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {content.dateStr}
              </span>
            )}
          </div>
        </DraggableBox>
      )}

      {/* ================= BODY / MEDIA SECTION ================= */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        flex: 1,
        display: 'flex',
        flexDirection: isLandscape || isSquare ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isLandscape ? 18 : isSquare ? 16 : isStory ? 14 : 10,
        margin: '6px 0',
        minHeight: 0,
        overflow: 'hidden',
      }}>
        {/* Scenario 1: User Stats Cards */}
        {isStats ? (
          <div style={{ width: '100%', maxWidth: 540, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{
              fontSize: isStory ? 'clamp(18px, 3.5vw, 26px)' : 'clamp(15px, 2.8vw, 22px)',
              margin: '0 0 2px',
              textAlign: 'center',
              color: template.textColor,
            }}>
              {content.title}
            </h2>
            <div style={{ textAlign: 'center', fontSize: 11, color: template.accentColor, marginBottom: 10 }}>
              {content.subtitle}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 10 }}>
              {content.statsList?.map((s, idx) => (
                <div key={idx} style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${template.borderColor}`,
                  borderRadius: 6,
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <span style={{ fontSize: 16 }}>{s.emoji}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: template.accentColor }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: 9, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {content.posters && content.posters.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 4 }}>
                {content.posters.slice(0, 4).map((p, i) => (
                  <img
                    key={i}
                    src={p}
                    alt="film"
                    crossOrigin="anonymous"
                    style={{
                      width: 40,
                      aspectRatio: '2/3',
                      objectFit: 'cover',
                      borderRadius: 3,
                      border: `1px solid ${template.borderColor}`,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : hasMultiplePosters ? (
          /* Scenario 2: Multi-movie collage (Collection / Watchlist / Top Picks) */
          <div style={{ width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
            <h2 style={{
              fontSize: isStory ? 'clamp(17px, 3vw, 24px)' : 'clamp(14px, 2.5vw, 20px)',
              margin: '0 0 2px',
              color: template.textColor,
            }}>
              {content.title}
            </h2>
            <div style={{ fontSize: 11, color: template.accentColor, marginBottom: 10 }}>
              {content.subtitle}
            </div>

            {/* Adaptive Grid of Posters */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: content.posters.length <= 3 ? `repeat(${content.posters.length}, 1fr)` : 'repeat(3, 1fr)',
              gap: 8,
              maxWidth: isLandscape ? 360 : 320,
              margin: '0 auto 4px',
            }}>
              {content.posters.slice(0, 6).map((p, i) => (
                <div key={i} style={{
                  position: 'relative',
                  aspectRatio: '2/3',
                  maxHeight: isLandscape ? 110 : isSquare ? 110 : 130,
                  borderRadius: template.isScrapbook ? 2 : 5,
                  overflow: 'hidden',
                  border: `1px solid ${template.borderColor}`,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
                  background: 'rgba(0,0,0,0.5)',
                  transform: template.isScrapbook ? `rotate(${i % 2 === 0 ? '-2deg' : '2deg'})` : 'none',
                }}>
                  <img
                    src={p}
                    alt="poster"
                    crossOrigin={p?.startsWith('data:') ? undefined : 'anonymous'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Scenario 3: Single Movie / Review / Rating / Weekend Winner */
          <>
            {/* Poster Card (Draggable with Bin Button) */}
            {!hiddenElements.card_poster && content.posterUrl && (
              <DraggableBox
                id="card_poster"
                offset={dragOffsets.card_poster}
                onOffsetChange={onUpdateDragOffset}
                onRemove={onRemoveElement}
                isExporting={isExporting}
                style={{
                  position: 'relative',
                  height: isStory ? 180 : isLandscape ? 145 : isSquare ? 155 : 138,
                  aspectRatio: '2/3',
                  flexShrink: 0,
                  borderRadius: template.isScrapbook ? 3 : 8,
                  padding: template.isScrapbook ? 5 : 0,
                  background: template.isScrapbook ? '#fff' : 'transparent',
                  border: `1px solid ${template.isScrapbook ? '#ddd' : template.borderColor}`,
                  boxShadow: template.id === 'neon'
                    ? '0 6px 20px rgba(56,189,248,0.35)'
                    : '0 8px 24px rgba(0,0,0,0.7)',
                  transform: template.isScrapbook ? 'rotate(-1.5deg)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={content.posterUrl}
                  alt={content.title}
                  crossOrigin={content.posterUrl?.startsWith('data:') ? undefined : 'anonymous'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: template.isScrapbook ? 1 : 7,
                    display: 'block',
                  }}
                  onError={e => {
                    console.warn('Poster failed to load:', content.posterUrl);
                  }}
                />
                {isWeekendWinner && (
                  <div style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    background: 'linear-gradient(135deg, #c9a84c, #fbbf24)',
                    color: '#000',
                    fontWeight: 800,
                    fontSize: 8.5,
                    padding: '2px 7px',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
                  }}>
                    <Trophy size={10} /> #1 PICK
                  </div>
                )}
              </DraggableBox>
            )}

            {/* Info and Quote (Draggable & Inline Editable) */}
            <div style={{
              textAlign: isLandscape || isSquare ? 'left' : 'center',
              flex: isLandscape || isSquare ? 1 : undefined,
              maxWidth: isLandscape || isSquare ? '100%' : 440,
              width: isLandscape || isSquare ? 'auto' : '100%',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: isLandscape || isSquare ? 'flex-start' : 'center',
              justifyContent: 'center',
            }}>
              {!hiddenElements.card_title && (
                <DraggableBox
                  id="card_title"
                  offset={dragOffsets.card_title}
                  onOffsetChange={onUpdateDragOffset}
                  onRemove={onRemoveElement}
                  isExporting={isExporting}
                  style={{ width: '100%' }}
                >
                  <h2 style={{
                    fontSize: isStory
                      ? 'clamp(18px, 3.8vw, 24px)'
                      : isLandscape
                      ? 'clamp(16px, 2.6vw, 21px)'
                      : isSquare
                      ? 'clamp(15px, 2.5vw, 19px)'
                      : 'clamp(15px, 3vw, 19px)',
                    lineHeight: 1.15,
                    margin: '0 0 3px',
                    color: template.textColor,
                    letterSpacing: template.fontFamily === 'serif' ? '0.03em' : '-0.01em',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    width: '100%',
                  }}>
                    <EditableText
                      value={customTitle !== undefined ? customTitle : (content.title || '')}
                      onChange={v => onUpdateText && onUpdateText('title', v)}
                      isExporting={isExporting}
                    />
                  </h2>

                  {showMeta && (!hiddenElements.card_subtitle) && (
                    <div style={{
                      fontSize: 10.5,
                      color: template.accentColor,
                      marginBottom: 6,
                      opacity: 0.9,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%',
                    }}>
                      <EditableText
                        value={customSubtitle !== undefined ? customSubtitle : (content.subtitle || '')}
                        onChange={v => onUpdateText && onUpdateText('subtitle', v)}
                        isExporting={isExporting}
                      />
                    </div>
                  )}
                </DraggableBox>
              )}

              {/* Star Rating Display */}
              {showRating && !hiddenElements.card_rating && (
                <DraggableBox
                  id="card_rating"
                  offset={dragOffsets.card_rating}
                  onOffsetChange={onUpdateDragOffset}
                  onRemove={onRemoveElement}
                  isExporting={isExporting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isLandscape || isSquare ? 'flex-start' : 'center',
                    gap: 5,
                    marginBottom: 6,
                  }}
                >
                  <div style={{ display: 'flex', gap: 2, color: template.accentColor }}>
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        size={14}
                        fill={idx < Math.floor(Number(effectiveRating) || 0) ? template.accentColor : 'none'}
                        color={template.accentColor}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: template.textColor }}>
                    <EditableText
                      value={formattedRatingStr}
                      onChange={v => onUpdateText && onUpdateText('rating', v)}
                      isExporting={isExporting}
                    /> <span style={{ fontSize: 10, opacity: 0.6 }}>/ 5</span>
                  </span>
                </DraggableBox>
              )}

              {/* User Review / Quote */}
              {!hiddenElements.card_quote && (quote || !isExporting) && (
                <DraggableBox
                  id="card_quote"
                  offset={dragOffsets.card_quote}
                  onOffsetChange={onUpdateDragOffset}
                  onRemove={onRemoveElement}
                  isExporting={isExporting}
                  style={{ width: '100%' }}
                >
                  <div style={{
                    position: 'relative',
                    fontSize: isStory ? 12 : 11,
                    fontStyle: 'italic',
                    lineHeight: 1.4,
                    color: template.textColor,
                    opacity: 0.92,
                    background: 'rgba(255,255,255,0.035)',
                    padding: '6px 10px',
                    borderRadius: 5,
                    borderLeft: `3px solid ${template.accentColor}`,
                    display: '-webkit-box',
                    WebkitLineClamp: isStory ? 3 : 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                  }}>
                    {quote ? (
                      <>“<EditableText
                        value={quote}
                        multiline
                        onChange={v => onUpdateText && onUpdateText('quote', v)}
                        isExporting={isExporting}
                      />”</>
                    ) : !isExporting ? (
                      <EditableText
                        value=""
                        placeholder="Click to add quote..."
                        multiline
                        onChange={v => onUpdateText && onUpdateText('quote', v)}
                        isExporting={isExporting}
                      />
                    ) : null}
                  </div>
                </DraggableBox>
              )}
            </div>
          </>
        )}
      </div>

      {/* ================= FOOTER SECTION (DRAGGABLE) ================= */}
      {!hiddenElements.card_footer && (
        <DraggableBox
          id="card_footer"
          offset={dragOffsets.card_footer}
          onOffsetChange={onUpdateDragOffset}
          onRemove={onRemoveElement}
          isExporting={isExporting}
          style={{
            position: 'relative',
            zIndex: 2,
            flexShrink: 0,
            borderTop: `1px solid ${template.borderColor}`,
            paddingTop: isStory ? 10 : 8,
            display: 'flex',
            alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          width: '100%',
        }}
      >
        {/* Author / Reviewer Info */}
        {showAuthor && content.authorName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <div style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: template.badgeBg,
              border: `1px solid ${template.borderColor}`,
              color: template.accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 11,
              flexShrink: 0,
            }}>
              {content.authorName.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{content.authorName}</span>
                {content.isPro && (
                  <span title="Verified Professional Critic" style={{ color: '#10b981', display: 'flex', flexShrink: 0 }}>
                    <ShieldCheck size={12} />
                  </span>
                )}
              </div>
              <div style={{ fontSize: 9.5, opacity: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {content.authorHandle || '@cinemascope'}
              </div>
            </div>
          </div>
        )}

        {/* Branding Watermark */}
        {showBranding && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: template.accentColor,
            textTransform: 'uppercase',
            marginLeft: 'auto',
            flexShrink: 0,
          }}>
            <Film size={12} />
            <span>CINEMASCOPE</span>
          </div>
        )}
      </DraggableBox>
    )}
  </div>
);
}
