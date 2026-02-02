import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../config/api'

export const documentService = {
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

  async list(filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.student_id) params.append('student_id', filters.student_id)
    if (filters.faculty_id) params.append('faculty_id', filters.faculty_id)
    if (filters.document_type) params.append('document_type', filters.document_type)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return await apiClient.get(`${API_ENDPOINTS.DOCUMENTS}${query}`)
  },

  async getById(id) {
    return await apiClient.get(`${API_ENDPOINTS.DOCUMENTS}/${id}`)
  },

  async download(id, filename) {
    const token = apiClient.getToken()
    const url = `${apiClient.baseURL}${API_ENDPOINTS.DOCUMENT_DOWNLOAD(id)}`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to download document')
    }
    
    const blob = await response.blob()
    const urlBlob = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = urlBlob
    a.download = filename || `document-${id}`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(urlBlob)
    document.body.removeChild(a)
  },

  async delete(id) {
    return await apiClient.delete(API_ENDPOINTS.DOCUMENT_DELETE(id))
  },
}
