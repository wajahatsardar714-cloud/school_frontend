import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../config/api'

export const analyticsService = {
  async getDashboard() {
    return await apiClient.get(API_ENDPOINTS.ANALYTICS_DASHBOARD)
  },

  async getRevenueTrends(filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.granularity) params.append('granularity', filters.granularity)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return await apiClient.get(`${API_ENDPOINTS.ANALYTICS_REVENUE_TRENDS}${query}`)
  },

  async getEnrollmentStats(filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.year) params.append('year', filters.year)
    if (filters.class_id) params.append('class_id', filters.class_id)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return await apiClient.get(`${API_ENDPOINTS.ANALYTICS_ENROLLMENT_STATS}${query}`)
  },

  async getClassPerformance(filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.class_id) params.append('class_id', filters.class_id)
    if (filters.metric) params.append('metric', filters.metric)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return await apiClient.get(`${API_ENDPOINTS.ANALYTICS_CLASS_PERFORMANCE}${query}`)
  },
}
