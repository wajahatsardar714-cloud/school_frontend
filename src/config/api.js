export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_PROFILE: '/api/auth/profile',
  AUTH_CHANGE_PASSWORD: '/api/auth/change-password',
  AUTH_USERS: '/api/auth/users',
  AUTH_DELETE_USER: (id) => `/api/auth/users/${id}`,

  // Students
  STUDENTS: '/api/students',
  STUDENTS_BULK: '/api/students/bulk-noauth', // No auth endpoint for CSV import
  STUDENTS_BULK_DELETE: '/api/bulk-delete-students', // No auth bulk delete endpoint
  STUDENT_DETAIL: (id) => `/api/students/${id}`,
  STUDENT_ENROLL: (id) => `/api/students/${id}/enroll`,
  STUDENT_WITHDRAW: (id) => `/api/students/${id}/withdraw`,
  STUDENT_TRANSFER: (id) => `/api/students/${id}/transfer`,
  STUDENT_ACTIVATE: (id) => `/api/students/${id}/activate`,
  STUDENT_DEACTIVATE: (id) => `/api/students/${id}/deactivate`,
  STUDENT_EXPEL: (id) => `/api/students/${id}/expel`,
  STUDENT_CLEAR_EXPULSION: (id) => `/api/students/${id}/clear-expulsion`,
  STUDENT_ADD_GUARDIAN: (id) => `/api/students/${id}/guardians`,
  STUDENT_REMOVE_GUARDIAN: (id, guardianId) => `/api/students/${id}/guardians/${guardianId}`,
  STUDENT_PROMOTE: (id) => `/api/students/${id}/promote`,
  STUDENT_DOCUMENTS: (id) => `/api/students/${id}/documents`,

  // Guardians
  GUARDIANS: '/api/guardians',
  GUARDIAN_DETAIL: (id) => `/api/guardians/${id}`,
  GUARDIAN_SEARCH_CNIC: (cnic) => `/api/guardians/search/cnic/${cnic}`,

  // Classes
  CLASSES: '/api/classes',
  CLASS_DETAIL: (id) => `/api/classes/${id}`,
  CLASS_FEE_STRUCTURE: (id) => `/api/classes/${id}/fee-structure`,
  CLASS_FEE_HISTORY: (id) => `/api/classes/${id}/fee-history`,

  // Sections
  SECTIONS: '/api/sections',
  SECTION_DETAIL: (id) => `/api/sections/${id}`,
  SECTION_STUDENTS: (id) => `/api/sections/${id}/students`,

  // Fee Vouchers (Backend: /api/vouchers)
  FEE_VOUCHERS: '/api/vouchers',
  FEE_VOUCHER_DETAIL: (id) => `/api/vouchers/${id}`,
  FEE_VOUCHER_GENERATE: '/api/vouchers/generate',
  FEE_VOUCHER_BULK_GENERATE: '/api/vouchers/generate-bulk',
  FEE_VOUCHER_PREVIEW_BULK: '/api/vouchers/preview-bulk',
  FEE_VOUCHER_GENERATE_BULK_PDF: '/api/vouchers/generate-bulk-pdf',
  FEE_VOUCHER_BULK_PRINT: '/api/vouchers/bulk-print',
  FEE_VOUCHER_PDF: (id) => `/api/vouchers/${id}/pdf`,
  FEE_VOUCHER_PRINT: (id) => `/api/vouchers/${id}/print`,
  FEE_VOUCHER_ITEMS: (id) => `/api/vouchers/${id}/items`,
  
  // Student Fee Overrides (NEW - Issue #4)
  STUDENT_FEE_OVERRIDES: '/api/student-fee-overrides',
  STUDENT_FEE_OVERRIDE_DETAIL: (studentId, classId) => `/api/student-fee-overrides/${studentId}/class/${classId}`,

  // Fee Payments (Backend: /api/fees)
  FEE_PAYMENTS: '/api/fees/payments',
  FEE_PAYMENT_RECORD: '/api/fees/payment',
  FEE_PAYMENT_DELETE: (id) => `/api/fees/payment/${id}`,
  FEE_PAYMENT_RECEIPT: (id) => `/api/fees/payment/${id}/receipt`,
  FEE_VOUCHER_PAYMENTS: (id) => `/api/fees/voucher/${id}/payments`,
  FEE_DEFAULTERS: '/api/fees/defaulters',
  FEE_STUDENT_HISTORY: (id) => `/api/fees/student/${id}`,
  FEE_STUDENT_DUE: (id) => `/api/fees/student/${id}/due`,
  FEE_STATS: '/api/fees/stats',

  // Faculty
  FACULTY: '/api/faculty',
  FACULTY_DETAIL: (id) => `/api/faculty/${id}`,
  FACULTY_ACTIVATE: (id) => `/api/faculty/${id}/activate`,
  FACULTY_DEACTIVATE: (id) => `/api/faculty/${id}/deactivate`,
  FACULTY_SALARY: (id) => `/api/faculty/${id}/salary`,
  FACULTY_SALARY_HISTORY: (id) => `/api/faculty/${id}/salary-history`,

  // Salary Vouchers
  SALARY_GENERATE: '/api/salaries/generate',
  SALARY_GENERATE_BULK: '/api/salaries/generate-bulk',
  SALARY_VOUCHERS: '/api/salaries/vouchers',
  SALARY_UNPAID: '/api/salaries/unpaid',
  SALARY_STATS: '/api/salaries/stats',
  SALARY_VOUCHER_DETAIL: (id) => `/api/salaries/voucher/${id}`,
  SALARY_VOUCHER_PDF: (id) => `/api/salaries/voucher/${id}/pdf`,
  SALARY_VOUCHER_ADJUSTMENT: (id) => `/api/salaries/voucher/${id}/adjustment`,
  SALARY_VOUCHER_DELETE: (id) => `/api/salaries/voucher/${id}`,
  SALARY_PAYMENT: '/api/salaries/payment',

  // Expenses
  EXPENSES: '/api/expenses',
  EXPENSE_DETAIL: (id) => `/api/expenses/${id}`,
  EXPENSE_SUMMARY: '/api/expenses/summary',

  // Reports
  REPORTS_DAILY_CLOSING: '/api/reports/daily-closing',
  REPORTS_PL_STATEMENT: '/api/reports/profit-loss',
  REPORTS_FEE_COLLECTION: '/api/reports/fee-collection',
  REPORTS_DEFAULTERS: '/api/reports/defaulters',

  // Analytics (Backend: /api/analytics)
  ANALYTICS_DASHBOARD: '/api/analytics/dashboard',
  ANALYTICS_REVENUE_TRENDS: '/api/analytics/revenue-trends',
  ANALYTICS_ENROLLMENT_TRENDS: '/api/analytics/enrollment-trends',
  ANALYTICS_CLASS_COLLECTION: '/api/analytics/class-collection',
  ANALYTICS_FACULTY_STATS: '/api/analytics/faculty-stats',
  ANALYTICS_EXPENSE_ANALYSIS: '/api/analytics/expense-analysis',
  ANALYTICS_PERFORMANCE: '/api/analytics/performance',

  // Documents
  DOCUMENTS: '/api/documents',
  DOCUMENT_UPLOAD: '/api/documents/upload',
  DOCUMENT_DOWNLOAD: (id) => `/api/documents/${id}/download`,
  DOCUMENT_DELETE: (id) => `/api/documents/${id}`,
}

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
}
