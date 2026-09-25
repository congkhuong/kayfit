export interface HistoryRecord {
  id: string;
  reps: number;
  date: string; // Format: YYYY-MM-DD
}

export interface Exercise {
  id: string;
  name: string;
  category?: string;
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
