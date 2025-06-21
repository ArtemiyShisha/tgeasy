// File upload utilities for TGeasy contracts
import { ContractFilePreview, FileUploadProgress, ContractError } from '@/types/contract-ui';

// File validation constants
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain'
];

export const ALLOWED_FILE_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.txt'
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
export const RESUMABLE_UPLOAD_THRESHOLD = 5 * 1024 * 1024; // 5MB

// File type detection
export function getFileType(file: File): 'pdf' | 'doc' | 'docx' | 'image' | 'other' {
  const mimeType = file.type.toLowerCase();
  const extension = file.name.toLowerCase().split('.').pop();

  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return 'pdf';
  }
  
  if (mimeType === 'application/msword' || extension === 'doc') {
    return 'doc';
  }
  
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || extension === 'docx') {
    return 'docx';
  }
  
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
    return 'image';
  }
  
  return 'other';
}

// File size formatting
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// File validation
export function validateContractFile(file: File): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`Файл слишком большой. Максимальный размер: ${formatFileSize(MAX_FILE_SIZE)}`);
  }
  
  // Check file type
  const extension = '.' + file.name.toLowerCase().split('.').pop();
  if (!ALLOWED_FILE_TYPES.includes(file.type) && !ALLOWED_FILE_EXTENSIONS.includes(extension)) {
    errors.push('Неподдерживаемый тип файла. Разрешены: PDF, DOC, DOCX, JPG, PNG, GIF, TXT');
  }
  
  // Check file name
  if (file.name.length > 255) {
    errors.push('Слишком длинное имя файла (максимум 255 символов)');
  }
  
  // Check for empty file
  if (file.size === 0) {
    errors.push('Файл пустой');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Generate file preview
export async function generateContractPreview(file: File): Promise<ContractFilePreview> {
  const validation = validateContractFile(file);
  const url = URL.createObjectURL(file);
  
  return {
    file,
    url,
    type: getFileType(file),
    size: file.size,
    formattedSize: formatFileSize(file.size),
    isValid: validation.isValid,
    validationErrors: validation.errors
  };
}

// Progress calculation utilities
export function calculateUploadProgress(loaded: number, total: number): FileUploadProgress {
  const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
  
  return {
    loaded,
    total,
    percentage
  };
}

export function calculateUploadSpeed(loaded: number, startTime: number): number {
  const elapsedTime = (Date.now() - startTime) / 1000; // seconds
  return elapsedTime > 0 ? loaded / elapsedTime : 0;
}

export function calculateTimeRemaining(loaded: number, total: number, speed: number): number {
  if (speed === 0 || loaded >= total) return 0;
  return Math.round((total - loaded) / speed);
}

// Enhanced progress with speed and time estimation
export function calculateEnhancedProgress(
  loaded: number, 
  total: number, 
  startTime: number
): FileUploadProgress {
  const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
  const speed = calculateUploadSpeed(loaded, startTime);
  const timeRemaining = calculateTimeRemaining(loaded, total, speed);
  
  return {
    loaded,
    total,
    percentage,
    speed,
    timeRemaining
  };
}

// Chunked upload utilities
export interface ChunkInfo {
  chunk: Blob;
  index: number;
  start: number;
  end: number;
  size: number;
}

export function createFileChunks(file: File, chunkSize: number = CHUNK_SIZE): ChunkInfo[] {
  const chunks: ChunkInfo[] = [];
  let start = 0;
  let index = 0;
  
  while (start < file.size) {
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    
    chunks.push({
      chunk,
      index,
      start,
      end,
      size: chunk.size
    });
    
    start = end;
    index++;
  }
  
  return chunks;
}

// Upload state management for resumable uploads
export interface UploadState {
  uploadId: string;
  fileName: string;
  fileSize: number;
  chunkSize: number;
  uploadedChunks: number[];
  totalChunks: number;
  startTime: number;
}

export function createUploadState(file: File, chunkSize: number = CHUNK_SIZE): UploadState {
  const totalChunks = Math.ceil(file.size / chunkSize);
  
  return {
    uploadId: generateUploadId(),
    fileName: file.name,
    fileSize: file.size,
    chunkSize,
    uploadedChunks: [],
    totalChunks,
    startTime: Date.now()
  };
}

export function generateUploadId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Resume upload utilities
export function saveUploadState(uploadState: UploadState): void {
  try {
    localStorage.setItem(`upload_${uploadState.uploadId}`, JSON.stringify(uploadState));
  } catch (error) {
    console.warn('Failed to save upload state:', error);
  }
}

export function loadUploadState(uploadId: string): UploadState | null {
  try {
    const saved = localStorage.getItem(`upload_${uploadId}`);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn('Failed to load upload state:', error);
    return null;
  }
}

export function clearUploadState(uploadId: string): void {
  try {
    localStorage.removeItem(`upload_${uploadId}`);
  } catch (error) {
    console.warn('Failed to clear upload state:', error);
  }
}

// Error handling utilities
export function createUploadError(message: string, code?: string, statusCode?: number): ContractError {
  const error = new Error(message) as ContractError;
  error.name = 'UploadError';
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

export function isRetryableError(error: any): boolean {
  // Network errors, timeouts, and 5xx server errors are retryable
  if (!error.statusCode) return true; // Network error
  return error.statusCode >= 500 || error.statusCode === 408 || error.statusCode === 429;
}

export function getRetryDelay(attempt: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s
  return Math.min(1000 * Math.pow(2, attempt), 16000);
}

// File URL utilities
export function createFilePreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

export function revokeFilePreviewUrl(url: string): void {
  try {
    URL.revokeObjectURL(url);
  } catch (error) {
    console.warn('Failed to revoke object URL:', error);
  }
}

// MIME type utilities
export function getMimeTypeFromExtension(filename: string): string {
  const extension = filename.toLowerCase().split('.').pop();
  
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'txt': 'text/plain'
  };
  
  return mimeTypes[extension || ''] || 'application/octet-stream';
}

// Drag and drop utilities
export function handleDragOver(event: DragEvent): void {
  event.preventDefault();
  event.stopPropagation();
}

export function handleDrop(event: DragEvent): File[] {
  event.preventDefault();
  event.stopPropagation();
  
  const files: File[] = [];
  
  if (event.dataTransfer?.files) {
    for (let i = 0; i < event.dataTransfer.files.length; i++) {
      const file = event.dataTransfer.files[i];
      if (file) {
        files.push(file);
      }
    }
  }
  
  return files;
}

// Upload progress formatting
export function formatUploadProgress(progress: FileUploadProgress): string {
  const { loaded, total, percentage, speed, timeRemaining } = progress;
  
  let text = `${formatFileSize(loaded)} / ${formatFileSize(total)} (${percentage}%)`;
  
  if (speed && speed > 0) {
    text += ` • ${formatFileSize(speed)}/s`;
  }
  
  if (timeRemaining && timeRemaining > 0) {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    
    if (minutes > 0) {
      text += ` • ${minutes}м ${seconds}с осталось`;
    } else {
      text += ` • ${seconds}с осталось`;
    }
  }
  
  return text;
}

// Cleanup utilities
export function cleanupFilePreview(preview: ContractFilePreview | null): void {
  if (preview?.url) {
    revokeFilePreviewUrl(preview.url);
  }
}

export function cleanupUploadState(uploadId: string): void {
  clearUploadState(uploadId);
} 