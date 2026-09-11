import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, X, Film, Star, Clock, Heart, Plus, Flame, ShieldAlert, Zap, Skull, Compass, Tv, Sparkles, SlidersHorizontal, ChevronRight, ChevronLeft } from 'lucide-react';
import { 
  searchTmdbMovies,
  searchTmdbTv,
  searchTmdbMulti,
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
  fetchActionMovies,
  // TV & Web Series
  fetchTrendingTv,
  fetchTopRatedTv,
  fetchPopularTv,
  discoverRecentIndianTv,
  fetchTeluguTv,
  fetchCrimeSuspenseTv,
  fetchSciFiFantasyTv,
  discoverTv,
  fetchTvGenres
} from '../services/tmdbService';
import GlobalMovieCard from '../components/discovery/GlobalMovieCard';
import SearchAutocomplete from '../components/discovery/SearchAutocomplete';
import DecadeShelf from '../components/discovery/DecadeShelf';
import WeekendRecommendationHero from '../components/weekend/WeekendRecommendationHero';
import FilterDrawerModal from '../components/discovery/FilterDrawerModal';
import { MovieShelfSkeleton, MovieCardSkeleton } from '../components/common/SkeletonLoader';

export default function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shelvesLoading, setShelvesLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Movie shelves
  const [trending, setTrending] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [indian, setIndian] = useState([]);
  const [telugu, setTelugu] = useState([]);
  const [horror, setHorror] = useState([]);
  const [crimeSuspense, setCrimeSuspense] = useState([]);
  const [actionMovies, setActionMovies] = useState([]);

  // TV Shows & Web Series shelves
  const [trendingTv, setTrendingTv] = useState([]);
  const [topRatedTv, setTopRatedTv] = useState([]);
  const [indianTv, setIndianTv] = useState([]);
  const [teluguTv, setTeluguTv] = useState([]);
  const [crimeTv, setCrimeTv] = useState([]);
  const [sciFiTv, setSciFiTv] = useState([]);

  const activeType = searchParams.get('type') || 'all'; // 'all' | 'movie' | 'tv'
  const activeGenre = searchParams.get('genre') || '';
  const activeLang = searchParams.get('language') || '';
  const activeDecade = searchParams.get('decade') || '';
  const activeSort = searchParams.get('sort') || 'popularity.desc';
  const query = searchParams.get('q') || '';

  const hasFilters = activeGenre || activeLang || activeDecade || query || (activeType !== 'all' && activeSort !== 'popularity.desc');

  // Count active filter pills
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeGenre) count++;
    if (activeLang) count++;
    if (activeDecade) count++;
    if (activeSort && activeSort !== 'popularity.desc') count++;
    if (activeType && activeType !== 'all') count++;
    return count;
  }, [activeGenre, activeLang, activeDecade, activeSort, activeType]);

  useEffect(() => {
    if (activeType === 'tv') {
      fetchTvGenres().then(setGenres).catch(console.error);
    } else {
      fetchGenres().then(setGenres).catch(console.error);
    }
    
    if (!hasFilters) {
      setShelvesLoading(true);
      const promises = [];

      // Load Movies
      if (activeType === 'all' || activeType === 'movie') {
        promises.push(fetchTrendingMovies().then(res => setTrending(res.results.slice(0, 15))).catch(console.error));
        promises.push(fetchTopRatedMovies().then(res => setTopRated(res.results.slice(0, 15))).catch(console.error));
        promises.push(discoverRecentIndianMovies().then(res => setIndian(res.results.slice(0, 15))).catch(console.error));
        promises.push(fetchTeluguMovies().then(res => setTelugu(res.results.slice(0, 15))).catch(console.error));
        promises.push(fetchHorrorMovies().then(res => setHorror(res.results.slice(0, 15))).catch(console.error));
        promises.push(fetchCrimeSuspenseMovies().then(res => setCrimeSuspense(res.results.slice(0, 15))).catch(console.error));
        promises.push(fetchActionMovies().then(res => setActionMovies(res.results.slice(0, 15))).catch(console.error));
      }

      // Load TV Shows & Web Series
      if (activeType === 'all' || activeType === 'tv') {
        promises.push(fetchTrendingTv().then(res => setTrendingTv(res.results.slice(0, 15))).catch(console.error));
        promises.push(fetchTopRatedTv().then(res => setTopRatedTv(res.results.slice(0, 15))).catch(console.error));
        promises.push(discoverRecentIndianTv().then(res => setIndianTv(res.results.slice(0, 15))).catch(console.error));
        promises.push(fetchTeluguTv().then(res => setTeluguTv(res.results.slice(0, 15))).catch(console.error));
        promises.push(fetchCrimeSuspenseTv().then(res => setCrimeTv(res.results.slice(0, 15))).catch(console.error));
        promises.push(fetchSciFiFantasyTv().then(res => setSciFiTv(res.results.slice(0, 15))).catch(console.error));
      }

      Promise.allSettled(promises).finally(() => {
        setShelvesLoading(false);
      });
    }
  }, [hasFilters, activeType]);

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
        if (activeType === 'tv') {
          res = await searchTmdbTv(query, currentPage);
        } else if (activeType === 'movie') {
          res = await searchTmdbMovies(query, currentPage);
        } else {
          res = await searchTmdbMulti(query, currentPage);
        }
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
          filters['first_air_date.gte'] = `${startYear}-01-01`;
          filters['first_air_date.lte'] = `${startYear + 9}-12-31`;
        }

        if (activeType === 'tv') {
          res = await discoverTv(filters);
        } else {
          res = await discoverMovies(filters);
        }
      }

      setResults(prev => isLoadMore ? [...prev, ...res.results] : res.results);
      setHasMore(currentPage < res.totalPages);
      if (isLoadMore) setPage(currentPage);
      else setPage(1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [activeGenre, activeLang, activeDecade, activeSort, activeType, query, hasFilters, page]);

  useEffect(() => {
    loadResults(false);
  }, [activeGenre, activeLang, activeDecade, activeSort, activeType, query]);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    
    if (key !== 'q') newParams.delete('q');
    
    setSearchParams(newParams);
  };

  const resetAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const handleSearchSelect = (item) => {
    const isTv = item.mediaType === 'tv' || item.isTv || String(item.id).includes('-tv-');
    const rawId = item.tmdbId || (typeof item.id === 'string' ? item.id.replace(/^tmdb-(tv-)?/, '') : item.id);
    navigate(`/movie/${isTv ? `tmdb-tv-${rawId}` : `tmdb-${rawId}`}`);
  };

  const languages = [
    { code: '', label: 'All Languages' },
    { code: 'te', label: 'Telugu' },
    { code: 'hi', label: 'Hindi' },
    { code: 'ta', label: 'Tamil' },
    { code: 'ml', label: 'Malayalam' },
    { code: 'kn', label: 'Kannada' },
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
    if (!movieList || movieList.length === 0) {
      if (shelvesLoading) {
        return <MovieShelfSkeleton key={title} count={6} />;
      }
      return null;
    }
    return (
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ 
            fontFamily: 'var(--font-sans)',
            fontSize: '1.35rem',
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
        <div 
          className="shelf-scroll-container hide-scrollbar"
          style={{
            display: 'flex',
            gap: '1.25rem',
            overflowX: 'auto',
            paddingBottom: '1rem',
            paddingRight: '20px',
            scrollbarWidth: 'thin'
          }}
        >
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
        padding: '3.5rem 1rem 2rem',
        textAlign: 'center',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)', 
            fontFamily: 'var(--font-sans)', 
            fontWeight: '800',
            color: 'var(--gold)',
            marginBottom: '0.8rem'
          }}>
            Discover every movie, TV show & web series.
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '1.05rem',
            marginBottom: '1.75rem'
          }}>
            Explore Indian Cinema, Web Series, Telugu Shows, Horror, Crime Thrillers, and worldwide releases.
          </p>
          
          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
            <SearchAutocomplete onSelect={handleSearchSelect} placeholder="Search for any movie, TV show, web series, or actor..." />
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div style={{ 
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0.75rem 1rem',
        position: 'sticky',
        top: 'var(--nav-height)',
        background: 'rgba(10, 8, 6, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 10
      }}>
        <div className="container" style={{ 
          display: 'flex', 
          gap: '0.75rem', 
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Media Type Switcher */}
          <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', gap: '3px' }}>
            {[
              { id: 'all', label: 'All', icon: Compass },
              { id: 'movie', label: 'Movies', icon: Film },
              { id: 'tv', label: 'Series', icon: Tv },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => updateFilter('type', tab.id === 'all' ? '' : tab.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: isActive ? 600 : 500,
                    background: isActive ? 'var(--gold)' : 'transparent',
                    color: isActive ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    transition: 'all var(--transition-fast)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={13} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop Filter Dropdowns */}
          <div className="desktop-filters" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <select 
              className="input" 
              style={{ width: 'auto', minWidth: '125px', background: '#18140e', color: '#ffffff', padding: '5px 10px', fontSize: '12px' }}
              value={activeSort}
              onChange={(e) => updateFilter('sort', e.target.value)}
            >
              {sorts.map(s => <option key={s.val} value={s.val} style={{ background: '#18140e', color: '#ffffff' }}>{s.label}</option>)}
            </select>

            <select 
              className="input" 
              style={{ width: 'auto', minWidth: '125px', background: '#18140e', color: '#ffffff', padding: '5px 10px', fontSize: '12px' }}
              value={activeGenre}
              onChange={(e) => updateFilter('genre', e.target.value)}
            >
              <option value="" style={{ background: '#18140e', color: '#ffffff' }}>All Genres</option>
              {genres.map(g => <option key={g.id} value={g.id} style={{ background: '#18140e', color: '#ffffff' }}>{g.name}</option>)}
            </select>

            <select 
              className="input" 
              style={{ width: 'auto', minWidth: '120px', background: '#18140e', color: '#ffffff', padding: '5px 10px', fontSize: '12px' }}
              value={activeLang}
              onChange={(e) => updateFilter('language', e.target.value)}
            >
              {languages.map(l => <option key={l.code} value={l.code} style={{ background: '#18140e', color: '#ffffff' }}>{l.label}</option>)}
            </select>

            <select 
              className="input" 
              style={{ width: 'auto', minWidth: '110px', background: '#18140e', color: '#ffffff', padding: '5px 10px', fontSize: '12px' }}
              value={activeDecade}
              onChange={(e) => updateFilter('decade', e.target.value)}
            >
              {decades.map(d => <option key={d.val} value={d.val} style={{ background: '#18140e', color: '#ffffff' }}>{d.label}</option>)}
            </select>
          </div>

          {/* Mobile Filter Button trigger */}
          <div className="mobile-filter-trigger" style={{ display: 'none' }}>
            <button
              type="button"
              onClick={() => setFilterDrawerOpen(true)}
              className="btn btn-outline btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                padding: '5px 12px',
                borderColor: activeFilterCount > 0 ? 'var(--gold)' : 'var(--border-subtle)',
                color: activeFilterCount > 0 ? 'var(--gold)' : 'var(--text-primary)',
              }}
            >
              <SlidersHorizontal size={13} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--gold)',
                    color: 'var(--bg-primary)',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {hasFilters && (
            <button 
              className="btn btn-ghost btn-sm"
              onClick={resetAllFilters}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--gold)', fontSize: '12px', padding: '4px 8px' }}
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container" style={{ padding: '2rem 1rem' }}>
        {hasFilters ? (
          <div>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', fontSize: '1.3rem' }}>
              {query 
                ? `Search Results for "${query}"` 
                : (activeType === 'tv' 
                    ? 'Filtered TV Shows & Web Series' 
                    : activeType === 'movie' 
                      ? 'Filtered Movies' 
                      : 'Filtered Titles')}
            </h2>
            
            {loading && results.length === 0 ? (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                {Array.from({ length: 12 }).map((_, idx) => (
                  <MovieCardSkeleton key={idx} width="100%" />
                ))}
              </div>
            ) : results.length === 0 && !loading ? (
              <div style={{
                textAlign: 'center',
                padding: '4rem 1rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-md)'
              }}>
                <Compass size={40} color="var(--gold)" style={{ opacity: 0.5, marginBottom: '12px' }} />
                <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', fontSize: '18px', marginBottom: '6px' }}>
                  No Titles Match Your Filters
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
                  Try resetting some filters or switching to another category.
                </p>
                <button onClick={resetAllFilters} className="btn btn-primary btn-sm">
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
                  gap: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  {results.map(item => (
                    <GlobalMovieCard key={item.id} movie={item} />
                  ))}
                </div>

                {hasMore && (
                  <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <button 
                      className="btn btn-outline" 
                      onClick={() => loadResults(true)}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : `Load More ${activeType === 'tv' ? 'Shows' : activeType === 'movie' ? 'Movies' : 'Titles'}`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Weekend Community Pick Recommendation */}
            <WeekendRecommendationHero />
            
            {/* TV SHOWS ONLY VIEW */}
            {activeType === 'tv' && (
              <>
                {renderMovieShelf("Trending Web Series & TV Shows", "🔥", trendingTv)}
                {renderMovieShelf("Indian Web Series (Pan-India & Regional)", "🇮🇳", indianTv, () => updateFilter('language', 'hi'))}
                {renderMovieShelf("Telugu Web Series & Shows", "⚡", teluguTv, () => updateFilter('language', 'te'))}
                {renderMovieShelf("Crime, Suspense & Mystery Series", "🔍", crimeTv, () => updateFilter('genre', '80'))}
                {renderMovieShelf("Sci-Fi, Fantasy & Supernatural Series", "🛸", sciFiTv, () => updateFilter('genre', '10765'))}
                {renderMovieShelf("Top Rated Series of All Time", "⭐", topRatedTv)}
              </>
            )}

            {/* MOVIES ONLY VIEW */}
            {activeType === 'movie' && (
              <>
                {renderMovieShelf("Trending Movies This Week", "🌟", trending)}
                {renderMovieShelf("Indian Cinema", "🎬", indian, () => updateFilter('language', 'te'))}
                {renderMovieShelf("Telugu Movies", "🔥", telugu, () => updateFilter('language', 'te'))}
                {renderMovieShelf("Horror Movies", "👻", horror, () => updateFilter('genre', '27'))}
                {renderMovieShelf("Crime & Suspense Thrillers", "🔍", crimeSuspense, () => updateFilter('genre', '80'))}
                {renderMovieShelf("Action Movies", "💥", actionMovies, () => updateFilter('genre', '28'))}
                {renderMovieShelf("Top Rated Movies All Time", "⭐", topRated)}
                <DecadeShelf decade={2010} />
                <DecadeShelf decade={2000} />
                <DecadeShelf decade={1990} />
                <DecadeShelf decade={1980} />
              </>
            )}

            {/* ALL MEDIA VIEW (Movies + TV Series) */}
            {activeType === 'all' && (
              <>
                {renderMovieShelf("Trending Movies", "🌟", trending)}
                {renderMovieShelf("Trending Web Series & TV Shows", "🔥", trendingTv)}
                {renderMovieShelf("Indian Cinema Releases", "🎬", indian, () => updateFilter('language', 'te'))}
                {renderMovieShelf("Indian Web Series (Hindi, Telugu & Tamil)", "🇮🇳", indianTv, () => updateFilter('language', 'hi'))}
                {renderMovieShelf("Telugu Cinema Hits", "🔥", telugu, () => updateFilter('language', 'te'))}
                {renderMovieShelf("Telugu Web Series & Shows", "⚡", teluguTv, () => updateFilter('language', 'te'))}
                {renderMovieShelf("Crime & Suspense Thrillers & Series", "🔍", crimeTv.length > 0 ? crimeTv : crimeSuspense, () => updateFilter('genre', '80'))}
                {renderMovieShelf("Sci-Fi & Fantasy Series", "🛸", sciFiTv, () => updateFilter('genre', '10765'))}
                {renderMovieShelf("Horror & Dark Thrillers", "👻", horror, () => updateFilter('genre', '27'))}
                {renderMovieShelf("Top Rated Series All-Time", "⭐", topRatedTv)}
                {renderMovieShelf("Top Rated Movies All Time", "🏆", topRated)}
                <DecadeShelf decade={2010} />
                <DecadeShelf decade={2000} />
                <DecadeShelf decade={1990} />
                <DecadeShelf decade={1980} />
              </>
            )}

          </div>
        )}
      </div>

      {/* Mobile Filters Drawer Modal */}
      <FilterDrawerModal
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        activeType={activeType}
        activeGenre={activeGenre}
        activeLang={activeLang}
        activeDecade={activeDecade}
        activeSort={activeSort}
        genres={genres}
        languages={languages}
        decades={decades}
        sorts={sorts}
        onUpdateFilter={updateFilter}
        onResetFilters={resetAllFilters}
      />

      <style>{`
        @media (max-width: 768px) {
          .desktop-filters { display: none !important; }
          .mobile-filter-trigger { display: block !important; }
        }
      `}</style>
    </div>
  );
}
