import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Expand } from 'lucide-react';
import { calcAspectFit, calcAspectCrop, ASPECT_RATIOS } from '../../data/formats';

// Demo image - a cinematic widescreen landscape (we use a gradient + SVG as fallback)
const DEMO_IMAGE_URL = '/demo-frame.jpg';
// BIG BUCK BUNNY - public domain, CC-licensed
const DEMO_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const SOURCE_RATIO = 1.78; // BBB is 16:9

function formatVal(v, unit = '') {
  if (v === null || v === undefined) return 'N/A';
  return `${v}${unit}`;
}

export default function ScreenSimulator({
  screenRatio = 2.39,
  screenRatioLabel = '2.39:1',
  screenFormatName = 'Scope',
  screenWidthM,
  screenHeightM,
  mode = 'fit',
  onModeChange,
  containerWidth,
  isExperience = false,
  stageHeight,
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [containerW, setContainerW] = useState(containerWidth || 800);

  useEffect(() => {
    if (containerWidth) {
      setContainerW(containerWidth);
    }
  }, [containerWidth]);
  const [useVideo, setUseVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoTime, setVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        setContainerW(e.contentRect.width);
      }
    });
    ro.observe(el);
    setContainerW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const maxDisplayW = Math.min(containerW * 0.86, isExperience ? 1100 : 840);
  
  const calc = mode === 'crop'
    ? calcAspectCrop(SOURCE_RATIO, screenRatio, maxDisplayW, maxDisplayW / screenRatio)
    : calcAspectFit(SOURCE_RATIO, screenRatio, maxDisplayW, maxDisplayW / screenRatio);

  const { screenW, screenH, mediaW, mediaH, offsetX, offsetY, percentVisible, percentCropped = 0, cropSide = 'none', screenCoverage = 100 } = calc;

  // Physical or aspect ratio dimensions strictly in feet
  const hasPhysical = Boolean(screenWidthM && Number(screenWidthM) > 0);
  const widthFt = hasPhysical
    ? Math.round(Number(screenWidthM) * 3.28084)
    : Math.round(20 * screenRatio);
  const heightFt = hasPhysical
    ? (screenHeightM ? Math.round(Number(screenHeightM) * 3.28084) : Math.round((Number(screenWidthM) / screenRatio) * 3.28084))
    : 20;

  const widthScaleText = `${widthFt} ft`;
  const heightScaleText = `${heightFt} ft`;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) { videoRef.current.pause(); setIsPlaying(false); }
    else { videoRef.current.play(); setIsPlaying(true); }
  };
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };
  const handleTimeUpdate = () => {
    if (videoRef.current) setVideoTime(videoRef.current.currentTime);
  };
  const handleDurationChange = () => {
    if (videoRef.current) setVideoDuration(videoRef.current.duration);
  };
  const handleSeek = (e) => {
    if (!videoRef.current || !videoDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    videoRef.current.currentTime = pct * videoDuration;
  };

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2,'0')}`;
  };

  const mediaStyle = {
    position: 'absolute',
    left: offsetX,
    top: offsetY,
    width: mediaW,
    height: mediaH,
    maxWidth: 'none',
    maxHeight: 'none',
    objectFit: 'cover',
    transition: 'all 550ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  };

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      {/* Top Aspect Ratio Badge */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          padding: '6px 22px',
          border: '1px solid rgba(245, 158, 11, 0.5)',
          background: 'rgba(12, 10, 6, 0.85)',
          borderRadius: 4,
          boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
        }}>
          <span style={{
            fontFamily: 'monospace',
            fontSize: 20,
            fontWeight: 800,
            color: '#f59e0b',
            letterSpacing: '0.06em',
          }}>
            {screenRatioLabel}
          </span>
          <div style={{ width: 1, height: 16, background: 'rgba(245, 158, 11, 0.4)' }} />
          <span style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#e2e8f0',
          }}>
            {screenFormatName}
          </span>
        </div>
      </div>

      {/* Screen frame stage */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: stageHeight ? `${stageHeight + 36}px` : 'auto',
          minHeight: stageHeight ? `${stageHeight + 36}px` : 'auto',
          paddingTop: 30,
          paddingRight: 36,
          boxSizing: 'content-box',
          transition: 'height 400ms ease',
        }}
      >
        <div style={{ position: 'relative', width: screenW, height: screenH }}>
          {/* Horizontal Width Scale Ruler (Top) */}
          <div
            style={{
              position: 'absolute',
              top: -26,
              left: 0,
              width: screenW,
              height: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            <svg
              width={screenW}
              height={22}
              style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}
            >
              {/* Main dimension line */}
              <line
                x1={0}
                y1={11}
                x2={screenW}
                y2={11}
                stroke="rgba(245, 158, 11, 0.35)"
                strokeWidth={1}
              />
              {/* Left bracket cap [ */}
              <path d="M 6 4 L 0 4 L 0 18 L 6 18" fill="none" stroke="#f59e0b" strokeWidth="1.8" />
              {/* Right bracket cap ] */}
              <path d={`M ${screenW - 6} 4 L ${screenW} 4 L ${screenW} 18 L ${screenW - 6} 18`} fill="none" stroke="#f59e0b" strokeWidth="1.8" />

              {/* Incremental ruler notches */}
              {Array.from({ length: 21 }).map((_, i) => {
                const x = (screenW / 20) * i;
                const isMajor = i % 5 === 0;
                return (
                  <line
                    key={`w-tick-${i}`}
                    x1={x}
                    y1={isMajor ? 4 : 8}
                    x2={x}
                    y2={isMajor ? 18 : 14}
                    stroke={isMajor ? "#f59e0b" : "rgba(245, 158, 11, 0.3)"}
                    strokeWidth={1}
                  />
                );
              })}
            </svg>

            {/* Centered Width Dimension Label Badge */}
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                background: '#0e0b06',
                border: '1px solid rgba(245, 158, 11, 0.55)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.8)',
                padding: '2px 10px',
                borderRadius: 4,
                fontSize: 10,
                fontFamily: 'monospace',
                color: '#f59e0b',
                letterSpacing: '0.06em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                whiteSpace: 'nowrap',
              }}
              title={`Screen Width: ${widthScaleText}`}
            >
              <span style={{ fontSize: 9, opacity: 0.85 }}>←</span>
              <span style={{ fontWeight: 800 }}>W: {widthScaleText}</span>
              <span style={{ fontSize: 9, opacity: 0.85 }}>→</span>
            </div>
          </div>

          {/* Vertical Height Scale Ruler (Right) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: -34,
              width: 28,
              height: screenH,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            <svg
              width={28}
              height={screenH}
              style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}
            >
              {/* Main dimension line */}
              <line
                x1={10}
                y1={0}
                x2={10}
                y2={screenH}
                stroke="rgba(245, 158, 11, 0.35)"
                strokeWidth={1}
              />
              {/* Top bracket cap [ */}
              <path d="M 0 6 L 0 0 L 14 0 L 14 6" fill="none" stroke="#f59e0b" strokeWidth="1.8" />
              {/* Bottom bracket cap ] */}
              <path d={`M 0 ${screenH - 6} L 0 ${screenH} L 14 ${screenH} L 14 ${screenH - 6}`} fill="none" stroke="#f59e0b" strokeWidth="1.8" />

              {/* Incremental ruler notches */}
              {Array.from({ length: 11 }).map((_, i) => {
                const y = (screenH / 10) * i;
                const isMajor = i % 5 === 0;
                return (
                  <line
                    key={`h-tick-${i}`}
                    x1={isMajor ? 3 : 7}
                    y1={y}
                    x2={isMajor ? 17 : 13}
                    y2={y}
                    stroke={isMajor ? "#f59e0b" : "rgba(245, 158, 11, 0.3)"}
                    strokeWidth={1}
                  />
                );
              })}
            </svg>

            {/* Vertical Height Dimension Label Badge */}
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                transform: 'rotate(90deg)',
                background: '#0e0b06',
                border: '1px solid rgba(245, 158, 11, 0.55)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.8)',
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 9,
                fontFamily: 'monospace',
                color: '#f59e0b',
                letterSpacing: '0.06em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
              }}
              title={`Screen Height: ${heightScaleText}`}
            >
              <span style={{ fontSize: 8, opacity: 0.85 }}>←</span>
              <span style={{ fontWeight: 800 }}>H: {heightScaleText}</span>
              <span style={{ fontSize: 8, opacity: 0.85 }}>→</span>
            </div>
          </div>

          <div
            className="screen-frame"
            style={{
              width: screenW,
              height: screenH,
              background: '#000',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 0 0 1px rgba(245, 158, 11, 0.35), 0 0 60px rgba(0,0,0,0.9), 0 0 80px rgba(245, 158, 11, 0.08)',
              transition: 'width 550ms cubic-bezier(0.25,0.46,0.45,0.94), height 550ms cubic-bezier(0.25,0.46,0.45,0.94)',
            }}
          >
          {/* Media */}
          {useVideo && !videoError ? (
            <video
              ref={videoRef}
              src={DEMO_VIDEO_URL}
              loop
              muted={isMuted}
              playsInline
              preload="metadata"
              style={mediaStyle}
              onLoadedData={() => setVideoLoaded(true)}
              onError={() => { setVideoError(true); setUseVideo(false); }}
              onTimeUpdate={handleTimeUpdate}
              onDurationChange={handleDurationChange}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          ) : (
            <img
              src={DEMO_IMAGE_URL}
              alt="Demo cinema frame"
              style={mediaStyle}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}

          {/* Inner vignette */}
          <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 80px rgba(0,0,0,0.5)', pointerEvents: 'none' }} />

          {/* Ratio overlay label in top right corner */}
          <div style={{
            position: 'absolute',
            top: 10,
            right: 12,
            fontFamily: 'system-ui, sans-serif',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.85)',
            textShadow: '0 2px 8px rgba(0,0,0,0.95)',
            pointerEvents: 'none',
          }}>
            {screenRatioLabel} · {screenFormatName}
          </div>

          {/* Video controls (only if useVideo is toggled on) */}
          {useVideo && !videoError && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <button onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}
                style={{ color: '#f59e0b', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}>
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <span style={{ fontSize: 10, color: '#f59e0b', fontFamily: 'monospace', minWidth: 36 }}>
                {fmt(videoTime)}
              </span>
              <div
                role="slider" aria-label="Seek"
                style={{ flex: 1, height: 24, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                onClick={handleSeek}
              >
                <div style={{ width: '100%', height: 2, background: 'rgba(245,158,11,0.2)', borderRadius: 1, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${videoDuration ? (videoTime/videoDuration)*100 : 0}%`, background: '#f59e0b', borderRadius: 1 }} />
                </div>
              </div>
              <span style={{ fontSize: 10, color: '#f59e0b', fontFamily: 'monospace', minWidth: 36 }}>
                {fmt(videoDuration)}
              </span>
              <button onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}
                style={{ color: '#f59e0b', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}>
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Mode toggle & stats matching Image 1 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 18,
        minHeight: 46,
        gap: 12,
        padding: '0 4px',
      }}>
        {/* Mode toggle buttons */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => onModeChange && onModeChange('fit')}
            style={{
              padding: '8px 18px',
              borderRadius: 4,
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              border: mode === 'fit' ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.16)',
              background: mode === 'fit' ? '#f59e0b' : 'rgba(255,255,255,0.05)',
              color: mode === 'fit' ? '#000000' : 'rgba(255,255,255,0.85)',
              transition: 'all 150ms ease',
            }}
          >
            FULL FRAME
          </button>
          <button
            onClick={() => onModeChange && onModeChange('crop')}
            style={{
              padding: '8px 18px',
              borderRadius: 4,
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              border: mode === 'crop' ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.16)',
              background: mode === 'crop' ? '#f59e0b' : 'rgba(255,255,255,0.05)',
              color: mode === 'crop' ? '#000000' : 'rgba(255,255,255,0.85)',
              transition: 'all 150ms ease',
            }}
          >
            CINEMA CROP
          </button>

          <button
            onClick={() => setUseVideo(!useVideo)}
            style={{
              padding: '6px 12px',
              borderRadius: 4,
              fontSize: 9.5,
              fontWeight: 600,
              letterSpacing: '0.05em',
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.5)',
              marginLeft: 4,
            }}
            title="Toggle between sample image and demo video"
          >
            {useVideo ? '📷 Photo' : '🎬 Video'}
          </button>
        </div>

        {/* Visibility stat */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: 11,
              fontWeight: 700,
              color: '#94a3b8',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}>
              {mode === 'fit' ? 'IMAGE VISIBLE' : 'SOURCE CROPPED'}
            </div>
            <div style={{
              fontFamily: 'system-ui, monospace',
              fontSize: 26,
              fontWeight: 900,
              color: mode === 'fit'
                ? '#f59e0b'
                : (percentCropped <= 0 ? '#f59e0b' : percentCropped <= 10 ? '#f59e0b' : '#f87171'),
              letterSpacing: '0.02em',
              lineHeight: 1.1,
            }}>
              {mode === 'fit' ? '100%' : `${percentCropped}%`}
            </div>
          </div>
        </div>
      </div>

      {/* Source ratio info */}
      <div style={{
        marginTop: 10,
        padding: '10px 14px',
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        flexWrap: 'wrap',
        minHeight: 56,
      }}>
        <div style={{ minWidth: 120 }}>
          <span style={{ fontSize: 9, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Demo Source</span>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Big Buck Bunny (CC) · 1.78:1 (16:9)</div>
        </div>
        <div style={{ minWidth: 90 }}>
          <span style={{ fontSize: 9, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Screen</span>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{screenRatioLabel} · {screenFormatName}</div>
        </div>
        <div style={{ minWidth: 110 }}>
          <span style={{ fontSize: 9, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Dimensions</span>
          <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 2, fontFamily: 'monospace', fontWeight: 600 }}>
            {widthFt} ft × {heightFt} ft
          </div>
        </div>
        {mode === 'fit' && Math.abs(offsetY) > 1 && (
          <div>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Letterbox Bars</span>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{Math.round(offsetY)}px each (top & bottom)</div>
          </div>
        )}
        {mode === 'fit' && Math.abs(offsetX) > 1 && (
          <div>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Pillarbox Bars</span>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{Math.round(offsetX)}px each (left & right)</div>
          </div>
        )}
        {mode === 'crop' && (
          <div>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Edge Cropping</span>
            <div style={{ fontSize: 11, color: percentCropped > 0 ? '#f87171' : 'var(--gold)', marginTop: 2 }}>
              {percentCropped > 0
                ? `${percentCropped}% cropped (${cropSide === 'sides' ? 'sides' : 'top & bottom'})`
                : 'None (Exact Match)'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
