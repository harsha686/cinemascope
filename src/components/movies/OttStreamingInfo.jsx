import React from 'react';
import { Tv, Calendar, ExternalLink, Play, Clock, Sparkles } from 'lucide-react';

// Common platform brand styling for seamless recognition
const BRAND_COLORS = {
  'netflix': { bg: '#E50914', text: '#FFFFFF', name: 'Netflix' },
  'amazon prime video': { bg: '#00A8E1', text: '#FFFFFF', name: 'Prime Video' },
  'prime video': { bg: '#00A8E1', text: '#FFFFFF', name: 'Prime Video' },
  'disney+ hotstar': { bg: '#0C3C82', text: '#FFFFFF', name: 'Disney+ Hotstar' },
  'hotstar': { bg: '#0C3C82', text: '#FFFFFF', name: 'Disney+ Hotstar' },
  'aha': { bg: '#FF5C00', text: '#FFFFFF', name: 'Aha' },
  'zee5': { bg: '#8230C6', text: '#FFFFFF', name: 'Zee5' },
  'sonyliv': { bg: '#002B49', text: '#FFFFFF', name: 'SonyLIV' },
  'jiocinema': { bg: '#E11383', text: '#FFFFFF', name: 'JioCinema' },
  'apple tv': { bg: '#000000', text: '#FFFFFF', name: 'Apple TV' },
  'apple tv store': { bg: '#000000', text: '#FFFFFF', name: 'Apple TV' },
  'google play movies': { bg: '#01875F', text: '#FFFFFF', name: 'Google Play' },
  'youtube': { bg: '#FF0000', text: '#FFFFFF', name: 'YouTube' },
};

function getBrand(name = '') {
  const key = name.toLowerCase().trim();
  return BRAND_COLORS[key] || { bg: 'rgba(255,255,255,0.08)', text: 'var(--text-primary)', name };
}

function formatOttDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export default function OttStreamingInfo({ movie }) {
  if (!movie) return null;

  // Extract date
  const rawDate = movie.ottReleaseDate || (movie.ottRelease && movie.ottRelease.date);
  const formattedDate = formatOttDate(rawDate);

  // Check if upcoming or already released
  let isUpcoming = false;
  if (rawDate) {
    try {
      const releaseTime = new Date(rawDate).getTime();
      const now = new Date().getTime();
      if (!isNaN(releaseTime) && releaseTime > now) {
        isUpcoming = true;
      }
    } catch {
      isUpcoming = false;
    }
  }

  // Extract platforms
  let platformsList = [];
  if (Array.isArray(movie.ottPlatforms) && movie.ottPlatforms.length > 0) {
    platformsList = movie.ottPlatforms;
  } else if (movie.ottPlatform) {
    // String like "Netflix, Amazon Prime Video"
    const splitNames = movie.ottPlatform.split(',').map(s => s.trim()).filter(Boolean);
    platformsList = splitNames.map(name => ({
      name,
      type: 'stream',
      logoUrl: '',
    }));
  }

  // Direct watch link
  const watchLink = movie.ottWatchUrl || movie.ottUrl || '';

  // Categorize
  const streamProviders = platformsList.filter(p => !p.type || p.type === 'stream');
  const rentBuyProviders = platformsList.filter(p => p.type === 'rent' || p.type === 'buy');

  const hasAnyInfo = formattedDate || platformsList.length > 0 || watchLink;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-sm)',
      padding: '22px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative gradient glow */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '140px',
        height: '140px',
        background: isUpcoming
          ? 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header with Title & Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tv size={17} color={isUpcoming ? 'var(--gold)' : '#10b981'} />
          <h3 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 13,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            Streaming &amp; OTT Release
          </h3>
        </div>

        {/* Status Pill */}
        {hasAnyInfo ? (
          isUpcoming ? (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10,
              padding: '3px 8px',
              borderRadius: 12,
              background: 'rgba(245,158,11,0.15)',
              color: 'var(--gold)',
              border: '1px solid var(--gold-dim)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              <Clock size={10} /> Upcoming OTT
            </span>
          ) : (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10,
              padding: '3px 8px',
              borderRadius: 12,
              background: 'rgba(16,185,129,0.15)',
              color: '#10b981',
              border: '1px solid rgba(16,185,129,0.3)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Streaming Now
            </span>
          )
        ) : (
          <span style={{
            fontSize: 10,
            padding: '3px 8px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.06)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)'
          }}>
            Theatrical Exclusive
          </span>
        )}
      </div>

      {/* OTT Release Date */}
      {formattedDate ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 4,
          marginBottom: 16
        }}>
          <Calendar size={14} color="var(--gold)" />
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {isUpcoming ? 'Expected OTT Premiere: ' : 'Digital Premiere Date: '}
            <strong style={{ color: 'var(--text-primary)', marginLeft: 4 }}>{formattedDate}</strong>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
          Digital release date to be confirmed by distributors.
        </div>
      )}

      {/* Streaming Platforms */}
      {platformsList.length > 0 ? (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            {streamProviders.length > 0 ? 'Watch On Subscription' : 'Available On'}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {platformsList.map((platform, idx) => {
              const brand = getBrand(platform.name);
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    borderRadius: 4,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'all 150ms ease',
                  }}
                >
                  {platform.logoUrl ? (
                    <img
                      src={platform.logoUrl}
                      alt={platform.name}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 3,
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 22,
                      height: 22,
                      borderRadius: 3,
                      background: brand.bg,
                      color: brand.text,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 10
                    }}>
                      {platform.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {platform.name}
                  </span>

                  {platform.type === 'rent' && (
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 8 }}>
                      Rent
                    </span>
                  )}
                  {platform.type === 'buy' && (
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 8 }}>
                      Buy
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{
          padding: '12px 14px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed var(--border-subtle)',
          borderRadius: 4,
          fontSize: 12,
          color: 'var(--text-muted)',
          lineHeight: 1.5,
          marginBottom: 16
        }}>
          Currently screening in cinemas. OTT platform rights will be updated once streaming rights are confirmed.
        </div>
      )}

      {/* Direct Watch / Streaming Link */}
      {watchLink && (
        <a
          href={watchLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline btn-sm"
          style={{
            width: '100%',
            justifyContent: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            marginTop: 8
          }}
        >
          <ExternalLink size={13} />
          {streamProviders.length > 0 ? `Stream on ${streamProviders[0].name}` : 'Check Streaming Options'}
        </a>
      )}
    </div>
  );
}
