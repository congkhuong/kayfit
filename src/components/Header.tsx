import React from 'react';
import { Dumbbell, Cloud, CloudOff, RefreshCw, Settings, Plus } from 'lucide-react';
import type { GoogleDriveConfig } from '../types/exercise';

interface HeaderProps {
  config: GoogleDriveConfig;
  isSyncing: boolean;
  onSync: () => void;
  onOpenSettings: () => void;
  onOpenAddModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  isSyncing,
  onSync,
  onOpenSettings,
  onOpenAddModal,
}) => {
  return (
    <header className="header">
      <div className="brand">
        <div className="brand-icon">
          <Dumbbell size={24} />
        </div>
        <div>
          <h1 className="brand-title">KAYFIT</h1>
          <p className="brand-subtitle">[ 8-BIT MAX LOG ]</p>
        </div>
      </div>

      <div className="header-actions">
        {/* Sync Status Badge */}
        {config.isConnected ? (
          <div
            className={`sync-badge ${isSyncing ? 'syncing' : 'synced'}`}
            title={config.fileId ? `File Drive ID: ${config.fileId}` : 'Đã kết nối Google Drive'}
          >
            <span className={`dot ${isSyncing ? 'pulse' : ''}`} />
            <Cloud size={14} />
            <span>{isSyncing ? 'SYNCING...' : 'DRIVE ONLINE'}</span>
          </div>
        ) : (
          <div className="sync-badge offline" title="Dữ liệu lưu tại máy (LocalStorage)">
            <CloudOff size={14} />
            <span>LOCAL SAVE</span>
          </div>
        )}

        {/* Sync Action Button */}
        {config.isConnected && (
          <button
            className="btn btn-icon"
            onClick={onSync}
            disabled={isSyncing}
            title="Đồng bộ thủ công với Google Drive"
          >
            <RefreshCw size={18} className={isSyncing ? 'spin' : ''} />
          </button>
        )}

        {/* Settings Button */}
        <button
          className="btn btn-icon"
          onClick={onOpenSettings}
          title="Cấu hình Google Drive Sync"
        >
          <Settings size={18} />
        </button>

        {/* Add Exercise Primary Button */}
        <button className="btn btn-primary" onClick={onOpenAddModal}>
          <Plus size={18} />
          <span>+ BÀI TẬP</span>
        </button>
      </div>
    </header>
  );
};
