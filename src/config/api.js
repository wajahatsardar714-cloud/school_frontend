export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

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

  // Fee Vouchers
  FEE_VOUCHERS: '/api/fee-vouchers',
  FEE_VOUCHER_DETAIL: (id) => `/api/fee-vouchers/${id}`,
  FEE_VOUCHER_GENERATE: '/api/fee-vouchers/generate',
  FEE_VOUCHER_BULK_GENERATE: '/api/fee-vouchers/bulk-generate',
  FEE_VOUCHER_PDF: (id) => `/api/fee-vouchers/${id}/pdf`,

  // Fee Payments
  FEE_PAYMENTS: '/api/fee-payments',
  FEE_PAYMENT_RECORD: '/api/fee-payments/record',
  FEE_PAYMENT_RECEIPT: (id) => `/api/fee-payments/${id}/receipt`,
  FEE_DEFAULTERS: '/api/fee-payments/defaulters',

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

  // Analytics
  ANALYTICS_DASHBOARD: '/api/analytics/dashboard',
  ANALYTICS_REVENUE_TRENDS: '/api/analytics/revenue-trends',
  ANALYTICS_ENROLLMENT_STATS: '/api/analytics/enrollment-stats',
  ANALYTICS_CLASS_PERFORMANCE: '/api/analytics/class-performance',

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
