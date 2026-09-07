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
  } = options;

  if (!content) return null;

  const isStory = format.id === 'story';
  const isLandscape = format.id === 'landscape';
  const isSquare = format.id === 'square';
  const isPortrait = format.id === 'portrait';

  const headline = customHeadline || content.headline;
  const quote = customQuote !== undefined && customQuote !== '' ? customQuote : content.quote;
  const ratingNum = Math.round((content.rating || 5) * 10) / 10;
  const fullStars = Math.floor(content.rating || 5);

  // Dynamic layout adaptation for multi-movie collections or lists
  const hasMultiplePosters = content.posters && content.posters.length > 1;
  const isStats = content.type === SOCIAL_CONTENT_TYPES.USER_STATS;
  const isWeekendWinner = content.type === SOCIAL_CONTENT_TYPES.WEEKEND_WINNER;

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
        padding: isStory ? '64px 44px' : isLandscape ? '36px 48px' : '40px 36px',
        boxSizing: 'border-box',
        fontFamily: template.fontFamily === 'serif' ? 'var(--font-serif, "Cinzel", Georgia, serif)' : 'var(--font-sans, "Inter", sans-serif)',
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
          width: 24,
          background: '#000',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '8px 0',
          zIndex: 3,
        }}>
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} style={{ width: 12, height: 16, background: 'rgba(255,255,255,0.25)', borderRadius: 2 }} />
          ))}
        </div>
      )}
      {template.isFilmRoll && (
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: 24,
          background: '#000',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '8px 0',
          zIndex: 3,
        }}>
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} style={{ width: 12, height: 16, background: 'rgba(255,255,255,0.25)', borderRadius: 2 }} />
          ))}
        </div>
      )}

      {/* Scrapbook Tape Accent */}
      {template.isScrapbook && (
        <div style={{
          position: 'absolute',
          top: 18,
          left: '50%',
          transform: 'translateX(-50%) rotate(-2deg)',
          width: 120,
          height: 28,
          background: 'rgba(255, 235, 180, 0.45)',
          border: '1px dashed rgba(200, 180, 120, 0.5)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          zIndex: 4,
        }} />
      )}

      {/* ================= HEADER SECTION ================= */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: template.isScrapbook ? 0 : 20,
            background: template.badgeBg,
            border: `1px solid ${template.borderColor}`,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: template.accentColor,
          }}>
            {isWeekendWinner ? <Trophy size={13} /> : <Film size={13} />}
            <span>{headline}</span>
          </div>

          {content.dateStr && (
            <span style={{ fontSize: 11, opacity: 0.6, letterSpacing: '0.05em' }}>
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
        flexDirection: isLandscape ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isLandscape ? 32 : isStory ? 28 : 20,
        margin: '12px 0',
      }}>
        {/* Scenario 1: User Stats Cards */}
        {isStats ? (
          <div style={{ width: '100%', maxWidth: 540 }}>
            <h2 style={{
              fontSize: 'clamp(22px, 4vw, 36px)',
              margin: '0 0 4px',
              textAlign: 'center',
              color: template.textColor,
            }}>
              {content.title}
            </h2>
            <div style={{ textAlign: 'center', fontSize: 12, color: template.accentColor, marginBottom: 20 }}>
              {content.subtitle}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
              {content.statsList?.map((s, idx) => (
                <div key={idx} style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${template.borderColor}`,
                  borderRadius: 6,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <span style={{ fontSize: 22 }}>{s.emoji}</span>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: template.accentColor }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {content.posters && content.posters.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
                {content.posters.slice(0, 4).map((p, i) => (
                  <img
                    key={i}
                    src={p}
                    alt="film"
                    crossOrigin="anonymous"
                    style={{
                      width: 50,
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
          <div style={{ width: '100%', textAlign: 'center' }}>
            <h2 style={{
              fontSize: 'clamp(20px, 3.5vw, 32px)',
              margin: '0 0 6px',
              color: template.textColor,
            }}>
              {content.title}
            </h2>
            <div style={{ fontSize: 12, color: template.accentColor, marginBottom: 18 }}>
              {content.subtitle}
            </div>

            {/* Adaptive Grid of Posters */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: content.posters.length <= 3 ? `repeat(${content.posters.length}, 1fr)` : 'repeat(3, 1fr)',
              gap: 12,
              maxWidth: 480,
              margin: '0 auto 16px',
            }}>
              {content.posters.slice(0, 6).map((p, i) => (
                <div key={i} style={{
                  position: 'relative',
                  aspectRatio: '2/3',
                  borderRadius: template.isScrapbook ? 2 : 6,
                  overflow: 'hidden',
                  border: `1px solid ${template.borderColor}`,
                  boxShadow: '0 6px 18px rgba(0,0,0,0.6)',
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
                width: isLandscape ? 180 : isStory ? 240 : 200,
                aspectRatio: '2/3',
                flexShrink: 0,
                borderRadius: template.isScrapbook ? 3 : 8,
                padding: template.isScrapbook ? 8 : 0,
                background: template.isScrapbook ? '#fff' : 'transparent',
                border: `1px solid ${template.isScrapbook ? '#ddd' : template.borderColor}`,
                boxShadow: '0 12px 36px rgba(0,0,0,0.7)',
                transform: template.isScrapbook ? 'rotate(-1.5deg)' : 'none',
              }}>
                <img
                  src={content.posterUrl}
                  alt={content.title}
                  crossOrigin={content.posterUrl?.startsWith('data:') ? undefined : 'anonymous'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: template.isScrapbook ? 1 : 8,
                    display: 'block',
                  }}
                  onError={e => {
                    // Do not replace with a generic mountain demo-frame.jpg
                    console.warn('Poster failed to load:', content.posterUrl);
                  }}
                />
                {isWeekendWinner && (
                  <div style={{
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    background: 'linear-gradient(135deg, #c9a84c, #fbbf24)',
                    color: '#000',
                    fontWeight: 800,
                    fontSize: 10,
                    padding: '4px 10px',
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                  }}>
                    <Trophy size={12} /> #1 PICK
                  </div>
                )}
              </div>
            )}

            {/* Info and Quote */}
            <div style={{
              textAlign: isLandscape ? 'left' : 'center',
              maxWidth: 580,
              width: '100%',
            }}>
              <h2 style={{
                fontSize: isStory ? 'clamp(24px, 4.5vw, 40px)' : 'clamp(20px, 3.5vw, 32px)',
                lineHeight: 1.15,
                margin: '0 0 6px',
                color: template.textColor,
                letterSpacing: template.fontFamily === 'serif' ? '0.04em' : '-0.02em',
              }}>
                {content.title}
              </h2>

              {showMeta && content.subtitle && (
                <div style={{ fontSize: 13, color: template.accentColor, marginBottom: 12, opacity: 0.9 }}>
                  {content.subtitle}
                </div>
              )}

              {/* Star Rating Display */}
              {showRating && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isLandscape ? 'flex-start' : 'center',
                  gap: 8,
                  marginBottom: 16,
                }}>
                  <div style={{ display: 'flex', gap: 2, color: template.accentColor }}>
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        size={20}
                        fill={idx < fullStars ? template.accentColor : 'none'}
                        color={template.accentColor}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: template.textColor }}>
                    {ratingNum} <span style={{ fontSize: 12, opacity: 0.6 }}>/ 5</span>
                  </span>
                </div>
              )}

              {/* User Review / Quote */}
              {quote && (
                <div style={{
                  position: 'relative',
                  fontSize: isStory ? 16 : 14,
                  fontStyle: 'italic',
                  lineHeight: 1.6,
                  color: template.textColor,
                  opacity: 0.9,
                  background: 'rgba(255,255,255,0.03)',
                  padding: '14px 20px',
                  borderRadius: 6,
                  borderLeft: `3px solid ${template.accentColor}`,
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
        borderTop: `1px solid ${template.borderColor}`,
        paddingTop: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        {/* Author / Reviewer Info */}
        {showAuthor && content.authorName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: template.badgeBg,
              border: `1px solid ${template.borderColor}`,
              color: template.accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 13,
            }}>
              {content.authorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>{content.authorName}</span>
                {content.isPro && (
                  <span title="Verified Professional Critic" style={{ color: '#10b981', display: 'flex' }}>
                    <ShieldCheck size={14} />
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>
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
            gap: 6,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.1em',
            color: template.accentColor,
            textTransform: 'uppercase',
            marginLeft: 'auto',
          }}>
            <Film size={13} />
            <span>CINEMASCOPE</span>
          </div>
        )}
      </div>
    </div>
  );
}
