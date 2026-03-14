/**
 * Client-side file validation utilities
 */

export const ALLOWED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx',
  'zip', 'rar', '7z',
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg',
  'txt', 'md', 'csv'
] as const;

export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  pdf: ['application/pdf'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ppt: ['application/vnd.ms-powerpoint'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  xls: ['application/vnd.ms-excel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  zip: ['application/zip', 'application/x-zip-compressed'],
  rar: ['application/x-rar-compressed', 'application/vnd.rar'],
  '7z': ['application/x-7z-compressed'],
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  gif: ['image/gif'],
  webp: ['image/webp'],
  svg: ['image/svg+xml'],
  txt: ['text/plain'],
  md: ['text/markdown', 'text/plain'],
  csv: ['text/csv', 'application/csv'],
};

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Get the file extension from a filename
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if a file extension is allowed
 */
export function isAllowedExtension(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number]);
}

/**
 * Check if a file's MIME type matches its extension
 */
export function isValidMimeType(file: File): boolean {
  const ext = getFileExtension(file.name);
  const allowedMimes = ALLOWED_MIME_TYPES[ext];
  
  if (!allowedMimes) return false;
  
  // Some browsers don't report MIME type correctly, so we accept empty MIME types
  // but warn about it
  if (!file.type) return true;
  
  return allowedMimes.includes(file.type);
}

/**
 * Validate file size
 */
export function validateFileSize(file: File): ValidationResult {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File is too large (${sizeMB}MB). Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`
    };
  }
  
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty. Please select a valid file.'
    };
  }
  
  return { valid: true };
}

/**
 * Validate file extension
 */
export function validateFileExtension(file: File): ValidationResult {
  const ext = getFileExtension(file.name);
  
  if (!ext) {
    return {
      valid: false,
      error: 'File has no extension. Please select a valid document file.'
    };
  }
  
  if (!isAllowedExtension(file.name)) {
    return {
      valid: false,
      error: `File type ".${ext}" is not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`
    };
  }
  
  return { valid: true };
}

/**
 * Validate MIME type matches extension
 */
export function validateMimeType(file: File): ValidationResult {
  if (!isValidMimeType(file)) {
    const ext = getFileExtension(file.name);
    return {
      valid: false,
      error: `File appears to be corrupted or has wrong extension. Expected ${ext.toUpperCase()} but got different content.`
    };
  }
  
  return { valid: true };
}

/**
 * Check PDF header bytes (basic corruption check)
 */
export async function validatePdfHeader(file: File): Promise<ValidationResult> {
  const ext = getFileExtension(file.name);
  if (ext !== 'pdf') {
    return { valid: true }; // Not a PDF, skip
  }
  
  try {
    const buffer = await file.slice(0, 5).arrayBuffer();
    const header = new Uint8Array(buffer);
    
    // PDF header should start with %PDF-
    const pdfMagic = [0x25, 0x50, 0x44, 0x46, 0x2D]; // %PDF-
    const isValid = pdfMagic.every((byte, i) => header[i] === byte);
    
    if (!isValid) {
      return {
        valid: false,
        error: 'This PDF file appears to be corrupted or invalid. Please try a different file.'
      };
    }
    
    return { valid: true };
  } catch {
    return {
      valid: false,
      error: 'Could not validate PDF file. Please try again.'
    };
  }
}

/**
 * Comprehensive file validation
 */
export async function validateFile(file: File): Promise<ValidationResult> {
  // Check size first (fastest check)
  const sizeResult = validateFileSize(file);
  if (!sizeResult.valid) return sizeResult;
  
  // Check extension
  const extResult = validateFileExtension(file);
  if (!extResult.valid) return extResult;
  
  // Check MIME type
  const mimeResult = validateMimeType(file);
  if (!mimeResult.valid) return mimeResult;
  
  // Check PDF header for PDFs
  const pdfResult = await validatePdfHeader(file);
  if (!pdfResult.valid) return pdfResult;
  
  return { valid: true };
}

/**
 * Format bytes to human readable size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get accepted file input string
 */
export function getAcceptString(): string {
  return ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',');
}
