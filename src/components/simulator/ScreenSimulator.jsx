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
  mode = 'fit',
  onModeChange,
  containerWidth,
  isExperience = false,
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [containerW, setContainerW] = useState(containerWidth || 800);
  const [useVideo, setUseVideo] = useState(true);
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

  const maxDisplayW = Math.min(containerW * 0.92, isExperience ? 1100 : 860);
  
  const calc = mode === 'crop'
    ? calcAspectCrop(SOURCE_RATIO, screenRatio, maxDisplayW, maxDisplayW / screenRatio)
    : calcAspectFit(SOURCE_RATIO, screenRatio, maxDisplayW, maxDisplayW / screenRatio);

  const { screenW, screenH, mediaW, mediaH, offsetX, offsetY, percentVisible } = calc;

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
    objectFit: 'cover',
    transition: 'all 550ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  };

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      {/* Ratio label */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '6px 20px', border: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--gold)', letterSpacing: '0.1em' }}>
            {screenRatioLabel}
          </span>
          <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
            {screenFormatName}
          </span>
        </div>
      </div>

      {/* Screen frame */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div
          className="screen-frame"
          style={{
            width: screenW,
            height: screenH,
            background: '#000',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 0 0 1px rgba(201,168,76,0.3), 0 0 60px rgba(0,0,0,0.8), 0 0 80px rgba(201,168,76,0.06)',
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
                // Generate gradient fallback
                e.target.style.display = 'none';
              }}
            />
          )}

          {/* Inner vignette */}
          <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 80px rgba(0,0,0,0.5)', pointerEvents: 'none' }} />

          {/* Ratio overlay label */}
          <div style={{
            position: 'absolute',
            top: 12,
            right: 12,
            fontFamily: 'var(--font-serif)',
            fontSize: 9,
            letterSpacing: '0.15em',
            color: 'rgba(255,255,255,0.6)',
            pointerEvents: 'none',
          }}>
            {screenRatioLabel} · {screenFormatName}
          </div>

          {/* Video controls */}
          {useVideo && !videoError && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <button onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}
                style={{ color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}>
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <span style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'monospace', minWidth: 36 }}>
                {fmt(videoTime)}
              </span>
              <div
                role="slider" aria-label="Seek"
                style={{ flex: 1, height: 24, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                onClick={handleSeek}
              >
                <div style={{ width: '100%', height: 2, background: 'rgba(201,168,76,0.2)', borderRadius: 1, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${videoDuration ? (videoTime/videoDuration)*100 : 0}%`, background: 'var(--gold)', borderRadius: 1 }} />
                </div>
              </div>
              <span style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'monospace', minWidth: 36 }}>
                {fmt(videoDuration)}
              </span>
              <button onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}
                style={{ color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}>
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mode toggle & stats */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap', gap: 12 }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 8 }}>
          {['fit', 'crop'].map(m => (
            <button
              key={m}
              onClick={() => onModeChange && onModeChange(m)}
              className={`btn btn-sm ${mode === m ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: 9, letterSpacing: '0.1em' }}
            >
              {m === 'fit' ? 'Full Frame' : 'Cinema Crop'}
            </button>
          ))}
        </div>

        {/* Visibility stat */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
              {mode === 'fit' ? 'IMAGE VISIBLE' : 'SOURCE CROPPED'}
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: percentVisible > 90 ? 'var(--gold)' : '#f87171', letterSpacing: '0.05em' }}>
              {percentVisible}%
            </div>
          </div>
        </div>
      </div>

      {/* Source ratio info */}
      <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: 9, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Demo Source</span>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Big Buck Bunny (CC) · 1.78:1 (16:9)</div>
        </div>
        <div>
          <span style={{ fontSize: 9, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Screen</span>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{screenRatioLabel} · {screenFormatName}</div>
        </div>
        {mode === 'fit' && Math.abs(offsetY) > 1 && (
          <div>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Letterbox Bars</span>
            <div style={{ fontSize: 11, color: '#f87171', marginTop: 2 }}>{Math.round(offsetY)}px each</div>
          </div>
        )}
        {mode === 'fit' && Math.abs(offsetX) > 1 && (
          <div>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Pillarbox Bars</span>
            <div style={{ fontSize: 11, color: '#f87171', marginTop: 2 }}>{Math.round(offsetX)}px each</div>
          </div>
        )}
      </div>
    </div>
  );
}
