import type { KayFitData } from '../types/exercise';

const DRIVE_FILE_NAME = 'kayfit_data.json';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

declare global {
  interface Window {
    google?: any;
  }
}

let tokenClient: any = null;
let accessToken: string | null = null;

// Dynamically load Google Identity Services script if not already present
export const loadGisScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existingScript = document.getElementById('google-gis-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services SDK')));
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services SDK'));
    document.head.appendChild(script);
  });
};

export const initGoogleAuth = (
  clientId: string,
  onSuccess: (token: string) => void,
  onError: (error: any) => void
) => {
  if (!window.google?.accounts?.oauth2) {
    onError('Google Identity Services SDK strictly requires loading before initializing');
    return;
  }

  try {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (tokenResponse: any) => {
        if (tokenResponse.error) {
          onError(tokenResponse);
          return;
        }
        accessToken = tokenResponse.access_token;
        // Save access token temporarily in sessionStorage
        if (accessToken) {
          sessionStorage.setItem('kayfit_gdrive_token', accessToken);
          sessionStorage.setItem(
            'kayfit_gdrive_token_expires_at',
            String(Date.now() + (tokenResponse.expires_in || 3600) * 1000)
          );
        }
        onSuccess(tokenResponse.access_token);
      },
    });
  } catch (err) {
    onError(err);
  }
};

export const requestDriveToken = () => {
  if (tokenClient) {
    tokenClient.requestAccessToken({ prompt: '' });
  } else {
    throw new Error('Google OAuth client is not initialized. Please set Client ID first.');
  }
};

export const getStoredToken = (): string | null => {
  if (accessToken) return accessToken;
  const storedToken = sessionStorage.getItem('kayfit_gdrive_token');
  const expiresAt = sessionStorage.getItem('kayfit_gdrive_token_expires_at');
  if (storedToken && expiresAt && Date.now() < Number(expiresAt)) {
    accessToken = storedToken;
    return storedToken;
  }
  return null;
};

export const clearStoredToken = () => {
  accessToken = null;
  sessionStorage.removeItem('kayfit_gdrive_token');
  sessionStorage.removeItem('kayfit_gdrive_token_expires_at');
};

// Search for existing kayfit_data.json on Google Drive
export const findDriveFileId = async (token: string): Promise<string | null> => {
  const query = encodeURIComponent(`name='${DRIVE_FILE_NAME}' and trashed=false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearStoredToken();
      throw new Error('Phiên làm việc Google Drive đã hết hạn. Vui lòng đăng nhập lại.');
    }
    throw new Error(`Google Drive API Search Error: ${res.statusText}`);
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
};

// Download kayfit_data.json content from Google Drive
export const downloadDriveFile = async (token: string, fileId: string): Promise<KayFitData> => {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Cannot download file from Google Drive: ${res.statusText}`);
  }

  return await res.json();
};

// Upload or update kayfit_data.json on Google Drive
export const uploadDriveFile = async (
  token: string,
  data: KayFitData,
  existingFileId?: string | null
): Promise<string> => {
  const fileContent = JSON.stringify(data, null, 2);

  if (existingFileId) {
    // Update existing file content via PATCH request
    const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: fileContent,
    });

    if (!res.ok) {
      if (res.status === 401) {
        clearStoredToken();
        throw new Error('Phiên đăng nhập Google hết hạn.');
      }
      throw new Error(`Cập nhật file Google Drive thất bại: ${res.statusText}`);
    }

    const updated = await res.json();
    return updated.id || existingFileId;
  } else {
    // Create new file with Multipart Upload
    const metadata = {
      name: DRIVE_FILE_NAME,
      mimeType: 'application/json',
      description: 'Dữ liệu ứng dụng theo dõi Max Rep KayFit',
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      fileContent +
      closeDelimiter;

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!res.ok) {
      if (res.status === 401) {
        clearStoredToken();
        throw new Error('Phiên đăng nhập Google hết hạn.');
      }
      throw new Error(`Tạo file Google Drive thất bại: ${res.statusText}`);
    }

    const created = await res.json();
    return created.id;
  }
};
