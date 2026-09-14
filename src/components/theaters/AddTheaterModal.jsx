import React, { useState } from 'react';
import { X, Plus, Check, MapPin, Monitor, Film, Sparkles, Building2, Volume2, ShieldCheck } from 'lucide-react';
import { getFeatureBadgeStyle } from '../city/TheaterCard';

const THEATER_TYPES = [
  { id: 'single-screen', label: 'Single Screen' },
  { id: 'multiplex', label: 'Multiplex' },
  { id: 'twin', label: 'Twin Cinema' },
];

const COMMON_CHAINS = [
  'Independent',
  'INOX (PVR INOX)',
  'PVR Cinemas',
  'Cinepolis',
  'Asian Cinemas',
  'SPI Cinemas',
  'Miraj Cinemas',
  'Mukta A2',
  'Other',
];

const POPULAR_FEATURES = [
  'Dolby Atmos',
  '4K Laser',
  '4K',
  'Barco HDR',
  'Barco Flagship',
  'IMAX',
  'Christie Projector',
  'JBL Sound',
  'Recliners',
  'Large Format',
];

export default function AddTheaterModal({
  isOpen,
  onClose,
  onSave,
  allCities = [],
  defaultCityId = 'visakhapatnam',
  currentUser = null,
}) {
  const [formData, setFormData] = useState({
    name: '',
    cityId: defaultCityId,
    area: '',
    address: '',
    type: 'single-screen',
    chain: 'Independent',
    customChain: '',
    totalScreens: 1,
    features: ['Dolby Atmos', '4K Laser'],
    mainAspectRatio: '2.39:1',
    mainProjection: '4K Laser',
    mainSound: 'Dolby Atmos',
    capacity: 250,
    description: '',
  });

  const [customFeatureInput, setCustomFeatureInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const toggleFeature = (feature) => {
    setFormData((prev) => {
      const exists = prev.features.includes(feature);
      return {
        ...prev,
        features: exists
          ? prev.features.filter((f) => f !== feature)
          : [...prev.features, feature],
      };
    });
  };

  const handleAddCustomFeature = (e) => {
    e.preventDefault();
    const trimmed = customFeatureInput.trim();
    if (!trimmed) return;
    if (!formData.features.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, trimmed],
      }));
    }
    setCustomFeatureInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim()) {
      setErrorMessage('Please provide the theater name.');
      return;
    }

    if (!formData.cityId) {
      setErrorMessage('Please select a city.');
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanName = formData.name.trim();
      const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const uniqueSuffix = Date.now().toString().slice(-4);
      const theaterId = `${slug}-${uniqueSuffix}`;

      const selectedChain =
        formData.chain === 'Other'
          ? (formData.customChain.trim() || 'Independent')
          : formData.chain;

      const screenCount = Math.max(1, parseInt(formData.totalScreens, 10) || 1);
      const isScope = formData.mainAspectRatio === '2.39:1';

      // Build screens list
      const screens = [];
      for (let i = 1; i <= screenCount; i++) {
        const isMain = i === 1;
        screens.push({
          id: `${theaterId}-screen${i}`,
          screenNumber: i,
          name: screenCount === 1 ? 'Main Screen' : `Screen ${i}`,
          aspectRatio: isMain ? formData.mainAspectRatio : '2.39:1',
          aspectRatioNumeric: isMain ? (isScope ? 2.39 : 1.85) : 2.39,
          formatName: isMain ? (isScope ? 'Scope' : 'Flat') : 'Scope',
          screenType: isMain && formData.features.includes('IMAX') ? 'IMAX' : 'Standard Widescreen',
          screenWidthM: 13.0,
          screenHeightM: isScope ? 5.4 : 7.0,
          capacity: isMain ? (parseInt(formData.capacity, 10) || 200) : 180,
          projection: isMain ? formData.mainProjection : 'Digital Laser',
          projectorBrand: formData.mainProjection.includes('Barco') ? 'Barco' : formData.mainProjection.includes('Christie') ? 'Christie' : 'Barco',
          projectorModel: 'Laser Cinema',
          resolution: formData.mainProjection.includes('4K') || formData.features.includes('4K') ? '4096 × 2160 (4K)' : '2048 × 1080 (2K)',
          soundSystem: isMain ? formData.mainSound : 'Dolby Atmos',
          speakerCount: formData.mainSound.includes('Atmos') ? 48 : 24,
          subwooferCount: 4,
          dolbyAtmos: formData.mainSound.includes('Atmos') || formData.features.includes('Dolby Atmos'),
          dolbyAtmosProcessor: 'Dolby CP950',
          screenMaterial: 'Silver Screen',
          seatingType: formData.features.includes('Recliners') ? ['Standard', 'Recliners'] : ['Standard'],
          dataSource: currentUser?.role === 'ADMIN' ? 'Admin Verified' : 'Community Contributed',
          sourceConfidence: currentUser?.role === 'ADMIN' ? 'verified' : 'reported',
          notes: i === 1 ? formData.description.trim() : '',
        });
      }

      const targetCity = allCities.find((c) => c.id === formData.cityId) || {
        name: formData.cityId,
        latitude: 17.6868,
        longitude: 83.2185,
      };

      const finalTheater = {
        id: theaterId,
        cityId: formData.cityId,
        name: cleanName,
        alias: [cleanName],
        chain: selectedChain,
        type: formData.type,
        totalScreens: screenCount,
        area: formData.area.trim() || cleanName,
        address: formData.address.trim() || `${cleanName}, ${formData.area.trim() || targetCity.name}, ${targetCity.name}`,
        latitude: targetCity.latitude || 17.6868,
        longitude: targetCity.longitude || 83.2185,
        description: formData.description.trim() || `${cleanName} is a popular cinema in ${formData.area || targetCity.name}, ${targetCity.name}.`,
        features: formData.features,
        dataSource: currentUser?.role === 'ADMIN' ? 'Admin Verified' : 'Community Contributed',
        sourceConfidence: currentUser?.role === 'ADMIN' ? 'verified' : 'reported',
        verified: currentUser?.role === 'ADMIN',
        addedBy: currentUser ? (currentUser.username || currentUser.name || currentUser.email) : 'Moviegoer',
        createdAt: new Date().toISOString(),
        screens,
      };

      onSave(finalTheater);
      onClose();
    } catch (err) {
      console.error('Failed to add theater:', err);
      setErrorMessage('Failed to save theater. Please check the details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2500,
        background: 'rgba(0, 0, 0, 0.86)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          maxWidth: 680,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px 24px',
          boxShadow: 'var(--shadow-card)',
          color: 'var(--text-primary)',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 20,
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontFamily: 'var(--font-serif)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--gold)',
                marginBottom: 4,
              }}
            >
              <Sparkles size={13} />
              <span>Community Theater Addition</span>
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 22,
                color: 'var(--text-primary)',
                letterSpacing: '0.02em',
                margin: 0,
              }}
            >
              Add Your Favorite Theater
            </h3>
            <p
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                margin: '4px 0 0 0',
              }}
            >
              Can't find a cinema on CinemaScope? Add it here with your favorite features!
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: 6, color: 'var(--text-muted)' }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 6,
              color: '#f87171',
              fontSize: 12,
              marginBottom: 16,
            }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Section 1: Basic Info */}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--gold)',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Building2 size={13} />
              <span>1. Theater Details</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {/* Theater Name */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontFamily: 'var(--font-serif)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Theater Name *
                </label>
                <input
                  required
                  className="input"
                  placeholder="e.g. Sarat Cinema 4K, Jagadamba 70mm, VMax Screen..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ fontSize: 13 }}
                />
              </div>

              {/* City Selection */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontFamily: 'var(--font-serif)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  City *
                </label>
                <select
                  className="input"
                  value={formData.cityId}
                  onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}
                  style={{ fontSize: 13, background: '#14120e', color: '#ffffff' }}
                >
                  {allCities.map((c) => (
                    <option key={c.id} value={c.id} style={{ background: '#14120e', color: '#ffffff' }}>
                      {c.name} ({c.state})
                    </option>
                  ))}
                </select>
              </div>

              {/* Area / Neighborhood */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontFamily: 'var(--font-serif)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Area / Locality
                </label>
                <input
                  className="input"
                  placeholder="e.g. Dabagardens, Beach Road, Gajuwaka"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  style={{ fontSize: 13 }}
                />
              </div>

              {/* Theater Type */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontFamily: 'var(--font-serif)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Cinema Type
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {THEATER_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          type: t.id,
                          totalScreens: t.id === 'single-screen' ? 1 : t.id === 'twin' ? 2 : Math.max(3, formData.totalScreens),
                        })
                      }
                      style={{
                        flex: 1,
                        padding: '7px 8px',
                        fontSize: 11,
                        borderRadius: 6,
                        border: formData.type === t.id ? '1px solid var(--gold)' : '1px solid var(--border-subtle)',
                        background: formData.type === t.id ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.02)',
                        color: formData.type === t.id ? 'var(--gold)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cinema Chain */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontFamily: 'var(--font-serif)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Chain / Brand
                </label>
                <select
                  className="input"
                  value={formData.chain}
                  onChange={(e) => setFormData({ ...formData, chain: e.target.value })}
                  style={{ fontSize: 13, background: '#14120e', color: '#ffffff' }}
                >
                  {COMMON_CHAINS.map((ch) => (
                    <option key={ch} value={ch} style={{ background: '#14120e', color: '#ffffff' }}>
                      {ch}
                    </option>
                  ))}
                </select>
                {formData.chain === 'Other' && (
                  <input
                    className="input"
                    placeholder="Enter chain name"
                    value={formData.customChain}
                    onChange={(e) => setFormData({ ...formData, customChain: e.target.value })}
                    style={{ fontSize: 12, marginTop: 6 }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Features */}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--gold)',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Volume2 size={13} />
              <span>2. Key Features & Technology</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
              Select all features that make this theater special:
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {POPULAR_FEATURES.map((feat) => {
                const isSelected = formData.features.includes(feat);
                const badgeStyle = getFeatureBadgeStyle(feat);
                return (
                  <button
                    key={feat}
                    type="button"
                    onClick={() => toggleFeature(feat)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 10px',
                      borderRadius: 16,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      border: isSelected
                        ? (badgeStyle.borderColor ? `1px solid ${badgeStyle.borderColor}` : '1px solid var(--gold)')
                        : '1px solid var(--border-subtle)',
                      background: isSelected
                        ? (badgeStyle.background || 'rgba(201,168,76,0.2)')
                        : 'rgba(255,255,255,0.02)',
                      color: isSelected ? (badgeStyle.color || 'var(--gold)') : 'var(--text-muted)',
                    }}
                  >
                    {isSelected && <Check size={12} />}
                    {feat}
                  </button>
                );
              })}
            </div>

            {/* Custom Feature Add */}
            <div style={{ display: 'flex', gap: 8, maxWidth: 360 }}>
              <input
                className="input"
                placeholder="Add custom feature (e.g. Curved Screen, RGB Laser)"
                value={customFeatureInput}
                onChange={(e) => setCustomFeatureInput(e.target.value)}
                style={{ fontSize: 12 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomFeature(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomFeature}
                className="btn btn-outline btn-sm"
                style={{ fontSize: 11, whiteSpace: 'nowrap' }}
              >
                + Add
              </button>
            </div>
          </div>

          {/* Section 3: Screen & Projection Quick Setup */}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--gold)',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Monitor size={13} />
              <span>3. Screen & Presentation</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
              {/* Total Screens */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontFamily: 'var(--font-serif)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Total Screens
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  className="input"
                  value={formData.totalScreens}
                  onChange={(e) => setFormData({ ...formData, totalScreens: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                  style={{ fontSize: 13 }}
                />
              </div>

              {/* Main Screen Aspect Ratio */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontFamily: 'var(--font-serif)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Aspect Ratio
                </label>
                <select
                  className="input"
                  value={formData.mainAspectRatio}
                  onChange={(e) => setFormData({ ...formData, mainAspectRatio: e.target.value })}
                  style={{ fontSize: 13, background: '#14120e', color: '#ffffff' }}
                >
                  <option value="2.39:1" style={{ background: '#14120e', color: '#ffffff' }}>Scope (2.39:1 Widescreen)</option>
                  <option value="1.85:1" style={{ background: '#14120e', color: '#ffffff' }}>Flat (1.85:1 Academy)</option>
                </select>
              </div>

              {/* Sound System */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontFamily: 'var(--font-serif)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Primary Sound System
                </label>
                <select
                  className="input"
                  value={formData.mainSound}
                  onChange={(e) => setFormData({ ...formData, mainSound: e.target.value })}
                  style={{ fontSize: 13, background: '#14120e', color: '#ffffff' }}
                >
                  <option value="Dolby Atmos" style={{ background: '#14120e', color: '#ffffff' }}>Dolby Atmos</option>
                  <option value="7.1 Surround" style={{ background: '#14120e', color: '#ffffff' }}>7.1 Surround</option>
                  <option value="5.1 Surround" style={{ background: '#14120e', color: '#ffffff' }}>5.1 Surround</option>
                  <option value="Dolby Digital" style={{ background: '#14120e', color: '#ffffff' }}>Dolby Digital</option>
                </select>
              </div>

              {/* Seating Capacity */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontFamily: 'var(--font-serif)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Approx Capacity (seats)
                </label>
                <input
                  type="number"
                  min="20"
                  max="2000"
                  className="input"
                  placeholder="e.g. 250"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  style={{ fontSize: 13 }}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Address & Description */}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--gold)',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <MapPin size={13} />
              <span>4. Location & Personal Note</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontFamily: 'var(--font-serif)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}
                >
                  Street Address / Landmark (Optional)
                </label>
                <input
                  className="input"
                  placeholder="e.g. Near RTC Complex, Main Road"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{ fontSize: 13 }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontFamily: 'var(--font-serif)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}
                >
                  Why do you love this theater? (Optional)
                </label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="e.g. Huge screen with punchy Dolby Atmos bass, best front row legroom in town..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ fontSize: 13, resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          {/* Submission Info / Contributor Tag */}
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(201,168,76,0.06)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 11,
              color: 'var(--text-secondary)',
            }}
          >
            <ShieldCheck size={16} color="var(--gold)" />
            <span>
              Adding as{' '}
              <strong style={{ color: 'var(--gold)' }}>
                {currentUser?.name || currentUser?.username || 'Community Moviegoer'}
              </strong>
              . This theater will be instantly available in the city directory for all users.
            </span>
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              paddingTop: 12,
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={16} />
              {isSubmitting ? 'Saving...' : 'Add Favorite Theater'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
