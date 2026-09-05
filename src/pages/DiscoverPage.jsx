import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, X, Film, Star, Clock, Heart, Plus } from 'lucide-react';
import { 
  searchTmdbMovies, 
  fetchTrendingMovies, 
  fetchTopRatedMovies, 
  fetchPopularMovies, 
  fetchMoviesByDecade, 
  fetchGenres, 
  discoverMovies 
} from '../services/tmdbService';
import GlobalMovieCard from '../components/discovery/GlobalMovieCard';
import SearchAutocomplete from '../components/discovery/SearchAutocomplete';
import DecadeShelf from '../components/discovery/DecadeShelf';

export default function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [trending, setTrending] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [indian, setIndian] = useState([]);

  const activeGenre = searchParams.get('genre') || '';
  const activeLang = searchParams.get('language') || '';
  const activeDecade = searchParams.get('decade') || '';
  const activeSort = searchParams.get('sort') || 'popularity.desc';
  const query = searchParams.get('q') || '';

  const hasFilters = activeGenre || activeLang || activeDecade || query;

  useEffect(() => {
    fetchGenres().then(setGenres).catch(console.error);
    
    if (!hasFilters) {
      fetchTrendingMovies().then(res => setTrending(res.results.slice(0, 10))).catch(console.error);
      fetchTopRatedMovies().then(res => setTopRated(res.results.slice(0, 10))).catch(console.error);
      discoverMovies({ with_original_language: 'hi|te|ta' }).then(res => setIndian(res.results.slice(0, 10))).catch(console.error);
    }
  }, [hasFilters]);

  const loadResults = useCallback(async (isLoadMore = false) => {
    if (!hasFilters && activeSort === 'popularity.desc') {
      if (!isLoadMore) setResults([]);
      return;
    }

    try {
      setLoading(true);
      const currentPage = isLoadMore ? page + 1 : 1;
      
      let res;
      if (query) {
        res = await searchTmdbMovies(query, currentPage);
      } else {
        const filters = {
          sort_by: activeSort,
          page: currentPage
        };
        
        if (activeGenre) filters.with_genres = activeGenre;
        if (activeLang) filters.with_original_language = activeLang;
        
        if (activeDecade) {
          const startYear = parseInt(activeDecade);
          filters['primary_release_date.gte'] = `${startYear}-01-01`;
          filters['primary_release_date.lte'] = `${startYear + 9}-12-31`;
        }

        res = await discoverMovies(filters);
      }

      setResults(prev => isLoadMore ? [...prev, ...res.results] : res.results);
      setHasMore(currentPage < res.total_pages);
      if (isLoadMore) setPage(currentPage);
      else setPage(1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [activeGenre, activeLang, activeDecade, activeSort, query, hasFilters, page]);

  useEffect(() => {
    loadResults(false);
  }, [activeGenre, activeLang, activeDecade, activeSort, query]);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    
    if (key !== 'q') newParams.delete('q');
    
    setSearchParams(newParams);
  };

  const handleSearchSelect = (movie) => {
    const rawId = movie.tmdbId || (typeof movie.id === 'string' ? movie.id.replace(/^tmdb-/, '') : movie.id);
    navigate(`/movie/tmdb-${rawId}`);
  };

  const languages = [
    { code: '', label: 'All Languages' },
    { code: 'hi', label: 'Hindi' },
    { code: 'te', label: 'Telugu' },
    { code: 'ta', label: 'Tamil' },
    { code: 'en', label: 'English' },
    { code: 'ko', label: 'Korean' },
    { code: 'ja', label: 'Japanese' },
    { code: 'fr', label: 'French' }
  ];

  const decades = [
    { val: '', label: 'All Decades' },
    { val: '2020', label: '2020s' },
    { val: '2010', label: '2010s' },
    { val: '2000', label: '2000s' },
    { val: '1990', label: '1990s' },
    { val: '1980', label: '1980s' },
    { val: '1970', label: '1970s' }
  ];

  const sorts = [
    { val: 'popularity.desc', label: 'Trending' },
    { val: 'vote_average.desc', label: 'Top Rated' },
    { val: 'primary_release_date.desc', label: 'Newest' }
  ];

  return (
    <div className="page-enter" style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(to bottom, var(--bg-card), var(--bg))',
        padding: '4rem 1rem 2rem',
        textAlign: 'center',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontFamily: 'var(--font-serif)', 
            color: 'var(--gold)',
            marginBottom: '1rem'
          }}>
            Discover every movie, ever made.
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '1.2rem',
            marginBottom: '2rem'
          }}>
            From silent films to the latest releases — rated, tracked, and saved to your personal archive.
          </p>
          
          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
            <SearchAutocomplete onSelect={handleSearchSelect} placeholder="Search for a movie..." />
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div style={{ 
        borderBottom: '1px solid var(--border-subtle)',
        padding: '1rem',
        position: 'sticky',
        top: '60px',
        background: 'rgba(var(--bg-rgb), 0.9)',
        backdropFilter: 'blur(10px)',
        zIndex: 10
      }}>
        <div className="container" style={{ 
          display: 'flex', 
          gap: '1rem', 
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <Filter size={20} color="var(--text-muted)" />
          
          <select 
            className="input" 
            style={{ width: 'auto', minWidth: '150px' }}
            value={activeSort}
            onChange={(e) => updateFilter('sort', e.target.value)}
          >
            {sorts.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
          </select>

          <select 
            className="input" 
            style={{ width: 'auto', minWidth: '150px' }}
            value={activeGenre}
            onChange={(e) => updateFilter('genre', e.target.value)}
          >
            <option value="">All Genres</option>
            {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>

          <select 
            className="input" 
            style={{ width: 'auto', minWidth: '150px' }}
            value={activeLang}
            onChange={(e) => updateFilter('language', e.target.value)}
          >
            {languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>

          <select 
            className="input" 
            style={{ width: 'auto', minWidth: '150px' }}
            value={activeDecade}
            onChange={(e) => updateFilter('decade', e.target.value)}
          >
            {decades.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}
          </select>

          {hasFilters && (
            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => setSearchParams(new URLSearchParams())}
              style={{ color: 'var(--text-secondary)' }}
            >
              <X size={16} /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container" style={{ marginTop: '2rem' }}>
        {(hasFilters || activeSort !== 'popularity.desc') ? (
          <div>
            <h2 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>
              {query ? `Search Results for "${query}"` : 'Discovery Results'}
            </h2>
            
            {results.length === 0 && !loading ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                <Film size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>No movies found matching your criteria.</p>
              </div>
            ) : (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {results.map(movie => (
                    <GlobalMovieCard key={movie.id} movie={movie} />
                  ))}
                </div>
                
                {loading && (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
                )}
                
                {hasMore && !loading && (
                  <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <button className="btn btn-outline" onClick={() => loadResults(true)}>
                      Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {/* Default State - Sections */}
            <section>
              <h2 style={{ 
                marginBottom: '1.5rem', 
                fontFamily: 'var(--font-serif)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ color: 'var(--gold)' }}>🔥</span> Trending This Week
              </h2>
              <div style={{
                display: 'flex',
                gap: '1.5rem',
                overflowX: 'auto',
                paddingBottom: '1rem',
                scrollbarWidth: 'thin'
              }}>
                {trending.map(movie => (
                  <div key={movie.id} style={{ minWidth: '160px', width: '160px' }}>
                    <GlobalMovieCard movie={movie} />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 style={{ 
                marginBottom: '1.5rem', 
                fontFamily: 'var(--font-serif)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Star size={24} color="var(--gold)" /> Top Rated All Time
              </h2>
              <div style={{
                display: 'flex',
                gap: '1.5rem',
                overflowX: 'auto',
                paddingBottom: '1rem',
                scrollbarWidth: 'thin'
              }}>
                {topRated.map(movie => (
                  <div key={movie.id} style={{ minWidth: '160px', width: '160px' }}>
                    <GlobalMovieCard movie={movie} />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 style={{ 
                marginBottom: '1.5rem', 
                fontFamily: 'var(--font-serif)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🎬 Indian Cinema
              </h2>
              <div style={{
                display: 'flex',
                gap: '1.5rem',
                overflowX: 'auto',
                paddingBottom: '1rem',
                scrollbarWidth: 'thin'
              }}>
                {indian.map(movie => (
                  <div key={movie.id} style={{ minWidth: '160px', width: '160px' }}>
                    <GlobalMovieCard movie={movie} />
                  </div>
                ))}
              </div>
            </section>

            <DecadeShelf decade={2010} />
            <DecadeShelf decade={2000} />
            <DecadeShelf decade={1990} />
            <DecadeShelf decade={1980} />
          </div>
        )}
      </div>
    </div>
  );
}
