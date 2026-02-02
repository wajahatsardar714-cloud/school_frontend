import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../config/api'

export const reportService = {
  async getDailyClosing(date) {
    const query = date ? `?date=${date}` : ''
    return await apiClient.get(`${API_ENDPOINTS.REPORTS_DAILY_CLOSING}${query}`)
  },

  async getProfitLossStatement(startDate, endDate) {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return await apiClient.get(`${API_ENDPOINTS.REPORTS_PL_STATEMENT}${query}`)
  },

  async getFeeCollection(filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.class_id) params.append('class_id', filters.class_id)
    if (filters.group_by) params.append('group_by', filters.group_by)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return await apiClient.get(`${API_ENDPOINTS.REPORTS_FEE_COLLECTION}${query}`)
  },

  async getDefaultersReport(filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.class_id) params.append('class_id', filters.class_id)
    if (filters.month) params.append('month', filters.month)
    if (filters.year) params.append('year', filters.year)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return await apiClient.get(`${API_ENDPOINTS.REPORTS_DEFAULTERS}${query}`)
  },
}
