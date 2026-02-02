import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../config/api'

export const expenseService = {
  async create(expenseData) {
    return await apiClient.post(API_ENDPOINTS.EXPENSES, expenseData)
  },

  async list(filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.category) params.append('category', filters.category)
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return await apiClient.get(`${API_ENDPOINTS.EXPENSES}${query}`)
  },

  async getById(id) {
    return await apiClient.get(API_ENDPOINTS.EXPENSE_DETAIL(id))
  },

  async update(id, expenseData) {
    return await apiClient.put(API_ENDPOINTS.EXPENSE_DETAIL(id), expenseData)
  },

  async delete(id) {
    return await apiClient.delete(API_ENDPOINTS.EXPENSE_DETAIL(id))
  },

  async getSummary(filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.group_by) params.append('group_by', filters.group_by)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return await apiClient.get(`${API_ENDPOINTS.EXPENSE_SUMMARY}${query}`)
  },
}
