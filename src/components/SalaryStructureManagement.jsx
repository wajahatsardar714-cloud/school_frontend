import { useState, useEffect } from 'react'
import { facultyService } from '../services/facultyService'
import { salaryService } from '../services/salaryService'

const SalaryStructureManagement = () => {
  const [facultyList, setFacultyList] = useState([])
  const [selectedFaculty, setSelectedFaculty] = useState(null)
  const [salaryHistory, setSalaryHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const [formData, setFormData] = useState({
    effective_from: '',
    base_salary: ''
  })

  useEffect(() => {
    loadFaculty()
  }, [])

  const loadFaculty = async () => {
    try {
      setLoading(true)
      const response = await facultyService.list({ is_active: true })
      setFacultyList(response.data || [])
    } catch (err) {
      setError(err.message || 'Failed to load faculty')
    } finally {
      setLoading(false)
    }
  }

  const loadSalaryHistory = async (facultyId) => {
    try {
      setLoading(true)
      const response = await salaryService.getSalaryHistory(facultyId)
      // API returns { data: { faculty, salary_history } }
      setSalaryHistory(response.data?.salary_history || response.data || [])
    } catch (err) {
      console.error('Failed to load salary history:', err)
      setSalaryHistory([])
    } finally {
      setLoading(false)
    }
  }

  const handleFacultySelect = async (faculty) => {
    setSelectedFaculty(faculty)
    setError(null)
    setSuccess(null)
    await loadSalaryHistory(faculty.id)
  }

  const handleOpenModal = () => {
    setFormData({
      effective_from: new Date().toISOString().split('T')[0],
      base_salary: selectedFaculty?.current_salary_structure?.base_salary || ''
    })
    setShowModal(true)
    setError(null)
    setSuccess(null)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setFormData({ effective_from: '', base_salary: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.effective_from || !formData.base_salary) {
      setError('All fields are required')
      return
    }

    if (parseFloat(formData.base_salary) <= 0) {
      setError('Base salary must be greater than 0')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      await salaryService.setSalaryStructure(selectedFaculty.id, {
        effective_from: formData.effective_from,
        base_salary: parseFloat(formData.base_salary)
      })

      setSuccess('Salary structure updated successfully')
      handleCloseModal()
      await loadSalaryHistory(selectedFaculty.id)
      await loadFaculty() // Refresh to get updated current_base_salary
    } catch (err) {
      setError(err.message || 'Failed to update salary structure')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="salary-structure-management">
      <div className="page-header">
        <h1>Salary Structure Management</h1>
        <p>Set and manage base salaries for faculty members</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span>✓ {success}</span>
          <button onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      <div className="content-grid">
        {/* Faculty List */}
        <div className="faculty-list-panel">
          <h2>Active Faculty</h2>
          
          {loading && !selectedFaculty ? (
            <div className="loading">Loading faculty...</div>
          ) : facultyList.length === 0 ? (
            <div className="empty-state">
              <p>No active faculty found</p>
            </div>
          ) : (
            <div className="faculty-cards">
              {facultyList.map((faculty) => (
                <div
                  key={faculty.id}
                  className={`faculty-card ${selectedFaculty?.id === faculty.id ? 'selected' : ''}`}
                  onClick={() => handleFacultySelect(faculty)}
                >
                  <div className="faculty-card-header">
                    <h3>{faculty.name}</h3>
                    <span className="badge badge-primary">{faculty.role || 'N/A'}</span>
                  </div>
                  <div className="faculty-card-body">
                    <p><strong>Subject:</strong> {faculty.subject || 'N/A'}</p>
                    <p><strong>Phone:</strong> {faculty.phone || 'N/A'}</p>
                    {faculty.current_salary_structure?.base_salary && (
                      <p className="salary-badge">
                        <strong>Current Salary:</strong> {formatCurrency(faculty.current_salary_structure.base_salary)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Salary Details */}
        <div className="salary-details-panel">
          {selectedFaculty ? (
            <>
              <div className="panel-header">
                <h2>Salary Structure: {selectedFaculty.name}</h2>
                <button
                  className="btn btn-primary"
                  onClick={handleOpenModal}
                  disabled={loading}
                >
                  Set New Salary
                </button>
              </div>

              <div className="current-salary-card">
                <h3>Current Base Salary</h3>
                <div className="salary-amount">
                  {selectedFaculty.current_salary_structure?.base_salary 
                    ? formatCurrency(selectedFaculty.current_salary_structure.base_salary)
                    : 'Not Set'}
                </div>
                {selectedFaculty.current_salary_structure?.effective_from && (
                  <p className="effective-date">
                    Effective from: {formatDate(selectedFaculty.current_salary_structure.effective_from)}
                  </p>
                )}
              </div>

              <h3>Salary History</h3>
              {loading ? (
                <div className="loading">Loading history...</div>
              ) : salaryHistory.length === 0 ? (
                <div className="empty-state">
                  <p>No salary history found</p>
                </div>
              ) : (
                <div className="salary-history-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Effective From</th>
                        <th>Base Salary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaryHistory.map((record) => (
                        <tr key={record.id}>
                          <td>{formatDate(record.effective_from)}</td>
                          <td className="amount">{formatCurrency(record.base_salary)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <p>Select a faculty member to view and manage salary structure</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Set New Salary Structure</h2>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Faculty Member</label>
                  <input
                    type="text"
                    value={selectedFaculty?.name || ''}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>Effective From <span className="required">*</span></label>
                  <input
                    type="date"
                    value={formData.effective_from}
                    onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Base Salary (PKR) <span className="required">*</span></label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g., 50000"
                    value={formData.base_salary}
                    onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                    disabled={submitting}
                    required
                  />
                  {formData.base_salary && (
                    <small className="form-hint">
                      {formatCurrency(formData.base_salary)}
                    </small>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save Salary Structure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SalaryStructureManagement
