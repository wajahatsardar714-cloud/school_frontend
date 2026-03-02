import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { classService } from '../services/classService'

const FeeStructureManagement = () => {
  const { classId } = useParams()
  const navigate = useNavigate()
  const [classInfo, setClassInfo] = useState(null)
  const [feeHistory, setFeeHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingFee, setEditingFee] = useState(null)
  const [deletingFeeId, setDeletingFeeId] = useState(null)
  
  const [formData, setFormData] = useState({
    effective_from: new Date().toISOString().split('T')[0],
    admission_fee: '',
    monthly_fee: '',
    paper_fund: '',
    promotion_fee: ''
  })

  useEffect(() => {
    loadData()
  }, [classId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [classRes, historyRes] = await Promise.all([
        classService.getById(classId),
        classService.getFeeHistory(classId)
      ])
      setClassInfo(classRes.data)
      setFeeHistory(historyRes.data || [])
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      await classService.updateFeeStructure(classId, formData)
      setSuccess(true)
      await loadData()
      setFormData({
        effective_from: new Date().toISOString().split('T')[0],
        admission_fee: '',
        monthly_fee: '',
        paper_fund: '',
        promotion_fee: ''
      })
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update fee structure')
    } finally {
      setSubmitting(false)
    }
  }

  const calculateTotal = () => {
    const admission = parseFloat(formData.admission_fee) || 0
    const monthly = parseFloat(formData.monthly_fee) || 0
    const paper = parseFloat(formData.paper_fund) || 0
    const promotion = parseFloat(formData.promotion_fee) || 0
    return admission + monthly + paper + promotion
  }

  const handleEditFee = (fee) => {
    setEditingFee({
      ...fee,
      effective_from: new Date(fee.effective_from).toISOString().split('T')[0]
    })
  }

  const handleCancelEdit = () => {
    setEditingFee(null)
  }

  const handleSaveEdit = async () => {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    
    try {
      await classService.updateSingleFeeStructure(classId, editingFee.id, {
        effective_from: editingFee.effective_from,
        admission_fee: editingFee.admission_fee,
        monthly_fee: editingFee.monthly_fee,
        paper_fund: editingFee.paper_fund,
        promotion_fee: editingFee.promotion_fee
      })
      setSuccess(true)
      setEditingFee(null)
      await loadData()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update fee structure')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteFee = async (feeId) => {
    if (!window.confirm('Are you sure you want to delete this fee structure? This action cannot be undone.')) {
      return
    }
    
    setDeletingFeeId(feeId)
    setError(null)
    
    try {
      await classService.deleteFeeStructure(classId, feeId)
      setSuccess(true)
      await loadData()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message || 'Failed to delete fee structure')
    } finally {
      setDeletingFeeId(null)
    }
  }

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading fee structure...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="breadcrumb-nav">
        <Link to="/classes">Classes</Link>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">{classInfo?.name} Fee Structure</span>
      </div>

      <div className="page-header">
        <div>
          <h2>Fee Structure: {classInfo?.name}</h2>
          <p className="text-muted">Define admission, monthly, paper fund, and promotion fees</p>
        </div>
        <button onClick={() => navigate('/classes')} className="btn-secondary">
          ← Back to Classes
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">✅ Fee structure updated successfully!</div>}

      <div className="two-column-layout">
        <div className="form-column">
          <div className="card">
            <h3>Add/Update Fee Structure</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Effective From Date *</label>
                <input
                  type="date"
                  value={formData.effective_from}
                  onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                  disabled={submitting}
                  required
                />
                <small>New fees will apply from this date forward</small>
              </div>

              <div className="form-group">
                <label>Admission Fee (Rs.) *</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={formData.admission_fee}
                  onChange={(e) => setFormData({ ...formData, admission_fee: Math.floor(parseFloat(e.target.value) || 0).toString() })}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="form-group">
                <label>Monthly Fee (Rs.) *</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={formData.monthly_fee}
                  onChange={(e) => setFormData({ ...formData, monthly_fee: Math.floor(parseFloat(e.target.value) || 0).toString() })}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="form-group">
                <label>Paper Fund (Rs.) *</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={formData.paper_fund}
                  onChange={(e) => setFormData({ ...formData, paper_fund: Math.floor(parseFloat(e.target.value) || 0).toString() })}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="form-group">
                <label>Promotion Fee (Rs.) *</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={formData.promotion_fee}
                  onChange={(e) => setFormData({ ...formData, promotion_fee: Math.floor(parseFloat(e.target.value) || 0).toString() })}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="fee-total">
                <strong>Total Fee:</strong>
                <span className="total-amount">Rs. {Math.floor(calculateTotal()).toLocaleString()}</span>
              </div>

              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Fee Structure'}
              </button>
            </form>
          </div>
        </div>

        <div className="history-column">
          <div className="card">
            <h3>Fee History</h3>
            {feeHistory.length === 0 ? (
              <p className="text-muted">No fee history available</p>
            ) : (
              <div className="fee-history-list">
                {feeHistory.map((fee, index) => (
                  <div key={fee.id} className="fee-history-item">
                    {editingFee && editingFee.id === fee.id ? (
                      // Edit Mode
                      <>
                        <div className="fee-history-date">
                          <strong>Edit Fee Structure</strong>
                        </div>
                        <div className="fee-edit-form">
                          <div className="form-group compact">
                            <label>Effective From:</label>
                            <input
                              type="date"
                              value={editingFee.effective_from}
                              onChange={(e) => setEditingFee({ ...editingFee, effective_from: e.target.value })}
                            />
                          </div>
                          <div className="form-group compact">
                            <label>Admission Fee:</label>
                            <input
                              type="number"
                              min="0"
                              value={editingFee.admission_fee}
                              onChange={(e) => setEditingFee({ ...editingFee, admission_fee: Math.floor(parseFloat(e.target.value) || 0) })}
                            />
                          </div>
                          <div className="form-group compact">
                            <label>Monthly Fee:</label>
                            <input
                              type="number"
                              min="0"
                              value={editingFee.monthly_fee}
                              onChange={(e) => setEditingFee({ ...editingFee, monthly_fee: Math.floor(parseFloat(e.target.value) || 0) })}
                            />
                          </div>
                          <div className="form-group compact">
                            <label>Paper Fund:</label>
                            <input
                              type="number"
                              min="0"
                              value={editingFee.paper_fund}
                              onChange={(e) => setEditingFee({ ...editingFee, paper_fund: Math.floor(parseFloat(e.target.value) || 0) })}
                            />
                          </div>
                          <div className="form-group compact">
                            <label>Promotion Fee:</label>
                            <input
                              type="number"
                              min="0"
                              value={editingFee.promotion_fee || 0}
                              onChange={(e) => setEditingFee({ ...editingFee, promotion_fee: Math.floor(parseFloat(e.target.value) || 0) })}
                            />
                          </div>
                          <div className="fee-edit-actions">
                            <button 
                              className="btn-primary btn-sm" 
                              onClick={handleSaveEdit}
                              disabled={submitting}
                            >
                              {submitting ? 'Saving...' : 'Save'}
                            </button>
                            <button 
                              className="btn-secondary btn-sm" 
                              onClick={handleCancelEdit}
                              disabled={submitting}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      // View Mode
                      <>
                        <div className="fee-history-date">
                          <strong>Effective: {new Date(fee.effective_from).toLocaleDateString()}</strong>
                          {index === 0 && <span className="badge badge-success">Current</span>}
                        </div>
                        <div className="fee-history-details">
                          <div className="fee-row">
                            <span>Admission Fee:</span>
                            <span>Rs. {Math.floor(parseFloat(fee.admission_fee) || 0).toLocaleString()}</span>
                          </div>
                          <div className="fee-row">
                            <span>Monthly Fee:</span>
                            <span>Rs. {Math.floor(parseFloat(fee.monthly_fee) || 0).toLocaleString()}</span>
                          </div>
                          <div className="fee-row">
                            <span>Paper Fund:</span>
                            <span>Rs. {Math.floor(parseFloat(fee.paper_fund) || 0).toLocaleString()}</span>
                          </div>
                          <div className="fee-row">
                            <span>Promotion Fee:</span>
                            <span>Rs. {Math.floor(parseFloat(fee.promotion_fee || 0)).toLocaleString()}</span>
                          </div>
                          <div className="fee-row fee-total-row">
                            <strong>Total:</strong>
                            <strong>Rs. {Math.floor(parseFloat(fee.admission_fee) + parseFloat(fee.monthly_fee) + parseFloat(fee.paper_fund) + parseFloat(fee.promotion_fee || 0)).toLocaleString()}</strong>
                          </div>
                        </div>
                        <div className="fee-history-actions">
                          <button 
                            className="btn-edit btn-sm" 
                            onClick={() => handleEditFee(fee)}
                            disabled={submitting || deletingFeeId === fee.id}
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            className="btn-delete btn-sm" 
                            onClick={() => handleDeleteFee(fee.id)}
                            disabled={submitting || deletingFeeId === fee.id}
                          >
                            {deletingFeeId === fee.id ? 'Deleting...' : '🗑️ Delete'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeeStructureManagement
