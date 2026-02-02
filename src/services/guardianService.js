import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../config/api'

export const guardianService = {
  async create(guardianData) {
    return await apiClient.post(API_ENDPOINTS.GUARDIANS, guardianData)
  },

  async list(searchQuery = '') {
    const query = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''
    return await apiClient.get(`${API_ENDPOINTS.GUARDIANS}${query}`)
  },

  async getById(id) {
    return await apiClient.get(API_ENDPOINTS.GUARDIAN_DETAIL(id))
  },

  async searchByCNIC(cnic) {
    return await apiClient.get(API_ENDPOINTS.GUARDIAN_SEARCH_CNIC(cnic))
  },

  async update(id, guardianData) {
    return await apiClient.put(API_ENDPOINTS.GUARDIAN_DETAIL(id), guardianData)
  },

  async delete(id) {
    return await apiClient.delete(API_ENDPOINTS.GUARDIAN_DETAIL(id))
  },
}
