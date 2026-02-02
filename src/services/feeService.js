import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../config/api'

export const feeVoucherService = {
  async generate(voucherData) {
    return await apiClient.post(API_ENDPOINTS.FEE_VOUCHER_GENERATE, voucherData)
  },

  async bulkGenerate(bulkData) {
    return await apiClient.post(API_ENDPOINTS.FEE_VOUCHER_BULK_GENERATE, bulkData)
  },

  async list(filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.student_id) params.append('student_id', filters.student_id)
    if (filters.class_id) params.append('class_id', filters.class_id)
    if (filters.status) params.append('status', filters.status)
    if (filters.month) params.append('month', filters.month)
    if (filters.year) params.append('year', filters.year)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return await apiClient.get(`${API_ENDPOINTS.FEE_VOUCHERS}${query}`)
  },

  async getById(id) {
    return await apiClient.get(API_ENDPOINTS.FEE_VOUCHER_DETAIL(id))
  },

  async update(id, voucherData) {
    return await apiClient.put(API_ENDPOINTS.FEE_VOUCHER_DETAIL(id), voucherData)
  },

  async delete(id) {
    return await apiClient.delete(API_ENDPOINTS.FEE_VOUCHER_DETAIL(id))
  },

  async downloadPDF(id) {
    const token = apiClient.getToken()
    const url = `${apiClient.baseURL}${API_ENDPOINTS.FEE_VOUCHER_PDF(id)}`
    
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
    a.download = `fee-voucher-${id}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(urlBlob)
    document.body.removeChild(a)
  },
}

export const feePaymentService = {
  async record(paymentData) {
    return await apiClient.post(API_ENDPOINTS.FEE_PAYMENT_RECORD, paymentData)
  },

  async list(filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.student_id) params.append('student_id', filters.student_id)
    if (filters.voucher_id) params.append('voucher_id', filters.voucher_id)
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return await apiClient.get(`${API_ENDPOINTS.FEE_PAYMENTS}${query}`)
  },

  async getById(id) {
    return await apiClient.get(`${API_ENDPOINTS.FEE_PAYMENTS}/${id}`)
  },

  async downloadReceipt(id) {
    const token = apiClient.getToken()
    const url = `${apiClient.baseURL}${API_ENDPOINTS.FEE_PAYMENT_RECEIPT(id)}`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to download receipt')
    }
    
    const blob = await response.blob()
    const urlBlob = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = urlBlob
    a.download = `fee-receipt-${id}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(urlBlob)
    document.body.removeChild(a)
  },

  async getDefaulters(filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.class_id) params.append('class_id', filters.class_id)
    if (filters.month) params.append('month', filters.month)
    if (filters.year) params.append('year', filters.year)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return await apiClient.get(`${API_ENDPOINTS.FEE_DEFAULTERS}${query}`)
  },
}
