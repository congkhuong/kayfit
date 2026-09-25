import React, { useState } from 'react';
import { ChevronDown, ChevronUp, History, Edit3, Calendar, Award } from 'lucide-react';
import type { Exercise } from '../types/exercise';

interface ExerciseCardProps {
  exercise: Exercise;
  onUpdateReps: (exercise: Exercise) => void;
}

const formatValueWithUnit = (val: number, unit?: string) => {
  if (unit === 'seconds') {
    if (val >= 60) {
      const mins = Math.floor(val / 60);
      const secs = val % 60;
      return secs > 0 ? `${val}s (${mins}m ${secs}s)` : `${val}s (${mins}m)`;
    }
    return `${val} giây`;
  }
  return `${val} reps`;
};

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onUpdateReps }) => {
  const [showHistory, setShowHistory] = useState(false);

  const historyCount = exercise.history?.length || 0;
  const isSeconds = exercise.unit === 'seconds';

  return (
    <div className="exercise-card">
      <div className="card-header">
        <h3 className="card-title">{exercise.name}</h3>
        {exercise.category && <span className="card-category">{exercise.category}</span>}
      </div>

      <div className="card-body">
        <div className="rep-stat">
          <span className="rep-label">{isSeconds ? 'Max Thời Gian' : 'Max Rep Hiện Tại'}</span>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span className="rep-value">{exercise.currentMaxReps}</span>
            <span className="rep-unit">{isSeconds ? 'giây' : 'reps'}</span>
          </div>
          {isSeconds && exercise.currentMaxReps >= 60 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
              ({Math.floor(exercise.currentMaxReps / 60)} phút {exercise.currentMaxReps % 60}s)
            </span>
          )}
        </div>

        <div className="updated-date">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
            <Calendar size={12} />
            <span>Ngày đạt:</span>
          </div>
          <strong style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>
            {exercise.lastUpdated || 'Chưa rõ'}
          </strong>
        </div>
      </div>

      <div className="card-actions">
        <button className="btn btn-primary" onClick={() => onUpdateReps(exercise)}>
          <Edit3 size={16} />
          <span>{isSeconds ? 'Cập nhật Thời gian' : 'Cập nhật Reps'}</span>
        </button>
      </div>

      {/* History section */}
      <div className="card-history">
        <button
          className="history-toggle"
          onClick={() => setShowHistory((prev) => !prev)}
          type="button"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <History size={14} />
            <span>Lịch sử ({historyCount}/4 lần)</span>
          </div>
          {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showHistory && (
          <div className="history-list">
            {historyCount === 0 ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', padding: '0.5rem 0' }}>
                Chưa có lịch sử cập nhật trước đó
              </p>
            ) : (
              exercise.history.map((record, index) => (
                <div key={record.id || index} className="history-item">
                  <div className="history-item-badge">
                    <Award size={12} style={{ color: 'var(--accent-amber)' }} />
                    <span>{formatValueWithUnit(record.reps, record.unit || exercise.unit)}</span>
                  </div>
                  <span className="history-item-date">{record.date}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
