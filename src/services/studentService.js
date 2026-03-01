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
    if (filters.search) params.append('search', filters.search)

    const query = params.toString() ? `?${params.toString()}` : ''
    return await apiClient.get(`${API_ENDPOINTS.STUDENTS}${query}`)
  },

  async search(searchTerm) {
    const params = new URLSearchParams()
    if (searchTerm) params.append('search', searchTerm)
    
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

  // Bulk update existing students with missing data (phone, fee, etc.)
  async bulkUpdate(data) {
    console.log('📝 Calling bulk update with data:', {
      studentsCount: data.students?.length || 0,
      classId: data.class_id,
      sectionId: data.section_id,
      endpoint: API_ENDPOINTS.STUDENTS_BULK_UPDATE
    })
    return await apiClient.post(API_ENDPOINTS.STUDENTS_BULK_UPDATE, data, { 
      requiresAuth: false
    })
  },

  async bulkDeactivate() {
    return await apiClient.post('/api/students/bulk-deactivate')
  },

  // Bulk delete students permanently from database
  async bulkDelete(data) {
    // Handle both old format (array) and new format (object)
    const requestBody = Array.isArray(data) ? {
      student_ids: data
    } : data;
    
    console.log('📡 Making bulk delete API call:', { data: requestBody, endpoint: API_ENDPOINTS.STUDENTS_BULK_DELETE })
    
    try {
      // Use the no-auth bulk delete endpoint directly
      const response = await apiClient.post(API_ENDPOINTS.STUDENTS_BULK_DELETE, requestBody, { 
        requiresAuth: false // Explicitly disable auth
      })
      
      console.log('✅ Bulk delete successful:', response)
      return response
      
    } catch (error) {
      console.error('❌ Bulk delete failed:', error)
      throw error
    }
  },

  // Individual delete student permanently
  async delete(id) {
    return await apiClient.delete(API_ENDPOINTS.STUDENT_DETAIL(id))
  },

  // Update basic student info (name, father name, contact, fee)
  async updateBasicInfo(id, data) {
    return await apiClient.patch(`/api/students/${id}/basic-info`, data, {
      requiresAuth: false
    })
  },

  // Mark students as fee-free (no voucher generation)
  async markFree(data) {
    return await apiClient.post('/api/students/mark-free', data, {
      requiresAuth: false
    })
  },

  // Unmark students as fee-free (resume voucher generation)
  async unmarkFree(data) {
    return await apiClient.post('/api/students/unmark-free', data, {
      requiresAuth: false
    })
  },
}
