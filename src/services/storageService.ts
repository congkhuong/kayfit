import type { Exercise, GoogleDriveConfig, HistoryRecord, KayFitData } from '../types/exercise';
import {
  downloadDriveFile,
  findDriveFileId,
  getStoredToken,
  uploadDriveFile,
} from './googleDriveService';

const LOCAL_STORAGE_DATA_KEY = 'kayfit_local_data';
const LOCAL_STORAGE_CONFIG_KEY = 'kayfit_gdrive_config';

const DEFAULT_CONFIG: GoogleDriveConfig = {
  clientId: '',
  isConnected: false,
  autoSync: true,
};

const DEFAULT_INITIAL_DATA: KayFitData = {
  version: 1,
  lastSyncedAt: undefined,
  exercises: [
    {
      id: 'ex-1',
      name: 'Hít đất (Push-up)',
      category: 'Push',
      currentMaxReps: 30,
      lastUpdated: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
      history: [
        {
          id: 'hist-1-1',
          reps: 25,
          date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
        },
        {
          id: 'hist-1-2',
          reps: 20,
          date: new Date(Date.now() - 21 * 86400000).toISOString().split('T')[0],
        },
      ],
    },
    {
      id: 'ex-2',
      name: 'Kéo xà (Pull-up)',
      category: 'Pull',
      currentMaxReps: 12,
      lastUpdated: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      history: [
        {
          id: 'hist-2-1',
          reps: 10,
          date: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0],
        },
      ],
    },
    {
      id: 'ex-3',
      name: 'Squat (Gánh đùi)',
      category: 'Legs',
      currentMaxReps: 50,
      lastUpdated: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      history: [],
    },
  ],
};

// 1. Get Local Storage Data
export const getLocalData = (): KayFitData => {
  const raw = localStorage.getItem(LOCAL_STORAGE_DATA_KEY);
  if (!raw) {
    saveLocalData(DEFAULT_INITIAL_DATA);
    return DEFAULT_INITIAL_DATA;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.exercises || !Array.isArray(parsed.exercises)) {
      return DEFAULT_INITIAL_DATA;
    }
    return parsed;
  } catch {
    return DEFAULT_INITIAL_DATA;
  }
};

// 2. Save Local Storage Data
export const saveLocalData = (data: KayFitData): void => {
  localStorage.setItem(LOCAL_STORAGE_DATA_KEY, JSON.stringify(data));
};

// 3. Get Google Drive Config from Local Storage
export const getDriveConfig = (): GoogleDriveConfig => {
  const raw = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
  if (!raw) return DEFAULT_CONFIG;
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
};

// 4. Save Google Drive Config to Local Storage
export const saveDriveConfig = (config: GoogleDriveConfig): void => {
  localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(config));
};

// Helper: generate unique IDs
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Update Max Reps for an existing Exercise
 * Strictly archives the previous record into history (capped at 4 items max).
 */
export const updateExerciseReps = (
  exercises: Exercise[],
  exerciseId: string,
  newReps: number,
  newDate: string
): Exercise[] => {
  return exercises.map((ex) => {
    if (ex.id !== exerciseId) return ex;

    // Archive current record to history before overwriting
    const previousRecord: HistoryRecord = {
      id: generateId(),
      reps: ex.currentMaxReps,
      date: ex.lastUpdated || newDate,
    };

    // Combine existing history, newest archived record first
    const updatedHistory = [previousRecord, ...(ex.history || [])];

    // Cap history array at strictly 4 items max
    const trimmedHistory = updatedHistory.slice(0, 4);

    return {
      ...ex,
      currentMaxReps: newReps,
      lastUpdated: newDate,
      history: trimmedHistory,
    };
  });
};

/**
 * Add a new Exercise
 */
export const addNewExercise = (
  exercises: Exercise[],
  name: string,
  category: string | undefined,
  initialMaxReps: number,
  date: string
): Exercise[] => {
  const newEx: Exercise = {
    id: generateId(),
    name: name.trim(),
    category: category ? category.trim() : undefined,
    currentMaxReps: initialMaxReps,
    lastUpdated: date,
    history: [],
  };

  return [newEx, ...exercises];
};

/**
 * Sync Local Data with Google Drive
 */
export const syncWithGoogleDrive = async (
  currentLocalData: KayFitData,
  config: GoogleDriveConfig
): Promise<{ data: KayFitData; updatedConfig: GoogleDriveConfig }> => {
  const token = getStoredToken();
  if (!token) {
    throw new Error('Chưa đăng nhập Google Account hoặc phiên đăng nhập đã hết hạn.');
  }

  let fileId = config.fileId || null;

  // 1. Locate file on Google Drive if fileId is unknown
  if (!fileId) {
    fileId = await findDriveFileId(token);
  }

  let mergedData: KayFitData = currentLocalData;

  if (fileId) {
    try {
      // 2. Download remote file
      const remoteData = await downloadDriveFile(token, fileId);

      // Merge strategy: if remoteData exists, combine exercises or use remote if newer
      if (remoteData && Array.isArray(remoteData.exercises)) {
        // Merge exercises by ID or name
        const exerciseMap = new Map<string, Exercise>();
        
        // Remote exercises first
        remoteData.exercises.forEach((ex) => {
          exerciseMap.set(ex.id || ex.name, ex);
        });

        // Override or append local exercises
        currentLocalData.exercises.forEach((ex) => {
          const existing = exerciseMap.get(ex.id || ex.name);
          if (!existing) {
            exerciseMap.set(ex.id || ex.name, ex);
          } else {
            // Pick the one with more recent update or merge history
            if (new Date(ex.lastUpdated) >= new Date(existing.lastUpdated)) {
              exerciseMap.set(ex.id || ex.name, ex);
            }
          }
        });

        mergedData = {
          version: 1,
          lastSyncedAt: new Date().toISOString(),
          exercises: Array.from(exerciseMap.values()),
        };
      }
    } catch (err) {
      console.warn('Error reading remote drive file, proceeding to create/update:', err);
    }
  }

  // 3. Upload merged data back to Google Drive
  mergedData.lastSyncedAt = new Date().toISOString();
  const savedFileId = await uploadDriveFile(token, mergedData, fileId);

  // 4. Save updated state to local storage
  saveLocalData(mergedData);

  const updatedConfig: GoogleDriveConfig = {
    ...config,
    fileId: savedFileId,
    isConnected: true,
  };
  saveDriveConfig(updatedConfig);

  return {
    data: mergedData,
    updatedConfig,
  };
};
