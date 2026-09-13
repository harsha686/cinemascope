import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Sparkles, Film } from 'lucide-react';

export default function AuditoriumView({
  screenWidthFt = '59.2 ft',
  screenHeightFt = '31.3 ft',
  aspectRatio = '1.89:1',
  formatName = 'FLAT',
  trailerUrl,
  onOpenTrailers,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  const togglePlay = () => {
    if (!videoRef.current) {
      if (onOpenTrailers) onOpenTrailers();
      return;
    }
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Dimensions formatted cleanly
  const widthDisplay = screenWidthFt.endsWith('ft') ? screenWidthFt : `${screenWidthFt} ft`;
  const heightDisplay = screenHeightFt.endsWith('ft') ? screenHeightFt : `${screenHeightFt} ft`;

  return (
    <div style={{
      width: '100%',
      position: 'relative',
      background: 'radial-gradient(ellipse 85% 65% at 50% 30%, #0c1424 0%, #060a11 60%, #030508 100%)',
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid rgba(56, 189, 248, 0.15)',
      boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)',
      userSelect: 'none',
    }}>
      {/* 3D AUDITORIUM STAGE (SVG + HTML) */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 780,
        margin: '0 auto',
        aspectRatio: '16 / 10',
        minHeight: 320,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <svg
          viewBox="0 0 800 500"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            overflow: 'visible',
          }}
        >
          <defs>
            {/* Projector Light Beam Gradient */}
            <linearGradient id="projectorBeam" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
              <stop offset="30%" stopColor="#0ea5e9" stopOpacity="0.22" />
              <stop offset="75%" stopColor="#0284c7" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </linearGradient>

            {/* Subtle Screen Gradient (Matte Cinema Fabric) */}
            <linearGradient id="screenFabric" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#b0bccd" />
            </linearGradient>

            {/* Ceiling Spotlights Glow */}
            <filter id="blueGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Soft Ambient Shadow for Screen */}
            <filter id="screenDropShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="16" stdDeviation="18" floodColor="#000000" floodOpacity="0.9" />
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#38bdf8" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* ================= 1. ARCHITECTURAL PERSPECTIVE ROOM ================= */}
          {/* Ceiling Trapezoid */}
          <polygon points="0,0 800,0 680,85 120,85" fill="#070c14" />
          <line x1="0" y1="0" x2="120" y2="85" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="1" />
          <line x1="800" y1="0" x2="680" y2="85" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="1" />

          {/* Left Wall Trapezoid */}
          <polygon points="0,0 120,85 120,380 0,500" fill="#080e18" />
          {/* Left Wall Perspective Grid Lines */}
          <line x1="0" y1="160" x2="120" y2="185" stroke="rgba(56, 189, 248, 0.12)" strokeWidth="1" />
          <line x1="0" y1="320" x2="120" y2="285" stroke="rgba(56, 189, 248, 0.12)" strokeWidth="1" />

          {/* Right Wall Trapezoid */}
          <polygon points="800,0 680,85 680,380 800,500" fill="#080e18" />
          {/* Right Wall Perspective Grid Lines */}
          <line x1="800" y1="160" x2="680" y2="185" stroke="rgba(56, 189, 248, 0.12)" strokeWidth="1" />
          <line x1="800" y1="320" x2="680" y2="285" stroke="rgba(56, 189, 248, 0.12)" strokeWidth="1" />

          {/* ================= 2. CEILING SPOTLIGHTS & PROJECTOR ================= */}
          {/* Projector Unit at Top Center */}
          <rect x="388" y="55" width="24" height="12" rx="2" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
          <circle cx="400" cy="67" r="4" fill="#38bdf8" filter="url(#blueGlow)" />

          {/* Conical Light Rays radiating from Projector down to Screen */}
          <polygon points="400,67 150,225 650,225" fill="url(#projectorBeam)" style={{ mixBlendMode: 'screen' }} />
          <polygon points="400,67 122,235 678,235" fill="url(#projectorBeam)" opacity="0.4" style={{ mixBlendMode: 'screen' }} />

          {/* Angled Ceiling Downlight Spots (Left row) */}
          <circle cx="180" cy="65" r="3.5" fill="#38bdf8" opacity="0.9" filter="url(#blueGlow)" />
          <circle cx="250" cy="65" r="3.5" fill="#38bdf8" opacity="0.9" filter="url(#blueGlow)" />
          <circle cx="320" cy="65" r="3.5" fill="#38bdf8" opacity="0.9" filter="url(#blueGlow)" />

          {/* Angled Ceiling Downlight Spots (Right row) */}
          <circle cx="480" cy="65" r="3.5" fill="#38bdf8" opacity="0.9" filter="url(#blueGlow)" />
          <circle cx="550" cy="65" r="3.5" fill="#38bdf8" opacity="0.9" filter="url(#blueGlow)" />
          <circle cx="620" cy="65" r="3.5" fill="#38bdf8" opacity="0.9" filter="url(#blueGlow)" />

          {/* ================= 3. SURROUND SPEAKERS ON WALLS ================= */}
          {/* Left Wall Speakers */}
          {[
            { x: 18, y: 130 },
            { x: 70, y: 130 },
          ].map((spk, idx) => (
            <g key={`l-spk-${idx}`}>
              <rect x={spk.x} y={spk.y} width="16" height="22" rx="3" fill="#040810" stroke="#0ea5e9" strokeWidth="1.2" filter="url(#blueGlow)" />
              <circle cx={spk.x + 8} cy={spk.y + 11} r="3" fill="#38bdf8" opacity="0.8" />
            </g>
          ))}

          {/* Right Wall Speakers */}
          {[
            { x: 714, y: 130 },
            { x: 766, y: 130 },
          ].map((spk, idx) => (
            <g key={`r-spk-${idx}`}>
              <rect x={spk.x} y={spk.y} width="16" height="22" rx="3" fill="#040810" stroke="#0ea5e9" strokeWidth="1.2" filter="url(#blueGlow)" />
              <circle cx={spk.x + 8} cy={spk.y + 11} r="3" fill="#38bdf8" opacity="0.8" />
            </g>
          ))}

          {/* ================= 4. CINEMA PROJECTION SCREEN ================= */}
          {/* Screen Outer Frame */}
          <g filter="url(#screenDropShadow)">
            {/* Dark Bezel / Masking Border */}
            <rect
              x="116"
              y="86"
              width="568"
              height="146"
              rx="4"
              fill="#0a0e17"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1.5"
            />
            {/* Screen Projection Surface */}
            <rect
              x="122"
              y="91"
              width="556"
              height="136"
              rx="2"
              fill="url(#screenFabric)"
            />
          </g>

          {/* Screen Dimension Lines & Typography */}
          {/* Width Dimension (Top dashed line with arrows) */}
          <g>
            <line x1="135" y1="80" x2="350" y2="80" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="4 3" />
            <line x1="450" y1="80" x2="665" y2="80" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="4 3" />
            {/* Left arrow < */}
            <path d="M 142 75 L 132 80 L 142 85" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Right arrow > */}
            <path d="M 658 75 L 668 80 L 658 85" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Width Text */}
            <text x="400" y="83" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontFamily="system-ui, sans-serif" fontWeight="700" letterSpacing="0.05em">
              {widthDisplay}
            </text>
          </g>

          {/* Height Dimension (Left dashed line with arrows) */}
          <g>
            <line x1="108" y1="98" x2="108" y2="135" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="4 3" />
            <line x1="108" y1="185" x2="108" y2="220" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="4 3" />
            {/* Top arrow ^ */}
            <path d="M 103 105 L 108 95 L 113 105" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Bottom arrow v */}
            <path d="M 103 213 L 108 223 L 113 213" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Height Text (Rotated) */}
            <text
              x="-160"
              y="104"
              transform="rotate(-90)"
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize="10"
              fontFamily="system-ui, sans-serif"
              fontWeight="700"
              letterSpacing="0.05em"
            >
              {heightDisplay}
            </text>
          </g>

          {/* Screen Content: Aspect Ratio & Label */}
          {!isPlaying && (
            <g>
              <text
                x="400"
                y="152"
                textAnchor="middle"
                fill="#1e293b"
                fontSize="30"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight="900"
                letterSpacing="-0.02em"
              >
                {aspectRatio}
              </text>
              <text
                x="400"
                y="172"
                textAnchor="middle"
                fill="#64748b"
                fontSize="10"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight="800"
                letterSpacing="0.22em"
              >
                ASPECT RATIO
              </text>
            </g>
          )}

          {/* ================= 5. TIERED AUDITORIUM SEATING (BLUE CHAIRS) ================= */}
          {/* We generate curved, tiered amphitheater seating rows matching Image 2 */}
          {Array.from({ length: 6 }).map((_, rowIdx) => {
            const yPos = 186 + rowIdx * 18;
            const seatScale = 0.8 + rowIdx * 0.05;

            return (
              <g key={`row-${rowIdx}`} opacity={0.75 + rowIdx * 0.05}>
                {/* Left Seating Block */}
                {Array.from({ length: 6 }).map((_, sIdx) => {
                  const x = 110 + sIdx * 22 + (5 - rowIdx) * 6;
                  return (
                    <g key={`l-seat-${rowIdx}-${sIdx}`} transform={`translate(${x}, ${yPos}) scale(${seatScale})`}>
                      {/* Chair Backrest */}
                      <rect x="0" y="0" width="16" height="11" rx="4" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
                      {/* Chair Seat Cushion */}
                      <rect x="1" y="9" width="14" height="6" rx="2" fill="#0369a1" />
                      {/* Chair Armrests */}
                      <line x1="-1" y1="5" x2="-1" y2="13" stroke="#0c4a6e" strokeWidth="1" />
                      <line x1="17" y1="5" x2="17" y2="13" stroke="#0c4a6e" strokeWidth="1" />
                    </g>
                  );
                })}

                {/* Central Aisle: Blank space between Left and Right block */}

                {/* Right Seating Block */}
                {Array.from({ length: 6 }).map((_, sIdx) => {
                  const x = 425 + sIdx * 22 + (rowIdx) * 4;
                  return (
                    <g key={`r-seat-${rowIdx}-${sIdx}`} transform={`translate(${x}, ${yPos}) scale(${seatScale})`}>
                      {/* Chair Backrest */}
                      <rect x="0" y="0" width="16" height="11" rx="4" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
                      {/* Chair Seat Cushion */}
                      <rect x="1" y="9" width="14" height="6" rx="2" fill="#0369a1" />
                      {/* Chair Armrests */}
                      <line x1="-1" y1="5" x2="-1" y2="13" stroke="#0c4a6e" strokeWidth="1" />
                      <line x1="17" y1="5" x2="17" y2="13" stroke="#0c4a6e" strokeWidth="1" />
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Video Surface Overlay on top of Screen if playing trailer */}
        {isPlaying && (
          <div style={{
            position: 'absolute',
            top: '18.2%',
            left: '15.3%',
            width: '69.4%',
            height: '27.2%',
            overflow: 'hidden',
            borderRadius: 2,
            background: '#000',
            zIndex: 10,
          }}>
            <video
              ref={videoRef}
              src={trailerUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
              loop
              autoPlay
              playsInline
              muted={isMuted}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {/* Simple Floating Video Controls */}
            <div style={{
              position: 'absolute',
              bottom: 4,
              right: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(0,0,0,0.65)',
              padding: '2px 8px',
              borderRadius: 12,
            }}>
              <button
                onClick={togglePlay}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', padding: 2 }}
                title="Pause"
              >
                <Pause size={12} />
              </button>
              <button
                onClick={toggleMute}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', padding: 2 }}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= 6. TRAILERS ACTION PILL BUTTON ================= */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '0 16px 20px',
        position: 'relative',
        zIndex: 5,
      }}>
        <button
          onClick={onOpenTrailers || togglePlay}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 24px',
            borderRadius: 24,
            background: 'rgba(8, 14, 26, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
            color: '#ffffff',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 200ms ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#38bdf8';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(56, 189, 248, 0.3)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)';
          }}
        >
          <Play size={13} fill="#38bdf8" color="#38bdf8" />
          <span>TRAILERS</span>
        </button>
      </div>
    </div>
  );
}
