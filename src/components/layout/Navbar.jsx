import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Film, Menu, X, ChevronRight, ChevronDown, User, LogOut, ShieldAlert, MapPin, Bookmark, Calendar } from 'lucide-react';
import { useApp } from '../../AppContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [moreDropdown, setMoreDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { state, dispatch, allCities } = useApp();
  const userDropdownRef = useRef(null);
  const moreDropdownRef = useRef(null);

  const currentUser = state.currentUser;
  const activeCity = state.selectedCity || allCities[0];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setUserDropdown(false);
    setMoreDropdown(false);
  }, [location]);

  useEffect(() => {
    const handler = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdown(false);
      }
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target)) {
        setMoreDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Primary top-level destinations
  const primaryLinks = useMemo(() => [
    { to: '/discover', label: 'Discover' },
    { to: `/city/${activeCity?.id || 'visakhapatnam'}`, label: 'Theaters' },
    { to: '/compare', label: 'Compare' },
    { to: '/weekend', label: 'Weekend Pick' },
  ], [activeCity]);

  // Secondary destinations grouped under "More"
  const moreLinks = [
    { to: '/movies', label: 'Now Showing' },
    { to: '/formats', label: 'Format Guide' },
    { to: '/weekend-winners', label: 'Weekend Winners' },
    { to: '/about', label: 'About & Data' },
  ];

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/');
  };

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to.split('?')[0]);
  };

  const isMoreActive = moreLinks.some(link => isActive(link.to));

  return (
    <nav className="nav" style={{ borderBottomColor: scrolled ? 'var(--border-subtle)' : 'transparent' }}>
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%',
          width: '100%',
        }}
      >
        {/* Left: Brand Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            flexShrink: 0,
          }}
          aria-label="CinemaScope Home"
        >
          <Film size={20} color="var(--accent)" />
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 16,
              letterSpacing: '0.16em',
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            Cinema<span style={{ color: 'var(--accent)' }}>Scope</span>
          </span>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <div
          className="desktop-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(12px, 1.8vw, 28px)',
            flex: 1,
            margin: '0 clamp(16px, 2.5vw, 40px)',
            minWidth: 0,
          }}
        >
          {primaryLinks.map((link) => {
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  fontWeight: active ? 600 : 500,
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  transition: 'color var(--transition-fast)',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  position: 'relative',
                  padding: '6px 4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {link.label}
                {active && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 4,
                      right: 4,
                      height: 2,
                      background: 'var(--accent)',
                      borderRadius: 1,
                    }}
                  />
                )}
              </Link>
            );
          })}

          {/* "More" Dropdown */}
          <div ref={moreDropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setMoreDropdown(!moreDropdown)}
              aria-expanded={moreDropdown}
              aria-label="More navigation options"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontWeight: isMoreActive ? 600 : 500,
                color: isMoreActive ? 'var(--accent)' : 'var(--text-secondary)',
                transition: 'color var(--transition-fast)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 4px',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isMoreActive) e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                if (!isMoreActive) e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              More
              <ChevronDown size={13} />
              {isMoreActive && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 4,
                    right: 4,
                    height: 2,
                    background: 'var(--accent)',
                    borderRadius: 1,
                  }}
                />
              )}
            </button>

            {moreDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  width: 190,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-neutral)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-card)',
                  zIndex: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '6px 0',
                  animation: 'pageIn 150ms ease forwards',
                }}
              >
                {moreLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    style={{
                      padding: '8px 16px',
                      fontSize: 12,
                      color: isActive(item.to) ? 'var(--accent)' : 'var(--text-primary)',
                      fontWeight: isActive(item.to) ? 600 : 400,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: User Menu / Auth Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {currentUser ? (
            <div ref={userDropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setUserDropdown(!userDropdown)}
                aria-label="User account menu"
                aria-expanded={userDropdown}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 10px 4px 5px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-neutral)',
                  borderRadius: 20,
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'var(--border-neutral)';
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    color: '#080604',
                    fontWeight: 700,
                    fontSize: 11,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="navbar-username" style={{ fontSize: 12, fontWeight: 500 }}>
                  {currentUser.displayName}
                </span>
                <ChevronDown size={12} color="var(--text-muted)" />
              </button>

              {/* User Dropdown Menu */}
              {userDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 195,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-neutral)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-card)',
                    zIndex: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '6px 0',
                    animation: 'pageIn 150ms ease forwards',
                  }}
                >
                  <Link
                    to="/profile"
                    style={{
                      padding: '8px 16px',
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <User size={13} color="var(--text-secondary)" /> My Profile
                  </Link>
                  <Link
                    to="/library"
                    style={{
                      padding: '8px 16px',
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <Film size={13} color="var(--text-secondary)" /> My Library
                  </Link>
                  <Link
                    to="/watchlist"
                    style={{
                      padding: '8px 16px',
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <Bookmark size={13} color="var(--text-secondary)" /> Watchlist
                  </Link>
                  <Link
                    to="/diary"
                    style={{
                      padding: '8px 16px',
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <Calendar size={13} color="var(--text-secondary)" /> Film Diary
                  </Link>

                  {currentUser.role === 'ADMIN' && (
                    <Link
                      to="/admin"
                      style={{
                        padding: '8px 16px',
                        fontSize: 12,
                        color: 'var(--accent)',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        borderTop: '1px solid var(--border-subtle)',
                        transition: 'background var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <ShieldAlert size={13} /> Admin Dashboard
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      padding: '8px 16px',
                      fontSize: 12,
                      color: 'var(--color-danger)',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      borderTop: '1px solid var(--border-subtle)',
                      width: '100%',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <LogOut size={13} /> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="desktop-auth-btns" style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <Link to="/login" className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: '5px 12px' }}>
                Log In
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm" style={{ fontSize: 11, padding: '5px 14px' }}>
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            style={{
              color: 'var(--text-primary)',
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 4,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            className="mobile-menu-btn"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {menuOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'var(--nav-height)',
            left: 0,
            right: 0,
            background: 'rgba(12,10,8,0.98)',
            borderBottom: '1px solid var(--border-neutral)',
            padding: '16px 20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            backdropFilter: 'blur(16px)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.85)',
            maxHeight: 'calc(100vh - var(--nav-height))',
            overflowY: 'auto',
            zIndex: 1000,
            animation: 'pageIn 200ms ease forwards',
          }}
        >
          {/* Mobile City Selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 4,
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={13} color="var(--accent)" />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>City</span>
            </div>
            <select
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-neutral)',
                borderRadius: 4,
                color: 'var(--text-primary)',
                fontSize: 12,
                padding: '4px 8px',
                outline: 'none',
                cursor: 'pointer',
              }}
              value={activeCity?.id}
              onChange={(e) => {
                const selected = allCities.find((c) => c.id === e.target.value);
                if (selected) {
                  dispatch({ type: 'SET_CITY', payload: selected });
                  setMenuOpen(false);
                }
              }}
            >
              {allCities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Primary Mobile Links */}
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: '6px 0 2px' }}>
            Main Menu
          </div>
          {primaryLinks.map((link) => {
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 4px',
                  fontSize: 13,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: active ? 'var(--accent)' : 'var(--text-primary)',
                  borderBottom: '1px solid var(--border-subtle)',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontWeight: active ? 600 : 400 }}>{link.label}</span>
                <ChevronRight size={13} color={active ? 'var(--accent)' : 'var(--text-muted)'} />
              </Link>
            );
          })}

          {/* Secondary Mobile Links */}
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: '14px 0 2px' }}>
            Explore More
          </div>
          {moreLinks.map((link) => {
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 4px',
                  fontSize: 13,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  borderBottom: '1px solid var(--border-subtle)',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontWeight: active ? 600 : 400 }}>{link.label}</span>
                <ChevronRight size={13} color={active ? 'var(--accent)' : 'var(--text-muted)'} />
              </Link>
            );
          })}

          {currentUser?.role === 'ADMIN' && (
            <Link
              to="/admin"
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 4px',
                fontSize: 13,
                color: 'var(--accent)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--border-subtle)',
                marginTop: 6,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldAlert size={14} /> Admin Dashboard
              </span>
              <ChevronRight size={13} color="var(--accent)" />
            </Link>
          )}

          {/* Account Section */}
          {currentUser ? (
            <div style={{ marginTop: 12, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    color: '#080604',
                    fontWeight: 700,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{currentUser.displayName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{currentUser.email}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="btn btn-outline btn-sm" style={{ justifyContent: 'center', fontSize: 11 }}>
                  Profile
                </Link>
                <Link to="/library" onClick={() => setMenuOpen(false)} className="btn btn-outline btn-sm" style={{ justifyContent: 'center', fontSize: 11 }}>
                  Library
                </Link>
              </div>
              <button
                type="button"
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="btn btn-danger btn-sm"
                style={{ justifyContent: 'center', marginTop: 4, fontSize: 11 }}
              >
                <LogOut size={12} /> Log Out
              </button>
            </div>
          ) : (
            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="btn btn-outline btn-sm" style={{ justifyContent: 'center', padding: '8px 0' }}>
                Log In
              </Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)} className="btn btn-primary btn-sm" style={{ justifyContent: 'center', padding: '8px 0' }}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (max-width: 640px) {
          .desktop-auth-btns { display: none !important; }
          .navbar-username { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
