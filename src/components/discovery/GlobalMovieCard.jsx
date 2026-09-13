import React from 'react';
import MovieCard from '../movies/MovieCard';

/**
 * GlobalMovieCard - Backward-compatible wrapper delegating directly
 * to the unified master MovieCard component.
 */
export default function GlobalMovieCard({ movie, onStatusChange, compact, className, style }) {
  return (
    <MovieCard
      movie={movie}
      onStatusChange={onStatusChange}
      compact={compact}
      className={className}
      style={style}
    />
  );
}
