import { useState, useMemo } from 'react'
import { feePaymentService } from '../services/feeService'
import { studentService } from '../services/studentService'
import { useFetch } from '../hooks/useApi'
import '../fee.css'

const StudentFeeHistory = () => {
  const [studentId, setStudentId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch students
  const { data: studentsData, loading: studentsLoading } = useFetch(
    () => studentService.list({ is_active: true }),
    [],
    { enabled: true }
  )

  // Fetch student fee history
  const { 
    data: historyData, 
    loading: historyLoading,
    refetch: refreshHistory 
  } = useFetch(
    () => feePaymentService.getStudentHistory(studentId),
    [studentId],
    { enabled: !!studentId }
  )

  // Fetch student due
  const { data: dueData } = useFetch(
    () => feePaymentService.getStudentDue(studentId),
    [studentId],
    { enabled: !!studentId }
  )

  const history = useMemo(() => {
    return historyData?.data?.history || historyData?.history || []
  }, [historyData])

  const due = useMemo(() => {
    return dueData?.data || dueData || { total_due: 0, voucher_count: 0 }
  }, [dueData])

  const selectedStudent = useMemo(() => {
    if (!studentId) return null
    const students = studentsData?.data || []
    return students.find(s => s.id === parseInt(studentId))
  }, [studentId, studentsData])

  const filteredStudents = useMemo(() => {
    const students = studentsData?.data || []
    if (!searchTerm) return students

    return students.filter(s =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.roll_no?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [studentsData, searchTerm])

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!history.length) {
      return {
        total_vouchers: 0,
        paid_vouchers: 0,
        partial_vouchers: 0,
        unpaid_vouchers: 0,
        total_amount: 0,
        total_paid: 0,
      }
    }

    return {
      total_vouchers: history.length,
      paid_vouchers: history.filter(h => h.status === 'PAID').length,
      partial_vouchers: history.filter(h => h.status === 'PARTIAL').length,
      unpaid_vouchers: history.filter(h => h.status === 'UNPAID').length,
      total_amount: history.reduce((sum, h) => sum + (h.total_fee || 0), 0),
      total_paid: history.reduce((sum, h) => sum + (h.paid_amount || 0), 0),
    }
  }, [history])

  return (
    <div className="fee-management">
      <div className="fee-header">
        <h1>Student Fee History</h1>
        {studentId && (
          <button onClick={refreshHistory} className="btn-primary">
            🔄 Refresh
          </button>
        )}
      </div>

      {/* Student Selection */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Search Student</label>
          <input
            type="text"
            className="search-input"
            placeholder="Search by name or roll no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Select Student</label>
          <select 
            className="filter-select"
            value={studentId} 
            onChange={(e) => setStudentId(e.target.value)}
            disabled={studentsLoading}
          >
            <option value="">-- Select Student --</option>
            {filteredStudents.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.roll_no}) - {s.class_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {studentId && selectedStudent && (
        <>
          {/* Student Info Card */}
          <div className="student-info-card">
            <div className="student-info-header">
              <div className="student-avatar">
                {selectedStudent.name?.charAt(0).toUpperCase()}
              </div>
              <div className="student-details">
                <h2>{selectedStudent.name}</h2>
                <div className="student-meta">
                  <span className="meta-item">
                    <strong>Roll No:</strong> {selectedStudent.roll_no}
                  </span>
                  <span className="meta-item">
                    <strong>Class:</strong> {selectedStudent.class_name}
                  </span>
                  {selectedStudent.section_name && (
                    <span className="meta-item">
                      <strong>Section:</strong> {selectedStudent.section_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="stats-grid">
            <div className="stat-card stat-danger">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-label">Total Outstanding</div>
                <div className="stat-value">
                  Rs. {due.total_due?.toLocaleString()}
                </div>
                <div className="stat-detail">
                  {due.voucher_count || 0} unpaid voucher{due.voucher_count !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <div className="stat-card stat-primary">
              <div className="stat-icon">📄</div>
              <div className="stat-content">
                <div className="stat-label">Total Vouchers</div>
                <div className="stat-value">{summary.total_vouchers}</div>
                <div className="stat-detail">
                  All time
                </div>
              </div>
            </div>

            <div className="stat-card stat-success">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-label">Paid Vouchers</div>
                <div className="stat-value">{summary.paid_vouchers}</div>
                <div className="stat-detail">
                  {summary.total_vouchers > 0 
                    ? ((summary.paid_vouchers / summary.total_vouchers) * 100).toFixed(1) 
                    : 0}% paid
                </div>
              </div>
            </div>

            <div className="stat-card stat-info">
              <div className="stat-icon">💵</div>
              <div className="stat-content">
                <div className="stat-label">Total Collected</div>
                <div className="stat-value">
                  Rs. {summary.total_paid?.toLocaleString()}
                </div>
                <div className="stat-detail">
                  of Rs. {summary.total_amount?.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Fee History Table */}
          <div className="table-section">
            <h3>Payment History</h3>
            <div className="table-container">
              {historyLoading ? (
                <div className="loading">Loading history...</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Class</th>
                      <th>Total Amount</th>
                      <th>Discount</th>
                      <th>Net Amount</th>
                      <th>Paid</th>
                      <th>Due</th>
                      <th>Status</th>
                      <th>Due Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan="10" style={{ textAlign: 'center', padding: '2rem' }}>
                          No fee history found for this student
                        </td>
                      </tr>
                    ) : (
                      history.map(record => {
                        const isOverdue = record.status !== 'PAID' && 
                          record.due_date && 
                          new Date(record.due_date) < new Date()

                        return (
                          <tr key={record.voucher_id} className={isOverdue ? 'row-overdue' : ''}>
                            <td>
                              {new Date(record.month).toLocaleDateString('en-US', { 
                                month: 'long', 
                                year: 'numeric' 
                              })}
                            </td>
                            <td>{record.class_name}</td>
                            <td>Rs. {record.total_fee?.toLocaleString()}</td>
                            <td>
                              {record.discount_amount > 0 ? (
                                <span className="badge badge-success">
                                  -Rs. {record.discount_amount?.toLocaleString()}
                                </span>
                              ) : '-'}
                            </td>
                            <td>
                              <strong>Rs. {record.net_amount?.toLocaleString()}</strong>
                            </td>
                            <td>Rs. {record.paid_amount?.toLocaleString()}</td>
                            <td>
                              <span className={record.due_amount > 0 ? 'amount-due' : ''}>
                                Rs. {record.due_amount?.toLocaleString()}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge status-${record.status.toLowerCase()}`}>
                                {record.status}
                                {isOverdue && ' (Overdue)'}
                              </span>
                            </td>
                            <td>
                              {record.due_date ? (
                                <span className={isOverdue ? 'overdue-date' : ''}>
                                  {new Date(record.due_date).toLocaleDateString()}
                                </span>
                              ) : '-'}
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button 
                                  className="btn-small btn-view"
                                  onClick={() => window.open(`/fees/vouchers?id=${record.voucher_id}`, '_blank')}
                                  title="View Voucher"
                                >
                                  👁️
                                </button>
                                {record.status !== 'PAID' && (
                                  <button 
                                    className="btn-small btn-pay"
                                    onClick={() => window.location.href = `/fees/payments?voucher_id=${record.voucher_id}`}
                                    title="Make Payment"
                                  >
                                    💳
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Payment Timeline */}
          {history.length > 0 && (
            <div className="timeline-section">
              <h3>Payment Timeline</h3>
              <div className="timeline">
                {history.slice(0, 5).map((record, index) => (
                  <div key={record.voucher_id} className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="timeline-date">
                        {new Date(record.month).toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </div>
                      <div className="timeline-details">
                        <span className={`status-badge status-${record.status.toLowerCase()}`}>
                          {record.status}
                        </span>
                        <span className="timeline-amount">
                          Rs. {record.paid_amount?.toLocaleString()} / {record.net_amount?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="help-text">
            <h4>💡 Understanding Fee History</h4>
            <ul>
              <li><strong>Total Outstanding:</strong> Current amount the student owes across all unpaid vouchers</li>
              <li><strong>Status PAID:</strong> Voucher is fully paid, no amount due</li>
              <li><strong>Status PARTIAL:</strong> Some payment made, but balance remains</li>
              <li><strong>Status UNPAID:</strong> No payment recorded yet</li>
              <li><strong>Overdue:</strong> Payment due date has passed and voucher is not fully paid</li>
              <li><strong>Actions:</strong> Click 👁️ to view voucher details, 💳 to make payment</li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

export default StudentFeeHistory
