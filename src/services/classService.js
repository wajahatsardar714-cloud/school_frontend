import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../config/api'

export const classService = {
  async create(classData) {
    return await apiClient.post(API_ENDPOINTS.CLASSES, classData)
  },

  async list() {
    return await apiClient.get(API_ENDPOINTS.CLASSES)
  },

  async getById(id) {
    return await apiClient.get(API_ENDPOINTS.CLASS_DETAIL(id))
  },

  async update(id, classData) {
    return await apiClient.put(API_ENDPOINTS.CLASS_DETAIL(id), classData)
  },

  async delete(id) {
    return await apiClient.delete(API_ENDPOINTS.CLASS_DETAIL(id))
  },

  async getFeeStructure(id) {
    return await apiClient.get(API_ENDPOINTS.CLASS_FEE_STRUCTURE(id))
  },

  async updateFeeStructure(id, feeStructure) {
    return await apiClient.put(API_ENDPOINTS.CLASS_FEE_STRUCTURE(id), feeStructure)
  },

  async getFeeHistory(id) {
    return await apiClient.get(API_ENDPOINTS.CLASS_FEE_HISTORY(id))
  },
}

export const sectionService = {
  async create(sectionData) {
    return await apiClient.post(API_ENDPOINTS.SECTIONS, sectionData)
  },

  async list(classId = null) {
    const query = classId ? `?class_id=${classId}` : ''
    return await apiClient.get(`${API_ENDPOINTS.SECTIONS}${query}`)
  },

  async getById(id) {
    return await apiClient.get(API_ENDPOINTS.SECTION_DETAIL(id))
  },

  async update(id, sectionData) {
    return await apiClient.put(API_ENDPOINTS.SECTION_DETAIL(id), sectionData)
  },

  async delete(id) {
    return await apiClient.delete(API_ENDPOINTS.SECTION_DETAIL(id))
  },

  async getStudents(id) {
    return await apiClient.get(API_ENDPOINTS.SECTION_STUDENTS(id))
  },
}
