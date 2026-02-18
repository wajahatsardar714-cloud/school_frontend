/**
 * Fee Voucher Management Component
 * 
 * Features:
 * - Generate single/bulk fee vouchers
 * - List and filter vouchers
 * - View voucher details
 * - Download PDF
 * - Record payments inline
 * 
 * Security & Performance:
 * - AbortController for request cancellation
 * - Race condition prevention
 * - Debounced search
 * - Optimized re-renders
 */

import { useState, useCallback, useMemo } from 'react'
import { feeVoucherService, feePaymentService } from '../services/feeService'
import { studentService } from '../services/studentService'
import { classService } from '../services/classService'
import { useFetch, useMutation, useDebounce } from '../hooks/useApi'
import '../fee.css'

// Constants
const VOUCHER_STATUS = {
  UNPAID: 'UNPAID',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
}

const STATUS_COLORS = {
  [VOUCHER_STATUS.UNPAID]: 'status-unpaid',
  [VOUCHER_STATUS.PARTIAL]: 'status-partial',
  [VOUCHER_STATUS.PAID]: 'status-paid',
}

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

// Fee types available for selection
const FEE_TYPES = [
  { value: 'MONTHLY', label: 'Monthly Fee', description: 'Regular monthly tuition fee' },
  { value: 'ADMISSION', label: 'Admission Fee', description: 'One-time admission fee' },
  { value: 'PAPER_FUND', label: 'Paper/Exam Fund', description: 'Examination and paper charges' },
  { value: 'TRANSPORT', label: 'Transport Fee', description: 'School transport charges' },
  { value: 'OTHER', label: 'Other Charges', description: 'Miscellaneous fees' },
]

const FeeVoucherManagement = () => {
  // UI State
  const [activeTab, setActiveTab] = useState('list')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Edit Items Modal State
  const [showEditItemsModal, setShowEditItemsModal] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState(null)
  const [editItems, setEditItems] = useState([])
  
  // Filter State
  const [filters, setFilters] = useState({
    class_id: '',
    status: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  })

  // Generate Form State
  const [generateForm, setGenerateForm] = useState({
    type: 'single', // 'single' | 'bulk'
    student_id: '',
    class_id: '',
    section_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    due_date: '',
    fee_types: ['MONTHLY'], // Default to monthly fee only
  })
  
  // Preview State (NEW - Issue #3)
  const [previewData, setPreviewData] = useState(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'CASH',
    reference_no: '',
  })

  // Debounced search
  const debouncedSearch = useDebounce(searchTerm, 300)

  // Data Fetching - classes (fetch once)
  const { 
    data: classesData, 
    loading: classesLoading 
  } = useFetch(
    () => classService.list(),
    [], // empty deps - fetch once
    { enabled: true }
  )

  // Data Fetching - vouchers (fetch when filters change)
  const { 
    data: vouchersData, 
    loading: vouchersLoading, 
    error: vouchersError,
    refetch: refreshVouchers 
  } = useFetch(
    () => feeVoucherService.list({
      month: filters.month,
      year: filters.year,
      class_id: filters.class_id || undefined,
      status: filters.status || undefined,
    }),
    [filters.month, filters.year, filters.class_id, filters.status],
    { enabled: true }
  )

  // Data Fetching - students for generate form
  const { 
    data: studentsData,
    refetch: refreshStudents 
  } = useFetch(
    () => studentService.list({ class_id: generateForm.class_id, is_active: true }),
    [generateForm.class_id],
    { enabled: !!generateForm.class_id }
  )

  // Data Fetching - sections for generate form
  const {
    data: sectionsData,
    refetch: refreshSections
  } = useFetch(
    () => classService.getSections(generateForm.class_id),
    [generateForm.class_id],
    { enabled: !!generateForm.class_id }
  )

  // Mutations with race condition prevention
  const generateMutation = useMutation(
    async (data) => {
      // Backend expects month in format "2026-02-01"
      const monthStr = `${data.year}-${String(data.month).padStart(2, '0')}-01`
      
      if (data.type === 'bulk') {
        return feeVoucherService.bulkGenerate({
          class_id: parseInt(data.class_id),
          section_id: data.section_id ? parseInt(data.section_id) : undefined,
          month: monthStr,
          fee_types: data.fee_types?.length > 0 ? data.fee_types : undefined,
        })
      } else {
        return feeVoucherService.generate({
          student_id: parseInt(data.student_id),
          month: monthStr,
          fee_types: data.fee_types?.length > 0 ? data.fee_types : undefined,
        })
      }
    },
    {
      onSuccess: () => {
        refreshVouchers()
        setGenerateForm({
          type: 'single',
          student_id: '',
          class_id: '',
          section_id: '',
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          due_date: '',
          fee_types: ['MONTHLY'],
        })
        setActiveTab('list')
      },
    }
  )

  // Edit items mutation
  const editItemsMutation = useMutation(
    async (data) => {
      return feeVoucherService.updateItems(data.voucher_id, data.items)
    },
    {
      onSuccess: () => {
        refreshVouchers()
        closeEditItemsModal()
      },
    }
  )

  const paymentMutation = useMutation(
    async (data) => {
      return feePaymentService.record({
        voucher_id: selectedVoucher.id,
        amount: parseFloat(data.amount),
        payment_date: data.payment_date || undefined,
      })
    },
    {
      onSuccess: () => {
        refreshVouchers()
        closePaymentModal()
      },
    }
  )

  const deleteMutation = useMutation(
    async (id) => {
      return feeVoucherService.delete(id)
    },
    {
      onSuccess: () => refreshVouchers(),
    }
  )

  // Helper to parse month from ISO date string
  const parseVoucherMonth = useCallback((monthStr) => {
    if (!monthStr) return { month: null, year: null }
    const date = new Date(monthStr)
    return {
      month: date.getMonth() + 1, // getMonth() is 0-indexed
      year: date.getFullYear()
    }
  }, [])

  // Memoized filtered vouchers with field mapping
  const filteredVouchers = useMemo(() => {
    // Backend returns vouchers under data key
    const vouchers = vouchersData?.data || vouchersData?.vouchers || vouchersData || []
    if (!Array.isArray(vouchers)) return []
    
    // Map backend fields to component expected fields
    const mappedVouchers = vouchers.map(v => {
      const { month, year } = parseVoucherMonth(v.month)
      return {
        id: v.voucher_id,
        voucher_no: `V-${v.voucher_id}`,
        student_id: v.student_id,
        student_name: v.student_name,
        student_roll_no: v.roll_no,
        class_id: v.class_id,
        class_name: v.class_name,
        section_id: v.section_id,
        section_name: v.section_name,
        month,
        year,
        total_amount: parseFloat(v.total_fee) || 0,
        paid_amount: parseFloat(v.paid_amount) || 0,
        due_amount: parseFloat(v.due_amount) || 0,
        status: v.status,
        created_at: v.created_at,
      }
    })

    if (!debouncedSearch) return mappedVouchers
    
    const searchLower = debouncedSearch.toLowerCase()
    return mappedVouchers.filter(v => 
      v.student_name?.toLowerCase().includes(searchLower) ||
      v.student_roll_no?.toLowerCase().includes(searchLower) ||
      v.voucher_no?.toLowerCase().includes(searchLower)
    )
  }, [vouchersData, debouncedSearch, parseVoucherMonth])

  // Handlers
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleGenerateFormChange = useCallback((key, value) => {
    setGenerateForm(prev => {
      const newForm = { ...prev, [key]: value }
      // Reset dependent fields
      if (key === 'class_id') {
        newForm.student_id = ''
        newForm.section_id = ''
      }
      if (key === 'type' && value === 'bulk') {
        newForm.student_id = ''
      }
      return newForm
    })
  }, [])

  // Toggle fee type selection
  const handleFeeTypeToggle = useCallback((feeType) => {
    setGenerateForm(prev => {
      const current = prev.fee_types || []
      const newTypes = current.includes(feeType)
        ? current.filter(t => t !== feeType)
        : [...current, feeType]
      return { ...prev, fee_types: newTypes }
    })
  }, [])

  // Open edit items modal
  const openEditItemsModal = useCallback(async (voucher) => {
    try {
      // Fetch full voucher details with items
      const response = await feeVoucherService.getById(voucher.id)
      const fullVoucher = response?.data || response
      setEditingVoucher(fullVoucher)
      setEditItems(fullVoucher.items || [])
      setShowEditItemsModal(true)
    } catch (error) {
      console.error('Failed to load voucher details:', error)
    }
  }, [])

  // Close edit items modal
  const closeEditItemsModal = useCallback(() => {
    setShowEditItemsModal(false)
    setEditingVoucher(null)
    setEditItems([])
  }, [])

  // Handle edit item change
  const handleEditItemChange = useCallback((index, field, value) => {
    setEditItems(prev => {
      const newItems = [...prev]
      newItems[index] = { ...newItems[index], [field]: field === 'amount' ? parseFloat(value) || 0 : value }
      return newItems
    })
  }, [])

  // Add new item
  const handleAddItem = useCallback(() => {
    setEditItems(prev => [...prev, { item_type: 'OTHER', amount: 0 }])
  }, [])

  // Remove item
  const handleRemoveItem = useCallback((index) => {
    setEditItems(prev => prev.filter((_, i) => i !== index))
  }, [])

  // Submit edit items
  const handleEditItemsSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!editingVoucher || editItems.length === 0) return
    await editItemsMutation.mutate({
      voucher_id: editingVoucher.voucher_id || editingVoucher.id,
      items: editItems,
    })
  }, [editingVoucher, editItems, editItemsMutation])

  const handleGenerateSubmit = useCallback(async (e) => {
    e.preventDefault()
    
    // Validation
    if (generateForm.type === 'single' && !generateForm.student_id) {
      return
    }
    if (generateForm.type === 'bulk' && !generateForm.class_id) {
      return
    }
    if (!generateForm.due_date) {
      return
    }
    if (!generateForm.fee_types || generateForm.fee_types.length === 0) {
      alert('Please select at least one fee type')
      return
    }

    await generateMutation.mutate(generateForm)
  }, [generateForm, generateMutation])

  // Handle preview bulk vouchers (NEW - Issue #3)
  const handlePreviewBulk = useCallback(async () => {
    if (generateForm.type !== 'bulk' || !generateForm.class_id) {
      alert('Please select a class for bulk preview')
      return
    }
    
    setIsPreviewLoading(true)
    try {
      const monthStr = `${generateForm.year}-${String(generateForm.month).padStart(2, '0')}-01`
      const result = await feeVoucherService.previewBulk({
        class_id: parseInt(generateForm.class_id),
        section_id: generateForm.section_id ? parseInt(generateForm.section_id) : undefined,
        month: monthStr,
        due_date: generateForm.due_date || undefined,
        fee_types: generateForm.fee_types?.length > 0 ? generateForm.fee_types : undefined,
      })
      
      setPreviewData(result?.data || result)
      setShowPreview(true)
    } catch (error) {
      console.error('Failed to preview vouchers:', error)
      alert('Failed to preview vouchers: ' + (error.message || 'Unknown error'))
    } finally {
      setIsPreviewLoading(false)
    }
  }, [generateForm])

  // Handle generate and save from preview (NEW - Issue #3)
  const handleGenerateAndSave = useCallback(async () => {
    setShowPreview(false)
    await generateMutation.mutate(generateForm)
  }, [generateForm, generateMutation])

  // Handle print without saving (NEW - Issue #3)
  const handlePrintWithoutSaving = useCallback(async () => {
    if (generateForm.type !== 'bulk' || !generateForm.class_id) {
      return
    }
    
    try {
      const monthStr = `${generateForm.year}-${String(generateForm.month).padStart(2, '0')}-01`
      const blob = await feeVoucherService.generateBulkPDF({
        class_id: parseInt(generateForm.class_id),
        section_id: generateForm.section_id ? parseInt(generateForm.section_id) : undefined,
        month: monthStr,
        due_date: generateForm.due_date || undefined,
        fee_types: generateForm.fee_types?.length > 0 ? generateForm.fee_types : undefined,
      })
      
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => window.URL.revokeObjectURL(url), 100)
      
      setShowPreview(false)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Failed to generate PDF: ' + (error.message || 'Unknown error'))
    }
  }, [generateForm])

  // Cancel preview (NEW - Issue #3)
  const handleCancelPreview = useCallback(() => {
    setShowPreview(false)
    setPreviewData(null)
  }, [])

  const openPaymentModal = useCallback((voucher) => {
    setSelectedVoucher(voucher)
    setPaymentForm({
      amount: (voucher.total_amount - (voucher.paid_amount || 0)).toString(),
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'CASH',
      reference_no: '',
    })
    setShowPaymentModal(true)
  }, [])

  const closePaymentModal = useCallback(() => {
    setShowPaymentModal(false)
    setSelectedVoucher(null)
    setPaymentForm({
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'CASH',
      reference_no: '',
    })
  }, [])

  const handlePaymentSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) return
    await paymentMutation.mutate(paymentForm)
  }, [paymentForm, paymentMutation])

  const handleDownloadPDF = useCallback(async (voucher) => {
    try {
      await feeVoucherService.downloadPDF(voucher.id)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }, [])

  // Handle print voucher (NEW - Issue #3)
  const handlePrintVoucher = useCallback((voucher) => {
    try {
      feeVoucherService.printVoucher(voucher.id)
    } catch (error) {
      console.error('Failed to print voucher:', error)
      alert('Failed to print voucher')
    }
  }, [])

  const handleDelete = useCallback(async (voucher) => {
    if (voucher.status !== VOUCHER_STATUS.UNPAID) {
      alert('Cannot delete voucher with payments')
      return
    }
    if (!confirm('Are you sure you want to delete this voucher?')) return
    await deleteMutation.mutate(voucher.id)
  }, [deleteMutation])

  // Render helpers
  const renderStatusBadge = (status) => (
    <span className={`status-badge ${STATUS_COLORS[status] || ''}`}>
      {status}
    </span>
  )

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount || 0)
  }

  const classes = classesData?.data || []
  const students = studentsData?.data || []
  const sections = sectionsData?.data || []

  return (
    <div className="page-content fee-management">
      <div className="page-header">
        <h2>Fee Voucher Management</h2>
        <div className="tab-buttons">
          <button 
            className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            Voucher List
          </button>
          <button 
            className={`tab-btn ${activeTab === 'generate' ? 'active' : ''}`}
            onClick={() => setActiveTab('generate')}
          >
            Generate Vouchers
          </button>
        </div>
      </div>

      {(vouchersError || generateMutation.error || paymentMutation.error) && (
        <div className="alert alert-error">
          {vouchersError || generateMutation.error || paymentMutation.error}
        </div>
      )}

      {activeTab === 'list' && (
        <div className="voucher-list-section">
          {/* Filters */}
          <div className="filters-section">
            <input
              type="text"
              placeholder="Search by student name, roll no, or voucher no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            
            <select
              value={filters.class_id}
              onChange={(e) => handleFilterChange('class_id', e.target.value)}
              className="filter-select"
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value={VOUCHER_STATUS.UNPAID}>Unpaid</option>
              <option value={VOUCHER_STATUS.PARTIAL}>Partial</option>
              <option value={VOUCHER_STATUS.PAID}>Paid</option>
            </select>

            <select
              value={filters.month}
              onChange={(e) => handleFilterChange('month', parseInt(e.target.value))}
              className="filter-select"
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            <input
              type="number"
              value={filters.year}
              onChange={(e) => handleFilterChange('year', parseInt(e.target.value))}
              className="filter-input year-input"
              min="2020"
              max="2030"
            />
          </div>

          {/* Vouchers Table */}
          {vouchersLoading ? (
            <div className="loading-container">
              <div className="spinner" />
              <p>Loading vouchers...</p>
            </div>
          ) : filteredVouchers.length === 0 ? (
            <div className="empty-state">
              <p>No vouchers found</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Voucher #</th>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Month/Year</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVouchers.map(voucher => (
                    <tr key={voucher.id}>
                      <td>{voucher.voucher_no}</td>
                      <td>
                        <div className="student-info">
                          <span className="student-name">{voucher.student_name}</span>
                          <span className="student-roll">{voucher.student_roll_no}</span>
                        </div>
                      </td>
                      <td>{voucher.class_name}</td>
                      <td>{voucher.month && voucher.year ? `${MONTHS.find(m => m.value === voucher.month)?.label || ''} ${voucher.year}` : '-'}</td>
                      <td>{formatCurrency(voucher.total_amount)}</td>
                      <td>{formatCurrency(voucher.paid_amount)}</td>
                      <td className="balance-cell">
                        {formatCurrency(voucher.due_amount)}
                      </td>
                      <td>{renderStatusBadge(voucher.status)}</td>
                      <td>
                        <div className="action-buttons">
                          {voucher.status !== VOUCHER_STATUS.PAID && (
                            <button 
                              className="btn-action btn-pay"
                              onClick={() => openPaymentModal(voucher)}
                              title="Record Payment"
                            >
                              💰
                            </button>
                          )}
                          <button 
                            className="btn-action btn-print"
                            onClick={() => handlePrintVoucher(voucher)}
                            title="Print Voucher"
                          >
                            🖨️
                          </button>
                          <button 
                            className="btn-action btn-download"
                            onClick={() => handleDownloadPDF(voucher)}
                            title="Download PDF"
                          >
                            📄
                          </button>
                          {voucher.status !== VOUCHER_STATUS.PAID && (
                            <button 
                              className="btn-action btn-edit"
                              onClick={() => openEditItemsModal(voucher)}
                              title="Edit Items"
                            >
                              ✏️
                            </button>
                          )}
                          {voucher.status === VOUCHER_STATUS.UNPAID && (
                            <button 
                              className="btn-action btn-delete"
                              onClick={() => handleDelete(voucher)}
                              disabled={deleteMutation.loading}
                              title="Delete Voucher"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'generate' && (
        <div className="generate-section">
          <form onSubmit={handleGenerateSubmit} className="generate-form">
            <div className="form-section">
              <h3>Generation Type</h3>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="type"
                    value="single"
                    checked={generateForm.type === 'single'}
                    onChange={(e) => handleGenerateFormChange('type', e.target.value)}
                  />
                  <span>Single Student</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="type"
                    value="bulk"
                    checked={generateForm.type === 'bulk'}
                    onChange={(e) => handleGenerateFormChange('type', e.target.value)}
                  />
                  <span>Bulk (Class/Section)</span>
                </label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Class *</label>
                <select
                  value={generateForm.class_id}
                  onChange={(e) => handleGenerateFormChange('class_id', e.target.value)}
                  required
                  disabled={classesLoading}
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              {generateForm.type === 'bulk' && (
                <div className="form-group">
                  <label>Section (Optional)</label>
                  <select
                    value={generateForm.section_id}
                    onChange={(e) => handleGenerateFormChange('section_id', e.target.value)}
                  >
                    <option value="">All Sections</option>
                    {sections.map(sec => (
                      <option key={sec.id} value={sec.id}>{sec.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {generateForm.type === 'single' && (
                <div className="form-group">
                  <label>Student *</label>
                  <select
                    value={generateForm.student_id}
                    onChange={(e) => handleGenerateFormChange('student_id', e.target.value)}
                    required
                    disabled={!generateForm.class_id}
                  >
                    <option value="">Select Student</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.roll_no})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Month *</label>
                <select
                  value={generateForm.month}
                  onChange={(e) => handleGenerateFormChange('month', parseInt(e.target.value))}
                  required
                >
                  {MONTHS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Year *</label>
                <input
                  type="number"
                  value={generateForm.year}
                  onChange={(e) => handleGenerateFormChange('year', parseInt(e.target.value))}
                  min="2020"
                  max="2030"
                  required
                />
              </div>

              <div className="form-group">
                <label>Due Date *</label>
                <input
                  type="date"
                  value={generateForm.due_date}
                  onChange={(e) => handleGenerateFormChange('due_date', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Fee Types Selection */}
            <div className="form-section">
              <h3>Fee Types to Include *</h3>
              <p className="form-hint">Select which fees to include in the voucher. Admission fee is typically only charged once.</p>
              <div className="checkbox-group">
                {FEE_TYPES.map(feeType => (
                  <label key={feeType.value} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={generateForm.fee_types?.includes(feeType.value) || false}
                      onChange={() => handleFeeTypeToggle(feeType.value)}
                    />
                    <span className="checkbox-text">
                      <strong>{feeType.label}</strong>
                      <small>{feeType.description}</small>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              {generateForm.type === 'bulk' && (
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={handlePreviewBulk}
                  disabled={isPreviewLoading || !generateForm.class_id || !generateForm.fee_types?.length}
                >
                  {isPreviewLoading ? 'Loading Preview...' : '👁️ Preview Vouchers'}
                </button>
              )}
              <button 
                type="submit" 
                className="btn-primary"
                disabled={generateMutation.loading || !generateForm.fee_types?.length}
              >
                {generateMutation.loading ? 'Generating...' : 
                  generateForm.type === 'bulk' ? 'Generate & Save to Database' : 'Generate Voucher'}
              </button>
            </div>
          </form>

          {/* Preview Section (NEW - Issue #3) */}
          {showPreview && previewData && (
            <div className="preview-section" style={{
              marginTop: '2rem',
              padding: '1.5rem',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '2px solid #3b82f6'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>📋 Voucher Preview</h3>
                <button 
                  onClick={handleCancelPreview}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    fontSize: '24px', 
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ 
                backgroundColor: '#eff6ff', 
                padding: '1rem', 
                borderRadius: '6px', 
                marginBottom: '1rem',
                border: '1px solid #bfdbfe'
              }}>
                <p style={{ margin: '0.25rem 0', fontSize: '14px' }}>
                  <strong>Total Vouchers:</strong> {previewData.summary?.total_students || 0}
                </p>
                <p style={{ margin: '0.25rem 0', fontSize: '14px' }}>
                  <strong>Total Amount:</strong> Rs. {(previewData.summary?.total_amount || 0).toLocaleString()}
                </p>
                {previewData.summary?.students_with_custom_fees > 0 && (
                  <p style={{ margin: '0.25rem 0', fontSize: '14px', color: '#059669' }}>
                    ℹ️ <strong>{previewData.summary.students_with_custom_fees}</strong> student(s) with custom fees
                  </p>
                )}
              </div>

              <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1rem' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Roll No</th>
                      <th>Fee Items</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(previewData.vouchers || []).map((voucher, index) => (
                      <tr key={index}>
                        <td>
                          {voucher.student_name}
                          {voucher.has_custom_fees && (
                            <span style={{ 
                              marginLeft: '0.5rem', 
                              fontSize: '12px', 
                              color: '#059669',
                              fontWeight: 'bold'
                            }}>
                              *
                            </span>
                          )}
                        </td>
                        <td>{voucher.roll_no}</td>
                        <td>
                          {(voucher.items || []).map((item, idx) => (
                            <div key={idx} style={{ fontSize: '12px' }}>
                              {item.item_type}: Rs. {item.amount}
                            </div>
                          ))}
                        </td>
                        <td><strong>Rs. {voucher.total_amount.toLocaleString()}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {previewData.summary?.students_with_custom_fees > 0 && (
                <p style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', marginBottom: '1rem' }}>
                  * Students with custom fees (different from class defaults)
                </p>
              )}

              <div className="form-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  onClick={handleCancelPreview}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handlePrintWithoutSaving}
                  className="btn-secondary"
                >
                  🖨️ Print Without Saving
                </button>
                <button 
                  type="button"
                  onClick={handleGenerateAndSave}
                  className="btn-primary"
                  disabled={generateMutation.loading}
                >
                  {generateMutation.loading ? 'Saving...' : '💾 Generate & Save to Database'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedVoucher && (
        <div className="modal-overlay" onClick={closePaymentModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Payment</h3>
              <button className="modal-close" onClick={closePaymentModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="voucher-summary">
                <p><strong>Student:</strong> {selectedVoucher.student_name}</p>
                <p><strong>Voucher:</strong> {selectedVoucher.voucher_no}</p>
                <p><strong>Total:</strong> {formatCurrency(selectedVoucher.total_amount)}</p>
                <p><strong>Paid:</strong> {formatCurrency(selectedVoucher.paid_amount)}</p>
                <p><strong>Balance:</strong> {formatCurrency(selectedVoucher.due_amount)}</p>
              </div>

              <form onSubmit={handlePaymentSubmit}>
                <div className="form-group">
                  <label>Amount *</label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    min="1"
                    max={selectedVoucher.due_amount}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Payment Date *</label>
                  <input
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_method: e.target.value }))}
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="ONLINE">Online Payment</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Reference No</label>
                  <input
                    type="text"
                    value={paymentForm.reference_no}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, reference_no: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={closePaymentModal}>
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={paymentMutation.loading}
                  >
                    {paymentMutation.loading ? 'Processing...' : 'Record Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Items Modal */}
      {showEditItemsModal && editingVoucher && (
        <div className="modal-overlay" onClick={closeEditItemsModal}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Voucher Items</h3>
              <button className="modal-close" onClick={closeEditItemsModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="voucher-info">
                <p><strong>Student:</strong> {editingVoucher.student_name}</p>
                <p><strong>Class:</strong> {editingVoucher.class_name} {editingVoucher.section_name && `- ${editingVoucher.section_name}`}</p>
              </div>

              {editItemsMutation.error && (
                <div className="alert alert-error">{editItemsMutation.error}</div>
              )}

              <form onSubmit={handleEditItemsSubmit}>
                <div className="items-list">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Fee Type</th>
                        <th>Amount</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editItems.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <select
                              value={item.item_type}
                              onChange={(e) => handleEditItemChange(index, 'item_type', e.target.value)}
                            >
                              {FEE_TYPES.map(ft => (
                                <option key={ft.value} value={ft.value}>{ft.label}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              value={item.amount}
                              onChange={(e) => handleEditItemChange(index, 'amount', e.target.value)}
                              min="0"
                              step="100"
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn-action btn-delete"
                              onClick={() => handleRemoveItem(index)}
                              title="Remove Item"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3">
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={handleAddItem}
                          >
                            + Add Item
                          </button>
                        </td>
                      </tr>
                      <tr className="total-row">
                        <td><strong>Total</strong></td>
                        <td colSpan="2">
                          <strong>{formatCurrency(editItems.reduce((sum, item) => sum + (item.amount || 0), 0))}</strong>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={closeEditItemsModal}>
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={editItemsMutation.loading || editItems.length === 0}
                  >
                    {editItemsMutation.loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FeeVoucherManagement
