export const MOVIE_REVIEW_PARAMS = [
  { key: 'direction',  label: 'Direction',   emoji: '🎬' },
  { key: 'story',      label: 'Story',        emoji: '📖' },
  { key: 'acting',     label: 'Acting',       emoji: '🎭' },
  { key: 'screenplay', label: 'Screenplay',   emoji: '📝' },
  { key: 'music',      label: 'Music',        emoji: '🎵' },
  { key: 'dop',        label: 'DOP',          emoji: '📷' },
  { key: 'vfx',        label: 'VFX',          emoji: '✨' },
];

export const THEATER_REVIEW_PARAMS = [
  { key: 'screen',    label: 'Screen & Projection', emoji: '🖥️' },
  { key: 'sound',     label: 'Sound & Acoustics',   emoji: '🔊' },
  { key: 'seating',   label: 'Seating Comfort',     emoji: '💺' },
  { key: 'ambience',  label: 'Ambience & AC',       emoji: '❄️' },
  { key: 'value',     label: 'Value & Experience',  emoji: '⭐' },
];

export function getParamsForReview(review) {
  if (!review) return MOVIE_REVIEW_PARAMS;
  if (
    review.theaterId ||
    review.targetType === 'THEATER' ||
    (review.parameterRatings && (
      review.parameterRatings.screen !== undefined ||
      review.parameterRatings.sound !== undefined ||
      review.parameterRatings.seating !== undefined
    ))
  ) {
    return THEATER_REVIEW_PARAMS;
  }
  return MOVIE_REVIEW_PARAMS;
}
