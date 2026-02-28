import { useState, useCallback, useMemo } from 'react'
import { discountService } from '../services/feeService'
import { studentService } from '../services/studentService'
import { classService } from '../services/classService'
import { useFetch, useMutation } from '../hooks/useApi'
import { sortClassesBySequence } from '../utils/classSorting'
import '../fee.css'

const DISCOUNT_TYPES = {
  PERCENTAGE: 'PERCENTAGE',
  FLAT: 'FLAT',
}

const DiscountManagement = () => {
  const [activeTab, setActiveTab] = useState('list')
  const [showModal, setShowModal] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

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
      if (editingDiscount) {
        return discountService.update(editingDiscount.id, data)
      } else {
        return discountService.create(data)
      }
    },
    {
      onSuccess: () => {
        refreshDiscounts()
        closeModal()
      },
    }
  )

  // Delete mutation
  const deleteMutation = useMutation(
    async (id) => discountService.delete(id),
    {
      onSuccess: () => refreshDiscounts(),
    }
  )

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
      })
    } else {
      setEditingDiscount(null)
      setFormData({
        student_id: '',
        class_id: '',
        discount_type: DISCOUNT_TYPES.PERCENTAGE,
        discount_value: '',
        reason: '',
        effective_from: new Date().toISOString().split('T')[0],
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
    
    const data = {
      ...formData,
      student_id: parseInt(formData.student_id),
      class_id: parseInt(formData.class_id),
      discount_value: parseFloat(formData.discount_value),
    }

    // Validation
    if (data.discount_type === DISCOUNT_TYPES.PERCENTAGE && data.discount_value > 100) {
      alert('Percentage discount cannot exceed 100%')
      return
    }

    if (data.discount_value <= 0) {
      alert('Discount value must be positive')
      return
    }

    saveMutation.mutate(data)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this discount? This will NOT affect existing vouchers.')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="fee-management">
      <div className="fee-header">
        <h1>💳 Discount Management</h1>
        <button onClick={() => openModal()} className="btn-primary">
          + Create Discount
        </button>
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

        <div className="filter-group">
          <label>Search Student</label>
          <input
            type="text"
            placeholder="Search by student name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
                <th>Reason</th>
                <th>Effective From</th>
                <th>Applied By</th>
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
                    <td>{discount.student_name}</td>
                    <td>{discount.class_name}</td>
                    <td>
                      <span className={`badge badge-${discount.discount_type.toLowerCase()}`}>
                        {discount.discount_type}
                      </span>
                    </td>
                    <td>
                      {discount.discount_type === 'PERCENTAGE' 
                        ? `${discount.discount_value}%` 
                        : `Rs. ${discount.discount_value.toLocaleString()}`}
                    </td>
                    <td>{discount.reason || '-'}</td>
                    <td>{new Date(discount.effective_from).toLocaleDateString()}</td>
                    <td>{discount.applied_by_name || '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={() => openModal(discount)}
                          className="btn-edit"
                          title="Edit Discount"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDelete(discount.id)}
                          className="btn-delete"
                          title="Delete Discount"
                        >
                          🗑️
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
                <div className="form-group">
                  <label>Class *</label>
                  <select
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value, student_id: '' })}
                    required
                  >
                    <option value="">Select Class</option>
                    {sortedClasses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Student *</label>
                  <select
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    required
                    disabled={!formData.class_id}
                  >
                    <option value="">Select Student</option>
                    {(studentsData?.data || []).map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.roll_no})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
                <label>Effective From *</label>
                <input
                  type="date"
                  value={formData.effective_from}
                  onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                  required
                />
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
