import { useState, useMemo, useEffect, useRef } from 'react'
import { feePaymentService } from '../services/feeService'
import { studentService } from '../services/studentService'
import { useFetch } from '../hooks/useApi'
import '../fee.css'
import './StudentFeeHistory.css'

const StudentFeeHistory = () => {
  const [studentId, setStudentId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const searchRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search students with debouncing
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        setSearchLoading(true)
        try {
          const response = await studentService.search(searchTerm.trim())
          const students = response.data || []
          setSearchResults(students)
          setShowResults(true)
        } catch (err) {
          console.error('Search error:', err)
          setSearchResults([])
        } finally {
          setSearchLoading(false)
        }
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [searchTerm])

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

  // Handle selecting a student from search results
  const handleSelectStudent = (student) => {
    // Extract class and section info
    const className = student.current_enrollment?.class_name || 
                      student.current_class_name || 
                      student.current_class?.name || 
                      student.class_name || 
                      'Not Enrolled'
    const sectionName = student.current_enrollment?.section_name || 
                        student.current_section_name || 
                        student.current_section?.name || 
                        student.section_name || 
                        'N/A'
    const fatherName = student.father_name || 
                       student.guardians?.find(g => g.relation === 'Father')?.name || 
                       'N/A'
    
    setSelectedStudent({
      ...student,
      class_name: className,
      section_name: sectionName,
      father_name: fatherName
    })
    setStudentId(student.id.toString())
    setSearchTerm('')
    setShowResults(false)
  }

  // Clear selection
  const handleClearSelection = () => {
    setStudentId('')
    setSelectedStudent(null)
    setSearchTerm('')
  }

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

      {/* Student Search Section */}
      <div className="student-search-section">
        <div className="search-container" ref={searchRef}>
          <div className="search-header">
            <h3>🔍 Search Student</h3>
            <p>Find a student to view their complete fee history</p>
          </div>
          
          <div className="search-input-container">
            <input
              type="text"
              className="student-search-input"
              placeholder="Type student name to search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
            />
            {searchTerm && (
              <button 
                className="clear-search-btn"
                onClick={() => { setSearchTerm(''); setShowResults(false); }}
              >✕</button>
            )}
            {searchLoading && <span className="search-loading">⏳</span>}
          </div>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="search-results-dropdown">
              {searchResults.length === 0 ? (
                <div className="no-results">
                  <p>No students found matching "{searchTerm}"</p>
                </div>
              ) : (
                <>
                  <div className="search-results-header">
                    <p>Found {searchResults.length} student{searchResults.length > 1 ? 's' : ''}</p>
                  </div>
                  <div className="search-results-list">
                    {searchResults.map((student) => {
                      const fatherName = student.father_name || student.guardians?.find(g => g.relation === 'Father')?.name || 'N/A'
                      const className = student.current_enrollment?.class_name || student.current_class_name || student.class_name || 'Not Enrolled'
                      const sectionName = student.current_enrollment?.section_name || student.current_section_name || student.section_name || ''
                      
                      return (
                        <div 
                          key={student.id}
                          className="search-result-item"
                          onClick={() => handleSelectStudent(student)}
                        >
                          <div className="student-card-left">
                            <div className="student-avatar">
                              {student.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="student-card-info">
                              <div className="student-name-highlight">{student.name}</div>
                              <div className="student-meta-grid">
                                <div className="meta-item">
                                  <span className="meta-label">FATHER</span>
                                  <span className="meta-value">{fatherName}</span>
                                </div>
                                <div className="meta-item">
                                  <span className="meta-label">CLASS</span>
                                  <span className="meta-value">{className}</span>
                                </div>
                                {sectionName && (
                                  <div className="meta-item">
                                    <span className="meta-label">SECTION</span>
                                    <span className="meta-value">{sectionName}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <button className="btn-view-details">
                            View History →
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Selected Student Badge */}
        {selectedStudent && (
          <div className="selected-student-badge">
            <div className="selected-info">
              <span className="selected-text">
                Selected: <strong>{selectedStudent.name}</strong> ({selectedStudent.class_name})
              </span>
            </div>
            <button 
              className="clear-selection-btn"
              onClick={handleClearSelection}
            >✕</button>
          </div>
        )}
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
                    <strong>Father:</strong> {selectedStudent.father_name || 'N/A'}
                  </span>
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
