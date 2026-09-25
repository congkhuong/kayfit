import React, { useState, useEffect } from 'react';
import { Dumbbell, Plus, CheckCircle2 } from 'lucide-react';
import type { Exercise, ExerciseUnit, GoogleDriveConfig, KayFitData } from './types/exercise';
import {
  addNewExercise,
  getDriveConfig,
  getLocalData,
  saveDriveConfig,
  saveLocalData,
  syncWithGoogleDrive,
  updateExerciseReps,
} from './services/storageService';
import { Header } from './components/Header';
import { ExerciseCard } from './components/ExerciseCard';
import { AddExerciseModal } from './components/AddExerciseModal';
import { UpdateRepsModal } from './components/UpdateRepsModal';
import { GoogleDriveConfigModal } from './components/GoogleDriveConfigModal';
import { getStoredToken, loadGisScript } from './services/googleDriveService';

export const App: React.FC = () => {
  const [data, setData] = useState<KayFitData>(getLocalData);
  const [driveConfig, setDriveConfig] = useState<GoogleDriveConfig>(getDriveConfig);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Sync & Toast state
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Load Google Identity Services SDK on startup
  useEffect(() => {
    loadGisScript().catch((err) => {
      console.warn('GIS Script loading issue:', err);
    });
  }, []);

  // Try auto sync if token is stored
  useEffect(() => {
    const token = getStoredToken();
    if (token && driveConfig.isConnected) {
      handleSyncDriveSilently();
    }
  }, []);

  const handleSyncDriveSilently = async () => {
    try {
      setIsSyncing(true);
      const res = await syncWithGoogleDrive(data, driveConfig);
      setData(res.data);
      setDriveConfig(res.updatedConfig);
    } catch (err) {
      console.warn('Silent sync warning:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncDrive = async () => {
    try {
      setIsSyncing(true);
      const res = await syncWithGoogleDrive(data, driveConfig);
      setData(res.data);
      setDriveConfig(res.updatedConfig);
      showToast('Đồng bộ Google Drive thành công!');
    } catch (err: any) {
      showToast(`Đồng bộ thất bại: ${err.message || 'Lỗi không xác định'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddExercise = (
    name: string,
    category: string | undefined,
    reps: number,
    date: string,
    unit: ExerciseUnit = 'reps'
  ) => {
    const updatedExercises = addNewExercise(data.exercises, name, category, reps, date, unit);
    const newData: KayFitData = { ...data, exercises: updatedExercises };
    setData(newData);
    saveLocalData(newData);
    const unitSuffix = unit === 'seconds' ? 'giây' : 'reps';
    showToast(`Đã thêm bài tập "${name}" (${reps} ${unitSuffix})!`);

    // Auto sync if drive connected
    if (getStoredToken() && driveConfig.isConnected) {
      syncWithGoogleDrive(newData, driveConfig)
        .then((res) => {
          setData(res.data);
          setDriveConfig(res.updatedConfig);
        })
        .catch(console.warn);
    }
  };

  const handleUpdateReps = (exerciseId: string, newReps: number, newDate: string) => {
    const updatedExercises = updateExerciseReps(data.exercises, exerciseId, newReps, newDate);
    const newData: KayFitData = { ...data, exercises: updatedExercises };
    setData(newData);
    saveLocalData(newData);
    showToast('Đã lưu kỷ lục Max Rep mới!');

    // Auto sync if drive connected
    if (getStoredToken() && driveConfig.isConnected) {
      syncWithGoogleDrive(newData, driveConfig)
        .then((res) => {
          setData(res.data);
          setDriveConfig(res.updatedConfig);
        })
        .catch(console.warn);
    }
  };

  const handleSaveConfig = (newConfig: GoogleDriveConfig) => {
    setDriveConfig(newConfig);
    saveDriveConfig(newConfig);
    showToast('Đã lưu cài đặt Google Drive!');
  };

  // Filter exercises by category
  const categories = ['All', 'Push', 'Pull', 'Legs', 'Core', 'Cardio'];
  const filteredExercises =
    selectedCategory === 'All'
      ? data.exercises
      : data.exercises.filter((ex) => ex.category === selectedCategory);

  return (
    <div className="app-container">
      {/* Header */}
      <Header
        config={driveConfig}
        isSyncing={isSyncing}
        onSync={handleSyncDrive}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Main Dashboard Summary & Filter */}
      <div className="summary-bar">
        <div className="summary-title">
          <Dumbbell size={22} style={{ color: 'var(--accent-emerald)' }} />
          <span>Danh Sách Bài Tập</span>
          <span className="summary-count">{filteredExercises.length}</span>
        </div>

        {/* Category Tabs */}
        <div className="filter-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`tab ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'All' ? 'Tất cả' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise Cards Grid */}
      {filteredExercises.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏋️‍♂️</div>
          <h3 className="empty-title">Chưa có bài tập nào</h3>
          <p className="empty-desc">
            {selectedCategory === 'All'
              ? 'Bắt đầu ghi lại kỷ lục Max Rep tập luyện của bạn ngay bây giờ!'
              : `Không tìm thấy bài tập thuộc nhóm "${selectedCategory}".`}
          </p>
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} />
            <span>Thêm bài tập đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="exercise-grid">
          {filteredExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onUpdateReps={(ex) => setEditingExercise(ex)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AddExerciseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddExercise}
      />

      <UpdateRepsModal
        exercise={editingExercise}
        isOpen={!!editingExercise}
        onClose={() => setEditingExercise(null)}
        onSave={handleUpdateReps}
      />

      <GoogleDriveConfigModal
        isOpen={isSettingsModalOpen}
        config={driveConfig}
        isSyncing={isSyncing}
        onClose={() => setIsSettingsModalOpen(false)}
        onSaveConfig={handleSaveConfig}
        onSync={handleSyncDrive}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast">
          <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default App;
