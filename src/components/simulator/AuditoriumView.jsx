import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Film } from 'lucide-react';

const DEMO_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

// 5 Realistic Cinema Color Palettes
export const AUDITORIUM_THEMES = [
  {
    id: 'sapphire',
    name: 'Sapphire Blue',
    emoji: '🔵',
    seatBase: '#1d4ed8',
    seatTop: '#3b82f6',
    seatStroke: 'rgba(96, 165, 250, 0.6)',
    seatShadow: '#0f172a',
    glowColor: '#38bdf8',
    aisleLight: '#60a5fa',
    ambientHue: 'rgba(30, 58, 138, 0.25)',
  },
  {
    id: 'crimson',
    name: 'Velvet Crimson',
    emoji: '🔴',
    seatBase: '#991b1b',
    seatTop: '#dc2626',
    seatStroke: 'rgba(248, 113, 113, 0.6)',
    seatShadow: '#1c0505',
    glowColor: '#f87171',
    aisleLight: '#fbbf24',
    ambientHue: 'rgba(153, 27, 27, 0.25)',
  },
  {
    id: 'gold',
    name: 'Cinemascope Gold',
    emoji: '🟡',
    seatBase: '#855b18',
    seatTop: '#c9a84c',
    seatStroke: 'rgba(252, 224, 139, 0.6)',
    seatShadow: '#1a1408',
    glowColor: '#fce08b',
    aisleLight: '#c9a84c',
    ambientHue: 'rgba(201, 168, 76, 0.22)',
  },
  {
    id: 'obsidian',
    name: 'Obsidian VIP',
    emoji: '⚫',
    seatBase: '#27272a',
    seatTop: '#3f3f46',
    seatStroke: 'rgba(161, 161, 170, 0.5)',
    seatShadow: '#09090b',
    glowColor: '#e4e4e7',
    aisleLight: '#a1a1aa',
    ambientHue: 'rgba(39, 39, 42, 0.3)',
  },
  {
    id: 'emerald',
    name: 'Emerald Club',
    emoji: '🟢',
    seatBase: '#047857',
    seatTop: '#059669',
    seatStroke: 'rgba(52, 211, 153, 0.6)',
    seatShadow: '#022c22',
    glowColor: '#34d399',
    aisleLight: '#34d399',
    ambientHue: 'rgba(4, 120, 87, 0.25)',
  },
];

export default function AuditoriumView({
  screenRatio = 2.39,
  screenRatioLabel = '2.39:1',
  screenFormatName = 'Scope',
  screenWidthM,
  screenHeightM,
  theaterName = '',
  screenName = '',
  onTrailerToggle,
  isTrailerPlaying = false,
}) {
  const [selectedTheme, setSelectedTheme] = useState(AUDITORIUM_THEMES[0]); // Sapphire default
  const [showTrailer, setShowTrailer] = useState(isTrailerPlaying);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    setShowTrailer(isTrailerPlaying);
  }, [isTrailerPlaying]);

  // Physical or aspect ratio dimensions in feet
  const hasPhysical = Boolean(screenWidthM && Number(screenWidthM) > 0);
  const widthFt = hasPhysical
    ? (Math.round(Number(screenWidthM) * 3.28084 * 10) / 10).toFixed(1)
    : (Math.round(20 * screenRatio * 10) / 10).toFixed(1);
  const heightFt = hasPhysical
    ? (screenHeightM
        ? (Math.round(Number(screenHeightM) * 3.28084 * 10) / 10).toFixed(1)
        : (Math.round((Number(screenWidthM) / screenRatio) * 3.28084 * 10) / 10).toFixed(1))
    : '20.0';

  // Screen Geometry Calculation inside ViewBox (1000 x 660)
  const centerX = 500;
  const screenTop = 95;
  const maxW = 580;
  const maxH = 250;

  let screenW, screenH;
  if (screenRatio >= 1.8) {
    screenW = maxW;
    screenH = Math.min(maxH, Math.round(screenW / screenRatio));
  } else {
    screenH = maxH;
    screenW = Math.min(maxW, Math.round(screenH * screenRatio));
  }

  const screenLeft = centerX - screenW / 2;
  const screenRight = centerX + screenW / 2;
  const screenBottom = screenTop + screenH;

  // Stadium Seating Generation (4 perfectly aligned perspective rows)
  const rowsConfig = [
    { rowIdx: 0, seatsPerBank: 5, scale: 0.78, y: screenBottom + 46, aisleW: 46 },
    { rowIdx: 1, seatsPerBank: 5, scale: 0.86, y: screenBottom + 94, aisleW: 50 },
    { rowIdx: 2, seatsPerBank: 5, scale: 0.96, y: screenBottom + 146, aisleW: 56 },
    { rowIdx: 3, seatsPerBank: 6, scale: 1.06, y: screenBottom + 204, aisleW: 62 },
  ];

  const togglePlay = () => {
    if (!videoRef.current) return;
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

  const handleTrailerClick = () => {
    const nextState = !showTrailer;
    setShowTrailer(nextState);
    if (onTrailerToggle) onTrailerToggle(nextState);
    if (nextState) {
      setIsPlaying(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.play().catch(() => {});
      }, 50);
    } else {
      setIsPlaying(false);
      if (videoRef.current) videoRef.current.pause();
    }
  };

  return (
    <div style={{ width: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* 3D Auditorium Canvas SVG Stage */}
      <div
        style={{
          width: '100%',
          aspectRatio: '1000 / 660',
          maxHeight: 660,
          background: '#07070a',
          borderRadius: 16,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.85), inset 0 0 100px rgba(0,0,0,0.9)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <svg
          viewBox="0 0 1000 660"
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <defs>
            {/* Projector Beam Gradient */}
            <linearGradient id="beamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
              <stop offset="25%" stopColor={selectedTheme.glowColor} stopOpacity="0.22" />
              <stop offset="70%" stopColor={selectedTheme.glowColor} stopOpacity="0.08" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>

            {/* Ambient Screen Light Spill onto Floor */}
            <radialGradient id="screenAmbientGlow" cx="50%" cy="0%" r="90%">
              <stop offset="0%" stopColor={selectedTheme.ambientHue} />
              <stop offset="60%" stopColor={selectedTheme.ambientHue} stopOpacity="0.1" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>

            {/* Ceiling Spotlights Cone */}
            <linearGradient id="spotlightCone" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={selectedTheme.glowColor} stopOpacity="0.7" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>

            {/* Screen Surface Gradient */}
            <linearGradient id="screenSurface" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e8ebf0" />
              <stop offset="50%" stopColor="#d1d7e0" />
              <stop offset="100%" stopColor="#b8c0cc" />
            </linearGradient>

            {/* Seat Gradients based on Active Color Theme */}
            <linearGradient id="seatHeadrestGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={selectedTheme.seatTop} />
              <stop offset="100%" stopColor={selectedTheme.seatBase} />
            </linearGradient>

            <linearGradient id="seatBackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={selectedTheme.seatTop} />
              <stop offset="60%" stopColor={selectedTheme.seatBase} />
              <stop offset="100%" stopColor={selectedTheme.seatShadow} />
            </linearGradient>

            <linearGradient id="seatCushionGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={selectedTheme.seatTop} />
              <stop offset="70%" stopColor={selectedTheme.seatBase} />
              <stop offset="100%" stopColor={selectedTheme.seatShadow} />
            </linearGradient>

            <linearGradient id="armrestGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2e3340" />
              <stop offset="100%" stopColor="#141720" />
            </linearGradient>

            {/* Soft Glow Filter */}
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* ================= 1. AUDITORIUM WALLS & PERSPECTIVE ================= */}
          {/* Ceiling plane */}
          <polygon points="0,0 1000,0 870,80 130,80" fill="#0c0d12" />
          <line x1="130" y1="80" x2="870" y2="80" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

          {/* Left perspective wall */}
          <polygon points="0,0 130,80 130,460 0,660" fill="#090a0f" />
          <line x1="130" y1="80" x2="130" y2="460" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <line x1="0" y1="0" x2="130" y2="80" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <line x1="0" y1="660" x2="130" y2="460" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

          {/* Left wall acoustic panel slats */}
          <line x1="45" y1="180" x2="105" y2="195" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
          <line x1="35" y1="270" x2="110" y2="285" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
          <line x1="25" y1="360" x2="115" y2="375" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />

          {/* Right perspective wall */}
          <polygon points="1000,0 870,80 870,460 1000,660" fill="#090a0f" />
          <line x1="870" y1="80" x2="870" y2="460" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <line x1="1000" y1="0" x2="870" y2="80" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <line x1="1000" y1="660" x2="870" y2="460" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

          {/* Right wall acoustic panel slats */}
          <line x1="955" y1="180" x2="895" y2="195" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
          <line x1="965" y1="270" x2="890" y2="285" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
          <line x1="975" y1="360" x2="885" y2="375" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />

          {/* Stage floor plane */}
          <polygon points="130,460 870,460 1000,660 0,660" fill="#060608" />

          {/* Ambient screen reflection glow on the floor */}
          <rect
            x={screenLeft - 40}
            y={screenBottom}
            width={screenW + 80}
            height={260}
            fill="url(#screenAmbientGlow)"
            pointerEvents="none"
          />

          {/* ================= 2. PROJECTOR & CEILING LIGHTS ================= */}
          {/* Projector Booth Aperture at ceiling center */}
          <rect x="475" y="10" width="50" height="14" rx="4" fill="#040406" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <circle cx="500" cy="17" r="5" fill="#ffffff" filter="url(#softGlow)" />
          <circle cx="500" cy="17" r="3" fill={selectedTheme.glowColor} />

          {/* Volumetric Projector Beam hitting the cinema screen */}
          <polygon
            points={`490,17 510,17 ${screenRight + 12},${screenBottom + 8} ${screenLeft - 12},${screenBottom + 8}`}
            fill="url(#beamGrad)"
            style={{ mixBlendMode: 'screen', opacity: showTrailer ? 0.35 : 0.2 }}
            pointerEvents="none"
          />

          {/* Symmetrical Ceiling Spotlights in Perspective */}
          {[
            { cx: 200, cy: 38 },
            { cx: 290, cy: 46 },
            { cx: 375, cy: 54 },
            { cx: 440, cy: 60 },
            { cx: 560, cy: 60 },
            { cx: 625, cy: 54 },
            { cx: 710, cy: 46 },
            { cx: 800, cy: 38 },
          ].map((spot, i) => (
            <g key={`spot-${i}`}>
              <circle cx={spot.cx} cy={spot.cy} r="3.5" fill={selectedTheme.glowColor} opacity="0.9" />
              <circle cx={spot.cx} cy={spot.cy} r="7" fill={selectedTheme.glowColor} opacity="0.3" filter="url(#softGlow)" />
              {/* Soft downlight flare */}
              <polygon
                points={`${spot.cx - 3},${spot.cy + 3} ${spot.cx + 3},${spot.cy + 3} ${spot.cx + 18},${spot.cy + 55} ${spot.cx - 18},${spot.cy + 55}`}
                fill="url(#spotlightCone)"
                opacity="0.12"
                style={{ mixBlendMode: 'screen' }}
              />
            </g>
          ))}

          {/* ================= 3. SURROUND SPEAKERS ON WALLS ================= */}
          {/* Left Wall Surround Speakers (angled in 3D perspective) */}
          {[160, 250, 340].map((yPos, idx) => {
            const xPos = 65 + idx * 22;
            return (
              <g key={`spk-left-${idx}`}>
                {/* Speaker Box */}
                <rect x={xPos} y={yPos} width="16" height="26" rx="2" fill="#11141c" stroke={selectedTheme.glowColor} strokeWidth="1" opacity="0.85" />
                {/* Speaker Cone */}
                <circle cx={xPos + 8} cy={yPos + 10} r="4.5" fill="#1a1e2b" stroke={selectedTheme.glowColor} strokeWidth="0.8" />
                <circle cx={xPos + 8} cy={yPos + 19} r="3" fill="#1a1e2b" stroke={selectedTheme.glowColor} strokeWidth="0.6" />
                {/* Sound wave glow arc */}
                <path d={`M ${xPos + 19} ${yPos + 6} Q ${xPos + 24} ${yPos + 13} ${xPos + 19} ${yPos + 20}`} fill="none" stroke={selectedTheme.glowColor} strokeWidth="1.2" opacity="0.65" />
              </g>
            );
          })}

          {/* Right Wall Surround Speakers */}
          {[160, 250, 340].map((yPos, idx) => {
            const xPos = 919 - idx * 22;
            return (
              <g key={`spk-right-${idx}`}>
                {/* Speaker Box */}
                <rect x={xPos} y={yPos} width="16" height="26" rx="2" fill="#11141c" stroke={selectedTheme.glowColor} strokeWidth="1" opacity="0.85" />
                {/* Speaker Cone */}
                <circle cx={xPos + 8} cy={yPos + 10} r="4.5" fill="#1a1e2b" stroke={selectedTheme.glowColor} strokeWidth="0.8" />
                <circle cx={xPos + 8} cy={yPos + 19} r="3" fill="#1a1e2b" stroke={selectedTheme.glowColor} strokeWidth="0.6" />
                {/* Sound wave glow arc */}
                <path d={`M ${xPos - 3} ${yPos + 6} Q ${xPos - 8} ${yPos + 13} ${xPos - 3} ${yPos + 20}`} fill="none" stroke={selectedTheme.glowColor} strokeWidth="1.2" opacity="0.65" />
              </g>
            );
          })}

          {/* ================= 4. CINEMA SCREEN FRAME & DIMENSIONS ================= */}
          {/* Outer Screen Bezel / Frame with deep shadow */}
          <rect
            x={screenLeft - 6}
            y={screenTop - 6}
            width={screenW + 12}
            height={screenH + 12}
            rx="6"
            fill="#050508"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.5"
            filter="drop-shadow(0 15px 35px rgba(0,0,0,0.9))"
          />

          {/* Inner Screen Surface (White/Silver Cinema Matte) */}
          <rect
            x={screenLeft}
            y={screenTop}
            width={screenW}
            height={screenH}
            rx="3"
            fill="url(#screenSurface)"
            stroke="#1a1b22"
            strokeWidth="1"
          />

          {/* Screen Content: Aspect Ratio Text (if not playing trailer) */}
          {!showTrailer && (
            <g pointerEvents="none">
              {/* Aspect Ratio Big Bold Display */}
              <text
                x={centerX}
                y={screenTop + screenH / 2 - 8}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#11151c"
                fontFamily="var(--font-sans, -apple-system, sans-serif)"
                fontSize={Math.min(42, Math.round(screenW * 0.082))}
                fontWeight="900"
                letterSpacing="0.04em"
              >
                {screenRatioLabel}
              </text>

              {/* Aspect Ratio Subtitle */}
              <text
                x={centerX}
                y={screenTop + screenH / 2 + 24}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#475569"
                fontFamily="var(--font-sans, -apple-system, sans-serif)"
                fontSize={Math.min(14, Math.round(screenW * 0.026))}
                fontWeight="800"
                letterSpacing="0.22em"
              >
                ASPECT RATIO
              </text>

              {/* Format Badge (e.g. FLAT / SCOPE) */}
              <text
                x={centerX}
                y={screenTop + screenH / 2 + 44}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#64748b"
                fontFamily="var(--font-sans, -apple-system, sans-serif)"
                fontSize={10}
                fontWeight="700"
                letterSpacing="0.15em"
              >
                {screenFormatName?.toUpperCase()}
              </text>
            </g>
          )}

          {/* ----------------- DIMENSION LINES ----------------- */}
          {/* Top Width Dimension Arrow: < - - - 59.2 ft - - - > */}
          <g>
            <line
              x1={screenLeft}
              y1={screenTop - 18}
              x2={screenRight}
              y2={screenTop - 18}
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.2"
              strokeDasharray="4 4"
            />
            {/* Left End Arrowhead */}
            <path
              d={`M ${screenLeft + 8} ${screenTop - 22} L ${screenLeft} ${screenTop - 18} L ${screenLeft + 8} ${screenTop - 14}`}
              fill="none"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="1.5"
            />
            {/* Right End Arrowhead */}
            <path
              d={`M ${screenRight - 8} ${screenTop - 22} L ${screenRight} ${screenTop - 18} L ${screenRight - 8} ${screenTop - 14}`}
              fill="none"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="1.5"
            />
            {/* Width Badge */}
            <rect
              x={centerX - 42}
              y={screenTop - 27}
              width="84"
              height="18"
              rx="4"
              fill="#0d0e14"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="1"
            />
            <text
              x={centerX}
              y={screenTop - 15}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              fontSize="10.5"
              fontFamily="monospace"
              fontWeight="700"
              letterSpacing="0.05em"
            >
              {widthFt} ft
            </text>
          </g>

          {/* Left Height Dimension Arrow: ^ - - - 31.3 ft - - - v */}
          <g>
            <line
              x1={screenLeft - 18}
              y1={screenTop}
              x2={screenLeft - 18}
              y2={screenBottom}
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.2"
              strokeDasharray="4 4"
            />
            {/* Top End Arrowhead */}
            <path
              d={`M ${screenLeft - 22} ${screenTop + 8} L ${screenLeft - 18} ${screenTop} L ${screenLeft - 14} ${screenTop + 8}`}
              fill="none"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="1.5"
            />
            {/* Bottom End Arrowhead */}
            <path
              d={`M ${screenLeft - 22} ${screenBottom - 8} L ${screenLeft - 18} ${screenBottom} L ${screenLeft - 14} ${screenBottom - 8}`}
              fill="none"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="1.5"
            />
            {/* Height Badge (rotated vertically) */}
            <g transform={`translate(${screenLeft - 18}, ${screenTop + screenH / 2}) rotate(-90)`}>
              <rect
                x="-38"
                y="-9"
                width="76"
                height="18"
                rx="4"
                fill="#0d0e14"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="1"
              />
              <text
                x="0"
                y="3"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize="10.5"
                fontFamily="monospace"
                fontWeight="700"
                letterSpacing="0.05em"
              >
                {heightFt} ft
              </text>
            </g>
          </g>

          {/* ================= 5. REALISTIC AUDITORIUM SEATING ================= */}
          {/* Center Aisle Floor Pathway Lights */}
          {rowsConfig.map((row, rIdx) => (
            <g key={`step-light-${rIdx}`}>
              <rect
                x={centerX - 10}
                y={row.y + 14}
                width="20"
                height="3"
                rx="1.5"
                fill={selectedTheme.aisleLight}
                opacity="0.85"
                filter="url(#softGlow)"
              />
            </g>
          ))}

          {/* Render Stadium Rows in Back-to-Front Order */}
          {rowsConfig.map((row) => {
            const { seatsPerBank, scale, y, aisleW } = row;
            const seatW = 28 * scale;
            const seatGap = 5 * scale;

            // Generate Seats for Left Bank and Right Bank
            const seats = [];

            // Left Bank (seats from aisle toward left wall)
            for (let i = 0; i < seatsPerBank; i++) {
              const seatX = centerX - aisleW / 2 - (seatsPerBank - i) * (seatW + seatGap);
              // Symmetrical subtle stadium curvature
              const distFromCenter = Math.abs(seatX + seatW / 2 - centerX);
              const curveY = -Math.pow(distFromCenter / 450, 2) * 8 * scale;
              seats.push({
                x: seatX,
                y: y + curveY,
                id: `seat-L-${row.rowIdx}-${i}`,
              });
            }

            // Right Bank (seats from aisle toward right wall)
            for (let i = 0; i < seatsPerBank; i++) {
              const seatX = centerX + aisleW / 2 + i * (seatW + seatGap);
              const distFromCenter = Math.abs(seatX + seatW / 2 - centerX);
              const curveY = -Math.pow(distFromCenter / 450, 2) * 8 * scale;
              seats.push({
                x: seatX,
                y: y + curveY,
                id: `seat-R-${row.rowIdx}-${i}`,
              });
            }

            return (
              <g key={`row-${row.rowIdx}`}>
                {seats.map((seat) => (
                  <g key={seat.id} transform={`translate(${seat.x}, ${seat.y}) scale(${scale})`}>
                    {/* Floor Drop Shadow */}
                    <ellipse
                      cx="14"
                      cy="33"
                      rx="14"
                      ry="3.5"
                      fill="rgba(0,0,0,0.5)"
                    />

                    {/* Realistic Headrest with contoured corners */}
                    <rect
                      x="6.5"
                      y="1"
                      width="15"
                      height="8"
                      rx="3.5"
                      fill="url(#seatHeadrestGrad)"
                      stroke={selectedTheme.seatStroke}
                      strokeWidth="0.8"
                    />
                    {/* Headrest top leather highlight */}
                    <line
                      x1="8.5"
                      y1="2.5"
                      x2="19.5"
                      y2="2.5"
                      stroke="rgba(255,255,255,0.4)"
                      strokeWidth="0.7"
                      strokeLinecap="round"
                    />

                    {/* Realistic Ergonomic Backrest Cushion */}
                    <path
                      d="M 4 8 Q 14 7 24 8 L 22 22 Q 14 23 6 22 Z"
                      fill="url(#seatBackGrad)"
                      stroke={selectedTheme.seatStroke}
                      strokeWidth="0.8"
                    />
                    {/* Center lumbar stitch seams */}
                    <line x1="14" y1="9" x2="14" y2="21" stroke="rgba(0,0,0,0.35)" strokeWidth="0.8" />
                    <line x1="14.5" y1="9" x2="14.5" y2="21" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" />

                    {/* Deep Comfortable Seat Pan Cushion */}
                    <path
                      d="M 3 21 Q 14 20 25 21 L 26 29 Q 14 31 2 29 Z"
                      fill="url(#seatCushionGrad)"
                      stroke={selectedTheme.seatStroke}
                      strokeWidth="0.8"
                    />

                    {/* Left Armrest with cup holder */}
                    <rect
                      x="0.5"
                      y="13"
                      width="4"
                      height="15"
                      rx="2"
                      fill="url(#armrestGrad)"
                      stroke="rgba(0,0,0,0.6)"
                      strokeWidth="0.6"
                    />
                    <circle cx="2.5" cy="16" r="1.1" fill="#07080a" />

                    {/* Right Armrest with cup holder */}
                    <rect
                      x="23.5"
                      y="13"
                      width="4"
                      height="15"
                      rx="2"
                      fill="url(#armrestGrad)"
                      stroke="rgba(0,0,0,0.6)"
                      strokeWidth="0.6"
                    />
                    <circle cx="25.5" cy="16" r="1.1" fill="#07080a" />
                  </g>
                ))}
              </g>
            );
          })}
        </svg>

        {/* Embedded Video Player (Live Trailer playing right on the screen) */}
        {showTrailer && (
          <div
            style={{
              position: 'absolute',
              left: `${(screenLeft / 1000) * 100}%`,
              top: `${(screenTop / 660) * 100}%`,
              width: `${(screenW / 1000) * 100}%`,
              height: `${(screenH / 660) * 100}%`,
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 0 30px rgba(0,0,0,0.9)',
              background: '#000',
              zIndex: 10,
            }}
          >
            <video
              ref={videoRef}
              src={DEMO_VIDEO_URL}
              loop
              muted={isMuted}
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* In-screen Video Controls overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <button
                onClick={togglePlay}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>

              <button
                onClick={toggleMute}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= CONTROL BAR: TRAILER + COLOR THEME SWITCHER ================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginTop: 16,
          padding: '12px 18px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
        }}
      >
        {/* Play Trailer Pill Button (matching user's screenshot ▶ TRAILERS) */}
        <button
          onClick={handleTrailerClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 20px',
            borderRadius: 24,
            background: showTrailer ? selectedTheme.seatBase : 'rgba(255,255,255,0.08)',
            border: `1px solid ${showTrailer ? selectedTheme.glowColor : 'rgba(255,255,255,0.2)'}`,
            color: '#ffffff',
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 200ms ease',
            boxShadow: showTrailer ? `0 4px 16px ${selectedTheme.ambientHue}` : 'none',
          }}
        >
          {showTrailer ? <Film size={14} /> : <Play size={14} fill="#ffffff" />}
          <span>{showTrailer ? 'SHOW SPECS' : 'TRAILERS'}</span>
        </button>

        {/* Realistic Seat Color Theme Switcher ("diff colours" requirement) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
            Seat Color:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {AUDITORIUM_THEMES.map((t) => {
              const isSelected = selectedTheme.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTheme(t)}
                  title={t.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 10px',
                    borderRadius: 16,
                    background: isSelected ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isSelected ? t.glowColor : 'rgba(255,255,255,0.1)'}`,
                    color: isSelected ? '#fff' : 'var(--text-secondary)',
                    fontSize: 11,
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: t.seatTop,
                      boxShadow: isSelected ? `0 0 8px ${t.glowColor}` : 'none',
                      display: 'inline-block',
                    }}
                  />
                  <span>{t.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
