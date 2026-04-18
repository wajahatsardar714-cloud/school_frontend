import { useState, useEffect, useRef } from 'react'
import { feePaymentService } from '../services/feeService'
import { studentService } from '../services/studentService'
import { PrintReportHeader, ReportTable } from './PrintReport'
import schoolLogo from '../assets/logo.png'
import '../fee.css'
import './StudentFeeHistory.css'

const MAX_SELECTED_STUDENTS = 5

const normalizeStudent = (student) => {
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

  return {
    ...student,
    class_name: className,
    section_name: sectionName,
    father_name: fatherName,
  }
}

const extractHistoryRows = (response) => {
  const root = response?.data ?? response
  let rows = root?.data ?? root

  if (rows && typeof rows === 'object' && !Array.isArray(rows)) {
    rows = rows.history || rows.payments || rows.vouchers || []
  }

  return Array.isArray(rows) ? rows : []
}

const buildReportRows = (history, student) => {
  return history.map((record, index) => {
    const items = Array.isArray(record.items) ? record.items : []
    const hasItemBreakdown = items.length > 0
    const monthlyFee = items.reduce((sum, item) => {
      const itemType = String(item?.item_type || '').toUpperCase()
      const amount = parseFloat(item?.amount)
      if (Number.isNaN(amount) || amount <= 0) return sum
      return itemType === 'MONTHLY' || itemType === 'MONTHLY_FEE' ? sum + amount : sum
    }, 0)
    const dues = items.reduce((sum, item) => {
      const itemType = String(item?.item_type || '').toUpperCase()
      const amount = parseFloat(item?.amount)
      if (Number.isNaN(amount) || amount <= 0) return sum
      return itemType === 'MONTHLY' || itemType === 'MONTHLY_FEE' ? sum : sum + amount
    }, 0)
    const parsedTotalFee = parseFloat(record.total_fee)
    const totalFee = hasItemBreakdown
      ? monthlyFee + dues
      : (Number.isNaN(parsedTotalFee) ? 0 : parsedTotalFee)
    const paidAmount = parseFloat(record.paid_amount) || 0
    const dueAmount = Math.max(totalFee - paidAmount, 0)
    const status = dueAmount <= 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID'
    const monthDate = record.month ? new Date(record.month) : null
    const monthYear = monthDate && !Number.isNaN(monthDate.getTime())
      ? monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : 'N/A'

    return {
      id: record.voucher_id || index,
      name: <strong>{record.student_name || student.name || 'N/A'}</strong>,
      fatherName: record.father_name || student.father_name || 'N/A',
      className: record.class_name || student.class_name || 'N/A',
      sectionName: record.section_name || student.section_name || 'N/A',
      monthYear,
      monthlyFee: <strong>Rs. {monthlyFee.toLocaleString()}</strong>,
      dues: <span style={{ color: dues > 0 ? '#dc3545' : '#6c757d' }}>Rs. {dues.toLocaleString()}</span>,
      totalFee: <strong>Rs. {totalFee.toLocaleString()}</strong>,
      paidAmount: <span style={{ color: '#28a745' }}>Rs. {paidAmount.toLocaleString()}</span>,
      dueAmount: <span style={{ color: dueAmount > 0 ? '#dc3545' : '#6c757d' }}>Rs. {dueAmount.toLocaleString()}</span>,
      status: (
        <span className={`status-badge status-${String(status).toLowerCase()}`}>
          {status}
        </span>
      ),
    }
  })
}

const reportColumns = [
  { key: 'name', label: 'Name', printWidth: '12%', printAlign: 'left' },
  { key: 'fatherName', label: 'Father Name', printWidth: '12%', printAlign: 'left' },
  { key: 'className', label: 'Class', printWidth: '7%', printAlign: 'left' },
  { key: 'sectionName', label: 'Section', printWidth: '7%', printAlign: 'left' },
  { key: 'monthYear', label: 'MonthYear', printWidth: '10%', printAlign: 'center' },
  { key: 'monthlyFee', label: 'Monthly Fee', printWidth: '9%', printAlign: 'right' },
  { key: 'dues', label: 'Dues', printWidth: '9%', printAlign: 'right' },
  { key: 'totalFee', label: 'Total Fee', printWidth: '9%', printAlign: 'right' },
  { key: 'paidAmount', label: 'Paid Amount', printWidth: '9%', printAlign: 'right' },
  { key: 'dueAmount', label: 'Due Amount', printWidth: '9%', printAlign: 'right' },
  { key: 'status', label: 'Status', printWidth: '7%', printAlign: 'center' },
]

const StudentFeeHistory = () => {
  const [selectedStudents, setSelectedStudents] = useState([])
  const [historiesByStudent, setHistoriesByStudent] = useState({})
  const [reloadTick, setReloadTick] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectionMessage, setSelectionMessage] = useState('')
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
          const students = response?.data?.data || response?.data || []
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

  useEffect(() => {
    let cancelled = false

    if (selectedStudents.length === 0) {
      setHistoriesByStudent({})
      return () => {
        cancelled = true
      }
    }

    const loadHistories = async () => {
      setHistoriesByStudent((prev) => {
        const next = {}
        selectedStudents.forEach((student) => {
          const key = String(student.id)
          next[key] = {
            history: prev[key]?.history || [],
            loading: true,
            error: '',
          }
        })
        return next
      })

      const results = await Promise.all(
        selectedStudents.map(async (student) => {
          try {
            const response = await feePaymentService.getStudentHistory(student.id)
            return {
              id: String(student.id),
              history: extractHistoryRows(response),
              error: '',
            }
          } catch (err) {
            return {
              id: String(student.id),
              history: [],
              error: err?.response?.data?.message || err?.message || 'Failed to load history',
            }
          }
        })
      )

      if (cancelled) return

      setHistoriesByStudent((prev) => {
        const next = { ...prev }

        results.forEach((result) => {
          next[result.id] = {
            history: result.history,
            loading: false,
            error: result.error,
          }
        })

        Object.keys(next).forEach((key) => {
          if (!selectedStudents.some(student => String(student.id) === key)) {
            delete next[key]
          }
        })

        return next
      })
    }

    loadHistories()

    return () => {
      cancelled = true
    }
  }, [selectedStudents, reloadTick])

  // Handle selecting a student from search results
  const handleSelectStudent = (student) => {
    const normalized = normalizeStudent(student)

    if (selectedStudents.some(s => String(s.id) === String(normalized.id))) {
      setSelectionMessage('Student is already selected.')
      setSearchTerm('')
      setShowResults(false)
      return
    }

    if (selectedStudents.length >= MAX_SELECTED_STUDENTS) {
      setSelectionMessage(`You can select up to ${MAX_SELECTED_STUDENTS} students only.`)
      setSearchTerm('')
      setShowResults(false)
      return
    }

    setSelectedStudents((prev) => [...prev, normalized])
    setSelectionMessage('')
    setSearchTerm('')
    setShowResults(false)
  }

  const handleRemoveStudent = (studentId) => {
    setSelectedStudents((prev) => prev.filter(student => String(student.id) !== String(studentId)))
    setHistoriesByStudent((prev) => {
      const next = { ...prev }
      delete next[String(studentId)]
      return next
    })
  }

  const handleClearSelection = () => {
    setSelectedStudents([])
    setHistoriesByStudent({})
    setSelectionMessage('')
    setSearchTerm('')
    setShowResults(false)
  }

  const handlePrintReport = () => {
    window.print()
  }

  const handleRefreshAll = () => {
    setReloadTick(value => value + 1)
  }

  return (
    <div className="fee-management">
      <img src={schoolLogo} alt="" className="fee-report-watermark print-only" />

      <div className="fee-header">
        <h1>Student Fee History</h1>
      </div>

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
                        const normalized = normalizeStudent(student)
                        const fatherName = normalized.father_name || 'N/A'
                        const className = normalized.class_name || 'Not Enrolled'
                        const sectionName = normalized.section_name || ''
                        const isAlreadySelected = selectedStudents.some(s => String(s.id) === String(student.id))
                        const isMaxReached = selectedStudents.length >= MAX_SELECTED_STUDENTS
                        const isDisabled = isAlreadySelected || isMaxReached
                      
                      return (
                        <div 
                          key={student.id}
                            className={`search-result-item${isDisabled ? ' search-result-item-disabled' : ''}`}
                            onClick={() => !isDisabled && handleSelectStudent(student)}
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
                            {isAlreadySelected ? 'Added' : isMaxReached ? 'Limit Reached' : 'Add Student →'}
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

        {selectionMessage && (
          <div className="alert alert-warning" style={{ marginTop: '12px' }}>
            {selectionMessage}
          </div>
        )}

        {/* Selected Students */}
        {selectedStudents.length > 0 && (
          <div className="selected-student-badge">
            <div className="selected-students-list">
              {selectedStudents.map((student) => (
                <div key={student.id} className="selected-student-chip">
                  <span>
                    <strong>{student.name}</strong> ({student.class_name}{student.section_name ? ` - ${student.section_name}` : ''})
                  </span>
                  <button
                    className="selected-chip-remove"
                    onClick={() => handleRemoveStudent(student.id)}
                    title="Remove student"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="selected-actions">
              <span className="selected-text">{selectedStudents.length}/{MAX_SELECTED_STUDENTS} selected</span>
              <button
                className="clear-selection-btn"
                onClick={handleClearSelection}
                title="Clear all students"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedStudents.length > 0 && (
        <>
          <div className="fee-history-report-header no-print">
            <h3>Student Fee History Report</h3>
            <div className="report-header-actions">
              <button className="btn-secondary" onClick={handleRefreshAll}>Refresh All</button>
              <button className="rpt-btn rpt-btn--print" onClick={handlePrintReport}>
                Print Report
              </button>
            </div>
          </div>

          {selectedStudents.map((student, index) => {
            const studentState = historiesByStudent[String(student.id)] || {
              history: [],
              loading: true,
              error: '',
            }

            return (
              <div
                className={`table-section fee-history-report-only student-history-block${index === 0 ? ' student-history-first' : ''}`}
                key={student.id}
              >
                <div className="student-history-info no-print">
                  <h4>{index + 1}. {student.name || 'N/A'}</h4>
                  <div className="student-history-meta">
                    <span><strong>Father:</strong> {student.father_name || 'N/A'}</span>
                    <span><strong>Class:</strong> {student.class_name || 'N/A'}</span>
                    <span><strong>Section:</strong> {student.section_name || 'N/A'}</span>
                  </div>
                </div>

                <PrintReportHeader
                  title="Student Fee History Report"
                  meta={[
                    { label: 'Student', value: student.name || 'N/A' },
                    { label: 'Father Name', value: student.father_name || 'N/A' },
                    { label: 'Class', value: student.class_name || 'N/A' },
                    { label: 'Section', value: student.section_name || 'N/A' },
                    { label: 'Order', value: `${index + 1} of ${selectedStudents.length}` },
                    { label: 'Printed On', value: new Date().toLocaleDateString('en-GB') },
                  ]}
                />

                <div className="table-container">
                  {studentState.loading ? (
                    <div className="loading">Loading history...</div>
                  ) : studentState.error ? (
                    <div className="alert alert-error" style={{ margin: '0.5rem' }}>
                      <strong>Unable to load history:</strong> {studentState.error}
                    </div>
                  ) : studentState.history.length === 0 ? (
                    <div className="empty-state">
                      <p>No fee history found for this student</p>
                    </div>
                  ) : (
                    <ReportTable
                      columns={reportColumns}
                      rows={buildReportRows(studentState.history, student)}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

export default StudentFeeHistory
