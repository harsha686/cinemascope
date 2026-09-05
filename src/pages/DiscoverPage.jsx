import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, X, Film, Star, Clock, Heart, Plus, Flame, ShieldAlert, Zap, Skull, Compass } from 'lucide-react';
import { 
  searchTmdbMovies, 
  fetchTrendingMovies, 
  fetchTopRatedMovies, 
  fetchPopularMovies, 
  fetchMoviesByDecade, 
  fetchGenres, 
  discoverMovies,
  discoverRecentIndianMovies,
  fetchTeluguMovies,
  fetchHorrorMovies,
  fetchCrimeSuspenseMovies,
  fetchActionMovies
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
  const [telugu, setTelugu] = useState([]);
  const [horror, setHorror] = useState([]);
  const [crimeSuspense, setCrimeSuspense] = useState([]);
  const [actionMovies, setActionMovies] = useState([]);

  const activeGenre = searchParams.get('genre') || '';
  const activeLang = searchParams.get('language') || '';
  const activeDecade = searchParams.get('decade') || '';
  const activeSort = searchParams.get('sort') || 'popularity.desc';
  const query = searchParams.get('q') || '';

  const hasFilters = activeGenre || activeLang || activeDecade || query;

  useEffect(() => {
    fetchGenres().then(setGenres).catch(console.error);
    
    if (!hasFilters) {
      fetchTrendingMovies().then(res => setTrending(res.results.slice(0, 12))).catch(console.error);
      fetchTopRatedMovies().then(res => setTopRated(res.results.slice(0, 12))).catch(console.error);
      discoverRecentIndianMovies().then(res => setIndian(res.results.slice(0, 15))).catch(console.error);
      fetchTeluguMovies().then(res => setTelugu(res.results.slice(0, 15))).catch(console.error);
      fetchHorrorMovies().then(res => setHorror(res.results.slice(0, 15))).catch(console.error);
      fetchCrimeSuspenseMovies().then(res => setCrimeSuspense(res.results.slice(0, 15))).catch(console.error);
      fetchActionMovies().then(res => setActionMovies(res.results.slice(0, 15))).catch(console.error);
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
    { code: 'te', label: 'Telugu' },
    { code: 'hi', label: 'Hindi' },
    { code: 'ta', label: 'Tamil' },
    { code: 'kn', label: 'Kannada' },
    { code: 'ml', label: 'Malayalam' },
    { code: 'en', label: 'English' },
    { code: 'ko', label: 'Korean' },
    { code: 'ja', label: 'Japanese' }
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

  const renderMovieShelf = (title, icon, movieList, onSeeAll) => {
    if (!movieList || movieList.length === 0) return null;
    return (
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ 
            fontFamily: 'var(--font-sans)',
            fontSize: '1.4rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            {icon} {title}
          </h2>
          {onSeeAll && (
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={onSeeAll}
              style={{ color: 'var(--gold)', fontSize: '0.85rem' }}
            >
              See All →
            </button>
          )}
        </div>
        <div style={{
          display: 'flex',
          gap: '1.25rem',
          overflowX: 'auto',
          paddingBottom: '1rem',
          scrollbarWidth: 'thin'
        }} className="hide-scrollbar">
          {movieList.map(movie => (
            <div key={movie.id || movie.tmdbId} style={{ minWidth: '170px', width: '170px', flexShrink: 0 }}>
              <GlobalMovieCard movie={movie} />
            </div>
          ))}
        </div>
      </section>
    );
  };

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
            fontFamily: 'var(--font-sans)', 
            fontWeight: '800',
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
            Explore Indian Cinema, Telugu Movies, Horror, Crime & Suspense, Action, and worldwide releases.
          </p>
          
          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
            <SearchAutocomplete onSelect={handleSearchSelect} placeholder="Search for any movie, actor, or director..." />
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div style={{ 
        borderBottom: '1px solid var(--border-subtle)',
        padding: '1rem',
        position: 'sticky',
        top: '60px',
        background: 'rgba(10, 8, 6, 0.95)',
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
            style={{ width: 'auto', minWidth: '150px', background: '#18140e', color: '#ffffff' }}
            value={activeSort}
            onChange={(e) => updateFilter('sort', e.target.value)}
          >
            {sorts.map(s => <option key={s.val} value={s.val} style={{ background: '#18140e', color: '#ffffff' }}>{s.label}</option>)}
          </select>

          <select 
            className="input" 
            style={{ width: 'auto', minWidth: '150px', background: '#18140e', color: '#ffffff' }}
            value={activeGenre}
            onChange={(e) => updateFilter('genre', e.target.value)}
          >
            <option value="" style={{ background: '#18140e', color: '#ffffff' }}>All Genres</option>
            {genres.map(g => <option key={g.id} value={g.id} style={{ background: '#18140e', color: '#ffffff' }}>{g.name}</option>)}
          </select>

          <select 
            className="input" 
            style={{ width: 'auto', minWidth: '150px', background: '#18140e', color: '#ffffff' }}
            value={activeLang}
            onChange={(e) => updateFilter('language', e.target.value)}
          >
            {languages.map(l => <option key={l.code} value={l.code} style={{ background: '#18140e', color: '#ffffff' }}>{l.label}</option>)}
          </select>

          <select 
            className="input" 
            style={{ width: 'auto', minWidth: '150px', background: '#18140e', color: '#ffffff' }}
            value={activeDecade}
            onChange={(e) => updateFilter('decade', e.target.value)}
          >
            {decades.map(d => <option key={d.val} value={d.val} style={{ background: '#18140e', color: '#ffffff' }}>{d.label}</option>)}
          </select>

          {hasFilters && (
            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => setSearchParams(new URLSearchParams())}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--gold)' }}
            >
              <X size={16} /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container" style={{ padding: '2rem 1rem' }}>
        {hasFilters ? (
          <div>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              {query ? `Search Results for "${query}"` : 'Filtered Movies'}
            </h2>
            
            {results.length === 0 && !loading ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
                No movies found. Try adjusting your filters.
              </div>
            ) : (
              <>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
                  gap: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  {results.map(movie => (
                    <GlobalMovieCard key={movie.id} movie={movie} />
                  ))}
                </div>

                {hasMore && (
                  <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <button 
                      className="btn btn-outline" 
                      onClick={() => loadResults(true)}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Load More Movies'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* 1. Indian Cinema */}
            {renderMovieShelf("Indian Cinema", "🎬", indian, () => updateFilter('language', 'te'))}

            {/* 2. Telugu Movies */}
            {renderMovieShelf("Telugu Movies", "🔥", telugu, () => updateFilter('language', 'te'))}

            {/* 3. Horror Movies */}
            {renderMovieShelf("Horror Movies", "👻", horror, () => updateFilter('genre', '27'))}

            {/* 4. Crime & Suspense Thrillers */}
            {renderMovieShelf("Crime & Suspense", "🔍", crimeSuspense, () => updateFilter('genre', '80'))}

            {/* 5. Action Movies */}
            {renderMovieShelf("Action Movies", "💥", actionMovies, () => updateFilter('genre', '28'))}

            {/* 6. Trending This Week */}
            {renderMovieShelf("Trending This Week", "🌟", trending)}

            {/* 7. Top Rated All Time */}
            {renderMovieShelf("Top Rated All Time", "⭐", topRated)}

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
