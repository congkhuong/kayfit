import React, { useState } from 'react';
import { PlusCircle, X } from 'lucide-react';

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, category: string | undefined, reps: number, date: string) => void;
}

export const AddExerciseModal: React.FC<AddExerciseModalProps> = ({ isOpen, onClose, onAdd }) => {
  const today = new Date().toISOString().split('T')[0];

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Push');
  const [reps, setReps] = useState<number>(10);
  const [date, setDate] = useState(today);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name, category, Number(reps), date);
    // Reset form
    setName('');
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
              placeholder="VD: Hít đất, Kéo xà, Dip..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phân loại (Category)</label>
            <select
              className="form-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Push">Push (Đẩy: Hít đất, Dips...)</option>
              <option value="Pull">Pull (Kéo: Xà đơn, Rowing...)</option>
              <option value="Legs">Legs (Chân: Squat, Lunge...)</option>
              <option value="Core">Core (Bụng: Plank, Sit-up...)</option>
              <option value="Cardio">Cardio / Khác</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Max Rep ban đầu *</label>
              <input
                type="number"
                min="1"
                max="9999"
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
