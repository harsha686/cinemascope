import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, Upload, Link, Check, RefreshCw, Image as ImageIcon, Sparkles } from 'lucide-react';
import {
  getUserFavoritePoster,
  setUserFavoritePoster,
  removeUserFavoritePoster,
  fetchAvailablePostersForMovie,
} from '../../services/userPosterService';

export default function FavoritePosterPickerModal({
  isOpen,
  onClose,
  movie,
  onPosterChanged,
}) {
  const movieId = movie?.id || movie?.tmdbId;
  const [availablePosters, setAvailablePosters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentFav, setCurrentFav] = useState(null);
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [customUrl, setCustomUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen && movie) {
      const savedFav = getUserFavoritePoster(movieId);
      setCurrentFav(savedFav);
      setSelectedPoster(savedFav || movie.posterUrl);

      setLoading(true);
      fetchAvailablePostersForMovie(movie)
        .then(posters => {
          setAvailablePosters(posters);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen, movie, movieId]);

  if (!isOpen || !movie) return null;

  const handleSelectPoster = (url) => {
    setSelectedPoster(url);
  };

  const handleSetFavorite = () => {
    if (!selectedPoster) return;
    setUserFavoritePoster(movieId, selectedPoster);
    setCurrentFav(selectedPoster);
    setToast('★ Saved as your favorite poster for this movie!');
    if (onPosterChanged) onPosterChanged(selectedPoster);
  };

  const handleResetToDefault = () => {
    removeUserFavoritePoster(movieId);
    setCurrentFav(null);
    setSelectedPoster(movie.posterUrl);
    setToast('Reverted to official theatrical poster.');
    if (onPosterChanged) onPosterChanged(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const customItem = {
        id: `custom-upload-${Date.now()}`,
        url: dataUrl,
        label: 'Uploaded Poster',
        type: 'custom',
      };
      setAvailablePosters(prev => [customItem, ...prev]);
      setSelectedPoster(dataUrl);
      setUserFavoritePoster(movieId, dataUrl, { isCustom: true });
      setCurrentFav(dataUrl);
      setToast('★ Custom poster uploaded and saved as favorite!');
      if (onPosterChanged) onPosterChanged(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleAddCustomUrl = () => {
    if (!customUrl.trim()) return;
    const clean = customUrl.trim();
    const customItem = {
      id: `custom-url-${Date.now()}`,
      url: clean,
      label: 'Custom Link Poster',
      type: 'custom',
    };
    setAvailablePosters(prev => [customItem, ...prev]);
    setSelectedPoster(clean);
    setUserFavoritePoster(movieId, clean, { isCustom: true });
    setCurrentFav(clean);
    setCustomUrl('');
    setShowUrlInput(false);
    setToast('★ Custom link poster saved as your favorite!');
    if (onPosterChanged) onPosterChanged(clean);
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card, #14110d)',
          border: '1px solid var(--gold, #dcb65b)',
          borderRadius: 8,
          maxWidth: 680,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(220,182,91,0.15)',
              border: '1px solid var(--gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold)',
            }}>
              <Star size={16} fill="var(--gold)" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold)' }}>
                Poster Artwork Gallery
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--text-primary)', margin: 0 }}>
                Choose Favorite Poster for "{movie.title}"
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div style={{
            background: 'rgba(220,182,91,0.15)',
            borderBottom: '1px solid var(--gold)',
            color: 'var(--gold)',
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 600,
            textAlign: 'center',
          }}>
            {toast}
          </div>
        )}

        {/* Content Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Select your preferred poster cut below or upload your own favorite artwork:
            </span>
            {currentFav && (
              <button
                type="button"
                onClick={handleResetToDefault}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <RefreshCw size={11} /> Reset to Official Poster
              </button>
            )}
          </div>

          {/* Posters Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              <RefreshCw size={24} className="spin" style={{ margin: '0 auto 10px', color: 'var(--gold)' }} />
              Discovering alternative cuts & posters...
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
              gap: 12,
              maxHeight: '45vh',
              overflowY: 'auto',
              padding: '4px',
            }}>
              {availablePosters.map((p, idx) => {
                const isSelected = selectedPoster === p.url;
                const isFav = currentFav === p.url;
                return (
                  <div
                    key={p.id || idx}
                    onClick={() => handleSelectPoster(p.url)}
                    style={{
                      position: 'relative',
                      aspectRatio: '2/3',
                      borderRadius: 6,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.12)',
                      boxShadow: isSelected ? '0 0 14px rgba(220,182,91,0.5)' : 'none',
                      transform: isSelected ? 'scale(1.03)' : 'none',
                      transition: 'all 150ms ease',
                      background: '#000',
                    }}
                  >
                    <img
                      src={p.url}
                      alt={p.label}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => e.target.src = '/demo-frame.jpg'}
                    />
                    {isFav && (
                      <span style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        background: 'rgba(0,0,0,0.85)',
                        border: '1px solid var(--gold)',
                        color: 'var(--gold)',
                        borderRadius: 12,
                        padding: '2px 6px',
                        fontSize: 9,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                      }}>
                        ★ FAV
                      </span>
                    )}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent)',
                      padding: '12px 6px 4px',
                      fontSize: 9,
                      color: isSelected ? 'var(--gold)' : '#fff',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {p.label || 'Poster'}
                    </div>
                  </div>
                );
              })}

              {/* Upload Card */}
              <label style={{
                position: 'relative',
                aspectRatio: '2/3',
                borderRadius: 6,
                border: '1px dashed var(--gold)',
                background: 'rgba(220,182,91,0.06)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                gap: 6,
                padding: 8,
                textAlign: 'center',
                color: 'var(--gold)',
              }}>
                <Upload size={20} />
                <span style={{ fontSize: 11, fontWeight: 600 }}>Upload File</span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>From Device</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>
          )}

          {/* Paste Custom URL Bar */}
          <div style={{ paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {!showUrlInput ? (
              <button
                type="button"
                onClick={() => setShowUrlInput(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Link size={12} /> Paste custom image web link
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  className="input"
                  style={{ flex: 1, fontSize: 12 }}
                  value={customUrl}
                  onChange={e => setCustomUrl(e.target.value)}
                  placeholder="https://... direct image URL"
                />
                <button
                  type="button"
                  onClick={handleAddCustomUrl}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: 11 }}
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(false)}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 11 }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {selectedPoster === currentFav
              ? '✓ This poster is currently saved as your favorite.'
              : 'Select any poster cut and click "Keep as Favorite" below.'}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm"
            >
              Done
            </button>
            <button
              type="button"
              onClick={handleSetFavorite}
              disabled={selectedPoster === currentFav}
              className="btn btn-primary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 600,
              }}
            >
              <Star size={13} fill={selectedPoster === currentFav ? 'transparent' : 'currentColor'} />
              <span>{selectedPoster === currentFav ? '✓ Current Favorite' : 'Keep as Favorite Poster'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
