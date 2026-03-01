import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { discountService } from '../services/feeService'
import { studentService } from '../services/studentService'
import { classService } from '../services/classService'
import { useFetch, useMutation } from '../hooks/useApi'
import { sortClassesBySequence } from '../utils/classSorting'
import '../fee.css'
import './StudentFeeHistory.css'

const DISCOUNT_TYPES = {
  PERCENTAGE: 'PERCENTAGE',
  FLAT: 'FLAT',
}

const DiscountManagement = () => {
  const [activeTab, setActiveTab] = useState('list')
  const [showModal, setShowModal] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState(null)
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

  // Filter State
  const [filters, setFilters] = useState({
    class_id: '',
    student_id: '',
    discount_type: '',
  })

  // Form State
  const [formData, setFormData] = useState({
    student_id: '',
    class_id: '',
    discount_type: DISCOUNT_TYPES.PERCENTAGE,
    discount_value: '',
    reason: '',
    effective_from: new Date().toISOString().split('T')[0],
    is_permanent: true,
    for_month: '',
    is_fee_free: false,
  })

  // Fetch discounts
  const { 
    data: discountsData, 
    loading: discountsLoading,
    refetch: refreshDiscounts 
  } = useFetch(
    () => discountService.list(filters),
    [filters.class_id, filters.student_id, filters.discount_type],
    { enabled: true }
  )

  // Fetch classes
  const { data: classesData } = useFetch(
    () => classService.list(),
    [],
    { enabled: true }
  )

  // Sort classes using centralized sorting
  const sortedClasses = useMemo(
    () => sortClassesBySequence(classesData?.data || []),
    [classesData]
  )

  // Fetch students for selected class
  const { data: studentsData } = useFetch(
    () => studentService.list({ 
      class_id: formData.class_id, 
      is_active: true 
    }),
    [formData.class_id],
    { enabled: !!formData.class_id }
  )

  // Create/Update mutation
  const saveMutation = useMutation(
    async (data) => {
      console.log('Submitting discount data:', data)
      try {
        if (editingDiscount) {
          const result = await discountService.update(editingDiscount.id, data)
          console.log('Discount update result:', result)
          return result
        } else {
          const result = await discountService.create(data)
          console.log('Discount create result:', result)
          return result
        }
      } catch (error) {
        console.error('Discount mutation error:', error)
        throw error
      }
    },
    {
      onSuccess: (result) => {
        console.log('Discount mutation successful:', result)
        refreshDiscounts()
        closeModal()
        
        // Show success message
        if (formData.is_fee_free) {
          alert('✅ Student marked as fee-free successfully! No vouchers will be generated for this student.')
        } else {
          alert('✅ Discount applied successfully!')
        }
      },
      onError: (error) => {
        console.error('Discount mutation failed:', error)
        alert(`❌ Failed to apply discount: ${error.message || error}`)
      }
    }
  )

  // Delete mutation
  const deleteMutation = useMutation(
    async (id) => discountService.delete(id),
    {
      onSuccess: () => refreshDiscounts(),
    }
  )

  // Print function (popup approach like Expense Report)
  const handlePrint = () => {
    const printedOn = new Date().toLocaleDateString('en-GB');
    const discounts = filteredDiscounts;
    
    const rows = discounts.map((d, index) => {
      const bg = index % 2 === 0 ? '#ffffff' : '#f0f4ff';
      const value = d.discount_type === 'PERCENTAGE' 
        ? `${d.discount_value}%` 
        : `Rs. ${d.discount_value?.toLocaleString()}`;
      return `<tr style="background:${bg};-webkit-print-color-adjust:exact;print-color-adjust:exact;">
        <td style="text-align:center;">${index + 1}</td>
        <td><strong>${d.student_name}</strong></td>
        <td>${d.class_name}</td>
        <td style="text-align:center;">${d.discount_type}</td>
        <td style="text-align:right;">${value}</td>
        <td>${d.reason || '-'}</td>
        <td style="text-align:center;">${new Date(d.effective_from).toLocaleDateString('en-GB')}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Discount Report</title>
  <style>
    @page { size: A4 portrait; margin: 1.2cm 0.8cm; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #000; background: #fff; }
    .school-name { text-align:center; font-size:11pt; font-weight:800; text-transform:uppercase; letter-spacing:.06em; margin-bottom:.15rem; }
    .report-title { text-align:center; font-size:14pt; font-weight:700; color:#1e3a8a; text-transform:uppercase; letter-spacing:.05em; margin-bottom:.4rem; }
    .divider { border:none; border-top:2.5px solid #1e3a8a; margin-bottom:0; }
    .meta-bar { display:flex; flex-wrap:wrap; gap:.5rem 1.5rem; align-items:center; font-size:8pt; padding:.3rem .6rem; background:#e8edf8; border:1px solid #b5c3e8; border-top:none; margin-bottom:.5rem; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .meta-bar strong { color:#1e3a8a; }
    table { width:100%; border-collapse:collapse; table-layout:fixed; }
    col.sno { width:7%; }
    col.student { width:22%; }
    col.class { width:12%; }
    col.type { width:12%; }
    col.value { width:12%; }
    col.reason { width:20%; }
    col.date { width:15%; }
    th { background:#1e3a8a; color:#fff; font-size:7pt; font-weight:700; text-transform:uppercase; letter-spacing:.03em; padding:.25rem .4rem; border:1px solid #1e3a8a; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    td { padding:.2rem .4rem; border:.5px solid #c0c0c0; font-size:8.5pt; vertical-align:middle; line-height:1.2; }
    thead { display:table-header-group; }
    tr { page-break-inside:avoid; }
  </style>
</head>
<body>
  <div class="school-name">Muslim Public Higher Secondary School Lar</div>
  <div class="report-title">Discount Report</div>
  <hr class="divider"/>
  <div class="meta-bar">
    <span><strong>Total Discounts:</strong> ${discounts.length}</span>
    <span><strong>Printed On:</strong> ${printedOn}</span>
  </div>
  <table>
    <colgroup>
      <col class="sno"/><col class="student"/><col class="class"/>
      <col class="type"/><col class="value"/><col class="reason"/><col class="date"/>
    </colgroup>
    <thead>
      <tr>
        <th style="text-align:center;">S.No</th>
        <th>Student</th>
        <th>Class</th>
        <th style="text-align:center;">Type</th>
        <th style="text-align:right;">Value</th>
        <th>Reason</th>
        <th style="text-align:center;">Effective From</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

    const popup = window.open('', '_blank', 'width=900,height=700');
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    setTimeout(() => { popup.print(); popup.close(); }, 400);
  }

  // Handle selecting a student from search results
  const handleSelectStudent = (student) => {
    // Extract class and section info
    const className = student.current_enrollment?.class_name || 
                      student.current_class_name || 
                      student.current_class?.name || 
                      student.class_name || 
                      'Not Enrolled'
    const classId = student.current_enrollment?.class_id || 
                    student.current_class_id || 
                    student.current_class?.id || 
                    student.class_id || 
                    ''
    const fatherName = student.father_name || 
                       student.guardians?.find(g => g.relation === 'Father')?.name || 
                       'N/A'
    
    setSelectedStudent({
      ...student,
      class_name: className,
      father_name: fatherName
    })
    
    // Pre-fill the form with selected student
    setFormData({
      ...formData,
      student_id: student.id.toString(),
      class_id: classId.toString()
    })
    
    setSearchTerm('')
    setShowResults(false)
  }

  // Clear selection
  const handleClearSelection = () => {
    setSelectedStudent(null)
    setFormData({
      ...formData,
      student_id: '',
      class_id: ''
    })
    setSearchTerm('')
  }

  // Filtered discounts
  const filteredDiscounts = useMemo(() => {
    const discounts = discountsData?.data || discountsData?.discounts || []
    if (!searchTerm) return discounts
    
    const searchLower = searchTerm.toLowerCase()
    return discounts.filter(d => 
      d.student_name?.toLowerCase().includes(searchLower) ||
      d.class_name?.toLowerCase().includes(searchLower)
    )
  }, [discountsData, searchTerm])

  // Handlers
  const openModal = (discount = null) => {
    if (discount) {
      setEditingDiscount(discount)
      setFormData({
        student_id: discount.student_id,
        class_id: discount.class_id,
        discount_type: discount.discount_type,
        discount_value: discount.discount_value,
        reason: discount.reason || '',
        effective_from: discount.effective_from?.split('T')[0] || new Date().toISOString().split('T')[0],
        is_permanent: true,
        for_month: '',
        is_fee_free: false,
      })
    } else {
      setEditingDiscount(null)
      setFormData({
        student_id: selectedStudent?.id || '',
        class_id: selectedStudent?.current_enrollment?.class_id || '',
        discount_type: DISCOUNT_TYPES.PERCENTAGE,
        discount_value: '',
        reason: '',
        effective_from: new Date().toISOString().split('T')[0],
        is_permanent: true,
        for_month: '',
        is_fee_free: false,
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingDiscount(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    console.log('Form submission started')
    console.log('Selected student:', selectedStudent)
    console.log('Form data:', formData)
    
    // Validate student selection
    if (!selectedStudent || !formData.student_id) {
      alert('Please select a student first')
      return
    }
    
    // Validate class selection
    if (!formData.class_id) {
      alert('Please select a class')
      return
    }
    
    const data = {
      ...formData,
      student_id: parseInt(formData.student_id),
      class_id: parseInt(formData.class_id),
      discount_value: parseFloat(formData.discount_value) || 0,
      is_permanent: formData.is_permanent,
      for_month: formData.for_month || null,
      is_fee_free: formData.is_fee_free,
    }
    
    console.log('Processed data for submission:', data)

    // If fee-free is checked, only send that
    if (data.is_fee_free) {
      console.log('Marking student as fee-free')
      const freeStudentData = {
        student_id: data.student_id,
        class_id: data.class_id,
        is_fee_free: true,
        discount_type: 'PERCENTAGE',  // Required by backend schema
        discount_value: 0,  // Required but not used
        reason: 'Student marked fee-free'
      }
      console.log('Fee-free data:', freeStudentData)
      saveMutation.mutate(freeStudentData)
      return
    }

    // Validation for discount values
    if (data.discount_type === DISCOUNT_TYPES.PERCENTAGE && data.discount_value > 100) {
      alert('Percentage discount cannot exceed 100%')
      return
    }

    if (data.discount_value <= 0 && !data.is_fee_free) {
      alert('Discount value must be positive')
      return
    }
    
    if (!data.reason && !data.is_fee_free) {
      alert('Please provide a reason for the discount')
      return
    }

    console.log('Submitting discount data:', data)
    saveMutation.mutate(data)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to REMOVE this permanent discount?\n\nThis will remove the discount from future vouchers, but will NOT affect existing vouchers that were already generated.')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="fee-management">
      <div className="fee-header">
        <h1>💳 Discount Management</h1>
        <div className="header-actions">
          <button
            onClick={handlePrint}
            className="btn-secondary"
            disabled={filteredDiscounts.length === 0}
          >
            🖨️ Print Report
          </button>
          <button onClick={() => openModal()} className="btn-primary">
            + Create Discount
          </button>
        </div>
      </div>

      {/* Student Search Section */}
      <div className="student-search-section">
        <div className="search-container" ref={searchRef}>
          <div className="search-header">
            <h3>🔍 Search Student</h3>
            <p>Find a student to create or manage discounts</p>
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
                            Select Student →
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

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Filter by Class</label>
          <select 
            value={filters.class_id} 
            onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}
          >
            <option value="">All Classes</option>
            {sortedClasses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Discount Type</label>
          <select 
            value={filters.discount_type} 
            onChange={(e) => setFilters({ ...filters, discount_type: e.target.value })}
          >
            <option value="">All Types</option>
            <option value="PERCENTAGE">Percentage</option>
            <option value="FLAT">Flat Amount</option>
          </select>
        </div>
      </div>

      {/* Discounts List */}
      <div className="table-container">
        {discountsLoading ? (
          <div className="loading">Loading discounts...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Type</th>
                <th>Value</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Effective From</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDiscounts.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                    No discounts found
                  </td>
                </tr>
              ) : (
                filteredDiscounts.map(discount => (
                  <tr key={discount.id}>
                    <td>
                      <strong>{discount.student_name}</strong>
                      {discount.roll_no && (
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Roll: {discount.roll_no}</div>
                      )}
                    </td>
                    <td>{discount.class_name}</td>
                    <td>
                      <span className={`badge badge-${discount.discount_type.toLowerCase()}`}>
                        {discount.discount_type}
                      </span>
                    </td>
                    <td>
                      <strong>
                        {discount.discount_type === 'PERCENTAGE' 
                          ? `${discount.discount_value}%` 
                          : `Rs. ${discount.discount_value.toLocaleString()}`}
                      </strong>
                    </td>
                    <td>
                      <span style={{ 
                        background: '#dcfce7', 
                        color: '#166534', 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        fontSize: '12px', 
                        fontWeight: '600' 
                      }}>
                        ♾️ Permanent
                      </span>
                    </td>
                    <td>{discount.reason || '-'}</td>
                    <td>{new Date(discount.created_at || discount.effective_from).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleDelete(discount.id)}
                          className="btn-delete"
                          title="Remove Permanent Discount"
                          style={{ 
                            background: '#dc2626',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          ❌ Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingDiscount ? 'Edit Discount' : 'Create Discount'}</h2>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                {/* Show Selected Student Info */}
                {selectedStudent ? (
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Selected Student</label>
                    <div className="selected-student-display" style={{ 
                      padding: '12px 16px', 
                      background: '#f8fafc', 
                      border: '2px solid #e2e8f0', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div className="student-avatar-small" style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: '600',
                        fontSize: '16px'
                      }}>
                        {selectedStudent.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="student-info" style={{ flex: 1 }}>
                        <div className="student-name" style={{ fontWeight: '600', color: '#1e293b', fontSize: '16px' }}>
                          {selectedStudent.name}
                        </div>
                        <div className="student-details" style={{ fontSize: '13px', color: '#64748b' }}>
                          {selectedStudent.class_name} • Father: {selectedStudent.father_name}
                        </div>
                      </div>
                      <button 
                        type="button"
                        className="btn-change-student"
                        onClick={handleClearSelection}
                        style={{
                          background: '#f59e0b',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Student *</label>
                    <div className="no-student-selected" style={{ 
                      padding: '20px', 
                      textAlign: 'center', 
                      backgroundColor: '#fef3c7', 
                      border: '2px dashed #f59e0b', 
                      borderRadius: '8px',
                      color: '#92400e'
                    }}>
                      <p>⚠️ Please search and select a student above before creating a discount</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Fee-Free Checkbox */}
              <div className="form-row" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #e2e8f0' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '16px', background: '#fef2f2', border: '2px solid #fca5a5', borderRadius: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_fee_free}
                      onChange={(e) => setFormData({ ...formData, is_fee_free: e.target.checked, discount_value: e.target.checked ? 0 : formData.discount_value })}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: '600', fontSize: '15px', color: '#991b1b' }}>
                      ⭐ Mark Student as Fee-Free (No vouchers will be generated)
                    </span>
                  </label>
                  <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px', paddingLeft: '4px' }}>
                    When enabled, this student will not receive any fee vouchers. This overrides all discount settings.
                  </p>
                </div>
              </div>

              {/* Discount Type Selection - Only show if not fee-free */}
              {!formData.is_fee_free && (
                <>
                  <div className="form-row" style={{ marginTop: '16px' }}>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontWeight: '600', marginBottom: '12px', display: 'block' }}>Discount Application Type *</label>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, padding: '14px', border: `2px solid ${formData.is_permanent ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '10px', background: formData.is_permanent ? '#eff6ff' : '#ffffff', transition: 'all 0.2s' }}>
                          <input
                            type="radio"
                            name="discount_duration"
                            checked={formData.is_permanent === true}
                            onChange={() => setFormData({ ...formData, is_permanent: true, for_month: '' })}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <div>
                            <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>🔄 Permanent Discount</div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Applies to all future vouchers</div>
                          </div>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, padding: '14px', border: `2px solid ${formData.is_permanent === false ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '10px', background: formData.is_permanent === false ? '#eff6ff' : '#ffffff', transition: 'all 0.2s' }}>
                          <input
                            type="radio"
                            name="discount_duration"
                            checked={formData.is_permanent === false}
                            onChange={() => setFormData({ ...formData, is_permanent: false })}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <div>
                            <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>📅 One-Time Discount</div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>For a specific month only</div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Month Picker - Only for one-time discounts */}
                  {!formData.is_permanent && (
                    <div className="form-row">
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label>For Month *</label>
                        <input
                          type="month"
                          value={formData.for_month}
                          onChange={(e) => setFormData({ ...formData, for_month: e.target.value })}
                          required={!formData.is_permanent}
                          style={{ padding: '12px', fontSize: '14px' }}
                        />
                        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
                          This discount will only apply to the voucher for the selected month
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Discount Fields */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Discount Type *</label>
                      <select
                        value={formData.discount_type}
                        onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                        required
                      >
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FLAT">Flat Amount (Rs.)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>
                        Discount Value * 
                        {formData.discount_type === 'PERCENTAGE' && ' (0-100)'}
                      </label>
                      <input
                        type="number"
                        step={formData.discount_type === 'PERCENTAGE' ? '0.01' : '1'}
                        min="0"
                        max={formData.discount_type === 'PERCENTAGE' ? '100' : undefined}
                        value={formData.discount_value}
                        onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Reason for Discount</label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      rows="3"
                      placeholder="e.g., Financial hardship, Sibling discount, Merit scholarship..."
                    />
                  </div>
                </>
              )}

              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={saveMutation.loading}
                >
                  {saveMutation.loading ? 'Saving...' : (editingDiscount ? 'Update' : 'Create')}
                </button>
              </div>

              {saveMutation.error && (
                <div className="error-message">
                  {saveMutation.error.message}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DiscountManagement
