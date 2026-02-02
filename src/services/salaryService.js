import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../config/api'

const salaryService = {
  // Salary Structure Management
  // PUT /api/faculty/:id/salary - Set/update salary structure
  async setSalaryStructure(facultyId, data) {
    // data = { base_salary: number, effective_from: "YYYY-MM-DD" }
    return await apiClient.put(API_ENDPOINTS.FACULTY_SALARY(facultyId), data)
  },

  // GET /api/faculty/:id/salary-history - Get salary history
  async getSalaryHistory(facultyId) {
    return await apiClient.get(API_ENDPOINTS.FACULTY_SALARY_HISTORY(facultyId))
  },

  // Salary Voucher Generation
  // POST /api/salaries/generate
  async generateVoucher(data) {
    // data = { faculty_id: number, month: "YYYY-MM-DD", adjustments?: [...] }
    return await apiClient.post(API_ENDPOINTS.SALARY_GENERATE, data)
  },

  // POST /api/salaries/generate-bulk
  async generateBulkVouchers(data) {
    // data = { month: "YYYY-MM-DD", faculty_ids?: number[] }
    return await apiClient.post(API_ENDPOINTS.SALARY_GENERATE_BULK, data)
  },

  // Salary Voucher Listing
  // GET /api/salaries/vouchers
  async listVouchers(params = {}) {
    const query = new URLSearchParams()
    if (params.faculty_id) query.append('faculty_id', params.faculty_id)
    if (params.month) query.append('month', params.month)
    if (params.from_date) query.append('from_date', params.from_date)
    if (params.to_date) query.append('to_date', params.to_date)
    if (params.page) query.append('page', params.page)
    if (params.limit) query.append('limit', params.limit)
    
    const queryString = query.toString() ? `?${query.toString()}` : ''
    return await apiClient.get(`${API_ENDPOINTS.SALARY_VOUCHERS}${queryString}`)
  },

  // GET /api/salaries/unpaid
  async getUnpaidVouchers() {
    return await apiClient.get(API_ENDPOINTS.SALARY_UNPAID)
  },

  // GET /api/salaries/stats
  async getStats(params = {}) {
    const query = new URLSearchParams()
    if (params.from_date) query.append('from_date', params.from_date)
    if (params.to_date) query.append('to_date', params.to_date)
    
    const queryString = query.toString() ? `?${query.toString()}` : ''
    return await apiClient.get(`${API_ENDPOINTS.SALARY_STATS}${queryString}`)
  },

  // GET /api/salaries/voucher/:id
  async getVoucher(voucherId) {
    return await apiClient.get(API_ENDPOINTS.SALARY_VOUCHER_DETAIL(voucherId))
  },

  // DELETE /api/salaries/voucher/:id
  async deleteVoucher(voucherId) {
    return await apiClient.delete(API_ENDPOINTS.SALARY_VOUCHER_DELETE(voucherId))
  },

  // POST /api/salaries/voucher/:id/adjustment
  async addAdjustment(voucherId, data) {
    // data = { type: "BONUS"|"ADVANCE", amount: number, calc_type: "FLAT"|"PERCENTAGE" }
    return await apiClient.post(API_ENDPOINTS.SALARY_VOUCHER_ADJUSTMENT(voucherId), data)
  },

  // POST /api/salaries/payment
  async recordPayment(data) {
    // data = { voucher_id: number, amount: number, payment_date: "YYYY-MM-DD" }
    return await apiClient.post(API_ENDPOINTS.SALARY_PAYMENT, data)
  },

  // GET /api/salaries/voucher/:id/pdf
  async downloadPDF(voucherId) {
    return await apiClient.get(API_ENDPOINTS.SALARY_VOUCHER_PDF(voucherId), {
      responseType: 'blob'
    })
  }
}

export { salaryService }
