import React, { useState } from 'react';
import { RefreshCw, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../../AppContext';
import { isSupabaseConfigured } from '../../services/supabase';
import CloudSyncModal from './CloudSyncModal';

export default function CloudSyncButton({
  variant = 'compact', // 'compact' | 'full' | 'pill'
  showStatus = true,
  style = {},
  className = '',
}) {
  const { syncCloudData, isRefreshing, syncStatus, lastSyncedAt } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const configured = isSupabaseConfigured();

  const handleSyncClick = async (e) => {
    e.stopPropagation();
    try {
      const res = await syncCloudData();
      if (res && res.success) {
        setToastMsg('✨ Cloud data synced!');
      } else {
        setToastMsg('⚠️ Check Cloud DB settings');
      }
    } catch {
      setToastMsg('⚠️ Sync error');
    }
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleOpenModal = (e) => {
    e.stopPropagation();
    setModalOpen(true);
  };

  if (variant === 'pill') {
    return (
      <>
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', ...style }}>
          <button
            type="button"
            onClick={handleSyncClick}
            disabled={isRefreshing}
            title={lastSyncedAt ? `Last synced: ${new Date(lastSyncedAt).toLocaleTimeString()} (Click to sync now)` : 'Click to sync with Cloud DB'}
            className={`btn btn-outline btn-sm ${className}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              padding: '5px 12px',
              borderRadius: 20,
              background: isRefreshing ? 'var(--gold-faint)' : 'rgba(0,0,0,0.4)',
              borderColor: configured ? 'var(--gold-dim)' : 'rgba(239,68,68,0.4)',
              color: isRefreshing ? 'var(--gold)' : 'var(--text-primary)',
              cursor: isRefreshing ? 'default' : 'pointer',
            }}
          >
            <RefreshCw
              size={12}
              style={{
                color: 'var(--gold)',
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
              }}
            />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Cloud'}</span>
            <span
              onClick={handleOpenModal}
              title="Cloud DB Settings"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 4,
                padding: '2px 5px',
                borderRadius: 10,
                background: configured ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.2)',
                color: configured ? '#4ade80' : '#f87171',
                fontSize: 9,
                fontWeight: 700,
              }}
            >
              {configured ? '● LIVE' : 'OFFLINE'}
            </span>
          </button>

          {toastMsg && (
            <div style={{
              position: 'absolute',
              top: '110%',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#1a1610',
              border: '1px solid var(--gold-dim)',
              color: 'var(--gold)',
              fontSize: 10,
              padding: '4px 8px',
              borderRadius: 4,
              whiteSpace: 'nowrap',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}>
              {toastMsg}
            </div>
          )}
        </div>

        <CloudSyncModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  // Compact circular button with settings gear on right-click or long click
  return (
    <>
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', ...style }}>
        <button
          type="button"
          onClick={handleSyncClick}
          onContextMenu={(e) => { e.preventDefault(); setModalOpen(true); }}
          disabled={isRefreshing}
          title={isRefreshing ? 'Syncing...' : (lastSyncedAt ? `Last synced: ${new Date(lastSyncedAt).toLocaleTimeString()} (Right click for settings)` : 'Sync Cloud Data')}
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: `1px solid ${configured ? 'var(--border-subtle)' : 'rgba(239,68,68,0.3)'}`,
            borderRadius: 20,
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: isRefreshing ? 'var(--gold)' : 'var(--text-secondary)',
            cursor: isRefreshing ? 'default' : 'pointer',
            transition: 'all 150ms ease',
            fontSize: 11,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--gold-dim)';
            e.currentTarget.style.color = 'var(--gold)';
          }}
          onMouseLeave={e => {
            if (!isRefreshing) {
              e.currentTarget.style.borderColor = configured ? 'var(--border-subtle)' : 'rgba(239,68,68,0.3)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
          }}
        >
          <RefreshCw
            size={12}
            style={{
              color: isRefreshing ? 'var(--gold)' : (configured ? '#4ade80' : 'var(--text-muted)'),
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
            }}
          />
          <span style={{ fontFamily: 'var(--font-serif)', letterSpacing: '0.05em' }}>
            {isRefreshing ? 'Syncing...' : 'Sync'}
          </span>
          <span
            onClick={handleOpenModal}
            title="Open Cloud Sync Settings"
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: configured ? '#4ade80' : '#f87171',
              boxShadow: configured ? '0 0 6px #4ade80' : 'none',
              marginLeft: 2,
            }}
          />
        </button>

        {toastMsg && (
          <div style={{
            position: 'absolute',
            top: '120%',
            right: 0,
            background: '#1a1610',
            border: '1px solid var(--gold-dim)',
            color: 'var(--gold)',
            fontSize: 10,
            padding: '4px 8px',
            borderRadius: 4,
            whiteSpace: 'nowrap',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}>
            {toastMsg}
          </div>
        )}
      </div>

      <CloudSyncModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
