import React, { useState } from 'react';
import { Cloud, X, Check, Key, ExternalLink, RefreshCw, LogOut, Info } from 'lucide-react';
import type { GoogleDriveConfig } from '../types/exercise';
import { clearStoredToken, initGoogleAuth, requestDriveToken } from '../services/googleDriveService';

interface GoogleDriveConfigModalProps {
  isOpen: boolean;
  config: GoogleDriveConfig;
  isSyncing: boolean;
  onClose: () => void;
  onSaveConfig: (config: GoogleDriveConfig) => void;
  onSync: () => void;
}

export const GoogleDriveConfigModal: React.FC<GoogleDriveConfigModalProps> = ({
  isOpen,
  config,
  isSyncing,
  onClose,
  onSaveConfig,
  onSync,
}) => {
  const [clientId, setClientId] = useState(config.clientId || '');
  const [showInstructions, setShowInstructions] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const updated = { ...config, clientId: clientId.trim() };
    onSaveConfig(updated);
  };

  const handleLoginDrive = () => {
    setErrorMsg(null);
    if (!clientId.trim()) {
      setErrorMsg('Vui lòng nhập Google OAuth Client ID trước khi đăng nhập.');
      return;
    }

    try {
      initGoogleAuth(
        clientId.trim(),
        (token) => {
          if (token) {
            onSync();
          }
        },
        (err) => {
          console.error('Google OAuth Login Error:', err);
          setErrorMsg('Đăng nhập thất bại. Vui lòng kiểm tra lại Client ID và Domain Authorized Javascript Origins.');
        }
      );

      requestDriveToken();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi đăng nhập Google Drive');
    }
  };

  const handleLogoutDrive = () => {
    clearStoredToken();
    const updated = { ...config, isConnected: false, fileId: undefined };
    onSaveConfig(updated);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Cloud size={22} style={{ color: 'var(--accent-emerald)' }} />
            Cấu Hình Google Drive Sync
          </h2>
          <button className="btn btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            {errorMsg}
          </div>
        )}

        {/* Status card */}
        <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Trạng thái kết nối:</div>
            <strong style={{ fontSize: '1rem', color: config.isConnected ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
              {config.isConnected ? '✓ Đã kết nối Google Drive' : 'Chưa kết nối (Lưu LocalStorage)'}
            </strong>
            {config.fileId && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                File Google Drive: <code>kayfit_data.json</code>
              </div>
            )}
          </div>

          <div>
            {config.isConnected ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={onSync} disabled={isSyncing}>
                  <RefreshCw size={14} className={isSyncing ? 'spin' : ''} />
                  <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
                </button>
                <button className="btn btn-icon" onClick={handleLogoutDrive} title="Đăng xuất khỏi Google Drive">
                  <LogOut size={16} style={{ color: 'var(--accent-rose)' }} />
                </button>
              </div>
            ) : (
              <button className="btn btn-primary" onClick={handleLoginDrive} disabled={!clientId.trim()}>
                <Cloud size={16} />
                <span>Đăng nhập Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Client ID Setup Form */}
        <form onSubmit={handleSaveClientId}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Google OAuth Client ID</span>
              <button
                type="button"
                style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                onClick={() => setShowInstructions((p) => !p)}
              >
                <Info size={14} />
                <span>{showInstructions ? 'Ẩn hướng dẫn' : 'Hướng dẫn lấy Client ID'}</span>
              </button>
            </label>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="VD: 123456789-abcdefg.apps.googleusercontent.com"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary">
                <Check size={16} />
                <span>Lưu</span>
              </button>
            </div>
          </div>
        </form>

        {/* Instructions Collapsible */}
        {showInstructions && (
          <div style={{ padding: '1rem', background: 'rgba(6, 182, 212, 0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(6, 182, 212, 0.2)', fontSize: '0.825rem', color: 'var(--text-muted)', margin: '1rem 0' }}>
            <h4 style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Key size={16} /> Các bước lấy Google OAuth Client ID (Miễn phí):
            </h4>
            <ol style={{ paddingLeft: '1.25rem', lineHeight: '1.6' }}>
              <li>
                Truy cập <strong>Google Cloud Console</strong>:{' '}
                <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-emerald)' }}>
                  console.cloud.google.com <ExternalLink size={12} style={{ display: 'inline' }} />
                </a>
              </li>
              <li>Tạo một dự án mới (ví dụ: <code>KayFit App</code>).</li>
              <li>Bật <strong>Google Drive API</strong> trong mục <em>APIs & Services {'>'} Library</em>.</li>
              <li>Tạo OAuth Client ID tại <em>APIs & Services {'>'} Credentials {'>'} Create Credentials {'>'} OAuth client ID</em>:
                <ul style={{ paddingLeft: '1rem', marginTop: '0.25rem' }}>
                  <li>Application type: <strong>Web application</strong></li>
                  <li>Authorized JavaScript origins: Thêm <code>https://congkhuong.github.io</code> và <code>http://localhost:5173</code></li>
                </ul>
              </li>
              <li>Coppy chuỗi Client ID dán vào ô bên trên và bấm <strong>Lưu</strong> {'>'} Bấm <strong>Đăng nhập Google</strong>!</li>
            </ol>
          </div>
        )}

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
