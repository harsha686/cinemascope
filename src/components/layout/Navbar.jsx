import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Film, Menu, X, ChevronRight, User, LogOut, ShieldAlert, MapPin, BookOpen } from 'lucide-react';
import { useApp } from '../../AppContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { state, dispatch, allCities } = useApp();
  const dropdownRef = useRef(null);

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
  }, [location]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setUserDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/weekend', label: '🏆 Weekend Pick' },
    { to: '/discover', label: 'Discover' },
    { to: '/movies', label: 'Now Showing' },
    { to: `/city/${activeCity?.id || 'visakhapatnam'}`, label: 'Theaters' },
    { to: '/formats', label: 'Formats' },
    { to: '/compare', label: 'Compare' },
  ];

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/');
  };

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to.split('?')[0]);
  };

  return (
    <nav className="nav" style={{ borderBottomColor: scrolled ? 'var(--border-subtle)' : 'transparent' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
        
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <Film size={20} color="var(--gold)" />
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, letterSpacing: '0.18em', color: 'var(--text-primary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Cinema<span style={{ color: 'var(--gold)' }}>Scope</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(14px, 1.8vw, 26px)' }} className="desktop-nav">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 500,
                color: isActive(link.to) ? 'var(--gold)' : 'var(--text-secondary)',
                transition: 'color var(--transition-fast)',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                position: 'relative',
                paddingBottom: 2,
              }}
              onMouseEnter={e => { if (!isActive(link.to)) e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { if (!isActive(link.to)) e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              {link.label}
              {isActive(link.to) && (
                <span style={{
                  position: 'absolute',
                  bottom: -4,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: 'var(--gold)',
                  borderRadius: 1,
                }} />
              )}
            </Link>
          ))}
          {/* Library link — only for logged-in users, desktop only */}
          {currentUser && (
            <Link
              to="/library"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 500,
                color: isActive('/library') ? 'var(--gold)' : 'var(--text-secondary)',
                transition: 'color var(--transition-fast)',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                position: 'relative',
                paddingBottom: 2,
              }}
              onMouseEnter={e => { if (!isActive('/library')) e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { if (!isActive('/library')) e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              Library
              {isActive('/library') && (
                <span style={{
                  position: 'absolute',
                  bottom: -4,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: 'var(--gold)',
                  borderRadius: 1,
                }} />
              )}
            </Link>
          )}
        </div>

        {/* Right Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {currentUser ? (
            <div ref={dropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setUserDropdown(!userDropdown)}
                aria-label="User menu"
                aria-expanded={userDropdown}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 10px',
                  background: 'var(--gold-faint)',
                  border: '1px solid var(--gold-dim)',
                  borderRadius: 20,
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--gold-faint)'}
              >
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'var(--gold)',
                  color: 'var(--bg-primary)',
                  fontWeight: 700,
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="navbar-username" style={{ fontSize: 12, fontWeight: 500 }}>
                  {currentUser.displayName}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {userDropdown && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: 188,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-gold)',
                  zIndex: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '6px 0',
                  animation: 'pageIn 150ms ease forwards',
                }}>
                  <Link
                    to="/profile"
                    style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, transition: 'background var(--transition-fast)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,182,91,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <User size={14} color="var(--gold)" /> My Profile
                  </Link>
                  <Link
                    to="/library"
                    style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, transition: 'background var(--transition-fast)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,182,91,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <Film size={14} color="var(--gold)" /> My Library
                  </Link>

                  {currentUser.role === 'ADMIN' && (
                    <Link
                      to="/admin"
                      style={{ padding: '10px 16px', fontSize: 12, color: 'var(--gold)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid var(--border-subtle)', transition: 'background var(--transition-fast)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,182,91,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <ShieldAlert size={14} /> Admin Hub
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      padding: '10px 16px', fontSize: 12, color: '#f87171', border: 'none', background: 'none',
                      cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
                      borderTop: '1px solid var(--border-subtle)', width: '100%',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <LogOut size={14} /> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="desktop-auth-btns" style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <Link to="/login" className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '6px 14px' }}>
                Log In
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm" style={{ fontSize: 11, padding: '6px 14px' }}>
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
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
              transition: 'color var(--transition-fast)',
            }}
            className="mobile-menu-btn"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div style={{
          position: 'absolute',
          top: 'var(--nav-height)',
          left: 0,
          right: 0,
          background: 'rgba(12,10,8,0.98)',
          borderBottom: '1px solid var(--border)',
          padding: '16px 20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          backdropFilter: 'blur(16px)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.85)',
          maxHeight: 'calc(100vh - var(--nav-height))',
          overflowY: 'auto',
          zIndex: 1000,
          animation: 'pageIn 200ms ease forwards',
        }}>
          {/* Mobile City Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 6,
            marginBottom: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={15} color="var(--gold)" />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>City</span>
            </div>
            <select
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                color: 'var(--gold)',
                fontSize: 12,
                padding: '6px 12px',
                outline: 'none',
                cursor: 'pointer',
              }}
              value={activeCity?.id}
              onChange={e => {
                const selected = allCities.find(c => c.id === e.target.value);
                if (selected) {
                  dispatch({ type: 'SET_CITY', payload: selected });
                  setMenuOpen(false);
                }
              }}
            >
              {allCities.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Nav Links */}
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 6px',
                fontSize: 13,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: isActive(link.to) ? 'var(--gold)' : 'var(--text-primary)',
                borderBottom: '1px solid var(--border-subtle)',
                textDecoration: 'none',
                transition: 'color var(--transition-fast)',
              }}
            >
              <span style={{ fontWeight: isActive(link.to) ? 600 : 400 }}>{link.label}</span>
              <ChevronRight size={14} color={isActive(link.to) ? 'var(--gold)' : 'var(--text-muted)'} />
            </Link>
          ))}

          {currentUser?.role === 'ADMIN' && (
            <Link
              to="/admin"
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 6px',
                fontSize: 13,
                color: 'var(--gold)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldAlert size={14} /> Admin Dashboard
              </span>
              <ChevronRight size={14} color="var(--gold)" />
            </Link>
          )}

          {/* User Section */}
          {currentUser ? (
            <div style={{ marginTop: 12, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--gold)', color: 'var(--bg-primary)',
                  fontWeight: 700, fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{currentUser.displayName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{currentUser.email}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="btn btn-ghost btn-sm" style={{ justifyContent: 'center', fontSize: 11 }}>
                  <User size={13} /> Profile
                </Link>
                <Link to="/library" onClick={() => setMenuOpen(false)} className="btn btn-ghost btn-sm" style={{ justifyContent: 'center', fontSize: 11 }}>
                  <Film size={13} /> Library
                </Link>
              </div>
              <button
                type="button"
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="btn btn-ghost btn-sm"
                style={{ justifyContent: 'center', color: '#f87171', borderColor: 'rgba(239,68,68,0.3)', marginTop: 4 }}
              >
                <LogOut size={13} /> Log Out
              </button>
            </div>
          ) : (
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="btn btn-ghost btn-sm" style={{ justifyContent: 'center', padding: '10px 0' }}>
                Log In
              </Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)} className="btn btn-primary btn-sm" style={{ justifyContent: 'center', padding: '10px 0' }}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
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
