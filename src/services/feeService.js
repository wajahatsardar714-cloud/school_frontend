import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../config/api'

/**
 * Fee Voucher Service
 * Backend: /api/vouchers
 */
export const feeVoucherService = {
  /**
   * Generate single fee voucher for a student
   * POST /api/vouchers/generate
   * Body: { student_id, month, custom_items? }
   */
  async generate(voucherData) {
    return await apiClient.post(API_ENDPOINTS.FEE_VOUCHER_GENERATE, voucherData)
  },

  /**
   * Bulk generate vouchers for class/section
   * POST /api/vouchers/generate-bulk
   * Body: { class_id, section_id?, month }
   */
  async bulkGenerate(bulkData) {
    return await apiClient.post(API_ENDPOINTS.FEE_VOUCHER_BULK_GENERATE, bulkData)
  },

  /**
   * Preview bulk vouchers WITHOUT creating them
   * POST /api/vouchers/preview-bulk
   * Body: { class_id, section_id?, month, due_date? }
   */
  async previewBulk(bulkData) {
    return await apiClient.post(API_ENDPOINTS.FEE_VOUCHER_PREVIEW_BULK, bulkData)
  },

  /**
   * Generate bulk PDF WITHOUT saving to database
   * POST /api/vouchers/generate-bulk-pdf
   * Body: { class_id, section_id?, month, due_date? }
   */
  async generateBulkPDF(bulkData) {
    const token = apiClient.getToken()
    const url = `${apiClient.baseURL}${API_ENDPOINTS.FEE_VOUCHER_GENERATE_BULK_PDF}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bulkData),
    })
    
    if (!response.ok) {
      throw new Error('Failed to generate PDF')
    }
    
    return response.blob()
  },

  /**
   * List vouchers with filters
   * GET /api/vouchers?student_id=&class_id=&section_id=&month=&year=&status=&from_date=&to_date=&page=&limit=
   */
  async list(filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.student_id) params.append('student_id', filters.student_id)
    if (filters.class_id) params.append('class_id', filters.class_id)
    if (filters.section_id) params.append('section_id', filters.section_id)
    if (filters.status) params.append('status', filters.status)
    if (filters.month) params.append('month', filters.month)
    if (filters.year) params.append('year', filters.year)
    if (filters.from_date) params.append('from_date', filters.from_date)
    if (filters.to_date) params.append('to_date', filters.to_date)
    if (filters.page) params.append('page', filters.page)
    if (filters.limit) params.append('limit', filters.limit)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return await apiClient.get(`${API_ENDPOINTS.FEE_VOUCHERS}${query}`)
  },

  /**
   * Get voucher by ID with complete details
   * GET /api/vouchers/:id
   */
  async getById(id) {
    return await apiClient.get(API_ENDPOINTS.FEE_VOUCHER_DETAIL(id))
  },

  /**
   * Update voucher items
   * PUT /api/vouchers/:id/items
   */
  async updateItems(id, items) {
    return await apiClient.put(API_ENDPOINTS.FEE_VOUCHER_ITEMS(id), { items })
  },

  /**
   * Delete voucher (only if unpaid)
   * DELETE /api/vouchers/:id
   */
  async delete(id) {
    return await apiClient.delete(API_ENDPOINTS.FEE_VOUCHER_DETAIL(id))
  },

  /**
   * Download voucher as PDF
   * GET /api/vouchers/:id/pdf
   */
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

  /**
   * Print voucher inline (opens in new tab for printing)
   * GET /api/vouchers/:id/print
   */
  printVoucher(id) {
    const token = apiClient.getToken()
    const url = `${apiClient.baseURL}${API_ENDPOINTS.FEE_VOUCHER_PRINT(id)}`
    
    // Open in new tab with authorization
    const printWindow = window.open('', '_blank')
    
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    .then(response => response.blob())
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob)
      printWindow.location.href = blobUrl
    })
    .catch(error => {
      console.error('Failed to print voucher:', error)
      printWindow.close()
    })
  },

  /**
   * Bulk print multiple vouchers in a single PDF (4 per page)
   * POST /api/vouchers/bulk-print
   * Body: { voucher_ids: [1, 2, 3, ...] }
   */
  async bulkPrintVouchers(voucherIds) {
    try {
      const token = apiClient.getToken()
      const url = `${apiClient.baseURL}${API_ENDPOINTS.FEE_VOUCHER_BULK_PRINT}`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voucher_ids: voucherIds }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to print vouchers: ${errorText}`)
      }
      
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      
      // Open in new tab for printing
      window.open(blobUrl, '_blank')
      
      // Clean up blob URL after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl)
      }, 1000)
      
      return { success: true, count: voucherIds.length }
    } catch (error) {
      console.error('Bulk print error:', error)
      throw error
    }
  },
}

/**
 * Student Fee Override Service (NEW - Issue #4)
 * Backend: /api/student-fee-overrides
 */
export const feeOverrideService = {
  /**
   * Set or update fee override for a student
   * POST /api/student-fee-overrides
   * Body: { student_id, class_id, admission_fee?, monthly_fee?, paper_fund?, reason }
   */
  async create(overrideData) {
    return await apiClient.post(API_ENDPOINTS.STUDENT_FEE_OVERRIDES, overrideData)
  },

  /**
   * Get fee override for specific student and class
   * GET /api/student-fee-overrides/:student_id/class/:class_id
   */
  async getByStudentAndClass(studentId, classId) {
    return await apiClient.get(API_ENDPOINTS.STUDENT_FEE_OVERRIDE_DETAIL(studentId, classId))
  },

  /**
   * List all fee overrides with filters
   * GET /api/student-fee-overrides?student_id=&class_id=&page=&limit=
   */
  async list(filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.student_id) params.append('student_id', filters.student_id)
    if (filters.class_id) params.append('class_id', filters.class_id)
    if (filters.page) params.append('page', filters.page)
    if (filters.limit) params.append('limit', filters.limit)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return await apiClient.get(`${API_ENDPOINTS.STUDENT_FEE_OVERRIDES}${query}`)
  },

  /**
   * Remove fee override (student will use class defaults)
   * DELETE /api/student-fee-overrides/:student_id/class/:class_id
   */
  async delete(studentId, classId) {
    return await apiClient.delete(API_ENDPOINTS.STUDENT_FEE_OVERRIDE_DETAIL(studentId, classId))
  },
}

/**
 * Discount Service
 * Backend: /api/discounts
 */
export const discountService = {
  /**
   * Create or update student discount
   * POST /api/discounts
   * Body: { student_id, class_id, discount_type, discount_value, reason, effective_from }
   */
  async create(discountData) {
    return await apiClient.post('/api/discounts', discountData)
  },

  /**
   * List all discounts with filters
   * GET /api/discounts?student_id=&class_id=&discount_type=
   */
  async list(filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.student_id) params.append('student_id', filters.student_id)
    if (filters.class_id) params.append('class_id', filters.class_id)
    if (filters.discount_type) params.append('discount_type', filters.discount_type)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return await apiClient.get(`/api/discounts${query}`)
  },

  /**
   * Get discounts for specific student
   * GET /api/discounts/student/:id
   */
  async getByStudent(studentId) {
    return await apiClient.get(`/api/discounts/student/${studentId}`)
  },

  /**
   * Update discount
   * PUT /api/discounts/:id
   */
  async update(id, discountData) {
    return await apiClient.put(`/api/discounts/${id}`, discountData)
  },

  /**
   * Delete discount
   * DELETE /api/discounts/:id
   */
  async delete(id) {
    return await apiClient.delete(`/api/discounts/${id}`)
  }
}

/**
 * Fee Payment Service
 * Backend: /api/fees
 */
export const feePaymentService = {
  /**
   * Record a fee payment
   * POST /api/fees/payment
   * Body: { voucher_id, amount, payment_date? }
   */
  async record(paymentData) {
    return await apiClient.post(API_ENDPOINTS.FEE_PAYMENT_RECORD, paymentData)
  },

  /**
   * List all payments with filters
   * GET /api/fees/payments?student_id=&class_id=&section_id=&from_date=&to_date=&page=&limit=
   */
  async list(filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.student_id) params.append('student_id', filters.student_id)
    if (filters.class_id) params.append('class_id', filters.class_id)
    if (filters.section_id) params.append('section_id', filters.section_id)
    if (filters.from_date) params.append('from_date', filters.from_date)
    if (filters.to_date) params.append('to_date', filters.to_date)
    if (filters.page) params.append('page', filters.page)
    if (filters.limit) params.append('limit', filters.limit)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return await apiClient.get(`${API_ENDPOINTS.FEE_PAYMENTS}${query}`)
  },

  /**
   * Get payments for specific voucher
   * GET /api/fees/voucher/:id/payments
   */
  async getVoucherPayments(voucherId) {
    return await apiClient.get(API_ENDPOINTS.FEE_VOUCHER_PAYMENTS(voucherId))
  },

  /**
   * Delete payment (for corrections)
   * DELETE /api/fees/payment/:id
   */
  async delete(id) {
    return await apiClient.delete(API_ENDPOINTS.FEE_PAYMENT_DELETE(id))
  },

  /**
   * Download payment receipt PDF
   * GET /api/fees/payment/:id/receipt
   */
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

  /**
   * Get defaulters list
   * GET /api/fees/defaulters?class_id=&section_id=&min_due_amount=&overdue_only=
   */
  async getDefaulters(filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.class_id) params.append('class_id', filters.class_id)
    if (filters.section_id) params.append('section_id', filters.section_id)
    if (filters.min_due_amount) params.append('min_due_amount', filters.min_due_amount)
    if (filters.overdue_only) params.append('overdue_only', 'true')
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return await apiClient.get(`${API_ENDPOINTS.FEE_DEFAULTERS}${query}`)
  },

  /**
   * Get student fee history
   * GET /api/fees/student/:id
   */
  async getStudentHistory(studentId) {
    return await apiClient.get(API_ENDPOINTS.FEE_STUDENT_HISTORY(studentId))
  },

  /**
   * Get student current due amount
   * GET /api/fees/student/:id/due
   */
  async getStudentDue(studentId) {
    return await apiClient.get(API_ENDPOINTS.FEE_STUDENT_DUE(studentId))
  },

  /**
   * Get fee collection statistics
   * GET /api/fees/stats?from_date=&to_date=&class_id=
   */
  async getStats(filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.from_date) params.append('from_date', filters.from_date)
    if (filters.to_date) params.append('to_date', filters.to_date)
    if (filters.class_id) params.append('class_id', filters.class_id)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return await apiClient.get(`${API_ENDPOINTS.FEE_STATS}${query}`)
  },
}

/**
 * Consolidated fee service for simpler imports
 * Combines voucher and payment operations
 */
export const feeService = {
  // Voucher operations
  generateVoucher: feeVoucherService.generate,
  bulkGenerateVouchers: feeVoucherService.bulkGenerate,
  getVouchers: feeVoucherService.list,
  getVoucherById: feeVoucherService.getById,
  updateVoucherItems: feeVoucherService.updateItems,
  deleteVoucher: feeVoucherService.delete,
  downloadVoucherPDF: feeVoucherService.downloadPDF,
  
  // Payment operations
  recordPayment: async (voucherId, paymentData) => {
    return await apiClient.post(API_ENDPOINTS.FEE_PAYMENT_RECORD, {
      voucher_id: voucherId,
      amount: parseFloat(paymentData.amount),
      payment_date: paymentData.paymentDate || paymentData.payment_date,
    })
  },
  getAllPayments: feePaymentService.list,
  getVoucherPayments: feePaymentService.getVoucherPayments,
  deletePayment: feePaymentService.delete,
  downloadReceipt: feePaymentService.downloadReceipt,
  
  // Student fee info
  getStudentHistory: feePaymentService.getStudentHistory,
  getStudentDue: feePaymentService.getStudentDue,
  
  // Defaulters & Stats
  getDefaulters: feePaymentService.getDefaulters,
  getStats: feePaymentService.getStats,
}
