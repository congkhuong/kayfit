import React, { useState } from 'react';
import { PlusCircle, X } from 'lucide-react';
import type { ExerciseUnit } from '../types/exercise';

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (
    name: string,
    category: string | undefined,
    reps: number,
    date: string,
    unit: ExerciseUnit
  ) => void;
}

export const AddExerciseModal: React.FC<AddExerciseModalProps> = ({ isOpen, onClose, onAdd }) => {
  const today = new Date().toISOString().split('T')[0];

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Push');
  const [unit, setUnit] = useState<ExerciseUnit>('reps');
  const [reps, setReps] = useState<number>(10);
  const [date, setDate] = useState(today);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name, category, Number(reps), date, unit);
    // Reset form
    setName('');
    setUnit('reps');
    setReps(10);
    setDate(today);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <PlusCircle size={22} style={{ color: 'var(--accent-emerald)' }} />
            Thêm bài tập mới
          </h2>
          <button className="btn btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Tên bài tập *</label>
            <input
              type="text"
              className="form-input"
              placeholder="VD: Hít đất, Plank, L-sit..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Phân loại (Category)</label>
              <select
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Push">Push (Đẩy)</option>
                <option value="Pull">Pull (Kéo)</option>
                <option value="Legs">Legs (Chân)</option>
                <option value="Core">Core (Bụng/Giữ)</option>
                <option value="Cardio">Cardio / Khác</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Đơn vị đo lường *</label>
              <select
                className="form-input"
                value={unit}
                onChange={(e) => setUnit(e.target.value as ExerciseUnit)}
              >
                <option value="reps">Số lần (Reps)</option>
                <option value="seconds">Thời gian (Giây)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">
                {unit === 'seconds' ? 'Kỷ kỷ lục thời gian (Giây) *' : 'Max Rep ban đầu *'}
              </label>
              <input
                type="number"
                min="1"
                max="99999"
                className="form-input"
                value={reps}
                onChange={(e) => setReps(Math.max(1, parseInt(e.target.value) || 0))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Ngày thực hiện *</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary">
              Tạo bài tập
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
