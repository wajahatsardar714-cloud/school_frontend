import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../config/api'

/**
 * Enhanced Document Service
 * Provides comprehensive document management for students and faculty
 */
export const documentService = {
  /**
   * Upload a document for a specific student
   * @param {number} studentId - Student ID
   * Upload multiple documents for a specific student in bulk
   * @param {number} studentId - Student ID
   * @param {Array<{file: File, documentType: string, description?: string}>} files - Array of file objects to upload
   * @returns {Promise} Upload response
   */
  /**
   * Upload a document for a specific student
   * @param {number} studentId - Student ID
   * @param {File} file - File to upload
   * @param {string} documentType - Type of document
   * @param {string} description - Optional description
   * @returns {Promise} Upload response
   */
  async uploadStudentDocument(studentId, file, documentType, description = '') {
    const formData = new FormData()
    formData.append('document', file)
    formData.append('document_type', documentType)

    if (description) {
      formData.append('description', description)
    }

    const token = apiClient.getToken()
    const url = `${apiClient.baseURL}/api/students/${studentId}/documents`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Upload failed')
    }

    return await response.json()
  },

  /**
   * Upload multiple documents for a student
   * @param {number} studentId - Student ID
   * @param {File[]} files - Array of files to upload
   * @param {string} documentType - Type of documents
   * @param {string} description - Optional description
   * @returns {Promise} - Upload response
   */

  async uploadMultipleDocuments(studentId, files) {
    const formData = new FormData()

    files.forEach((fileObj, index) => {
      formData.append('files', fileObj.file)
      formData.append(`document_types[${index}]`, fileObj.documentType)
      if (fileObj.description) {
        formData.append(`descriptions[${index}]`, fileObj.description)
      }
    })

    const token = apiClient.getToken()
    const url = `${apiClient.baseURL}/api/students/${studentId}/documents/bulk`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Bulk upload failed')
    }

    return await response.json()
  },

  /**
   * Get all documents for a specific student
   * @param {number} studentId - Student ID
   * @param {string} documentType - Optional filter by document type
   * @returns {Promise} Student data with documents array
   */
  async getStudentDocuments(studentId, documentType = null) {
    try {
      const apiBody = await apiClient.get(`/api/students/${studentId}/documents`)
      let documents = []

      if (apiBody && apiBody.data) {
        if (Array.isArray(apiBody.data.documents)) {
          documents = apiBody.data.documents
        } else if (Array.isArray(apiBody.data)) {
          documents = apiBody.data
        }
      } else if (Array.isArray(apiBody)) {
        documents = apiBody
      }

      // Filter by document type if specified
      if (documentType) {
        documents = documents.filter(doc => doc.document_type === documentType)
      }

      return {
        success: true,
        data: documents
      }
    } catch (error) {
      console.error('Error fetching student documents:', error)
      // Fallback to checking student details if dedicated endpoint fails
      try {
        const studentBody = await apiClient.get(`/api/students/${studentId}`)
        let documents = []

        if (studentBody && studentBody.data) {
          if (Array.isArray(studentBody.data.documents)) {
            documents = studentBody.data.documents
          } else if (Array.isArray(studentBody.data)) {
            documents = studentBody.data
          }
        } else if (studentBody && Array.isArray(studentBody.documents)) {
          documents = studentBody.documents
        }

        if (documentType) {
          documents = documents.filter(doc => doc.document_type === documentType)
        }

        return {
          success: true,
          data: documents
        }
      } catch (fallbackError) {
        console.error('Fallback fetch failed:', fallbackError)
        // Return empty list instead of throwing to prevent UI crash
        return {
          success: false,
          data: []
        }
      }
    }
  },

  /**
   * Get a specific document by ID
   * @param {number} documentId - Document ID
   * @returns {Promise} - Document details
   */
  async getDocumentById(documentId) {
    return await apiClient.get(`${API_ENDPOINTS.DOCUMENTS}/${documentId}`)
  },

  /**
   * Get document download URL (signed URL / temporary access)
   * @param {number} documentId - Document ID
   * @returns {Promise} Download URL
   */
  async getDownloadUrl(documentId) {
    return await apiClient.get(`/api/documents/${documentId}/url`)
  },

  /**
   * Update document metadata
   * @param {number} documentId - Document ID
   * @param {string} documentType - Document type
   * @param {string} description - Description
   * @returns {Promise} - Update response
   */
  async updateDocument(documentId, documentType, description) {
    return await apiClient.put(`${API_ENDPOINTS.DOCUMENTS}/${documentId}`, {
      document_type: documentType,
      description
    })
  },

  /**
   * Delete a document
   * @param {number} documentId - Document ID
   * @returns {Promise} - Delete response
   */
  async deleteDocument(documentId) {
    return await apiClient.delete(API_ENDPOINTS.DOCUMENT_DELETE(documentId))
  },

  /**
   * Download a document
   * @param {number} documentId - Document ID
   * @param {string} filename - Filename to save as
   */
  async downloadDocument(documentId, filename) {
    const token = apiClient.getToken()
    const url = `${apiClient.baseURL}/api/documents/${documentId}/download`

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to download document')
      }

      const blob = await response.blob()
      const urlBlob = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = urlBlob
      a.download = filename || `document-${documentId}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(urlBlob)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      throw error
    }
  },

  /**
   * Legacy method - kept for backward compatibility
   */
  async upload(file, metadata = {}) {
    const formData = new FormData()
    formData.append('file', file)

    if (metadata.student_id) formData.append('student_id', metadata.student_id)
    if (metadata.faculty_id) formData.append('faculty_id', metadata.faculty_id)
    if (metadata.document_type) formData.append('document_type', metadata.document_type)
    if (metadata.description) formData.append('description', metadata.description)

    const token = apiClient.getToken()
    const url = `${apiClient.baseURL}${API_ENDPOINTS.DOCUMENT_UPLOAD}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Upload failed')
    }

    return await response.json()
  },

  /**
   * Legacy method - kept for backward compatibility
   */
  async list(filters = {}) {
    const params = new URLSearchParams()

    if (filters.student_id) params.append('student_id', filters.student_id)
    if (filters.faculty_id) params.append('faculty_id', filters.faculty_id)
    if (filters.document_type) params.append('document_type', filters.document_type)

    const query = params.toString() ? `?${params.toString()}` : ''
    return await apiClient.get(`${API_ENDPOINTS.DOCUMENTS}${query}`)
  },

  /**
   * Legacy method - kept for backward compatibility
   */
  async getById(id) {
    return await apiClient.get(`${API_ENDPOINTS.DOCUMENTS}/${id}`)
  },

  /**
   * Legacy method - kept for backward compatibility
   */
  async download(id, filename) {
    return await this.downloadDocument(id, filename)
  },

  /**
   * Legacy method - kept for backward compatibility
   */
  async delete(id) {
    return await apiClient.delete(API_ENDPOINTS.DOCUMENT_DELETE(id))
  },
}

