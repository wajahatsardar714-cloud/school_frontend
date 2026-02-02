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
  
  const [formData, setFormData] = useState({
    effective_from: new Date().toISOString().split('T')[0],
    admission_fee: '',
    monthly_fee: '',
    paper_fund: ''
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
        paper_fund: ''
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
    return admission + monthly + paper
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
          <p className="text-muted">Define admission, monthly, and paper fund fees</p>
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
                  step="0.01"
                  placeholder="0.00"
                  value={formData.admission_fee}
                  onChange={(e) => setFormData({ ...formData, admission_fee: e.target.value })}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="form-group">
                <label>Monthly Fee (Rs.) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.monthly_fee}
                  onChange={(e) => setFormData({ ...formData, monthly_fee: e.target.value })}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="form-group">
                <label>Paper Fund (Rs.) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.paper_fund}
                  onChange={(e) => setFormData({ ...formData, paper_fund: e.target.value })}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="fee-total">
                <strong>Total Fee:</strong>
                <span className="total-amount">Rs. {calculateTotal().toFixed(2)}</span>
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
                  <div key={index} className="fee-history-item">
                    <div className="fee-history-date">
                      <strong>Effective: {new Date(fee.effective_from).toLocaleDateString()}</strong>
                      {index === 0 && <span className="badge badge-success">Current</span>}
                    </div>
                    <div className="fee-history-details">
                      <div className="fee-row">
                        <span>Admission Fee:</span>
                        <span>Rs. {parseFloat(fee.admission_fee).toFixed(2)}</span>
                      </div>
                      <div className="fee-row">
                        <span>Monthly Fee:</span>
                        <span>Rs. {parseFloat(fee.monthly_fee).toFixed(2)}</span>
                      </div>
                      <div className="fee-row">
                        <span>Paper Fund:</span>
                        <span>Rs. {parseFloat(fee.paper_fund).toFixed(2)}</span>
                      </div>
                      <div className="fee-row fee-total-row">
                        <strong>Total:</strong>
                        <strong>Rs. {(parseFloat(fee.admission_fee) + parseFloat(fee.monthly_fee) + parseFloat(fee.paper_fund)).toFixed(2)}</strong>
                      </div>
                    </div>
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
