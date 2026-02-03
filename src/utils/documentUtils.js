/**
 * Document Type Constants
 */
export const DOCUMENT_TYPES = {
  PHOTO: 'PHOTO',
  BAY_FORM: 'BAY_FORM',
  FATHER_CNIC: 'FATHER_CNIC',
  BIRTH_CERTIFICATE: 'BIRTH_CERTIFICATE',
  CUSTOM: 'CUSTOM'
}

export const DOCUMENT_TYPE_LABELS = {
  PHOTO: 'Student Photo',
  BAY_FORM: 'Bay Form / B-Form',
  FATHER_CNIC: "Father's CNIC",
  BIRTH_CERTIFICATE: 'Birth Certificate',
  CUSTOM: 'Custom Document'
}

/**
 * File Validation Constants
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_FILE_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',

  // Documents
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
]

export const ALLOWED_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx'
]

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validateFile = (file) => {
  if (!file) {
    return 'No file selected'
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return `File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return 'File type not supported. Allowed: Images (JPG, PNG, GIF) and Documents (PDF, DOC/DOCX, XLS/XLSX)'
  }

  return null
}

/**
 * Format bytes to human-readable file size
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

/**
 * Get display label for document type
 * @param {string} type - Document type constant
 * @returns {string} - Display label
 */
export const getDocumentTypeLabel = (type) => {
  return DOCUMENT_TYPE_LABELS[type] || type.replace(/_/g, ' ')
}

/**
 * Check if file is an image
 * @param {string} mimeType - File MIME type
 * @returns {boolean}
 */
export const isImageFile = (mimeType) => {
  return mimeType && mimeType.startsWith('image/')
}

/**
 * Check if file is a PDF
 * @param {string} mimeType - File MIME type
 * @returns {boolean}
 */
export const isPdfFile = (mimeType) => {
  return mimeType === 'application/pdf'
}

/**
 * Get file extension from filename
 * @param {string} filename - File name
 * @returns {string} - File extension
 */
export const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase()
}

/**
 * Validate file extension
 * @param {string} filename - File name
 * @returns {boolean}
 */
export const isValidExtension = (filename) => {
  const ext = getFileExtension(filename)
  return ALLOWED_EXTENSIONS.includes(ext)
}
