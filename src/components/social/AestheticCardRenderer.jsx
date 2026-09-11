import React from 'react';
import { Star, Trophy, Film, Sparkles, Heart, Bookmark, ShieldCheck, Check } from 'lucide-react';
import { SOCIAL_CONTENT_TYPES } from '../../services/socialSharingService';

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
  } = options;

  if (!content) return null;

  const isStory = format.id === 'story';
  const isLandscape = format.id === 'landscape';
  const isSquare = format.id === 'square';
  const isPortrait = format.id === 'portrait';

  const headline = customHeadline || content.headline;
  const quote = customQuote !== undefined && customQuote !== '' ? customQuote : content.quote;
  // Use user's personal rating first, then content rating
  const effectiveRating = customRating !== '' ? customRating : (content.userRating ?? content.rating ?? 5);
  const ratingNum = Math.round((content.rating || 5) * 10) / 10;
  const fullStars = Math.floor(content.rating || 5);

  // Dynamic layout adaptation for multi-movie collections or lists
  const hasMultiplePosters = content.posters && content.posters.length > 1;
  const isStats = content.type === SOCIAL_CONTENT_TYPES.USER_STATS;
  const isWeekendWinner = content.type === SOCIAL_CONTENT_TYPES.WEEKEND_WINNER;
  const isKeyArt = template.isKeyArt;

  // Background image source priority for full-bleed key-art mode
  const keyArtImage = content.backdropUrl || content.posterUrl;

  if (isKeyArt) {
    return (
      <div
        ref={cardRef}
        style={{
          width: '100%',
          aspectRatio: format.aspectRatio,
          background: '#000000',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: isStory ? '48px 32px' : isLandscape ? '28px 40px' : '36px 30px',
          boxSizing: 'border-box',
          fontFamily: 'var(--font-sans, "Montserrat", -apple-system, sans-serif)',
          border: '1px solid rgba(255,255,255,0.15)',
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

        {/* ================= TOP SECTION: STUDIO ACCOLADE MASTHEAD ================= */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', width: '100%' }}>
          {/* App Name — centered, smaller */}
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
            {customAppName || 'CINEMASCOPE'}
          </h1>

          {/* Underline Rule */}
          <div style={{
            width: '80%',
            height: 2,
            margin: '0 auto 10px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.95) 20%, rgba(255,255,255,0.95) 80%, transparent 100%)',
          }} />

          {/* Headline / Award Category */}
          <p style={{
            fontSize: isStory ? 12 : 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: '#ffffff',
            margin: '0 0 6px',
            textShadow: '0 2px 8px rgba(0,0,0,0.9)',
          }}>
            {headline || 'FEATURE FILM OF THE YEAR'}
          </p>

          {/* Review excerpt / Quote line */}
          {quote && (
            <p style={{
              fontSize: isStory ? 11 : 10,
              fontWeight: 500,
              letterSpacing: '0.06em',
              color: 'rgba(255,255,255,0.88)',
              margin: '0 auto',
              textShadow: '0 2px 8px rgba(0,0,0,0.9)',
              maxWidth: '90%',
              lineHeight: 1.5,
              fontStyle: 'italic',
            }}>
              {`"${quote}"`}
            </p>
          )}
        </div>

        {/* ================= CENTER ACCENT: RATING PILL ================= */}
        {showRating && (
          <div style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            justifyContent: 'center',
            margin: 'auto 0',
          }}>
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
                {effectiveRating}
                <span style={{ fontSize: 10, opacity: 0.65, marginLeft: 2 }}> / 5.0</span>
              </span>
            </div>
          </div>
        )}

        {/* ================= BOTTOM SECTION: STUDIO TITLE & BRANDING ================= */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          {/* Genre / Studio Mini Badge */}
          <div style={{
            display: 'inline-block',
            padding: '3px 12px',
            border: '1px solid rgba(255,255,255,0.85)',
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#ffffff',
            marginBottom: 10,
            backdropFilter: 'blur(6px)',
          }}>
            {customGenreBadge || (content.genres && content.genres.length > 0 ? content.genres[0] : 'CINEMASCOPE SELECTION')}
          </div>

          {/* Movie Title */}
          <div>
            <h2 style={{
              fontSize: isStory ? 'clamp(22px, 5vw, 34px)' : isLandscape ? '22px' : '26px',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-serif, "Cinzel", Georgia, serif)',
              color: '#ffffff',
              margin: '0 0 6px',
              lineHeight: 1.1,
              textShadow: '0 2px 16px rgba(0,0,0,0.95)',
            }}>
              {customTitle || content.title}
            </h2>

            {/* Title Underline Separator */}
            <div style={{
              width: '65%',
              height: 1,
              margin: '0 auto 8px',
              background: 'rgba(255,255,255,0.7)',
            }} />

            {/* Subtitle / Release Info */}
            <p style={{
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.85)',
              margin: 0,
              fontWeight: 600,
            }}>
              {customSubtitle || content.subtitle || ''}
            </p>
          </div>

          {/* Bottom Bar: Left & Right labels */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 16,
            paddingTop: 10,
            borderTop: '1px solid rgba(255,255,255,0.2)',
            fontSize: 9,
            fontWeight: 800,
          }}>
            <span style={{ letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)' }}>
              {customBottomLeft || 'CINEMASCOPE EXCLUSIVE'}
            </span>
            <span style={{ letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fce08b' }}>
              {customBottomRight || 'NOW STREAMING'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      style={{
        width: '100%',
        aspectRatio: format.aspectRatio,
        background: template.bg,
        color: template.textColor,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isStory
          ? (template.isFilmRoll ? '28px 36px' : '28px 24px')
          : isLandscape
          ? (template.isFilmRoll ? '20px 42px' : '20px 32px')
          : isSquare
          ? (template.isFilmRoll ? '22px 38px' : '22px 24px')
          : (template.isFilmRoll ? '22px 34px' : '22px 20px'),
        boxSizing: 'border-box',
        fontFamily: template.fontFamily === 'serif'
          ? 'var(--font-serif, "Cinzel", Georgia, serif)'
          : template.fontFamily === 'monospace'
          ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
          : 'var(--font-sans, "Inter", sans-serif)',
        border: `1px solid ${template.borderColor}`,
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

      {/* ================= HEADER SECTION ================= */}
      <div style={{ position: 'relative', zIndex: 2, flexShrink: 0 }}>
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
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{headline}</span>
          </div>

          {content.dateStr && (
            <span style={{ fontSize: 10, opacity: 0.6, letterSpacing: '0.05em', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {content.dateStr}
            </span>
          )}
        </div>
      </div>

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
            {/* Poster Card */}
            {content.posterUrl && (
              <div style={{
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
              }}>
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
              </div>
            )}

            {/* Info and Quote */}
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
                {content.title}
              </h2>

              {showMeta && content.subtitle && (
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
                  {content.subtitle}
                </div>
              )}

              {/* Star Rating Display */}
              {showRating && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isLandscape || isSquare ? 'flex-start' : 'center',
                  gap: 5,
                  marginBottom: 6,
                }}>
                  <div style={{ display: 'flex', gap: 2, color: template.accentColor }}>
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        size={14}
                        fill={idx < fullStars ? template.accentColor : 'none'}
                        color={template.accentColor}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: template.textColor }}>
                    {ratingNum} <span style={{ fontSize: 10, opacity: 0.6 }}>/ 5</span>
                  </span>
                </div>
              )}

              {/* User Review / Quote */}
              {quote && (
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
                  “{quote}”
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ================= FOOTER SECTION ================= */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        flexShrink: 0,
        borderTop: `1px solid ${template.borderColor}`,
        paddingTop: isStory ? 10 : 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}>
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
      </div>
    </div>
  );
}
