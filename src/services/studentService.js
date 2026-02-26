import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../config/api'

export const studentService = {
  async create(studentData) {
    return await apiClient.post(API_ENDPOINTS.STUDENTS, studentData)
  },

  async list(filters = {}) {
    const params = new URLSearchParams()

    if (filters.class_id) params.append('class_id', filters.class_id)
    if (filters.section_id) params.append('section_id', filters.section_id)
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active)
    if (filters.is_expelled !== undefined) params.append('is_expelled', filters.is_expelled)

    const query = params.toString() ? `?${params.toString()}` : ''
    return await apiClient.get(`${API_ENDPOINTS.STUDENTS}${query}`)
  },

  async getById(id) {
    return await apiClient.get(API_ENDPOINTS.STUDENT_DETAIL(id))
  },

  async update(id, studentData) {
    return await apiClient.put(API_ENDPOINTS.STUDENT_DETAIL(id), studentData)
  },

  async enroll(id, classId, sectionId, startDate) {
    return await apiClient.post(API_ENDPOINTS.STUDENT_ENROLL(id), {
      class_id: classId,
      section_id: sectionId,
      start_date: startDate,
    })
  },

  async withdraw(id, endDate) {
    return await apiClient.post(API_ENDPOINTS.STUDENT_WITHDRAW(id), {
      end_date: endDate,
    })
  },

  async transfer(id, newClassId, newSectionId, transferDate) {
    return await apiClient.post(API_ENDPOINTS.STUDENT_TRANSFER(id), {
      new_class_id: newClassId,
      new_section_id: newSectionId,
      transfer_date: transferDate,
    })
  },

  async activate(id) {
    return await apiClient.post(API_ENDPOINTS.STUDENT_ACTIVATE(id))
  },

  async deactivate(id) {
    return await apiClient.post(API_ENDPOINTS.STUDENT_DEACTIVATE(id))
  },

  async expel(id) {
    return await apiClient.post(API_ENDPOINTS.STUDENT_EXPEL(id))
  },

  async clearExpulsion(id) {
    return await apiClient.post(API_ENDPOINTS.STUDENT_CLEAR_EXPULSION(id))
  },

  async addGuardian(id, guardianId, relation) {
    return await apiClient.post(API_ENDPOINTS.STUDENT_ADD_GUARDIAN(id), {
      guardian_id: guardianId,
      relation,
    })
  },

  async removeGuardian(id, guardianId) {
    return await apiClient.delete(API_ENDPOINTS.STUDENT_REMOVE_GUARDIAN(id, guardianId))
  },

  async promote(id, promotionData) {
    // promotionData can include { class_id, section_id, force }
    return await apiClient.post(API_ENDPOINTS.STUDENT_PROMOTE(id), promotionData)
  },

  async getDocuments(id) {
    return await apiClient.get(API_ENDPOINTS.STUDENT_DOCUMENTS(id))
  },

  async updateDocument(docId, data) {
    const response = await apiClient.put(`/students/documents/${docId}`, data)
    return response.data
  },

  async deleteDocument(docId) {
    const response = await apiClient.delete(`/students/documents/${docId}`)
    return response.data
  },

  async getDocumentUrl(docId) {
    return await apiClient.get(`/api/documents/${docId}/url`)
  },

  async downloadDocument(docId) {
    return await apiClient.get(`/api/documents/${docId}/download`, { responseType: 'blob' })
  },

  async bulkCreate(studentsData) {
    console.log('🚀 Calling bulk create with data:', {
      studentsData,
      url: `${API_ENDPOINTS.STUDENTS_BULK}`,
      baseUrl: 'http://localhost:5001'
    })
    return await apiClient.post(API_ENDPOINTS.STUDENTS_BULK, studentsData, { 
      requiresAuth: false // Disable auth for testing
    })
  },

  async bulkDeactivate() {
    return await apiClient.post('/api/students/bulk-deactivate')
  },
}
