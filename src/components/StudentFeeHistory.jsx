import { useState, useEffect, useRef } from 'react'
import { feePaymentService } from '../services/feeService'
import { studentService } from '../services/studentService'
import { ReportTable } from './PrintReport'
import schoolLogo from '../assets/logo.png'
import '../fee.css'
import './StudentFeeHistory.css'

const MAX_SELECTED_STUDENTS = 5
const SCHOOL_NAME = 'Muslim Public Higher Secondary School Lar'
const SCHOOL_ADDRESS = 'Bahawalpur Road, Adda Laar'
const SCHOOL_PHONE = '0300-6246297'
const SCHOOL_EMAIL = 'muslimpublichighersecondarysch@gmail.com'

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
    roll_no: student.current_enrollment?.roll_no || student.roll_no || student.student_roll_no || '',
    serial_number: student.serial_number || student.serial_no || student.admission_no || student.admission_number || '',
    admission_no: student.admission_no || student.admission_number || student.serial_number || '',
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

const toVoucherNo = (record, fallbackIndex) => {
  const voucherNo = record?.voucher_no || record?.voucherNo
  if (voucherNo) return String(voucherNo)

  const voucherId = record?.voucher_id || record?.voucherId || record?.id || fallbackIndex
  if (!voucherId) return 'N/A'

  return `V-${voucherId}`
}

const isCollegeHistoryRecord = (record) => {
  const items = Array.isArray(record?.items) ? record.items : []
  const hasYearlyPackageItem = items.some((item) => {
    const itemType = String(item?.item_type || '').toUpperCase().replace(/[\s-]+/g, '_')
    const description = String(item?.description || '').toLowerCase()
    return itemType === 'YEARLY_PACKAGE' || (description.includes('annual') && description.includes('package'))
  })

  const voucherType = String(record?.voucher_type || record?.voucherType || '').toUpperCase()
  const classType = String(record?.class_type || record?.classType || '').toUpperCase()
  return voucherType === 'YEARLY_COLLEGE' || classType === 'COLLEGE' || hasYearlyPackageItem
}

const parseRecordAmounts = (record) => {
  const isCollegeRecord = isCollegeHistoryRecord(record)
  const items = Array.isArray(record.items) ? record.items : []
  const hasItemBreakdown = items.length > 0

  if (isCollegeRecord) {
    const annualFeeFromItems = items.reduce((sum, item) => {
      const itemType = String(item?.item_type || '').toUpperCase().replace(/[\s-]+/g, '_')
      const description = String(item?.description || '').toLowerCase()
      const amount = parseFloat(item?.amount)
      if (Number.isNaN(amount) || amount <= 0) return sum
      const isAnnualPackage = itemType === 'YEARLY_PACKAGE' || (description.includes('annual') && description.includes('package'))
      return isAnnualPackage ? sum + amount : sum
    }, 0)

    const parsedTotalFee = parseFloat(record.total_fee)
    const totalFee = annualFeeFromItems > 0
      ? annualFeeFromItems
      : (Number.isNaN(parsedTotalFee) ? 0 : parsedTotalFee)

    const paidAmount = parseFloat(record.paid_amount) || 0
    const dueAmount = Math.max(totalFee - paidAmount, 0)

    const statusFromRecord = String(record.status || '').toUpperCase()
    const status = ['PAID', 'PARTIAL', 'UNPAID'].includes(statusFromRecord)
      ? statusFromRecord
      : (dueAmount <= 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID')

    return {
      monthlyFee: totalFee,
      dues: 0,
      totalFee,
      paidAmount,
      dueAmount,
      status,
    }
  }

  const monthlyFee = items.reduce((sum, item) => {
    const itemType = String(item?.item_type || '').toUpperCase()
    const amount = parseFloat(item?.amount)
    if (Number.isNaN(amount) || amount <= 0) return sum
    return itemType === 'MONTHLY' || itemType === 'MONTHLY_FEE' ? sum + amount : sum
  }, 0)

  const duesFromItems = items.reduce((sum, item) => {
    const itemType = String(item?.item_type || '').toUpperCase()
    const description = String(item?.description || '').toLowerCase()
    const amount = parseFloat(item?.amount)
    if (Number.isNaN(amount) || amount <= 0) return sum

    // Only treat outstanding/carry-forward dues as "Dues" in this report.
    const isOutstandingDuesItem = (
      itemType === 'ARREARS' ||
      ((itemType === 'CUSTOM' || itemType === 'DUES') &&
        (description.includes('dues') || description.includes('outstanding') || description.includes('arrear')))
    )

    return isOutstandingDuesItem ? sum + amount : sum
  }, 0)

  const parsedOutstanding = parseFloat(
    record.student_outstanding ??
    record.studentOutstanding ??
    record.outstanding ??
    record.outstanding_due ??
    record.outstandingDue ??
    record.outstanding_dues ??
    record.outstandingDues ??
    record.previous_due ??
    record.previousDue ??
    record.dues
  )

  const hasOutstandingInRecord = Number.isFinite(parsedOutstanding)
  const duesFromRecord = hasOutstandingInRecord ? Math.max(parsedOutstanding, 0) : 0
  const dues = hasOutstandingInRecord
    ? duesFromRecord
    : (hasItemBreakdown ? duesFromItems : 0)

  const parsedTotalFee = parseFloat(record.total_fee)
  const totalFee = hasItemBreakdown
    ? monthlyFee + dues
    : (Number.isNaN(parsedTotalFee) ? 0 : parsedTotalFee)

  const paidAmount = parseFloat(record.paid_amount) || 0
  const dueAmount = Math.max(totalFee - paidAmount, 0)
  const status = dueAmount <= 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID'

  return {
    monthlyFee,
    dues,
    totalFee,
    paidAmount,
    dueAmount,
    status,
  }
}

const getMonthLabel = (monthValue) => {
  const monthDate = monthValue ? new Date(monthValue) : null
  if (!monthDate || Number.isNaN(monthDate.getTime())) return 'N/A'

  return monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

const toDateObject = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const getPaymentTimestamp = (payment) => {
  const directDate = toDateObject(payment?.payment_date || payment?.paymentDate)
  if (directDate) return directDate.getTime()

  const createdDate = toDateObject(payment?.created_at || payment?.createdAt)
  if (createdDate) return createdDate.getTime()

  return 0
}

const formatPaymentDateTime = (payment) => {
  const date = toDateObject(payment?.payment_date || payment?.paymentDate || payment?.created_at || payment?.createdAt)
  if (!date) return 'N/A'

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`

const getStudentSerialNo = (student) => {
  return student.roll_no || student.current_enrollment?.roll_no || student.student_roll_no || student.serial_number || student.serial_no || 'N/A'
}

const buildStudentSummary = (history, student) => {
  const totals = history.reduce((acc, record, index) => {
    const amounts = parseRecordAmounts(record)
    const voucherNo = toVoucherNo(record, index + 1)

    acc.totalPaid += amounts.paidAmount
    acc.totalDues += amounts.dues
    if (!acc.latestVoucherNo || acc.latestVoucherNo === 'N/A') {
      acc.latestVoucherNo = voucherNo
    }

    const monthDate = record.month ? new Date(record.month) : null
    if (monthDate && !Number.isNaN(monthDate.getTime())) {
      acc.monthDates.push(monthDate)
    }

    return acc
  }, {
    totalPaid: 0,
    totalDues: 0,
    latestVoucherNo: 'N/A',
    monthDates: [],
  })

  let dateRange = 'N/A'
  if (totals.monthDates.length > 0) {
    const sortedMonths = [...totals.monthDates].sort((a, b) => a.getTime() - b.getTime())
    const fromDate = sortedMonths[0].toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    const toDate = sortedMonths[sortedMonths.length - 1].toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    dateRange = `${fromDate} - ${toDate}`
  }

  return {
    studentName: student.name || 'N/A',
    fatherName: student.father_name || 'N/A',
    className: student.class_name || 'N/A',
    sectionName: student.section_name || 'N/A',
    serialNo: getStudentSerialNo(student),
    latestVoucherNo: totals.latestVoucherNo,
    dateRange,
    printedOn: new Date().toLocaleDateString('en-GB'),
    totalPaid: formatCurrency(totals.totalPaid),
    totalDues: formatCurrency(totals.totalDues),
  }
}

const buildReportRows = (history) => {
  return history.map((record, index) => {
    const amounts = parseRecordAmounts(record)

    return {
      id: record.voucher_id || index,
      voucherNo: <strong>{toVoucherNo(record, index + 1)}</strong>,
      monthYear: getMonthLabel(record.month),
      monthlyFee: <strong>{formatCurrency(amounts.monthlyFee)}</strong>,
      dues: <span style={{ color: amounts.dues > 0 ? '#dc3545' : '#6c757d' }}>{formatCurrency(amounts.dues)}</span>,
      totalFee: <strong>{formatCurrency(amounts.totalFee)}</strong>,
      paidAmount: <span style={{ color: '#166534' }}>{formatCurrency(amounts.paidAmount)}</span>,
      dueAmount: <span style={{ color: amounts.dueAmount > 0 ? '#dc3545' : '#6c757d' }}>{formatCurrency(amounts.dueAmount)}</span>,
      status: (
        <span className={`status-badge status-${String(amounts.status).toLowerCase()}`}>
          {amounts.status}
        </span>
      ),
    }
  })
}

const buildPaymentHistoryRows = (history) => {
  const collegeHistory = Array.isArray(history) ? history.filter(isCollegeHistoryRecord) : []
  const rows = []

  collegeHistory.forEach((record, recordIndex) => {
    const payments = Array.isArray(record?.payments) ? record.payments : []
    if (payments.length === 0) return

    const amounts = parseRecordAmounts(record)
    const sortedPayments = [...payments].sort((a, b) => getPaymentTimestamp(a) - getPaymentTimestamp(b))
    let runningPaid = 0

    sortedPayments.forEach((payment, paymentIndex) => {
      const amount = parseFloat(payment?.amount)
      if (!Number.isFinite(amount) || amount <= 0) return

      runningPaid += amount
      const balanceAfterPayment = Math.max(amounts.totalFee - runningPaid, 0)

      rows.push({
        id: `${record?.voucher_id || recordIndex}-payment-${paymentIndex}`,
        voucherNoText: toVoucherNo(record, recordIndex + 1),
        periodText: getMonthLabel(record?.month),
        paidOnText: formatPaymentDateTime(payment),
        amountValue: amount,
        balanceValue: balanceAfterPayment,
        paymentTimestamp: getPaymentTimestamp(payment),
      })
    })
  })

  return rows
    .sort((a, b) => a.paymentTimestamp - b.paymentTimestamp)
    .map((row, index) => ({
      id: `${row.id}-${index}`,
      serialNo: index + 1,
      voucherNo: <strong>{row.voucherNoText}</strong>,
      period: row.periodText,
      paidOn: row.paidOnText,
      amount: <span style={{ color: '#166534', fontWeight: 700 }}>{formatCurrency(row.amountValue)}</span>,
      balance: <span style={{ color: row.balanceValue > 0 ? '#dc2626' : '#64748b', fontWeight: 700 }}>{formatCurrency(row.balanceValue)}</span>,
    }))
}

const reportColumns = [
  { key: 'voucherNo', label: 'Voucher No', printWidth: '11%', printAlign: 'left' },
  { key: 'monthYear', label: 'Month', printWidth: '13%', printAlign: 'center' },
  { key: 'monthlyFee', label: 'Monthly Fee', printWidth: '12%', printAlign: 'right' },
  { key: 'dues', label: 'Dues', printWidth: '11%', printAlign: 'right' },
  { key: 'totalFee', label: 'Total Fee', printWidth: '12%', printAlign: 'right' },
  { key: 'paidAmount', label: 'Paid Amount', printWidth: '12%', printAlign: 'right' },
  { key: 'dueAmount', label: 'Due Amount', printWidth: '12%', printAlign: 'right' },
  { key: 'status', label: 'Status', printWidth: '17%', printAlign: 'center' },
]

const getReportColumns = (history) => {
  const isCollegeOnlyHistory = Array.isArray(history) && history.length > 0 && history.every(isCollegeHistoryRecord)
  if (!isCollegeOnlyHistory) return reportColumns

  return reportColumns.map((column) => {
    if (column.key === 'monthYear') {
      return { ...column, label: 'Session' }
    }
    if (column.key === 'monthlyFee') {
      return { ...column, label: 'Annual Fee' }
    }
    return column
  })
}

const paymentHistoryColumns = [
  { key: 'serialNo', label: '#', printWidth: '6%', printAlign: 'center' },
  { key: 'voucherNo', label: 'Voucher No', printWidth: '14%', printAlign: 'left' },
  { key: 'period', label: 'Month', printWidth: '18%', printAlign: 'center' },
  { key: 'paidOn', label: 'Paid On', printWidth: '24%', printAlign: 'center' },
  { key: 'amount', label: 'Amount', printWidth: '18%', printAlign: 'right' },
  { key: 'balance', label: 'Balance After Payment', printWidth: '20%', printAlign: 'right' },
]

const getPaymentHistoryColumns = (history) => {
  const isCollegeOnlyHistory = Array.isArray(history) && history.length > 0 && history.every(isCollegeHistoryRecord)
  if (!isCollegeOnlyHistory) return paymentHistoryColumns

  return paymentHistoryColumns.map((column) => {
    if (column.key === 'period') {
      return { ...column, label: 'Session' }
    }
    return column
  })
}

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
      <div className="fee-report-watermark print-only" aria-hidden="true">
        <img src={schoolLogo} alt="" />
      </div>

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

          <div className="student-history-print-header print-only">
            <div className="school-name">{SCHOOL_NAME}</div>
            <div className="report-title">Student Fee History Report</div>
            <hr className="student-report-divider" />
          </div>

          {selectedStudents.map((student, index) => {
            const studentState = historiesByStudent[String(student.id)] || {
              history: [],
              loading: true,
              error: '',
            }
            const reportSummary = buildStudentSummary(studentState.history, student)
            const reportRows = buildReportRows(studentState.history)
            const collegeHistory = Array.isArray(studentState.history)
              ? studentState.history.filter(isCollegeHistoryRecord)
              : []
            const hasCollegeHistory = collegeHistory.length > 0
            const paymentHistoryRows = hasCollegeHistory ? buildPaymentHistoryRows(collegeHistory) : []

            return (
              <div
                className={`table-section fee-history-report-only student-history-block${index === 0 ? ' student-history-first' : ''}`}
                key={student.id}
              >
                <div className="student-summary-bar">
                  <span className="student-summary-item"><strong>Student:</strong> {reportSummary.studentName}</span>
                  <span className="student-summary-item"><strong>Father:</strong> {reportSummary.fatherName}</span>
                  <span className="student-summary-item"><strong>Class:</strong> {reportSummary.className}</span>
                  <span className="student-summary-item"><strong>Section:</strong> {reportSummary.sectionName}</span>
                  <span className="student-summary-item"><strong>Serial No:</strong> {reportSummary.serialNo}</span>
                  <span className="student-summary-item"><strong>Voucher No:</strong> {reportSummary.latestVoucherNo}</span>
                  <span className="student-summary-item"><strong>Date Range:</strong> {reportSummary.dateRange}</span>
                  <span className="student-summary-item"><strong>Printed On:</strong> {reportSummary.printedOn}</span>
                  <span className="student-summary-item student-summary-item--strong"><strong>Total Paid:</strong> {reportSummary.totalPaid}</span>
                  <span className="student-summary-item student-summary-item--strong"><strong>Total Dues:</strong> {reportSummary.totalDues}</span>
                </div>

                <div className="student-history-table-wrap">
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
                    <>
                      <ReportTable
                        columns={getReportColumns(studentState.history)}
                        rows={reportRows}
                      />

                      {hasCollegeHistory && (
                        <div className="student-payment-history-wrap">
                          <div className="student-payment-history-title">
                            Payment History ({paymentHistoryRows.length} payment{paymentHistoryRows.length === 1 ? '' : 's'})
                          </div>

                          {paymentHistoryRows.length === 0 ? (
                            <div className="empty-state" style={{ margin: 0 }}>
                              <p>No payment entries found for this student</p>
                            </div>
                          ) : (
                            <ReportTable
                              columns={getPaymentHistoryColumns(collegeHistory)}
                              rows={paymentHistoryRows}
                            />
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}

          <div className="student-history-print-footer print-only">
            <div className="student-history-print-footer__line">{SCHOOL_ADDRESS}</div>
            <div className="student-history-print-footer__line">Phone: {SCHOOL_PHONE} | Email: {SCHOOL_EMAIL}</div>
            <div className="student-history-print-footer__line student-history-print-footer__line--strong">Pay at school office during working hours. Contact: {SCHOOL_PHONE}</div>
          </div>
        </>
      )}
    </div>
  )
}

export default StudentFeeHistory
