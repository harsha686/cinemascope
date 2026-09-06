import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Monitor, Layers, MapPin, Sparkles, Check, ChevronDown } from 'lucide-react';
import { ASPECT_RATIOS } from '../../data/formats';

const THEATER_TYPES = [
  { id: 'multiplex', label: 'Multiplex' },
  { id: 'single-screen', label: 'Single Screen' },
  { id: 'twin', label: 'Twin Cinema' },
];

const COMMON_CHAINS = [
  'INOX (PVR INOX)',
  'PVR Cinemas',
  'Cinepolis',
  'SPI Cinemas',
  'Miraj Cinemas',
  'Asian Cinemas',
  'Mukta A2',
  'Independent',
];

const COMMON_FEATURES = [
  '4K Laser',
  'Barco Flagship',
  'Dolby Atmos',
  'IMAX',
  'Recliners',
  'Large Format',
  'Barco HDR',
  'Christie Projector',
  'JBL Sound',
  '4K',
  'Premium Screens',
  'QSC Sound',
];

const DEFAULT_SCREEN_TEMPLATE = (screenNum = 1) => ({
  id: `screen-${screenNum}-${Date.now()}`,
  screenNumber: screenNum,
  name: `Screen ${screenNum}`,
  aspectRatio: '2.39:1',
  aspectRatioNumeric: 2.39,
  formatName: 'Scope',
  screenType: 'Standard Widescreen',
  screenWidthM: 12.5,
  screenHeightM: 5.2,
  capacity: 200,
  projection: 'Digital Laser',
  projectorBrand: 'Barco',
  projectorModel: 'Barco SP4K-15',
  resolution: '4096 × 2160 (4K)',
  soundSystem: 'Dolby Atmos',
  speakerCount: 48,
  subwooferCount: 4,
  dolbyAtmos: true,
  dolbyAtmosProcessor: 'Dolby CP950',
  screenMaterial: 'Silver Screen',
  seatingType: ['Standard', 'Recliners'],
  dataSource: 'Admin Verified',
  sourceConfidence: 'verified',
  notes: '',
});

export default function AdminTheaterFormModal({
  isOpen,
  onClose,
  onSave,
  theaterToEdit = null,
  allCities = [],
  defaultCityId = 'visakhapatnam',
}) {
  const [formData, setFormData] = useState({
    name: '',
    cityId: defaultCityId,
    type: 'multiplex',
    chain: 'Independent',
    customChain: '',
    area: '',
    address: '',
    latitude: '',
    longitude: '',
    description: '',
    features: ['4K Laser', 'Dolby Atmos'],
    dataSource: 'Admin Added',
    sourceConfidence: 'verified',
    verified: true,
    screens: [DEFAULT_SCREEN_TEMPLATE(1)],
  });

  const [activeScreenIndex, setActiveScreenIndex] = useState(0);
  const [newFeatureInput, setNewFeatureInput] = useState('');

  useEffect(() => {
    if (theaterToEdit) {
      setFormData({
        name: theaterToEdit.name || '',
        cityId: theaterToEdit.cityId || defaultCityId,
        type: theaterToEdit.type || 'multiplex',
        chain: COMMON_CHAINS.includes(theaterToEdit.chain) ? theaterToEdit.chain : 'Other',
        customChain: COMMON_CHAINS.includes(theaterToEdit.chain) ? '' : (theaterToEdit.chain || ''),
        area: theaterToEdit.area || '',
        address: theaterToEdit.address || '',
        latitude: theaterToEdit.latitude !== undefined ? String(theaterToEdit.latitude) : '',
        longitude: theaterToEdit.longitude !== undefined ? String(theaterToEdit.longitude) : '',
        description: theaterToEdit.description || '',
        features: theaterToEdit.features || [],
        dataSource: theaterToEdit.dataSource || 'Admin Added',
        sourceConfidence: theaterToEdit.sourceConfidence || 'verified',
        verified: theaterToEdit.verified !== undefined ? theaterToEdit.verified : true,
        screens: theaterToEdit.screens && theaterToEdit.screens.length > 0 ? theaterToEdit.screens : [DEFAULT_SCREEN_TEMPLATE(1)],
      });
      setActiveScreenIndex(0);
    } else {
      setFormData({
        name: '',
        cityId: defaultCityId,
        type: 'multiplex',
        chain: 'Independent',
        customChain: '',
        area: '',
        address: '',
        latitude: '',
        longitude: '',
        description: '',
        features: ['4K Laser', 'Dolby Atmos'],
        dataSource: 'Admin Added',
        sourceConfidence: 'verified',
        verified: true,
        screens: [DEFAULT_SCREEN_TEMPLATE(1)],
      });
      setActiveScreenIndex(0);
    }
  }, [theaterToEdit, defaultCityId, isOpen]);

  if (!isOpen) return null;

  const handleAddScreen = () => {
    const nextNum = formData.screens.length + 1;
    const newScreen = DEFAULT_SCREEN_TEMPLATE(nextNum);
    setFormData(prev => ({
      ...prev,
      screens: [...prev.screens, newScreen],
    }));
    setActiveScreenIndex(formData.screens.length);
  };

  const handleRemoveScreen = (idx) => {
    if (formData.screens.length <= 1) {
      alert('A theater must have at least 1 screen.');
      return;
    }
    const updatedScreens = formData.screens.filter((_, i) => i !== idx);
    setFormData(prev => ({
      ...prev,
      screens: updatedScreens,
    }));
    setActiveScreenIndex(Math.max(0, idx - 1));
  };

  const updateScreenField = (idx, field, value) => {
    setFormData(prev => {
      const screens = [...prev.screens];
      const screen = { ...screens[idx] };

      if (field === 'aspectRatio') {
        const found = ASPECT_RATIOS.find(r => r.ratio === value);
        screen.aspectRatio = value;
        screen.aspectRatioNumeric = found ? found.numeric : parseFloat(value) || 2.39;
        screen.formatName = found ? found.name : (value === '2.39:1' ? 'Scope' : 'Flat');
      } else if (field === 'screenWidthM' || field === 'screenHeightM' || field === 'capacity' || field === 'speakerCount' || field === 'subwooferCount') {
        screen[field] = value === '' ? '' : parseFloat(value) || 0;
      } else {
        screen[field] = value;
      }

      screens[idx] = screen;
      return { ...prev, screens };
    });
  };

  const toggleFeature = (feat) => {
    setFormData(prev => {
      const exists = prev.features.includes(feat);
      return {
        ...prev,
        features: exists ? prev.features.filter(f => f !== feat) : [...prev.features, feat],
      };
    });
  };

  const handleAddCustomFeature = (e) => {
    e.preventDefault();
    const trimmed = newFeatureInput.trim();
    if (!trimmed) return;
    if (!formData.features.includes(trimmed)) {
      setFormData(prev => ({ ...prev, features: [...prev.features, trimmed] }));
    }
    setNewFeatureInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a theater name.');
      return;
    }
    if (!formData.cityId) {
      alert('Please select a city.');
      return;
    }

    const theaterId = theaterToEdit?.id || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const selectedChain = formData.chain === 'Other' ? (formData.customChain.trim() || 'Independent') : formData.chain;

    const finalScreens = formData.screens.map((s, idx) => ({
      ...s,
      id: s.id || `${theaterId}-screen${idx + 1}`,
      screenNumber: idx + 1,
      name: s.name || `Screen ${idx + 1}`,
      aspectRatioNumeric: s.aspectRatioNumeric || (s.aspectRatio === '1.85:1' ? 1.85 : 2.39),
      screenWidthM: parseFloat(s.screenWidthM) || 12.0,
      screenHeightM: parseFloat(s.screenHeightM) || 5.0,
      capacity: parseInt(s.capacity, 10) || 150,
      speakerCount: parseInt(s.speakerCount, 10) || 32,
      subwooferCount: parseInt(s.subwooferCount, 10) || 2,
    }));

    const finalTheater = {
      id: theaterId,
      cityId: formData.cityId,
      name: formData.name.trim(),
      alias: theaterToEdit?.alias || [formData.name.trim()],
      chain: selectedChain,
      type: formData.type,
      totalScreens: finalScreens.length,
      area: formData.area.trim() || formData.name.trim(),
      address: formData.address.trim() || `${formData.name.trim()}, ${formData.cityId}`,
      latitude: formData.latitude ? parseFloat(formData.latitude) : 17.6868,
      longitude: formData.longitude ? parseFloat(formData.longitude) : 83.2185,
      description: formData.description.trim(),
      features: formData.features,
      dataSource: formData.dataSource,
      sourceConfidence: formData.sourceConfidence,
      verified: formData.verified,
      screens: finalScreens,
    };

    onSave(finalTheater);
    onClose();
  };

  const currentScreen = formData.screens[activeScreenIndex] || formData.screens[0];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2500,
      background: 'rgba(0,0,0,0.88)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        maxWidth: 880,
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: 28,
        boxShadow: 'var(--shadow-card)',
        color: 'var(--text-primary)',
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
          <div>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--gold)' }}>
              {theaterToEdit ? 'Admin Theater Editor' : 'Admin Theater Addition'}
            </span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--text-primary)', marginTop: 2 }}>
              {formData.name || (theaterToEdit ? 'Edit Theater' : 'Add New Theater')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: 6, color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Section 1: Basic Info */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: 12 }}>
              1. Theater Overview
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Theater Name *
                </label>
                <input
                  required
                  className="input"
                  placeholder="e.g. Varun INOX, Sangam Sarat, Jagadamba..."
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                  City *
                </label>
                <select
                  required
                  className="input"
                  value={formData.cityId}
                  onChange={e => setFormData({ ...formData, cityId: e.target.value })}
                >
                  {allCities.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.state || 'India'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Theater Type
                </label>
                <select
                  className="input"
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                >
                  {THEATER_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Chain / Brand
                </label>
                <select
                  className="input"
                  value={formData.chain}
                  onChange={e => setFormData({ ...formData, chain: e.target.value })}
                >
                  {COMMON_CHAINS.map(ch => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                  <option value="Other">Other / Custom Chain</option>
                </select>
              </div>

              {formData.chain === 'Other' && (
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Custom Chain Name
                  </label>
                  <input
                    className="input"
                    placeholder="Enter chain name"
                    value={formData.customChain}
                    onChange={e => setFormData({ ...formData, customChain: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Area / Neighborhood
                </label>
                <input
                  className="input"
                  placeholder="e.g. Beach Road, Dwaraka Nagar, RTC Complex"
                  value={formData.area}
                  onChange={e => setFormData({ ...formData, area: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                Full Address
              </label>
              <input
                className="input"
                placeholder="Full address of the cinema complex"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                Theater Bio / Description
              </label>
              <textarea
                className="input"
                rows={2}
                placeholder="A brief overview of the cinema's history, projection setup, sound, and viewing experience..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          {/* Section 2: Features & Badges */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 18 }}>
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: 12 }}>
              2. Features & Highlights
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {COMMON_FEATURES.map(feat => {
                const isSelected = formData.features.includes(feat);
                return (
                  <button
                    key={feat}
                    type="button"
                    onClick={() => toggleFeature(feat)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 11,
                      fontFamily: 'var(--font-serif)',
                      borderRadius: 3,
                      border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border-subtle)'}`,
                      background: isSelected ? 'var(--gold-faint)' : 'rgba(255,255,255,0.02)',
                      color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    {isSelected && <Check size={11} />}
                    {feat}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 8, maxWidth: 360 }}>
              <input
                className="input"
                style={{ fontSize: 11, padding: '4px 10px' }}
                placeholder="Add custom tag (e.g. RGB Laser)..."
                value={newFeatureInput}
                onChange={e => setNewFeatureInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomFeature(e); } }}
              />
              <button
                type="button"
                onClick={handleAddCustomFeature}
                className="btn btn-outline btn-sm"
                style={{ fontSize: 11, padding: '4px 10px' }}
              >
                + Add
              </button>
            </div>
          </div>

          {/* Section 3: Screens Specification */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)' }}>
                  3. Screens Configuration ({formData.screens.length} Screen{formData.screens.length !== 1 ? 's' : ''})
                </h4>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Configure screen aspect ratio, projection technology, audio processor, and physical dimensions
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddScreen}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}
              >
                <Plus size={13} /> Add Another Screen
              </button>
            </div>

            {/* Screen selection tabs */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
              {formData.screens.map((screen, idx) => {
                const isActive = activeScreenIndex === idx;
                return (
                  <div key={screen.id || idx} style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setActiveScreenIndex(idx)}
                      style={{
                        padding: '6px 14px',
                        fontFamily: 'var(--font-serif)',
                        fontSize: 11,
                        background: isActive ? 'var(--gold-faint)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isActive ? 'var(--gold)' : 'var(--border-subtle)'}`,
                        borderRadius: formData.screens.length > 1 ? '3px 0 0 3px' : 3,
                        color: isActive ? 'var(--gold)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {screen.name || `Screen ${idx + 1}`}
                      <span style={{ fontSize: 9, opacity: 0.7, marginLeft: 6 }}>({screen.aspectRatio})</span>
                    </button>
                    {formData.screens.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveScreen(idx)}
                        title="Delete Screen"
                        style={{
                          padding: '6px 8px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: `1px solid ${isActive ? 'var(--gold)' : 'var(--border-subtle)'}`,
                          borderLeft: 'none',
                          borderRadius: '0 3px 3px 0',
                          color: '#f87171',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Active Screen Details Form */}
            {currentScreen && (
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', padding: 18, borderRadius: 4 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                      Screen Label
                    </label>
                    <input
                      className="input"
                      value={currentScreen.name}
                      onChange={e => updateScreenField(activeScreenIndex, 'name', e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                      Aspect Ratio
                    </label>
                    <select
                      className="input"
                      value={currentScreen.aspectRatio}
                      onChange={e => updateScreenField(activeScreenIndex, 'aspectRatio', e.target.value)}
                    >
                      {ASPECT_RATIOS.map(ar => (
                        <option key={ar.ratio} value={ar.ratio}>
                          {ar.ratio} ({ar.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                      Width (Meters)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="input"
                      value={currentScreen.screenWidthM}
                      onChange={e => updateScreenField(activeScreenIndex, 'screenWidthM', e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                      Height (Meters)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="input"
                      value={currentScreen.screenHeightM}
                      onChange={e => updateScreenField(activeScreenIndex, 'screenHeightM', e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                      Seating Capacity
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={currentScreen.capacity}
                      onChange={e => updateScreenField(activeScreenIndex, 'capacity', e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                      Projection Type
                    </label>
                    <input
                      className="input"
                      placeholder="e.g. Digital Laser, 4K RGB Laser, Xenon"
                      value={currentScreen.projection}
                      onChange={e => updateScreenField(activeScreenIndex, 'projection', e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                      Projector Brand & Model
                    </label>
                    <input
                      className="input"
                      placeholder="e.g. Barco SP4K-15, Christie CP4420"
                      value={currentScreen.projectorBrand}
                      onChange={e => updateScreenField(activeScreenIndex, 'projectorBrand', e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                      Resolution
                    </label>
                    <input
                      className="input"
                      placeholder="e.g. 4096 × 2160 (4K), 2K"
                      value={currentScreen.resolution}
                      onChange={e => updateScreenField(activeScreenIndex, 'resolution', e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                      Sound System
                    </label>
                    <input
                      className="input"
                      placeholder="e.g. Dolby Atmos, 7.1 Surround, Dolby 5.1"
                      value={currentScreen.soundSystem}
                      onChange={e => updateScreenField(activeScreenIndex, 'soundSystem', e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                      Dolby Atmos Equipped?
                    </label>
                    <select
                      className="input"
                      value={currentScreen.dolbyAtmos ? 'yes' : 'no'}
                      onChange={e => updateScreenField(activeScreenIndex, 'dolbyAtmos', e.target.value === 'yes')}
                    >
                      <option value="yes">Yes (Dolby Atmos)</option>
                      <option value="no">No</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                      Speaker Count
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={currentScreen.speakerCount}
                      onChange={e => updateScreenField(activeScreenIndex, 'speakerCount', e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                      Screen Material
                    </label>
                    <input
                      className="input"
                      placeholder="e.g. Silver Screen, Matt White"
                      value={currentScreen.screenMaterial}
                      onChange={e => updateScreenField(activeScreenIndex, 'screenMaterial', e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Screen Notes
                  </label>
                  <input
                    className="input"
                    placeholder="Specific advice, sweet spot seating, or optical strengths..."
                    value={currentScreen.notes}
                    onChange={e => updateScreenField(activeScreenIndex, 'notes', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 18, marginTop: 6 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ minWidth: 140, justifyContent: 'center' }}
            >
              {theaterToEdit ? 'Save Changes' : 'Add Theater'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
