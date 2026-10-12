import { getAccessToken } from './googleAuth';
import { FinWiseBackupData, DriveFileInfo, Transaction, Category } from '../types';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';

export const APP_FOLDER_NAME = 'FinWise - Gestão Financeira';
export const RECEIPTS_FOLDER_NAME = 'FinWise - Comprovantes';

/**
 * Helper to execute authorized requests to Google Drive
 */
async function driveFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Não autenticado com o Google Drive. Faça login primeiro.');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson?.error?.message || response.statusText;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(`Google Drive API erro (${response.status}): ${errorDetail}`);
  }
  return response;
}

/**
 * Get user information and Drive storage quota
 */
export async function getDriveStorageInfo(): Promise<{
  displayName?: string;
  emailAddress?: string;
  photoLink?: string;
  usageBytes: number;
  limitBytes: number;
}> {
  const res = await driveFetch(`${DRIVE_API_URL}/about?fields=user,storageQuota`);
  const data = await res.json();
  return {
    displayName: data.user?.displayName,
    emailAddress: data.user?.emailAddress,
    photoLink: data.user?.photoLink,
    usageBytes: parseInt(data.storageQuota?.usage || '0', 10),
    limitBytes: parseInt(data.storageQuota?.limit || '0', 10),
  };
}

/**
 * Locate or create a folder in user's Google Drive
 */
export async function getOrCreateFolder(folderName: string, parentFolderId?: string): Promise<string> {
  let query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentFolderId) {
    query += ` and '${parentFolderId}' in parents`;
  }

  const searchRes = await driveFetch(
    `${DRIVE_API_URL}/files?q=${encodeURIComponent(query)}&fields=files(id,name)&spaces=drive`
  );
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder if not found
  const body: { name: string; mimeType: string; parents?: string[] } = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentFolderId) {
    body.parents = [parentFolderId];
  }

  const createRes = await driveFetch(`${DRIVE_API_URL}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const createData = await createRes.json();
  return createData.id;
}

/**
 * Get the main FinWise root folder ID
 */
export async function getFinWiseFolderId(): Promise<string> {
  return await getOrCreateFolder(APP_FOLDER_NAME);
}

/**
 * Get receipts folder ID inside FinWise folder
 */
export async function getReceiptsFolderId(): Promise<string> {
  const parentId = await getFinWiseFolderId();
  return await getOrCreateFolder(RECEIPTS_FOLDER_NAME, parentId);
}

/**
 * List all backup files stored in Google Drive
 */
export async function listDriveBackups(): Promise<DriveFileInfo[]> {
  const folderId = await getFinWiseFolderId();
  const query = `'${folderId}' in parents and (mimeType = 'application/json' or name contains 'backup' or name contains 'Backup') and trashed = false`;
  
  const res = await driveFetch(
    `${DRIVE_API_URL}/files?q=${encodeURIComponent(query)}&orderBy=modifiedTime desc&fields=files(id,name,mimeType,size,modifiedTime,webViewLink,description)`
  );
  const data = await res.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    size: f.size,
    modifiedTime: f.modifiedTime,
    webViewLink: f.webViewLink,
    description: f.description,
  }));
}

/**
 * Create a new backup in Google Drive
 */
export async function createDriveBackup(
  backupData: FinWiseBackupData, 
  customName?: string
): Promise<DriveFileInfo> {
  const folderId = await getFinWiseFolderId();
  const now = new Date();
  const formattedDate = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = customName?.trim() 
    ? (customName.endsWith('.json') ? customName : `${customName}.json`)
    : `FinWise_Backup_${formattedDate}.json`;

  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: 'application/json',
    description: `Backup do FinWise contendo ${backupData.transactions.length} transações e ${backupData.reminders.length} lembretes. Exportado em ${now.toLocaleString('pt-BR')}.`,
  };

  const fileContent = JSON.stringify(backupData, null, 2);
  const boundary = `-------FinWiseUploadBoundary${Date.now()}`;
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

  const res = await driveFetch(
    `${DRIVE_UPLOAD_URL}/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink,description`,
    {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  return await res.json();
}

/**
 * Download and parse backup JSON file from Google Drive
 */
export async function downloadDriveBackup(fileId: string): Promise<FinWiseBackupData> {
  const res = await driveFetch(`${DRIVE_API_URL}/files/${fileId}?alt=media`);
  const json = await res.json();
  if (!json || (!Array.isArray(json.transactions) && !Array.isArray(json.categories))) {
    throw new Error('Arquivo de backup inválido ou incompatível.');
  }
  return json as FinWiseBackupData;
}

/**
 * Export CSV report to Google Drive
 */
export async function exportCsvToDrive(
  transactions: Transaction[], 
  categories: Category[],
  titleSuffix = 'Extrato_Geral'
): Promise<DriveFileInfo> {
  const folderId = await getFinWiseFolderId();
  const now = new Date();
  const fileName = `FinWise_${titleSuffix}_${now.toISOString().slice(0, 10)}.csv`;

  // Build CSV content
  const headers = ['Data', 'Tipo', 'Categoria', 'Descrição / Nota', 'Valor (R$)', 'Frequência'];
  const rows = transactions.map(t => [
    t.date.split('T')[0],
    t.type === 'expense' ? 'Despesa' : 'Receita',
    `"${t.category || ''}"`,
    `"${(t.note || '').replace(/"/g, '""')}"`,
    t.amount.toFixed(2),
    t.frequency || 'Única',
  ]);

  const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: 'text/csv',
    description: `Relatório exportado em formato CSV pelo FinWise em ${now.toLocaleString('pt-BR')}.`,
  };

  const boundary = `-------FinWiseCsvBoundary${Date.now()}`;
  const multipartRequestBody =
    `\r\n--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\n` +
    'Content-Type: text/csv; charset=UTF-8\r\n\r\n' +
    csvString +
    `\r\n--${boundary}--`;

  const res = await driveFetch(
    `${DRIVE_UPLOAD_URL}/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink`,
    {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  return await res.json();
}

/**
 * Upload receipt image/PDF to Receipts folder on Google Drive
 */
export async function uploadReceiptToDrive(
  file: File, 
  transactionNote?: string
): Promise<DriveFileInfo> {
  const receiptsFolderId = await getReceiptsFolderId();
  const extension = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanName = transactionNote ? `Comprovante_${transactionNote.replace(/[^a-zA-Z0-9_-]/g, '_')}_${dateStr}${extension}` : `Comprovante_${file.name}`;

  const metadata = {
    name: cleanName,
    parents: [receiptsFolderId],
    mimeType: file.type || 'application/octet-stream',
    description: `Comprovante vinculado pelo FinWise em ${new Date().toLocaleString('pt-BR')}.`,
  };

  const boundary = `-------FinWiseReceiptBoundary${Date.now()}`;
  
  // Read file as ArrayBuffer for multipart
  const arrayBuffer = await file.arrayBuffer();
  const metadataPart = new Blob(
    [`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`],
    { type: 'text/plain' }
  );
  const closingPart = new Blob([`\r\n--${boundary}--`], { type: 'text/plain' });

  const multipartBody = new Blob([metadataPart, arrayBuffer, closingPart]);

  const res = await driveFetch(
    `${DRIVE_UPLOAD_URL}/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink`,
    {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  return await res.json();
}

/**
 * List all receipts stored in Google Drive
 */
export async function listReceiptFiles(): Promise<DriveFileInfo[]> {
  const folderId = await getReceiptsFolderId();
  const query = `'${folderId}' in parents and trashed = false`;
  
  const res = await driveFetch(
    `${DRIVE_API_URL}/files?q=${encodeURIComponent(query)}&orderBy=modifiedTime desc&fields=files(id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink)`
  );
  const data = await res.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    size: f.size,
    modifiedTime: f.modifiedTime,
    webViewLink: f.webViewLink,
    thumbnailLink: f.thumbnailLink,
  }));
}

/**
 * Delete a file on Google Drive permanently.
 * NOTE: UI must ALWAYS prompt the user for confirmation prior to calling this!
 */
export async function deleteDriveFile(fileId: string): Promise<void> {
  await driveFetch(`${DRIVE_API_URL}/files/${fileId}`, {
    method: 'DELETE',
  });
}
