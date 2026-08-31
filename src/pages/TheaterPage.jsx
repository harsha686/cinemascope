import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Monitor, ChevronRight, GitCompare } from 'lucide-react';
import YoutubeIcon from '../components/shared/YoutubeIcon';
import { useApp } from '../AppContext';
import TheaterMap from '../components/city/TheaterMap';
import { getFormat } from '../data/formats';

function ScreenMiniCard({ screen, theaterId }) {
  const navigate = useNavigate();
  const fmt = getFormat(screen.aspectRatio);
  const screenH = 80 / screen.aspectRatioNumeric;

  return (
    <div
      onClick={() => navigate(`/theater/${theaterId}/screen/${screen.id}`)}
      style={{
        border: '1px solid var(--border-subtle)',
        background: 'var(--bg-card)',
        padding: 20,
        cursor: 'pointer',
        transition: 'all var(--transition-base)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow-gold)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Screen shape preview */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px 0' }}>
        <div style={{
          width: 80,
          height: screenH,
          background: 'rgba(201,168,76,0.08)',
          border: '1px solid var(--gold-dim)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all var(--transition-ratio)',
        }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 8, color: 'var(--gold)', letterSpacing: '0.08em' }}>
            {screen.aspectRatio}
          </span>
        </div>
      </div>

      {/* Info */}
      <div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 4 }}>
          {screen.name}
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--gold)', letterSpacing: '0.05em', marginBottom: 4 }}>
          {screen.aspectRatio}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {screen.formatName}
        </div>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {screen.dolbyAtmos && <span className="badge badge-gold">Dolby Atmos</span>}
        {screen.projection?.includes('Laser') && <span className="badge badge-dim">Laser</span>}
        {screen.resolution?.includes('4096') && <span className="badge badge-dim">4K</span>}
        {screen.capacity && <span className="badge badge-dim">{screen.capacity} seats</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--gold)', fontSize: 10, fontFamily: 'var(--font-serif)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        View Screen <ChevronRight size={11} />
      </div>
    </div>
  );
}

export default function TheaterPage() {
  const { theaterId } = useParams();
  const navigate = useNavigate();
  const { getTheater, getCity, dispatch } = useApp();

  const theater = getTheater(theaterId);
  const city = theater ? getCity(theater.cityId) : null;

  const [activeTab, setActiveTab] = useState('screens');

  if (!theater) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>Theater Not Found</h1>
        <button onClick={() => navigate('/')} className="btn btn-outline" style={{ marginTop: 24 }}>← Back Home</button>
      </div>
    );
  }

  const tabs = ['screens', 'about', 'map'];

  return (
    <div className="page-enter">
      {/* Hero */}
      <div style={{
        padding: '60px 24px 40px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'linear-gradient(135deg, rgba(201,168,76,0.04) 0%, transparent 60%)',
        position: 'relative',
      }}>
        <div className="container">
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            <Link to="/" style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
            <span style={{ color: 'var(--border)', fontSize: 10 }}>/</span>
            {city && <Link to={`/city/${city.id}`} style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none' }}>{city.name}</Link>}
            <span style={{ color: 'var(--border)', fontSize: 10 }}>/</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{theater.name}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                <span className="badge badge-dim" style={{ fontSize: 9 }}>
                  {theater.type === 'single-screen' ? 'Single Screen' : theater.type === 'multiplex' ? 'Multiplex' : 'Twin Cinema'}
                </span>
                {theater.chain && theater.chain !== 'Independent' && (
                  <span className="badge badge-gold" style={{ fontSize: 9 }}>{theater.chain}</span>
                )}
              </div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(24px, 4vw, 42px)', color: 'var(--text-primary)', letterSpacing: '0.04em', lineHeight: 1.1, marginBottom: 10 }}>
                {theater.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <MapPin size={12} color="var(--text-muted)" />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{theater.address}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Monitor size={12} color="var(--text-muted)" />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{theater.totalScreens} Screen{theater.totalScreens > 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/compare')}
                className="btn btn-outline btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <GitCompare size={13} />
                Compare
              </button>
              {theater.dataSource?.includes('TheatreBabu') && (
                <a
                  href="https://youtube.com/@theatrebabu9796"
                  target="_blank" rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <YoutubeIcon size={13} />
                  Source
                </a>
              )}
            </div>
          </div>

          {/* Feature badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
            {theater.features?.map(f => (
              <span key={f} style={{
                padding: '3px 10px',
                background: 'rgba(201,168,76,0.08)',
                border: '1px solid var(--border-subtle)',
                fontSize: 10,
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-serif)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}>{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.3)' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '14px 24px',
                  fontFamily: 'var(--font-serif)',
                  fontSize: 10,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: activeTab === tab ? 'var(--gold)' : 'var(--text-muted)',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid var(--gold)' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all var(--transition-base)',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container" style={{ padding: '32px 24px' }}>
        {/* SCREENS TAB */}
        {activeTab === 'screens' && (
          <div>
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 14, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 4 }}>
                  Choose Your Screen
                </h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Select a screen to view its aspect ratio, projection, and sound specifications</p>
              </div>
            </div>

            {theater.screens?.length === 1 ? (
              // Single screen — auto-redirect
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, fontFamily: 'var(--font-italic)' }}>
                  This is a single-screen theater.
                </p>
                <ScreenMiniCard screen={theater.screens[0]} theaterId={theaterId} />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {theater.screens?.map(screen => (
                  <ScreenMiniCard key={screen.id} screen={screen} theaterId={theaterId} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <div style={{ maxWidth: 680 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 14, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 16 }}>
              About This Theater
            </h2>
            <p style={{ fontFamily: 'var(--font-italic)', fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.9, marginBottom: 24 }}>
              {theater.description}
            </p>
            <div style={{ border: '1px solid var(--border-subtle)', padding: '16px 20px', background: 'rgba(0,0,0,0.3)' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Data Information</div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Data sourced from: <strong style={{ color: 'var(--text-primary)' }}>{theater.dataSource}</strong><br />
                Confidence level: <strong style={{ color: 'var(--text-primary)' }}>{theater.sourceConfidence}</strong><br />
                Officially verified: <strong style={{ color: 'var(--text-primary)' }}>{theater.verified ? 'Yes' : 'No'}</strong>
              </p>
            </div>
          </div>
        )}

        {/* MAP TAB */}
        {activeTab === 'map' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 14, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 16 }}>
              Location
            </h2>
            <TheaterMap
              theaters={[theater]}
              selectedId={theater.id}
              cityLat={theater.latitude}
              cityLng={theater.longitude}
            />
            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
              {theater.address}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
