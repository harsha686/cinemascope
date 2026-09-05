import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Film, Menu, X, ChevronRight, User, LogOut, ShieldAlert, MapPin } from 'lucide-react';
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

  return (
    <nav className="nav" style={{ borderBottomColor: scrolled ? 'var(--border-subtle)' : 'transparent' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
        
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Film size={20} color="var(--gold)" />
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, letterSpacing: '0.18em', color: 'var(--text-primary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Cinema<span style={{ color: 'var(--gold)' }}>Scope</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="desktop-nav">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 12,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                fontWeight: 500,
                color: location.pathname === link.to ? 'var(--gold)' : 'var(--text-secondary)',
                transition: 'color var(--transition-base)',
                textDecoration: 'none',
              }}
              onMouseEnter={e => { if (location.pathname !== link.to) e.target.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { if (location.pathname !== link.to) e.target.style.color = 'var(--text-secondary)'; }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Action Controls (City Dropdown + Auth Menu) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          
          {/* City Quick Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 4 }}>
            <MapPin size={12} color="var(--gold)" />
            <select
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 11, fontFamily: 'var(--font-serif)', cursor: 'pointer', outline: 'none' }}
              value={activeCity?.id}
              onChange={e => {
                const selected = allCities.find(c => c.id === e.target.value);
                if (selected) dispatch({ type: 'SET_CITY', payload: selected });
              }}
            >
              {allCities.map(c => (
                <option key={c.id} value={c.id} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* User Auth Section */}
          {currentUser ? (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setUserDropdown(!userDropdown)}
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
                }}
              >
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'var(--gold)',
                  color: 'var(--bg-primary)',
                  fontFamily: 'var(--font-serif)',
                  fontWeight: 700,
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-serif)', fontWeight: 500 }}>
                  {currentUser.displayName}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {userDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 8,
                  width: 180,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-gold)',
                  zIndex: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '6px 0',
                }}>
                  <Link
                    to="/profile"
                    style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,182,91,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <User size={14} color="var(--gold)" /> My Profile
                  </Link>
                  <Link
                    to="/library"
                    style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,182,91,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <Film size={14} color="var(--gold)" /> My Library
                  </Link>

                  {currentUser.role === 'ADMIN' && (
                    <Link
                      to="/admin"
                      style={{ padding: '10px 16px', fontSize: 12, color: 'var(--gold)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid var(--border-subtle)' }}
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
                      borderTop: '1px solid var(--border-subtle)', width: '100%'
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
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/login" className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>
                Log In
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm" style={{ fontSize: 11 }}>
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            style={{ color: 'var(--text-primary)', display: 'none', background: 'none', border: 'none', cursor: 'pointer' }}
            className="mobile-menu-btn"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
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
          background: 'rgba(10,8,6,0.98)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '16px 24px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          backdropFilter: 'blur(14px)',
        }}>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 0',
                fontFamily: 'var(--font-serif)',
                fontSize: 13,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: location.pathname === link.to ? 'var(--gold)' : 'var(--text-primary)',
                borderBottom: '1px solid var(--border-subtle)',
                textDecoration: 'none',
              }}
            >
              {link.label}
              <ChevronRight size={14} color="var(--text-muted)" />
            </Link>
          ))}
          {currentUser?.role === 'ADMIN' && (
            <Link
              to="/admin"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 0',
                fontFamily: 'var(--font-serif)',
                fontSize: 13,
                color: 'var(--gold)',
                textDecoration: 'none',
              }}
            >
              Admin Dashboard
              <ChevronRight size={14} color="var(--gold)" />
            </Link>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
