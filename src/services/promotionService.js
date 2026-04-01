import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../config/api'

export const promotionService = {
  async fullSchoolPromotion(payload = {}) {
    return await apiClient.post(API_ENDPOINTS.PROMOTIONS_FULL_SCHOOL, payload)
  },

  async fullCollegePromotion(payload = {}) {
    return await apiClient.post(API_ENDPOINTS.PROMOTIONS_FULL_COLLEGE, payload)
  },

  async classPromotion(payload) {
    return await apiClient.post(API_ENDPOINTS.PROMOTIONS_CLASS, payload)
  },

  async history() {
    return await apiClient.get(API_ENDPOINTS.PROMOTIONS_HISTORY)
  },

  async undo(runId) {
    return await apiClient.post(API_ENDPOINTS.PROMOTIONS_UNDO(runId), {})
  },

  async listExClasses() {
    return await apiClient.get(API_ENDPOINTS.PROMOTIONS_EX_CLASSES)
  },

  async getExClassBatch(batchId) {
    return await apiClient.get(API_ENDPOINTS.PROMOTIONS_EX_CLASS_DETAIL(batchId))
  },
}
