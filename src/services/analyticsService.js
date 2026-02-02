import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../config/api'

/**
 * Analytics Service
 * Backend: /api/analytics
 */
export const analyticsService = {
  /**
   * Complete dashboard overview
   * GET /api/analytics/dashboard
   * Response: { students, faculty, fees, salaries, today, recent_activity }
   */
  async getDashboard() {
    return await apiClient.get(API_ENDPOINTS.ANALYTICS_DASHBOARD)
  },

  /**
   * Revenue trends (last N months)
   * GET /api/analytics/revenue-trends?months=6
   * Response: Monthly breakdown with fee_collections, salary_payments, expenses, net_profit
   */
  async getRevenueTrends(months = 6) {
    const params = new URLSearchParams()
    if (months) params.append('months', months)
    const query = params.toString() ? `?${params.toString()}` : ''
    return await apiClient.get(`${API_ENDPOINTS.ANALYTICS_REVENUE_TRENDS}${query}`)
  },

  /**
   * Student enrollment trends
   * GET /api/analytics/enrollment-trends
   * Response: { trends (monthly), class_distribution }
   */
  async getEnrollmentTrends() {
    return await apiClient.get(API_ENDPOINTS.ANALYTICS_ENROLLMENT_TRENDS)
  },

  /**
   * Class-wise fee collection analysis
   * GET /api/analytics/class-collection
   * Response: Per class - total_vouchers, total_fee_generated, total_collected, total_pending, collection_rate
   */
  async getClassCollection() {
    return await apiClient.get(API_ENDPOINTS.ANALYTICS_CLASS_COLLECTION)
  },

  /**
   * Faculty & salary statistics
   * GET /api/analytics/faculty-stats
   * Response: { designation_stats, salary_distribution, salary_trend }
   */
  async getFacultyStats() {
    return await apiClient.get(API_ENDPOINTS.ANALYTICS_FACULTY_STATS)
  },

  /**
   * Expense analysis
   * GET /api/analytics/expense-analysis
   * Response: { monthly_trend, expense_comparison }
   */
  async getExpenseAnalysis() {
    return await apiClient.get(API_ENDPOINTS.ANALYTICS_EXPENSE_ANALYSIS)
  },

  /**
   * Performance metrics with growth
   * GET /api/analytics/performance
   * Response: { current_month, last_month, growth }
   */
  async getPerformance() {
    return await apiClient.get(API_ENDPOINTS.ANALYTICS_PERFORMANCE)
  },
}
