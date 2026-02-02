import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../config/api'

export const facultyService = {
  async create(facultyData) {
    return await apiClient.post(API_ENDPOINTS.FACULTY, facultyData)
  },

  async list(filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active)
    if (filters.department) params.append('department', filters.department)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return await apiClient.get(`${API_ENDPOINTS.FACULTY}${query}`)
  },

  async getById(id) {
    return await apiClient.get(API_ENDPOINTS.FACULTY_DETAIL(id))
  },

  async update(id, facultyData) {
    return await apiClient.put(API_ENDPOINTS.FACULTY_DETAIL(id), facultyData)
  },

  async delete(id) {
    return await apiClient.delete(API_ENDPOINTS.FACULTY_DETAIL(id))
  },

  async activate(id) {
    return await apiClient.post(API_ENDPOINTS.FACULTY_ACTIVATE(id))
  },

  async deactivate(id) {
    return await apiClient.post(API_ENDPOINTS.FACULTY_DEACTIVATE(id))
  },

  async getSalaryStructure(id) {
    return await apiClient.get(API_ENDPOINTS.FACULTY_SALARY_STRUCTURE(id))
  },

  async updateSalaryStructure(id, salaryData) {
    return await apiClient.put(API_ENDPOINTS.FACULTY_SALARY_STRUCTURE(id), salaryData)
  },
}

export const salaryVoucherService = {
  async generate(voucherData) {
    return await apiClient.post(API_ENDPOINTS.SALARY_VOUCHER_GENERATE, voucherData)
  },

  async list(filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.faculty_id) params.append('faculty_id', filters.faculty_id)
    if (filters.month) params.append('month', filters.month)
    if (filters.year) params.append('year', filters.year)
    if (filters.status) params.append('status', filters.status)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return await apiClient.get(`${API_ENDPOINTS.SALARY_VOUCHERS}${query}`)
  },

  async getById(id) {
    return await apiClient.get(API_ENDPOINTS.SALARY_VOUCHER_DETAIL(id))
  },

  async update(id, voucherData) {
    return await apiClient.put(API_ENDPOINTS.SALARY_VOUCHER_DETAIL(id), voucherData)
  },

  async delete(id) {
    return await apiClient.delete(API_ENDPOINTS.SALARY_VOUCHER_DETAIL(id))
  },

  async addAdjustment(id, adjustmentData) {
    return await apiClient.post(API_ENDPOINTS.SALARY_VOUCHER_ADJUSTMENTS(id), adjustmentData)
  },

  async recordPayment(id, paymentData) {
    return await apiClient.post(API_ENDPOINTS.SALARY_VOUCHER_RECORD_PAYMENT(id), paymentData)
  },

  async downloadPDF(id) {
    const token = apiClient.getToken()
    const url = `${apiClient.baseURL}${API_ENDPOINTS.SALARY_VOUCHER_PDF(id)}`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to download PDF')
    }
    
    const blob = await response.blob()
    const urlBlob = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = urlBlob
    a.download = `salary-voucher-${id}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(urlBlob)
    document.body.removeChild(a)
  },
}
