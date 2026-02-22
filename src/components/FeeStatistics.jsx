import { useState, useMemo, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import { feePaymentService } from '../services/feeService'
import { classService } from '../services/classService'
import { useFetch } from '../hooks/useApi'
import '../fee.css'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
)

const FeeStatistics = () => {
  const currentDate = new Date()
  const [filters, setFilters] = useState({
    from_date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0],
    to_date: currentDate.toISOString().split('T')[0],
    class_id: '',
  })

  const [activeQuickFilter, setActiveQuickFilter] = useState('month')

  // Fetch classes
  const { data: classesData } = useFetch(
    () => classService.list(),
    [],
    { enabled: true }
  )

  // Fetch statistics
  const { 
    data: statsData, 
    loading: statsLoading,
    refetch: refreshStats 
  } = useFetch(
    () => feePaymentService.getStats(filters),
    [filters.from_date, filters.to_date, filters.class_id],
    { enabled: true }
  )

  const stats = useMemo(() => {
    const data = statsData?.data || statsData || {}
    
    const total_fee_amount = parseFloat(data.total_fee_generated || 0)
    const total_collected = parseFloat(data.total_collected || 0)
    
    // Calculate due correctly: total_fee - total_collected
    // If backend returns negative, it means they calculated collected - fee, so fix it
    let total_due = parseFloat(data.total_pending || 0)
    
    // If due is negative, it means backend calculated wrong direction
    if (total_due < 0) {
      total_due = Math.abs(total_due) // This would still be wrong
      // Better: calculate it ourselves
      total_due = total_fee_amount - total_collected
    }
    
    // Ensure due is never negative (overpayment should show as 0)
    if (total_due < 0) {
      total_due = 0
    }
    
    const collection_percentage = total_fee_amount > 0 
      ? (total_collected / total_fee_amount) * 100 
      : 0

    console.log('Stats Calculation:', {
      total_fee_amount,
      total_collected,
      backend_pending: data.total_pending,
      calculated_due: total_due,
      collection_percentage
    })
    
    // Warning: Check for data integrity issues
    if (total_collected > total_fee_amount && total_fee_amount > 0) {
      console.warn('⚠️ DATA INTEGRITY ISSUE: Total collected exceeds total fee amount!', {
        total_fee_amount,
        total_collected,
        difference: total_collected - total_fee_amount,
        possible_causes: [
          'Duplicate payments in database',
          'Incorrect SQL query with JOIN causing duplicate rows',
          'Advance payments not reflected in vouchers',
          'Payment records not properly linked to vouchers'
        ]
      })
    }

    return {
      total_vouchers: parseInt(data.total_vouchers || 0),
      paid_vouchers: parseInt(data.paid_vouchers || 0),
      partial_vouchers: parseInt(data.partial_vouchers || 0),
      unpaid_vouchers: parseInt(data.unpaid_vouchers || 0),
      total_fee_amount,
      total_collected,
      total_due,
      collection_percentage,
      total_students: parseInt(data.total_students || 0),
    }
  }, [statsData])

  // Quick date filters
  const setQuickFilter = (type) => {
    const now = new Date()
    let from_date, to_date

    switch (type) {
      case 'today':
        from_date = now.toISOString().split('T')[0]
        to_date = now.toISOString().split('T')[0]
        break
      case 'week':
        from_date = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0]
        to_date = new Date().toISOString().split('T')[0]
        break
      case 'month':
        from_date = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        to_date = new Date().toISOString().split('T')[0]
        break
      case 'year':
        from_date = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
        to_date = new Date().toISOString().split('T')[0]
        break
      default:
        return
    }

    setActiveQuickFilter(type)
    setFilters({ ...filters, from_date, to_date })
  }

  // Chart data for voucher status pie chart
  const chartData = useMemo(() => {
    return {
      labels: ['Paid Vouchers', 'Partial Payments', 'Unpaid Vouchers'],
      datasets: [
        {
          data: [stats.paid_vouchers, stats.partial_vouchers, stats.unpaid_vouchers],
          backgroundColor: [
            '#10b981', // success green
            '#f59e0b', // warning orange
            '#ef4444'  // error red
          ],
          borderWidth: 0,
          hoverBackgroundColor: [
            '#059669',
            '#d97706', 
            '#dc2626'
          ],
        },
      ],
    }
  }, [stats])

  // Mock data for collection trend line chart
  const lineChartData = useMemo(() => {
    const labels = []
    const data = []
    
    // Generate last 7 days for trend
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
      // Mock trend data - in real app, this would come from API
      data.push(Math.floor(Math.random() * 100000) + 50000)
    }

    return {
      labels,
      datasets: [
        {
          label: 'Daily Collections',
          data,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: '#2563eb',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
        },
      ],
    }
  }, [])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#f1f5f9',
          lineWidth: 1,
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 12,
          },
          callback: function(value) {
            return 'Rs. ' + value.toLocaleString()
          }
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 12,
          },
        },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          color: '#334155',
          font: {
            size: 12,
            weight: 500,
          },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0)
            const percentage = ((context.raw / total) * 100).toFixed(1)
            return `${context.label}: ${context.raw} (${percentage}%)`
          }
        },
      },
    },
    cutout: '60%',
  }

  return (
    <div className="page-content statistics-enhanced">
      {/* Modern Header */}
      <div className="statistics-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Fee Collection Statistics</h1>
            <p className="page-subtitle">Comprehensive analytics and insights for fee management</p>
          </div>
          <button onClick={refreshStats} className="btn-refresh">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Quick Filter Buttons */}
      <div className="quick-filters-modern">
        <h3 className="filter-title">Time Period</h3>
        <div className="filter-buttons">
          <button 
            onClick={() => setQuickFilter('today')} 
            className={`filter-btn ${activeQuickFilter === 'today' ? 'active' : ''}`}
          >
            Today
          </button>
          <button 
            onClick={() => setQuickFilter('week')} 
            className={`filter-btn ${activeQuickFilter === 'week' ? 'active' : ''}`}
          >
            Last 7 Days
          </button>
          <button 
            onClick={() => setQuickFilter('month')} 
            className={`filter-btn ${activeQuickFilter === 'month' ? 'active' : ''}`}
          >
            This Month
          </button>
          <button 
            onClick={() => setQuickFilter('year')} 
            className={`filter-btn ${activeQuickFilter === 'year' ? 'active' : ''}`}
          >
            This Year
          </button>
        </div>
      </div>

      {/* Custom Date Range */}
      <div className="date-range-modern">
        <h3 className="filter-title">Custom Date Range</h3>
        <div className="date-filters">
          <div className="date-input-group">
            <label>From Date</label>
            <input
              type="date"
              value={filters.from_date}
              onChange={(e) => {
                setFilters({ ...filters, from_date: e.target.value })
                setActiveQuickFilter('')
              }}
              className="date-input"
            />
          </div>
          <div className="date-input-group">
            <label>To Date</label>
            <input
              type="date"
              value={filters.to_date}
              onChange={(e) => {
                setFilters({ ...filters, to_date: e.target.value })
                setActiveQuickFilter('')
              }}
              className="date-input"
            />
          </div>
          <div className="class-filter-group">
            <label>Filter by Class</label>
            <select 
              value={filters.class_id} 
              onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}
              className="class-select"
            >
              <option value="">All Classes</option>
              {(classesData?.data || []).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {statsLoading ? (
        <div className="loading-modern">
          <div className="loading-spinner"></div>
          <p>Loading statistics...</p>
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="stats-cards-modern">
            <div className="stat-card-modern primary">
              <div className="stat-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <div className="stat-content">
                <h3 className="stat-title">Total Fee Amount</h3>
                <p className="stat-value">Rs. {stats.total_fee_amount?.toLocaleString()}</p>
                <p className="stat-detail">{stats.total_vouchers} vouchers generated</p>
              </div>
            </div>

            <div className="stat-card-modern success">
              <div className="stat-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="stat-content">
                <h3 className="stat-title">Collected Amount</h3>
                <p className="stat-value">Rs. {stats.total_collected?.toLocaleString()}</p>
                <p className="stat-detail">{stats.collection_percentage?.toFixed(1)}% collection rate</p>
              </div>
            </div>

            <div className="stat-card-modern warning">
              <div className="stat-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="stat-content">
                <h3 className="stat-title">Pending Amount</h3>
                <p className="stat-value">Rs. {stats.total_due?.toLocaleString()}</p>
                <p className="stat-detail">{stats.unpaid_vouchers} unpaid vouchers</p>
              </div>
            </div>

            <div className="stat-card-modern info">
              <div className="stat-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="stat-content">
                <h3 className="stat-title">Total Students</h3>
                <p className="stat-value">{stats.total_students}</p>
                <p className="stat-detail">Across all classes</p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-section">
            <div className="chart-container">
              <div className="chart-header">
                <h3 className="chart-title">Collection Trend</h3>
                <p className="chart-subtitle">Daily fee collection over the last 7 days</p>
              </div>
              <div className="chart-wrapper">
                <Line data={lineChartData} options={chartOptions} />
              </div>
            </div>

            <div className="chart-container">
              <div className="chart-header">
                <h3 className="chart-title">Voucher Status Distribution</h3>
                <p className="chart-subtitle">Breakdown of voucher payment status</p>
              </div>
              <div className="chart-wrapper pie-chart">
                <Doughnut data={chartData} options={doughnutOptions} />
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="progress-section-modern">
            <div className="progress-header">
              <h3 className="progress-title">Overall Collection Progress</h3>
              <span className="progress-percentage">{stats.collection_percentage?.toFixed(1)}% Complete</span>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar"
                style={{ width: `${Math.min(stats.collection_percentage, 100)}%` }}
              >
                <span className="progress-text">Rs. {stats.total_collected?.toLocaleString()}</span>
              </div>
            </div>
            <div className="progress-details">
              <span className="detail-item">
                <span className="detail-label">Collected:</span>
                <span className="detail-value">Rs. {stats.total_collected?.toLocaleString()}</span>
              </span>
              <span className="detail-item">
                <span className="detail-label">Remaining:</span>
                <span className="detail-value">Rs. {stats.total_due?.toLocaleString()}</span>
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default FeeStatistics
