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
    error: historyError,
    refetch: refreshHistory
  } = useFetch(
    () => {
      console.log('Fetching history for student ID:', studentId)
      return feePaymentService.getStudentHistory(studentId)
    },
    [studentId],
    { enabled: !!studentId }
  )

  // Log the response immediately when it changes
  console.log('>>> HISTORY DATA UPDATED:', historyData)

  // Log any errors
  if (historyError) {
    console.error('Fee History Error:', historyError)
  }

  // Fetch student due
  const { data: dueData } = useFetch(
    () => feePaymentService.getStudentDue(studentId),
    [studentId],
    { enabled: !!studentId }
  )

  const history = useMemo(() => {
    console.log('=== FEE HISTORY DEBUG ===')
    console.log('Raw historyData:', historyData)
    console.log('Type:', typeof historyData)
    console.log('Keys:', historyData ? Object.keys(historyData) : 'null')
    console.log('historyData.data:', historyData?.data)
    console.log('historyData.data keys:', historyData?.data ? Object.keys(historyData.data) : 'null')
    
    // Use same structure as FeePaymentManagement: data is wrapped in { data: [...] }
    let historyArray = historyData?.data || []
    
    // If data is an object with nested arrays, try common patterns
    if (historyArray && typeof historyArray === 'object' && !Array.isArray(historyArray)) {
      console.log('Data is object, checking nested properties...')
      historyArray = historyArray.history || historyArray.payments || historyArray.vouchers || []
    }
    
    console.log('Final historyArray:', historyArray)
    console.log('Array length:', Array.isArray(historyArray) ? historyArray.length : 'not an array')
    console.log('First item:', historyArray[0])
    if (historyArray[0]) {
      console.log('First item keys:', Object.keys(historyArray[0]))
      console.log('First item values:', Object.entries(historyArray[0]))
    }
    
    return Array.isArray(historyArray) ? historyArray : []
  }, [historyData])

  const due = useMemo(() => {
    return dueData?.data || dueData || { total_due: 0, voucher_count: 0 }
  }, [dueData])

  const selectedStudent = useMemo(() => {
    if (!studentId) return null
    const students = studentsData?.data || []
    const student = students.find(s => String(s.id) === String(studentId))
    console.log('Selected Student:', student)
    console.log('Selected Student Keys:', student ? Object.keys(student) : 'null')
    console.log('All Students:', students)
    
    // If student doesn't have class info, try to get it from the first history record
    if (student && history.length > 0 && !student.class_name) {
      const firstRecord = history[0]
      return {
        ...student,
        class_name: firstRecord.class_name,
        section_name: firstRecord.section_name,
        roll_no: student.roll_no || student.roll_number || firstRecord.roll_no || 'N/A'
      }
    }
    
    return student
  }, [studentId, studentsData, history])

  const filteredStudents = useMemo(() => {
    const students = studentsData?.data || []
    if (!searchTerm) return students

    return students.filter(s =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.roll_no?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [studentsData, searchTerm])

  // Calculate summary statistics - use backend summary if available
  const summary = useMemo(() => {
    // First, try to use the summary from the backend response
    const backendSummary = historyData?.data?.summary
    
    if (backendSummary) {
      console.log('Using backend summary:', backendSummary)
      return {
        total_vouchers: backendSummary.total_vouchers || history.length,
        paid_vouchers: backendSummary.paid_vouchers || 0,
        partial_vouchers: backendSummary.partial_vouchers || 0,
        unpaid_vouchers: backendSummary.unpaid_vouchers || 0,
        total_amount: backendSummary.total_amount || 0,
        total_paid: backendSummary.total_paid || 0,
      }
    }
    
    // Fallback: calculate from history array
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
  }, [history, historyData])

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

      {/* Error Display */}
      {historyError && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          <strong>Error loading fee history:</strong> {historyError.message || 'Unknown error'}
        </div>
      )}

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
                    <strong>Roll No:</strong> {selectedStudent.roll_no || 'N/A'}
                  </span>
                  <span className="meta-item">
                    <strong>Class:</strong> {selectedStudent.class_name || 'N/A'}
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
                      <th>Voucher ID</th>
                      <th>Month</th>
                      <th>Class/Section</th>
                      <th>Total Fee</th>
                      <th>Paid Amount</th>
                      <th>Due Amount</th>
                      <th>Status</th>
                      <th>Created Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                          No fee history found for this student
                        </td>
                      </tr>
                    ) : (
                      history.map(record => {
                        const totalFee = parseFloat(record.total_fee) || 0
                        const paidAmount = parseFloat(record.paid_amount) || 0
                        const dueAmount = parseFloat(record.due_amount) || 0

                        return (
                          <tr key={record.voucher_id}>
                            <td>
                              <strong>#{record.voucher_id}</strong>
                            </td>
                            <td>
                              {new Date(record.month).toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric'
                              })}
                            </td>
                            <td>
                              {record.class_name}
                              {record.section_name && ` - ${record.section_name}`}
                            </td>
                            <td>
                              <strong>Rs. {totalFee.toLocaleString()}</strong>
                            </td>
                            <td>
                              <span style={{ color: '#28a745' }}>
                                Rs. {paidAmount.toLocaleString()}
                              </span>
                            </td>
                            <td>
                              <span style={{ color: dueAmount > 0 ? '#dc3545' : '#6c757d' }}>
                                Rs. {dueAmount.toLocaleString()}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge status-${record.status.toLowerCase()}`}>
                                {record.status}
                              </span>
                            </td>
                            <td>
                              {new Date(record.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
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
