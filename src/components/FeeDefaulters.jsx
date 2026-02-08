import { useState, useMemo, useCallback } from 'react'
import { feePaymentService } from '../services/feeService'
import { classService } from '../services/classService'
import { useFetch } from '../hooks/useApi'
import '../fee.css'

const FeeDefaulters = () => {
  const [filters, setFilters] = useState({
    class_id: '',
    section_id: '',
    min_due_amount: '',
    overdue_only: false,
  })

  const [sortConfig, setSortConfig] = useState({
    key: 'due_amount',
    direction: 'desc',
  })

  // Fetch classes
  const { data: classesData } = useFetch(
    () => classService.list(),
    [],
    { enabled: true }
  )

  // Fetch sections for selected class
  const { data: sectionsData } = useFetch(
    () => classService.getSections(filters.class_id),
    [filters.class_id],
    { enabled: !!filters.class_id }
  )

  // Fetch defaulters
  const {
    data: defaultersData,
    loading: defaultersLoading,
    refetch: refreshDefaulters
  } = useFetch(
    () => feePaymentService.getDefaulters(filters),
    [filters.class_id, filters.section_id, filters.min_due_amount, filters.overdue_only],
    { enabled: true }
  )

  // Sort defaulters
  const sortedDefaulters = useMemo(() => {
    const defaulters = defaultersData?.data?.defaulters || defaultersData?.defaulters || []
    if (!sortConfig.key) return defaulters

    const sorted = [...defaulters].sort((a, b) => {
      let aVal = a[sortConfig.key]
      let bVal = b[sortConfig.key]

      // Handle numeric sorting for strings that are numbers
      if (['due_amount', 'total_fee', 'paid_amount', 'total_vouchers'].includes(sortConfig.key)) {
        aVal = parseFloat(aVal) || 0
        bVal = parseFloat(bVal) || 0
      }

      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
    })

    return sorted
  }, [defaultersData, sortConfig])

  // Summary
  const summary = useMemo(() => {
    return defaultersData?.data?.summary || defaultersData?.summary || {
      total_defaulters: 0,
      total_due_amount: 0,
    }
  }, [defaultersData])

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  // Export to CSV
  const exportToCSV = useCallback(() => {
    const headers = [
      'Student Name', 'Roll No', 'Class', 'Section',
      'Guardian', 'Contact', 'Total Vouchers',
      'Total Fee', 'Paid Amount', 'Due Amount'
    ]
    const rows = sortedDefaulters.map(d => {
      const guardian = d.guardians?.[0] || {}
      return [
        d.student_name,
        d.roll_no,
        d.class_name,
        d.section_name || '-',
        guardian.name || d.guardian_name || '-',
        guardian.phone || d.guardian_contact || d.phone || '-',
        d.total_vouchers,
        d.total_fee || 0,
        d.paid_amount || 0,
        d.due_amount,
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `defaulters-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }, [sortedDefaulters])

  return (
    <div className="fee-management">
      <div className="fee-header">
        <h1>⚠️ Fee Defaulters</h1>
        <div className="header-actions">
          <button
            onClick={exportToCSV}
            className="btn-secondary"
            disabled={sortedDefaulters.length === 0}
          >
            📥 Export CSV
          </button>
          <button
            onClick={refreshDefaulters}
            className="btn-primary"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-danger">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-label">Total Defaulters</div>
            <div className="stat-value">{summary.total_defaulters}</div>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">Total Due Amount</div>
            <div className="stat-value">
              Rs. {summary.total_due_amount?.toLocaleString() || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Class</label>
          <select
            value={filters.class_id}
            onChange={(e) => setFilters({ ...filters, class_id: e.target.value, section_id: '' })}
          >
            <option value="">All Classes</option>
            {(classesData?.data || []).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Section</label>
          <select
            value={filters.section_id}
            onChange={(e) => setFilters({ ...filters, section_id: e.target.value })}
            disabled={!filters.class_id}
          >
            <option value="">All Sections</option>
            {(sectionsData?.data || []).map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Min Due Amount</label>
          <input
            type="number"
            value={filters.min_due_amount}
            onChange={(e) => setFilters({ ...filters, min_due_amount: e.target.value })}
            placeholder="e.g., 1000"
            min="0"
          />
        </div>

        <div className="filter-group">
          <label className="checkbox-filter">
            <input
              type="checkbox"
              checked={filters.overdue_only}
              onChange={(e) => setFilters({ ...filters, overdue_only: e.target.checked })}
            />
            {' '}Overdue Only
          </label>
        </div>
      </div>

      {/* Defaulters Table */}
      <div className="table-container">
        {defaultersLoading ? (
          <div className="loading">Loading defaulters...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('student_name')} className="sortable">
                  Student {sortConfig.key === 'student_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th>Roll No</th>
                <th onClick={() => handleSort('class_name')} className="sortable">
                  Class {sortConfig.key === 'class_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th>Section</th>
                <th>Guardian</th>
                <th onClick={() => handleSort('total_vouchers')} className="sortable">
                  Vouchers {sortConfig.key === 'total_vouchers' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('total_fee')} className="sortable">
                  Total Fee {sortConfig.key === 'total_fee' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('paid_amount')} className="sortable">
                  Paid {sortConfig.key === 'paid_amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('due_amount')} className="sortable">
                  Due {sortConfig.key === 'due_amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedDefaulters.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>
                    {filters.overdue_only
                      ? 'No overdue defaulters found! 🎉'
                      : 'No defaulters found! 🎉'}
                  </td>
                </tr>
              ) : (
                sortedDefaulters.map((defaulter, index) => {
                  const guardian = defaulter.guardians?.[0] || {}
                  const contact = guardian.phone || defaulter.guardian_contact || defaulter.phone

                  return (
                    <tr key={`${defaulter.student_id}-${index}`}>
                      <td>
                        <strong>{defaulter.student_name}</strong>
                      </td>
                      <td>{defaulter.roll_no}</td>
                      <td>{defaulter.class_name}</td>
                      <td>{defaulter.section_name || '-'}</td>
                      <td>
                        <div className="guardian-info">
                          <span className="guardian-name">{guardian.name || defaulter.guardian_name || '-'}</span>
                          {contact && (
                            <a href={`tel:${contact}`} className="contact-link small">
                              📞 {contact}
                            </a>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-info">
                          {defaulter.total_vouchers} Vouchers
                        </span>
                      </td>
                      <td>Rs. {parseFloat(defaulter.total_fee || 0).toLocaleString()}</td>
                      <td className="amount-paid">
                        Rs. {parseFloat(defaulter.paid_amount || 0).toLocaleString()}
                      </td>
                      <td className="amount-due">
                        Rs. {parseFloat(defaulter.due_amount || 0).toLocaleString()}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Help Text */}
      {sortedDefaulters.length > 0 && (
        <div className="help-text">
          <p>💡 <strong>Tip:</strong> Click on column headers to sort. Export to CSV for SMS/Email campaigns.</p>
        </div>
      )}
    </div>
  )
}

export default FeeDefaulters
