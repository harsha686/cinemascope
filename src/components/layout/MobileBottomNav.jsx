import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Compass, Trophy, Film, User } from 'lucide-react';
import { useApp } from '../../AppContext';

export default function MobileBottomNav() {
  const location = useLocation();
  const { state, allCities } = useApp();
  const currentUser = state?.currentUser;
  const activeCity = state?.selectedCity || allCities?.[0];

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/discover', label: 'Discover', icon: Compass },
    { to: '/weekend', label: 'Weekend', icon: Trophy },
    { to: '/movies', label: 'Now Showing', icon: Film },
    {
      to: currentUser ? `/profile/${currentUser.id || 'admin-1'}` : '/login',
      label: currentUser ? 'Profile' : 'Sign In',
      icon: User,
    },
  ];

  return (
    <div
      className="mobile-bottom-nav"
      style={{
        display: 'none', // Controlled via CSS media query
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '62px',
        backgroundColor: 'rgba(10, 8, 6, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border-subtle)',
        zIndex: 999,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          height: '100%',
          maxWidth: '500px',
          margin: '0 auto',
          padding: '0 8px',
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                textDecoration: 'none',
                color: isActive ? 'var(--gold)' : 'var(--text-muted)',
                flex: 1,
                padding: '6px 0',
                transition: 'color var(--transition-fast)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.3 : 1.8} />
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--gold)',
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-serif)',
                  fontWeight: isActive ? 600 : 500,
                  letterSpacing: '0.04em',
                }}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
