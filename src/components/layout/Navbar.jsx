import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Film, Menu, X, ChevronRight, ChevronDown, User, LogOut, ShieldAlert, MapPin, Bookmark, Calendar, Tv, Bell, Heart, Trash2 } from 'lucide-react';
import { useApp } from '../../AppContext';

function formatTimeAgo(isoString) {
  if (!isoString) return '';
  try {
    const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
    if (diff < 45) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (e) {
    return '';
  }
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [moreDropdown, setMoreDropdown] = useState(false);
  const [notifDropdown, setNotifDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { state, dispatch, allCities } = useApp();
  const userDropdownRef = useRef(null);
  const moreDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);

  const currentUser = state.currentUser;
  const activeCity = state.selectedCity || allCities[0];

  const userNotifications = useMemo(() => {
    if (!currentUser?.id) return [];
    return (state.notifications || [])
      .filter(n => n.recipientId === currentUser.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [state.notifications, currentUser?.id]);

  const unreadCount = useMemo(() => {
    return userNotifications.filter(n => !n.isRead).length;
  }, [userNotifications]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setUserDropdown(false);
    setMoreDropdown(false);
    setNotifDropdown(false);
  }, [location]);

  useEffect(() => {
    const handler = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdown(false);
      }
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target)) {
        setMoreDropdown(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setNotifDropdown(false);
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
    { to: '/users', label: 'Find Members' },
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
                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
                <button
                  type="button"
                  onClick={() => {
                    setMoreDropdown(false);
                    window.dispatchEvent(new CustomEvent('open-ott-popup'));
                  }}
                  style={{
                    padding: '8px 16px',
                    fontSize: 12,
                    color: 'var(--gold)',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'none',
                    border: 'none',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220,182,91,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <Tv size={13} color="var(--gold)" />
                  Latest OTT Release
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: User Menu / Auth Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {currentUser && (
            <div ref={notifDropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setNotifDropdown(!notifDropdown)}
                aria-label="Notifications"
                aria-expanded={notifDropdown}
                title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: notifDropdown ? 'rgba(220,182,91,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${notifDropdown ? 'var(--gold-dim)' : 'var(--border-neutral)'}`,
                  cursor: 'pointer',
                  color: unreadCount > 0 ? 'var(--gold)' : 'var(--text-secondary)',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = notifDropdown ? 'rgba(220,182,91,0.15)' : 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = unreadCount > 0 ? 'var(--gold)' : 'var(--text-secondary)';
                }}
              >
                <Bell size={15} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -3,
                      right: -3,
                      minWidth: 16,
                      height: 16,
                      padding: '0 4px',
                      borderRadius: 8,
                      background: 'var(--gold)',
                      color: '#080604',
                      fontSize: 10,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 8px rgba(220,182,91,0.6)',
                      lineHeight: 1,
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Menu */}
              {notifDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 340,
                    maxWidth: '88vw',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-neutral)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-card)',
                    zIndex: 250,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'pageIn 150ms ease forwards',
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--border-subtle)',
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 10,
                            background: 'var(--gold-faint)',
                            color: 'var(--gold)',
                            border: '1px solid var(--gold-dim)',
                          }}
                        >
                          {unreadCount} new
                        </span>
                      )}
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ', payload: currentUser.id })}
                        style={{
                          fontSize: 11,
                          color: 'var(--gold)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 600,
                          padding: 0,
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Notification List */}
                  <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                    {userNotifications.length === 0 ? (
                      <div style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: '50%',
                            background: 'var(--gold-faint)',
                            border: '1px solid var(--gold-dim)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 10px',
                            color: 'var(--gold)',
                          }}
                        >
                          <Heart size={18} />
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                          No notifications yet
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          When cinema lovers like your reviews, you'll be notified here!
                        </p>
                      </div>
                    ) : (
                      userNotifications.map((notif) => {
                        const isUnread = !notif.isRead;
                        return (
                          <div
                            key={notif.id}
                            onClick={() => {
                              if (isUnread) {
                                dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notif.id });
                              }
                              setNotifDropdown(false);
                              if (notif.targetType === 'THEATER') {
                                navigate(`/theater/${notif.targetId}`);
                              } else {
                                navigate(`/movie/${notif.targetId}`);
                              }
                            }}
                            style={{
                              display: 'flex',
                              gap: 10,
                              padding: '11px 14px',
                              borderBottom: '1px solid var(--border-subtle)',
                              background: isUnread ? 'rgba(220,182,91,0.06)' : 'transparent',
                              cursor: 'pointer',
                              transition: 'background var(--transition-fast)',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = isUnread ? 'rgba(220,182,91,0.1)' : 'rgba(255,255,255,0.04)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = isUnread ? 'rgba(220,182,91,0.06)' : 'transparent'}
                          >
                            {/* Avatar with heart indicator */}
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                              {notif.actorAvatar ? (
                                <img
                                  src={notif.actorAvatar}
                                  alt={notif.actorName}
                                  style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    background: 'var(--gold-faint)',
                                    border: '1px solid var(--gold-dim)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--gold)',
                                    fontWeight: 700,
                                    fontSize: 12,
                                  }}
                                >
                                  {(notif.actorName || 'A').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span
                                style={{
                                  position: 'absolute',
                                  bottom: -2,
                                  right: -2,
                                  width: 14,
                                  height: 14,
                                  borderRadius: '50%',
                                  background: '#ef4444',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1.5px solid var(--bg-card)',
                                }}
                              >
                                <Heart size={8} color="#fff" fill="#fff" />
                              </span>
                            </div>

                            {/* Text content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 3 }}>
                                <strong style={{ color: 'var(--gold)', fontWeight: 600 }}>{notif.actorName}</strong>
                                {' '}liked your review on{' '}
                                <strong style={{ color: 'var(--text-primary)' }}>{notif.targetTitle}</strong>
                              </div>

                              {notif.reviewSnippet && (
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: 'var(--text-muted)',
                                    background: 'rgba(255,255,255,0.03)',
                                    padding: '3px 6px',
                                    borderRadius: 4,
                                    marginBottom: 4,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    fontStyle: 'italic',
                                  }}
                                >
                                  "{notif.reviewSnippet}"
                                </div>
                              )}

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                  {formatTimeAgo(notif.createdAt)}
                                </span>
                                {isUnread && (
                                  <span
                                    style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: '50%',
                                      background: 'var(--gold)',
                                      boxShadow: '0 0 6px var(--gold)',
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  {userNotifications.length > 0 && (
                    <div
                      style={{
                        padding: '8px 14px',
                        borderTop: '1px solid var(--border-subtle)',
                        background: 'rgba(255,255,255,0.01)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'CLEAR_NOTIFICATIONS', payload: currentUser.id })}
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <Trash2 size={11} /> Clear all
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.displayName || 'User'}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1px solid var(--gold-dim)',
                    }}
                  />
                ) : (
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
                )}
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

          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              window.dispatchEvent(new CustomEvent('open-ott-popup'));
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 4px',
              fontSize: 13,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid var(--border-subtle)',
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Tv size={14} color="var(--gold)" />
              Latest OTT Release
            </span>
            <ChevronRight size={13} color="var(--gold)" />
          </button>

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
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.displayName || 'User'}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1px solid var(--gold-dim)',
                    }}
                  />
                ) : (
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
                )}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{currentUser.displayName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{currentUser.email}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setNotifDropdown(true);
                }}
                className="btn btn-outline btn-sm"
                style={{
                  justifyContent: 'space-between',
                  fontSize: 11,
                  marginTop: 2,
                  borderColor: unreadCount > 0 ? 'var(--gold-dim)' : 'var(--border-neutral)',
                  background: unreadCount > 0 ? 'var(--gold-faint)' : 'transparent',
                  color: unreadCount > 0 ? 'var(--gold)' : 'var(--text-primary)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Bell size={13} /> Notifications
                </span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      padding: '1px 6px',
                      borderRadius: 10,
                      background: 'var(--gold)',
                      color: '#080604',
                      fontWeight: 800,
                      fontSize: 10,
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

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
