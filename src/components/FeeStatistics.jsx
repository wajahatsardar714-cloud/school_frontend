import { useState, useMemo } from 'react'
import { feePaymentService } from '../services/feeService'
import { classService } from '../services/classService'
import { useFetch } from '../hooks/useApi'
import '../fee.css'

const FeeStatistics = () => {
  const currentDate = new Date()
  const [filters, setFilters] = useState({
    from_date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0],
    to_date: currentDate.toISOString().split('T')[0],
    class_id: '',
  })

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

    setFilters({ ...filters, from_date, to_date })
  }

  return (
    <div className="fee-management">
      <div className="fee-header">
        <h1>Fee Collection Statistics</h1>
        <button onClick={refreshStats} className="btn-primary">
          🔄 Refresh
        </button>
      </div>

      {/* Quick Filters */}
      <div className="quick-filters">
        <button onClick={() => setQuickFilter('today')} className="btn-filter">
          Today
        </button>
        <button onClick={() => setQuickFilter('week')} className="btn-filter">
          Last 7 Days
        </button>
        <button onClick={() => setQuickFilter('month')} className="btn-filter">
          This Month
        </button>
        <button onClick={() => setQuickFilter('year')} className="btn-filter">
          This Year
        </button>
      </div>

      {/* Date Range Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>From Date</label>
          <input
            type="date"
            value={filters.from_date}
            onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <label>To Date</label>
          <input
            type="date"
            value={filters.to_date}
            onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <label>Filter by Class</label>
          <select 
            value={filters.class_id} 
            onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}
          >
            <option value="">All Classes</option>
            {(classesData?.data || []).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {statsLoading ? (
        <div className="loading">Loading statistics...</div>
      ) : (
        <>
          {/* Data Integrity Warning */}
          {stats.total_collected > stats.total_fee_amount && stats.total_fee_amount > 0 && (
            <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
              <strong>⚠️ Data Integrity Issue Detected!</strong>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                Total collected (Rs. {stats.total_collected?.toLocaleString()}) exceeds total fee amount (Rs. {stats.total_fee_amount?.toLocaleString()}).
                This indicates duplicate payments or incorrect backend calculations. Please check the backend database.
              </p>
            </div>
          )}
          
          {/* Summary Cards */}
          <div className="stats-grid">
            <div className="stat-card stat-primary">
              <div className="stat-icon">📄</div>
              <div className="stat-content">
                <div className="stat-label">Total Vouchers</div>
                <div className="stat-value">{stats.total_vouchers}</div>
                <div className="stat-detail">
                  {stats.total_students} students
                </div>
              </div>
            </div>

            <div className="stat-card stat-success">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-label">Paid Vouchers</div>
                <div className="stat-value">{stats.paid_vouchers}</div>
                <div className="stat-detail">
                  {stats.total_vouchers > 0 
                    ? ((stats.paid_vouchers / stats.total_vouchers) * 100).toFixed(1) 
                    : 0}% of total
                </div>
              </div>
            </div>

            <div className="stat-card stat-warning">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <div className="stat-label">Partial Payments</div>
                <div className="stat-value">{stats.partial_vouchers}</div>
                <div className="stat-detail">
                  {stats.total_vouchers > 0 
                    ? ((stats.partial_vouchers / stats.total_vouchers) * 100).toFixed(1) 
                    : 0}% of total
                </div>
              </div>
            </div>

            <div className="stat-card stat-danger">
              <div className="stat-icon">❌</div>
              <div className="stat-content">
                <div className="stat-label">Unpaid Vouchers</div>
                <div className="stat-value">{stats.unpaid_vouchers}</div>
                <div className="stat-detail">
                  {stats.total_vouchers > 0 
                    ? ((stats.unpaid_vouchers / stats.total_vouchers) * 100).toFixed(1) 
                    : 0}% of total
                </div>
              </div>
            </div>
          </div>

          {/* Financial Stats */}
          <div className="stats-grid">
            <div className="stat-card stat-info">
              <div className="stat-icon">💵</div>
              <div className="stat-content">
                <div className="stat-label">Total Fee Amount</div>
                <div className="stat-value">
                  Rs. {stats.total_fee_amount?.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="stat-card stat-success">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-label">Total Collected</div>
                <div className="stat-value">
                  Rs. {stats.total_collected?.toLocaleString()}
                </div>
                <div className="stat-detail">
                  {stats.collection_percentage?.toFixed(1)}% collected
                </div>
              </div>
            </div>

            <div className="stat-card stat-danger">
              <div className="stat-icon">⚠️</div>
              <div className="stat-content">
                <div className="stat-label">Total Due</div>
                <div className="stat-value">
                  Rs. {stats.total_due?.toLocaleString()}
                </div>
                <div className="stat-detail">
                  {stats.total_fee_amount > 0
                    ? ((stats.total_due / stats.total_fee_amount) * 100).toFixed(1)
                    : 0}% remaining
                </div>
              </div>
            </div>
          </div>

          {/* Collection Progress */}
          <div className="progress-section">
            <h3>Collection Progress</h3>
            <div className="progress-bar-container">
              <div 
                className="progress-bar progress-success"
                style={{ width: `${Math.min(stats.collection_percentage, 100)}%` }}
              >
                {stats.collection_percentage?.toFixed(1)}%
              </div>
            </div>
            <div className="progress-legend">
              <span>Collected: Rs. {stats.total_collected?.toLocaleString()}</span>
              <span>Remaining: Rs. {stats.total_due?.toLocaleString()}</span>
            </div>
          </div>

          {/* Voucher Status Breakdown */}
          <div className="voucher-breakdown">
            <h3>Voucher Status Breakdown</h3>
            <div className="breakdown-grid">
              <div className="breakdown-item">
                <div className="breakdown-bar">
                  <div 
                    className="bar-segment bar-success"
                    style={{ 
                      width: stats.total_vouchers > 0 
                        ? `${(stats.paid_vouchers / stats.total_vouchers) * 100}%` 
                        : '0%' 
                    }}
                    title={`Paid: ${stats.paid_vouchers}`}
                  ></div>
                  <div 
                    className="bar-segment bar-warning"
                    style={{ 
                      width: stats.total_vouchers > 0 
                        ? `${(stats.partial_vouchers / stats.total_vouchers) * 100}%` 
                        : '0%' 
                    }}
                    title={`Partial: ${stats.partial_vouchers}`}
                  ></div>
                  <div 
                    className="bar-segment bar-danger"
                    style={{ 
                      width: stats.total_vouchers > 0 
                        ? `${(stats.unpaid_vouchers / stats.total_vouchers) * 100}%` 
                        : '0%' 
                    }}
                    title={`Unpaid: ${stats.unpaid_vouchers}`}
                  ></div>
                </div>
                <div className="breakdown-legend">
                  <div className="legend-item">
                    <span className="legend-color legend-success"></span>
                    <span>Paid ({stats.paid_vouchers})</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color legend-warning"></span>
                    <span>Partial ({stats.partial_vouchers})</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color legend-danger"></span>
                    <span>Unpaid ({stats.unpaid_vouchers})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="help-text">
            <h4>💡 Using Statistics</h4>
            <ul>
              <li><strong>Quick Filters:</strong> Click buttons above to quickly view today, week, month, or year statistics</li>
              <li><strong>Custom Range:</strong> Use date inputs to select any custom date range</li>
              <li><strong>Class Filter:</strong> Filter statistics for specific classes to analyze performance</li>
              <li><strong>Collection Progress:</strong> The progress bar shows overall collection percentage</li>
              <li><strong>Breakdown Chart:</strong> Visual representation of paid, partial, and unpaid vouchers</li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

export default FeeStatistics
