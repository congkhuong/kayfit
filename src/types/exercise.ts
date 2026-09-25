export type ExerciseUnit = 'reps' | 'seconds';

export interface HistoryRecord {
  id: string;
  reps: number; // Giá trị (số rep hoặc số giây)
  unit?: ExerciseUnit;
  date: string; // Format: YYYY-MM-DD
}

export interface Exercise {
  id: string;
  name: string;
  category?: string;
  unit?: ExerciseUnit; // 'reps' (mặc định) hoặc 'seconds'
  currentMaxReps: number;
  lastUpdated: string; // Format: YYYY-MM-DD
  history: HistoryRecord[]; // Tối đa 4 bản ghi gần nhất
}

export interface KayFitData {
  version: number;
  lastSyncedAt?: string;
  exercises: Exercise[];
}

export interface GoogleDriveConfig {
  clientId: string;
  userEmail?: string;
  userName?: string;
  isConnected: boolean;
  fileId?: string;
  autoSync: boolean;
}
