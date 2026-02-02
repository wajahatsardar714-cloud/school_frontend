/**
 * AnalyticsDashboard Component
 * 
 * Comprehensive analytics dashboard with key metrics, charts, and insights.
 * Displays school-wide statistics for students, fees, staff, and performance.
 * 
 * Backend endpoints used:
 * - GET /api/analytics/dashboard
 * - GET /api/analytics/revenue-trends?months=N
 * - GET /api/analytics/enrollment-trends
 * - GET /api/analytics/class-collection
 * - GET /api/analytics/performance
 */

import { useState, useCallback, useMemo } from 'react';
import { useFetch } from '../hooks/useApi';
import { analyticsService } from '../services/analyticsService';
import '../fee.css';

export default function AnalyticsDashboard() {
  // Filter state
  const [revenueMonths, setRevenueMonths] = useState(6);
  
  // Fetch dashboard data
  // Response: { students, faculty, fees, salaries, today, recent_activity }
  const {
    data: dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useFetch(
    () => analyticsService.getDashboard(),
    []
  );
  
  // Fetch revenue trends
  // Response: Monthly breakdown with fee_collections, salary_payments, expenses, net_profit
  const {
    data: revenueData,
    loading: revenueLoading,
  } = useFetch(
    () => analyticsService.getRevenueTrends(revenueMonths),
    [revenueMonths]
  );
  
  // Fetch enrollment trends
  // Response: { trends (monthly), class_distribution }
  const {
    data: enrollmentData,
    loading: enrollmentLoading,
  } = useFetch(
    () => analyticsService.getEnrollmentTrends(),
    []
  );
  
  // Fetch class-wise fee collection
  // Response: Per class - total_vouchers, total_fee_generated, total_collected, total_pending, collection_rate
  const {
    data: classCollectionData,
    loading: classCollectionLoading,
  } = useFetch(
    () => analyticsService.getClassCollection(),
    []
  );
  
  // Fetch performance metrics
  // Response: { current_month, last_month, growth }
  const {
    data: performanceData,
    loading: performanceLoading,
  } = useFetch(
    () => analyticsService.getPerformance(),
    []
  );
  
  // Format currency
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount) || 0);
  }, []);
  
  // Format percentage
  const formatPercent = useCallback((value) => {
    const num = parseFloat(value) || 0;
    return `${num.toFixed(1)}%`;
  }, []);
  
  // Format number with commas
  const formatNumber = useCallback((num) => {
    return new Intl.NumberFormat('en-PK').format(parseFloat(num) || 0);
  }, []);
  
  // Extract data from API responses - backend wraps data in { success, data, ... }
  // Dashboard: { students, faculty, fees, salaries, today, recent_activity }
  const dashboard = dashboardData?.data || dashboardData || {};
  const students = dashboard.students || {};
  const faculty = dashboard.faculty || {};
  const fees = dashboard.fees?.current_month || {};
  const salaries = dashboard.salaries?.current_month || {};
  const todayStats = dashboard.today || {};
  const recentActivity = dashboard.recent_activity || [];
  
  // Revenue trends array - backend returns { data: [...] }
  const revenue = revenueData?.data || revenueData || [];
  
  // Enrollment data - backend returns { data: { trends, class_distribution } }
  const enrollmentRaw = enrollmentData?.data || enrollmentData || {};
  const enrollmentTrends = enrollmentRaw.trends || [];
  const classDistribution = enrollmentRaw.class_distribution || [];
  
  // Class collection data - backend returns { data: [...] }
  const classCollection = classCollectionData?.data || classCollectionData || [];
  
  // Performance metrics - backend returns { data: { current_month, last_month, growth } }
  const performance = performanceData?.data || performanceData || {};
  
  // Calculate derived metrics from dashboard response
  const metrics = useMemo(() => {
    return {
      totalStudents: students.total_students || 0,
      activeStudents: students.active_students || 0,
      inactiveStudents: students.inactive_students || 0,
      expelledStudents: students.expelled_students || 0,
      totalFaculty: faculty.total_faculty || 0,
      activeFaculty: faculty.active_faculty || 0,
      feesCollected: fees.total_collected || 0,
      feesPending: fees.pending || 0,
      feeCollectionRate: fees.collection_rate || 0,
      salariesPaid: salaries.total_paid || 0,
      salariesPending: salaries.pending || 0,
      salaryPaymentRate: salaries.payment_rate || 0,
      todayCollections: todayStats.collections || 0,
      todayExpenses: todayStats.expenses || 0,
      todayNet: todayStats.net || 0,
    };
  }, [students, faculty, fees, salaries, todayStats]);
  
  // Calculate revenue summary from trends
  const revenueSummary = useMemo(() => {
    if (!Array.isArray(revenue) || revenue.length === 0) {
      return { totalFees: 0, totalSalaries: 0, totalExpenses: 0, netProfit: 0 };
    }
    
    const totalFees = revenue.reduce((sum, r) => sum + (r.fee_collections || 0), 0);
    const totalSalaries = revenue.reduce((sum, r) => sum + (r.salary_payments || 0), 0);
    const totalExpenses = revenue.reduce((sum, r) => sum + (r.expenses || 0), 0);
    const netProfit = revenue.reduce((sum, r) => sum + (r.net_profit || 0), 0);
    
    return { totalFees, totalSalaries, totalExpenses, netProfit };
  }, [revenue]);
  
  return (
    <div className="fee-management analytics-dashboard">
      <div className="page-header">
        <h2>📊 Analytics Dashboard</h2>
        <button className="btn-secondary" onClick={refetchDashboard}>
          🔄 Refresh
        </button>
      </div>
      
      {/* Error Display */}
      {dashboardError && (
        <div className="alert alert-error">{dashboardError}</div>
      )}
      
      {/* Key Metrics - Today's Summary */}
      {dashboardLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      ) : (
        <>
          {/* Today's Quick Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Students</div>
              <div className="stat-value">{formatNumber(metrics.totalStudents)}</div>
              <div className="stat-change positive">
                {formatNumber(metrics.activeStudents)} active
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Faculty</div>
              <div className="stat-value">{formatNumber(metrics.totalFaculty)}</div>
              <div className="stat-change positive">
                {formatNumber(metrics.activeFaculty)} active
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Today's Collections</div>
              <div className="stat-value" style={{ color: '#28a745' }}>
                {formatCurrency(metrics.todayCollections)}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Today's Net</div>
              <div className="stat-value" style={{ color: metrics.todayNet >= 0 ? '#28a745' : '#dc3545' }}>
                {formatCurrency(metrics.todayNet)}
              </div>
            </div>
          </div>
          
          {/* Current Month Fee & Salary Stats */}
          <div className="stats-grid" style={{ marginTop: '1rem' }}>
            <div className="stat-card">
              <div className="stat-label">Fees Collected (This Month)</div>
              <div className="stat-value">{formatCurrency(metrics.feesCollected)}</div>
              <div className="stat-change positive">
                {formatPercent(metrics.feeCollectionRate)} collection rate
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pending Fees</div>
              <div className="stat-value" style={{ color: '#dc3545' }}>
                {formatCurrency(metrics.feesPending)}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Salaries Paid (This Month)</div>
              <div className="stat-value">{formatCurrency(metrics.salariesPaid)}</div>
              <div className="stat-change positive">
                {formatPercent(metrics.salaryPaymentRate)} payment rate
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pending Salaries</div>
              <div className="stat-value" style={{ color: '#dc3545' }}>
                {formatCurrency(metrics.salariesPending)}
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Revenue Trends Section */}
      <div className="chart-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ margin: 0 }}>Revenue Trends (Last {revenueMonths} Months)</h3>
          <select
            className="filter-select"
            value={revenueMonths}
            onChange={(e) => setRevenueMonths(parseInt(e.target.value))}
          >
            <option value={3}>Last 3 Months</option>
            <option value={6}>Last 6 Months</option>
            <option value={12}>Last 12 Months</option>
          </select>
        </div>
        
        {revenueLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading revenue data...</p>
          </div>
        ) : (
          <>
            {/* Revenue Summary Cards */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="stat-card">
                <div className="stat-label">Total Fee Collections</div>
                <div className="stat-value" style={{ color: '#28a745' }}>{formatCurrency(revenueSummary.totalFees)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Salary Payments</div>
                <div className="stat-value">{formatCurrency(revenueSummary.totalSalaries)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Expenses</div>
                <div className="stat-value" style={{ color: '#dc3545' }}>{formatCurrency(revenueSummary.totalExpenses)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Net Profit</div>
                <div className="stat-value" style={{ color: revenueSummary.netProfit >= 0 ? '#28a745' : '#dc3545' }}>
                  {formatCurrency(revenueSummary.netProfit)}
                </div>
              </div>
            </div>
            
            {/* Revenue Trend Visualization (Simple Bar Chart) */}
            {Array.isArray(revenue) && revenue.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', minHeight: '150px', padding: '1rem 0' }}>
                  {revenue.map((item, index) => {
                    const amount = item.fee_collections || 0;
                    const maxAmount = Math.max(...revenue.map(r => r.fee_collections || 0)) || 1;
                    const heightPercent = (amount / maxAmount) * 100;
                    
                    return (
                      <div
                        key={index}
                        style={{
                          flex: '1',
                          minWidth: '40px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <div
                          style={{
                            width: '100%',
                            height: `${Math.max(heightPercent, 5)}px`,
                            maxHeight: '120px',
                            background: 'linear-gradient(180deg, #4a6cf7 0%, #3651d4 100%)',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.3s ease',
                          }}
                          title={`${item.period || item.date || index + 1}: ${formatCurrency(amount)}`}
                        />
                        <span style={{ fontSize: '0.7rem', color: '#888', textAlign: 'center' }}>
                          {item.period || item.month || item.date?.slice(5, 10) || index + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Enrollment & Class Distribution Section */}
      <div className="chart-section">
        <h3 style={{ margin: '0 0 1rem 0' }}>Class Distribution</h3>
        
        {enrollmentLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading enrollment data...</p>
          </div>
        ) : classDistribution.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Students</th>
                </tr>
              </thead>
              <tbody>
                {classDistribution.map((item, index) => (
                  <tr key={index}>
                    <td><strong>{item.class_name}</strong></td>
                    <td>{formatNumber(item.student_count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No class distribution data available</p>
          </div>
        )}
      </div>
      
      {/* Class-wise Fee Collection Section */}
      <div className="chart-section">
        <h3>Class-wise Fee Collection</h3>
        
        {classCollectionLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading collection data...</p>
          </div>
        ) : Array.isArray(classCollection) && classCollection.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Total Vouchers</th>
                  <th>Generated</th>
                  <th>Collected</th>
                  <th>Pending</th>
                  <th>Collection Rate</th>
                </tr>
              </thead>
              <tbody>
                {classCollection.map((item, index) => (
                  <tr key={index}>
                    <td><strong>{item.class_name}</strong></td>
                    <td>{formatNumber(item.total_vouchers)}</td>
                    <td>{formatCurrency(item.total_fee_generated)}</td>
                    <td style={{ color: '#28a745' }}>{formatCurrency(item.total_collected)}</td>
                    <td style={{ color: '#dc3545' }}>{formatCurrency(item.total_pending)}</td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{
                          background: item.collection_rate >= 80 ? '#d4edda' : item.collection_rate >= 50 ? '#fff3cd' : '#f8d7da',
                          color: item.collection_rate >= 80 ? '#155724' : item.collection_rate >= 50 ? '#856404' : '#721c24',
                        }}
                      >
                        {formatPercent(item.collection_rate)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No collection data available</p>
          </div>
        )}
      </div>
      
      {/* Performance & Growth Section */}
      <div className="chart-section">
        <h3>Performance Metrics</h3>
        
        {performanceLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading performance data...</p>
          </div>
        ) : performance.current_month ? (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">This Month Revenue</div>
              <div className="stat-value">{formatCurrency(performance.current_month?.revenue)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">This Month Expenses</div>
              <div className="stat-value">{formatCurrency(performance.current_month?.expenses)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">This Month Profit</div>
              <div className="stat-value" style={{ color: (performance.current_month?.profit || 0) >= 0 ? '#28a745' : '#dc3545' }}>
                {formatCurrency(performance.current_month?.profit)}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Fee Collection Growth</div>
              <div className="stat-value" style={{ color: (performance.growth?.fee_collections || 0) >= 0 ? '#28a745' : '#dc3545' }}>
                {(performance.growth?.fee_collections || 0) >= 0 ? '+' : ''}
                {formatPercent(performance.growth?.fee_collections)}
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>No performance data available</p>
          </div>
        )}
      </div>
      
      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="chart-section">
          <h3>Recent Activity</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Name</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.slice(0, 10).map((activity, index) => (
                  <tr key={index}>
                    <td>
                      <span className={`status-badge ${activity.type === 'collection' ? 'status-paid' : 'status-unpaid'}`}>
                        {activity.type}
                      </span>
                    </td>
                    <td style={{ color: activity.type === 'collection' ? '#28a745' : '#dc3545' }}>
                      {formatCurrency(activity.amount)}
                    </td>
                    <td>{activity.related_name}</td>
                    <td>{new Date(activity.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Quick Insights */}
      <div className="chart-section">
        <h3>Quick Insights</h3>
        <div className="stats-grid">
          <div className="stat-card" style={{ background: '#e8f4fd' }}>
            <div className="stat-label">💡 Fee Collection</div>
            <div style={{ fontSize: '0.875rem', color: '#333', marginTop: '0.5rem' }}>
              {metrics.feeCollectionRate >= 80 
                ? 'Excellent collection rate! Keep up the good work.'
                : metrics.feeCollectionRate >= 60
                ? 'Good collection rate. Consider following up on pending fees.'
                : 'Low collection rate. Immediate action recommended for pending fees.'}
            </div>
          </div>
          <div className="stat-card" style={{ background: '#d4edda' }}>
            <div className="stat-label">📈 Student Enrollment</div>
            <div style={{ fontSize: '0.875rem', color: '#333', marginTop: '0.5rem' }}>
              {metrics.totalStudents > 0 
                ? `Currently ${formatNumber(metrics.totalStudents)} students enrolled (${formatNumber(metrics.activeStudents)} active).`
                : 'No enrollment data available.'}
            </div>
          </div>
          <div className="stat-card" style={{ background: '#fff3cd' }}>
            <div className="stat-label">👥 Faculty Overview</div>
            <div style={{ fontSize: '0.875rem', color: '#333', marginTop: '0.5rem' }}>
              {metrics.totalFaculty > 0
                ? `${formatNumber(metrics.totalFaculty)} faculty members (${formatNumber(metrics.activeFaculty)} active).`
                : 'No faculty data available.'}
            </div>
          </div>
          <div className="stat-card" style={{ background: '#f8d7da' }}>
            <div className="stat-label">⚠️ Action Required</div>
            <div style={{ fontSize: '0.875rem', color: '#333', marginTop: '0.5rem' }}>
              {metrics.feesPending > 0
                ? `${formatCurrency(metrics.feesPending)} in pending fees require attention.`
                : 'All fees collected. Great job!'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
