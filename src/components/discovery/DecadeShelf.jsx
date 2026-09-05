import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import GlobalMovieCard from './GlobalMovieCard';
import { fetchMoviesByDecade } from '../../services/tmdbService';

export default function DecadeShelf({ decade, label }) {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadMovies = async () => {
      setIsLoading(true);
      try {
        const data = await fetchMoviesByDecade(decade);
        setMovies(data.slice(0, 20));
      } catch (error) {
        console.error('Failed to load movies for decade', decade, error);
      } finally {
        setIsLoading(false);
      }
    };
    loadMovies();
  }, [decade]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', color: 'var(--text-primary)' }}>{label}</h2>
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={() => navigate(`/discover?decade=${decade}`)}
          style={{ color: 'var(--gold)' }}
        >
          See All
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        <button 
          onClick={() => scroll('left')}
          style={{
            position: 'absolute', left: '-20px', top: '50%', transform: 'translateY(-50%)',
            zIndex: 10, background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white',
            borderRadius: '50%', width: '40px', height: '40px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}
        >
          <ChevronLeft />
        </button>

        <div 
          ref={scrollRef}
          style={{
            display: 'flex', gap: '16px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '16px'
          }}
          className="hide-scrollbar"
        >
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} style={{ width: '180px', height: '270px', backgroundColor: 'var(--bg-card)', flexShrink: 0, borderRadius: 'var(--radius-sm)' }}></div>
            ))
          ) : (
            movies.map(movie => (
              <div key={movie.id || movie.tmdbId} style={{ flexShrink: 0 }}>
                <GlobalMovieCard movie={movie} />
              </div>
            ))
          )}
        </div>

        <button 
          onClick={() => scroll('right')}
          style={{
            position: 'absolute', right: '-20px', top: '50%', transform: 'translateY(-50%)',
            zIndex: 10, background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white',
            borderRadius: '50%', width: '40px', height: '40px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}
