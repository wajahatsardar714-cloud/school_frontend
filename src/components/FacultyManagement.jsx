import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { facultyService } from '../services/facultyService'

const FacultyManagement = () => {
  const [faculty, setFaculty] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingFaculty, setEditingFaculty] = useState(null)
  const [filterActive, setFilterActive] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    father_or_husband: '',
    cnic: '',
    phone: '',
    gender: '',
    role: '',
    subject: '',
    base_salary: ''
  })

  useEffect(() => {
    loadFaculty()
  }, [])

  const loadFaculty = async () => {
    try {
      setLoading(true)
      const response = await facultyService.list()
      setFaculty(response.data || [])
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load faculty')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (member = null) => {
    if (member) {
      setEditingFaculty(member)
      setFormData({
        name: member.name || '',
        father_or_husband: member.father_or_husband || '',
        cnic: member.cnic || '',
        phone: member.phone || '',
        gender: member.gender || '',
        role: member.role || '',
        subject: member.subject || '',
        base_salary: '' // Don't pre-fill, salary is managed in Salary Structure
      })
    } else {
      setEditingFaculty(null)
      setFormData({
        name: '',
        father_or_husband: '',
        cnic: '',
        phone: '',
        gender: '',
        role: '',
        subject: '',
        base_salary: ''
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingFaculty(null)
    setFormData({
      name: '',
      father_or_husband: '',
      cnic: '',
      phone: '',
      gender: '',
      role: '',
      subject: '',
      base_salary: ''
    })
  }

  const formatCNIC = (value) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 13)
    if (digitsOnly.length > 12) {
      return `${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5, 12)}-${digitsOnly.slice(12)}`
    } else if (digitsOnly.length > 5) {
      return `${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5)}`
    }
    return digitsOnly
  }

  const handleCNICChange = (value) => {
    const digitsOnly = value.replace(/\D/g, '')
    setFormData({ ...formData, cnic: digitsOnly })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    // Validate base_salary for new faculty
    if (!editingFaculty && (!formData.base_salary || parseFloat(formData.base_salary) <= 0)) {
      setError('Base salary is required for new faculty members')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      if (editingFaculty) {
        // Don't send base_salary on update - it's managed separately
        const { base_salary, ...updateData } = formData
        await facultyService.update(editingFaculty.id, updateData)
      } else {
        // Include base_salary as number for new faculty
        const createData = {
          ...formData,
          base_salary: parseFloat(formData.base_salary)
        }
        await facultyService.create(createData)
      }
      await loadFaculty()
      closeModal()
    } catch (err) {
      setError(err.message || 'Failed to save faculty member')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (id, currentStatus) => {
    try {
      if (currentStatus) {
        await facultyService.deactivate(id)
      } else {
        await facultyService.activate(id)
      }
      await loadFaculty()
    } catch (err) {
      setError(err.message || 'Failed to update status')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this faculty member?')) {
      return
    }

    try {
      await facultyService.delete(id)
      await loadFaculty()
    } catch (err) {
      setError(err.message || 'Failed to delete faculty member')
    }
  }

  const filteredFaculty = faculty.filter(member => {
    const matchesActive = filterActive === 'all' || 
                         (filterActive === 'active' && member.is_active) || 
                         (filterActive === 'inactive' && !member.is_active)
    const matchesSearch = member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesActive && matchesSearch
  })

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading faculty...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Faculty Management</h2>
        <button onClick={() => openModal()} className="btn-primary">
          + Add Faculty Member
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="filters-section">
        <input
          type="text"
          placeholder="Search by name, subject, or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="filter-tabs">
          <button 
            className={filterActive === 'all' ? 'active' : ''} 
            onClick={() => setFilterActive('all')}
          >
            All ({faculty.length})
          </button>
          <button 
            className={filterActive === 'active' ? 'active' : ''} 
            onClick={() => setFilterActive('active')}
          >
            Active ({faculty.filter(f => f.is_active).length})
          </button>
          <button 
            className={filterActive === 'inactive' ? 'active' : ''} 
            onClick={() => setFilterActive('inactive')}
          >
            Inactive ({faculty.filter(f => !f.is_active).length})
          </button>
        </div>
      </div>

      {filteredFaculty.length === 0 ? (
        <div className="empty-state">
          <p>No faculty members found</p>
          <button onClick={() => openModal()} className="btn-primary">
            Add First Faculty Member
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Father/Husband</th>
                <th>CNIC</th>
                <th>Phone</th>
                <th>Gender</th>
                <th>Role</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculty.map(member => (
                <tr key={member.id}>
                  <td><strong>{member.name}</strong></td>
                  <td>{member.father_or_husband || '-'}</td>
                  <td>{member.cnic ? formatCNIC(member.cnic) : '-'}</td>
                  <td>{member.phone || '-'}</td>
                  <td>{member.gender || '-'}</td>
                  <td>{member.role || '-'}</td>
                  <td>{member.subject || '-'}</td>
                  <td>
                    <span className={`badge ${member.is_active ? 'badge-success' : 'badge-inactive'}`}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => openModal(member)} className="btn-secondary btn-sm">
                        Edit
                      </button>
                      <button 
                        onClick={() => handleToggleActive(member.id, member.is_active)} 
                        className={`btn-sm ${member.is_active ? 'btn-warning' : 'btn-success'}`}
                      >
                        {member.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <Link to={`/faculty/${member.id}/salary`} className="btn-secondary btn-sm">
                        Salary
                      </Link>
                      <button onClick={() => handleDelete(member.id)} className="btn-danger btn-sm">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingFaculty ? 'Edit Faculty Member' : 'Add New Faculty Member'}</h3>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* Personal Information Section */}
              <div className="form-section">
                <h4 className="form-section-title">👤 Personal Information</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name <span className="required">*</span></label>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Father/Husband Name</label>
                    <input
                      type="text"
                      placeholder="Father or husband name"
                      value={formData.father_or_husband}
                      onChange={(e) => setFormData({ ...formData, father_or_husband: e.target.value })}
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      disabled={submitting}
                    >
                      <option value="">Select Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>CNIC</label>
                    <input
                      type="text"
                      placeholder="00000-0000000-0"
                      value={formatCNIC(formData.cnic)}
                      onChange={(e) => handleCNICChange(e.target.value)}
                      disabled={submitting}
                    />
                    <small className="field-hint">13 digits (auto-formatted)</small>
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+92-XXX-XXXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information Section */}
              <div className="form-section">
                <h4 className="form-section-title">💼 Professional Information</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Role/Designation</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      disabled={submitting}
                    >
                      <option value="">Select Role</option>
                      <option value="Teacher">Teacher</option>
                      <option value="Senior Teacher">Senior Teacher</option>
                      <option value="Head Teacher">Head Teacher</option>
                      <option value="Principal">Principal</option>
                      <option value="Vice Principal">Vice Principal</option>
                      <option value="Admin Staff">Admin Staff</option>
                      <option value="Accountant">Accountant</option>
                      <option value="Librarian">Librarian</option>
                      <option value="Lab Assistant">Lab Assistant</option>
                      <option value="Peon">Peon</option>
                      <option value="Security">Security</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Subject/Department</label>
                    <input
                      type="text"
                      placeholder="e.g., Mathematics, English, Physics"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              {/* Salary Information Section - Only for new faculty */}
              {!editingFaculty && (
                <div className="form-section form-section-highlight">
                  <h4 className="form-section-title">💰 Initial Salary</h4>
                  <p className="form-section-description">
                    Set the starting salary for this faculty member. This will create their initial salary structure.
                  </p>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Base Salary (PKR) <span className="required">*</span></label>
                      <input
                        type="number"
                        placeholder="e.g., 50000"
                        min="0"
                        step="1000"
                        value={formData.base_salary}
                        onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                        disabled={submitting}
                        required
                      />
                      <small className="field-hint">Monthly salary amount in Pakistani Rupees</small>
                    </div>
                  </div>
                </div>
              )}

              {editingFaculty && (
                <div className="form-section form-section-info">
                  <p className="info-text">
                    💡 To update salary, use the <strong>Salary Structure</strong> page in the Faculty menu.
                  </p>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-secondary" disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingFaculty ? 'Update Faculty' : 'Add Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default FacultyManagement
