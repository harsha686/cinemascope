export const ASPECT_RATIOS = [
  {
    ratio: '1.33:1',
    numeric: 1.33,
    name: 'Academy',
    fullName: 'Academy Ratio',
    description: 'The classic square-ish format from Hollywood\'s golden era. Used in 4:3 television and early film.',
    color: '#8b6914',
    category: 'vintage',
    screenWidth: 1.33,
    screenHeight: 1,
  },
  {
    ratio: '1.43:1',
    numeric: 1.43,
    name: 'IMAX',
    fullName: 'IMAX Film / Classic IMAX',
    description: 'The tallest IMAX ratio, shot on 70mm film. Gives the most expansive, immersive image — filling far more of your visual field than any other format.',
    color: '#c9a84c',
    category: 'large-format',
    screenWidth: 1.43,
    screenHeight: 1,
  },
  {
    ratio: '1.66:1',
    numeric: 1.66,
    name: 'European Widescreen',
    fullName: 'European Widescreen',
    description: 'Used in some European productions and early widescreen television. Slightly wider than academy.',
    color: '#7a6a3a',
    category: 'standard',
    screenWidth: 1.66,
    screenHeight: 1,
  },
  {
    ratio: '1.78:1',
    numeric: 1.78,
    name: 'HDTV (16:9)',
    fullName: 'HDTV / 16:9 Widescreen',
    description: 'Standard high-definition television format. Most streaming content and home videos use this ratio.',
    color: '#5a6a7a',
    category: 'standard',
    screenWidth: 1.78,
    screenHeight: 1,
  },
  {
    ratio: '1.85:1',
    numeric: 1.85,
    name: 'Flat',
    fullName: 'Flat / Academy Flat',
    description: 'The most common widescreen cinema format. Slightly wider than 16:9. Used in countless Hollywood productions.',
    color: '#9a7a4a',
    category: 'standard',
    screenWidth: 1.85,
    screenHeight: 1,
  },
  {
    ratio: '1.90:1',
    numeric: 1.90,
    name: 'IMAX Digital',
    fullName: 'IMAX Digital / Large Format Digital',
    description: 'The digital IMAX aspect ratio. Common in modern large-format laser screens. Wider than 1.85 but less tall than the classic 1.43 film IMAX.',
    color: '#c9a84c',
    category: 'large-format',
    screenWidth: 1.90,
    screenHeight: 1,
  },
  {
    ratio: '2.00:1',
    numeric: 2.00,
    name: 'Univisium',
    fullName: 'Univisium / 2:1',
    description: 'Used by directors like Netflix OA and some Netflix originals. A balance between widescreen drama and cinematic scope.',
    color: '#7a5a3a',
    category: 'standard',
    screenWidth: 2.00,
    screenHeight: 1,
  },
  {
    ratio: '2.20:1',
    numeric: 2.20,
    name: '70mm',
    fullName: '70mm / Todd-AO',
    description: 'Used in epic 70mm productions. Films like Lawrence of Arabia, Interstellar, and The Hateful Eight use this format.',
    color: '#a08030',
    category: 'large-format',
    screenWidth: 2.20,
    screenHeight: 1,
  },
  {
    ratio: '2.35:1',
    numeric: 2.35,
    name: 'Scope (old)',
    fullName: 'CinemaScope / Anamorphic (legacy)',
    description: 'The original CinemaScope anamorphic ratio from the 1950s. Still used to describe many scope presentations.',
    color: '#8a6040',
    category: 'scope',
    screenWidth: 2.35,
    screenHeight: 1,
  },
  {
    ratio: '2.39:1',
    numeric: 2.39,
    name: 'Scope',
    fullName: 'Panavision / Anamorphic Scope',
    description: 'The most common widescreen cinema format today. Gives that sweeping cinematic look. Famously used in epic films.',
    color: '#b89030',
    category: 'scope',
    screenWidth: 2.39,
    screenHeight: 1,
  },
];

export const getFormat = (ratioString) => {
  return ASPECT_RATIOS.find(r => r.ratio === ratioString) || null;
};

export const getFormatByNumeric = (numeric) => {
  return ASPECT_RATIOS.reduce((closest, r) =>
    Math.abs(r.numeric - numeric) < Math.abs(closest.numeric - numeric) ? r : closest
  );
};

/**
 * Calculate letterbox/pillarbox/crop values
 * @param {number} sourceRatio - source media aspect ratio
 * @param {number} screenRatio - target screen aspect ratio
 * @param {number} containerW - display container width in px
 * @param {number} containerH - display container height in px
 * @returns {{ mediaW, mediaH, offsetX, offsetY, letterboxH, pillarboxW, percentVisible }}
 */
export function calcAspectFit(sourceRatio, screenRatio, containerW, containerH) {
  // The screen shape as rendered
  const screenW = containerW;
  const screenH = containerW / screenRatio;

  // Fill screen with source (letterbox/pillarbox in "fit" mode)
  let mediaW, mediaH;
  if (sourceRatio > screenRatio) {
    // Source is wider: letterbox (black bars top/bottom)
    mediaW = screenW;
    mediaH = screenW / sourceRatio;
  } else {
    // Source is taller: pillarbox (black bars left/right)
    mediaH = screenH;
    mediaW = screenH * sourceRatio;
  }

  const offsetX = (screenW - mediaW) / 2;
  const offsetY = (screenH - mediaH) / 2;

  const letterboxH = offsetY; // bar height (0 if no letterbox)
  const pillarboxW = offsetX; // bar width (0 if no pillarbox)

  // Percentage of source image visible in this screen
  const sourceArea = sourceRatio * 1;
  const screenArea = screenRatio * 1;
  const percentVisible = Math.min(1, screenArea / sourceArea) * 100;

  return {
    screenW, screenH,
    mediaW, mediaH,
    offsetX, offsetY,
    letterboxH,
    pillarboxW,
    percentVisible: Math.round(percentVisible * 10) / 10,
  };
}

/**
 * Calculate crop mode values (source fills screen, edges clipped)
 */
export function calcAspectCrop(sourceRatio, screenRatio, containerW, containerH) {
  const screenW = containerW;
  const screenH = containerW / screenRatio;

  let mediaW, mediaH;
  if (sourceRatio > screenRatio) {
    // Source wider than screen: scale to fit height, crop sides
    mediaH = screenH;
    mediaW = screenH * sourceRatio;
  } else {
    // Source taller than screen: scale to fit width, crop top/bottom
    mediaW = screenW;
    mediaH = screenW / sourceRatio;
  }

  const offsetX = (screenW - mediaW) / 2;
  const offsetY = (screenH - mediaH) / 2;

  const cropX = offsetX < 0 ? -offsetX : 0;
  const cropY = offsetY < 0 ? -offsetY : 0;

  const visibleW = Math.min(mediaW, screenW);
  const visibleH = Math.min(mediaH, screenH);
  const percentVisible = Math.round((visibleW * visibleH) / (mediaW * mediaH) * 1000) / 10;

  return {
    screenW, screenH,
    mediaW, mediaH,
    offsetX, offsetY,
    cropX, cropY,
    percentVisible,
  };
}
