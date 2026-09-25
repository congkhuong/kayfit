import React, { useState, useEffect } from 'react';
import { Edit3, X, History, TrendingUp } from 'lucide-react';
import type { Exercise } from '../types/exercise';

interface UpdateRepsModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (exerciseId: string, newReps: number, newDate: string) => void;
}

export const UpdateRepsModal: React.FC<UpdateRepsModalProps> = ({
  exercise,
  isOpen,
  onClose,
  onSave,
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [newReps, setNewReps] = useState<number>(0);
  const [newDate, setNewDate] = useState(today);

  useEffect(() => {
    if (exercise) {
      setNewReps(exercise.currentMaxReps);
      setNewDate(today);
    }
  }, [exercise]);

  if (!isOpen || !exercise) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(exercise.id, Number(newReps), newDate);
    onClose();
  };

  const repDifference = newReps - exercise.currentMaxReps;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Edit3 size={22} style={{ color: 'var(--accent-cyan)' }} />
            Cập nhật Max Rep
          </h2>
          <button className="btn btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem', padding: '0.85rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              {exercise.name}
            </h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span>Kỷ lục hiện tại: <strong style={{ color: 'var(--accent-emerald)' }}>{exercise.currentMaxReps} reps</strong></span>
              <span>Ngày: {exercise.lastUpdated || 'N/A'}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Max Rep mới *</label>
              <input
                type="number"
                min="1"
                max="9999"
                className="form-input"
                value={newReps}
                onChange={(e) => setNewReps(Math.max(1, parseInt(e.target.value) || 0))}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Ngày ghi nhận *</label>
              <input
                type="date"
                className="form-input"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Progress indicator */}
          {repDifference !== 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: repDifference > 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', margin: '0.5rem 0 1rem' }}>
              <TrendingUp size={16} style={{ transform: repDifference < 0 ? 'rotate(180deg)' : 'none' }} />
              <span>
                {repDifference > 0
                  ? `Tăng +${repDifference} reps so với kỷ lục trước!`
                  : `Thay đổi ${repDifference} reps`}
              </span>
            </div>
          )}

          <div style={{ padding: '0.75rem', background: 'rgba(6, 182, 212, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(6, 182, 212, 0.2)', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <History size={16} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
            <span>Kỷ lục cũ ({exercise.currentMaxReps} reps) sẽ tự động được lưu vào Lịch sử (giữ tối đa 4 lần gần nhất).</span>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary">
              Lưu kỷ lục mới
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
