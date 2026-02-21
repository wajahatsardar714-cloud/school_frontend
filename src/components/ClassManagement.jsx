import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { classService, sectionService } from '../services/classService'

const ClassManagement = () => {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [expandedClassId, setExpandedClassId] = useState(null)
  const [sections, setSections] = useState({})
  const [feeStructures, setFeeStructures] = useState({})

  const [formData, setFormData] = useState({
    name: '',
    class_type: 'SCHOOL'
  })

  useEffect(() => {
    loadClasses()
  }, [])

  const loadClasses = async () => {
    try {
      setLoading(true)
      const response = await classService.list()
      setClasses(response.data || [])
      setError(null)
    } catch (err) {
      console.error('Class list error:', err)
      setError(err.message || 'Failed to load classes. Please check backend logs.')
      setClasses([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const loadSections = async (classId) => {
    try {
      const response = await sectionService.list(classId)
      setSections(prev => ({ ...prev, [classId]: response.data || [] }))
    } catch (err) {
      console.error('Failed to load sections:', err)
    }
  }

  const loadFeeStructure = async (classId) => {
    try {
      const response = await classService.getFeeStructure(classId)
      setFeeStructures(prev => ({ ...prev, [classId]: response.data || null }))
    } catch (err) {
      console.error('Failed to load fee structure:', err)
    }
  }

  const toggleExpand = async (classId) => {
    if (expandedClassId === classId) {
      setExpandedClassId(null)
    } else {
      setExpandedClassId(classId)
      if (!sections[classId]) {
        await loadSections(classId)
      }
      if (!feeStructures[classId]) {
        await loadFeeStructure(classId)
      }
    }
  }

  const openModal = (cls = null) => {
    if (cls) {
      setEditingClass(cls)
      setFormData({
        name: cls.name,
        class_type: cls.class_type
      })
    } else {
      setEditingClass(null)
      setFormData({
        name: '',
        class_type: 'SCHOOL'
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingClass(null)
    setFormData({ name: '', class_type: 'SCHOOL' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      if (editingClass) {
        await classService.update(editingClass.id, formData)
      } else {
        await classService.create(formData)
      }
      await loadClasses()
      closeModal()
    } catch (err) {
      setError(err.message || 'Failed to save class')
    }
  }

  const handleDelete = async (classId) => {
    if (!confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      return
    }

    try {
      await classService.delete(classId)
      await loadClasses()
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to delete class')
    }
  }

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading classes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Class Management</h2>
        <button onClick={() => openModal()} className="btn-primary">
          + Add New Class
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {classes.length === 0 ? (
        <div className="empty-state">
          <p>No classes found</p>
          <button onClick={() => openModal()} className="btn-primary">
            Add First Class
          </button>
        </div>
      ) : (
        <div className="classes-list">
          {classes.map(cls => (
            <div key={cls.id} className="class-card">
              <div className="class-header">
                <div className="class-info">
                  <h3>{cls.name}</h3>
                  <span className={`badge ${cls.class_type === 'SCHOOL' ? 'badge-primary' : 'badge-secondary'}`}>
                    {cls.class_type}
                  </span>
                  <span className={`badge ${cls.is_active ? 'badge-success' : 'badge-inactive'}`}>
                    {cls.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ marginTop: '0.5rem', width: '200px' }}>
                  {(() => {
                    const estimatedCapacity = (parseInt(cls.section_count) || 1) * 40
                    const studentCount = parseInt(cls.student_count) || 0
                    const occupancyPercent = Math.min(Math.round((studentCount / estimatedCapacity) * 100), 100)
                    const statusColor = occupancyPercent > 90 ? '#e53e3e' : occupancyPercent > 70 ? '#ecc94b' : '#38a169'
                    return (
                      <div className="capacity-indicator">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.2rem' }}>
                          <span>{studentCount}/{estimatedCapacity} Pupils</span>
                          <span>{occupancyPercent}% Occupancy</span>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: '#edf2f7', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${occupancyPercent}%`, height: '100%', background: statusColor }}></div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
                <div className="class-actions">
                  <button
                    onClick={() => toggleExpand(cls.id)}
                    className="btn-secondary"
                  >
                    {expandedClassId === cls.id ? '▲ Hide Details' : '▼ Show Details'}
                  </button>
                  <button onClick={() => openModal(cls)} className="btn-secondary">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(cls.id)} className="btn-danger">
                    Delete
                  </button>
                </div>
              </div>

              {expandedClassId === cls.id && (
                <div className="class-details">
                  <div className="detail-section">
                    <h4>Sections</h4>
                    {sections[cls.id]?.length > 0 ? (
                      <div className="sections-grid">
                        {sections[cls.id].map(section => (
                          <div key={section.id} className="section-chip">
                            {section.name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted">No sections created yet</p>
                    )}
                    <Link to={`/classes/${cls.id}/sections`} className="btn-link">
                      Manage Sections →
                    </Link>
                  </div>

                  <div className="detail-section">
                    <h4>Fee Structure</h4>
                    {feeStructures[cls.id] ? (
                      <div className="fee-grid">
                        <div className="fee-item">
                          <span>Admission Fee:</span>
                          <strong>Rs. {feeStructures[cls.id].admission_fee}</strong>
                        </div>
                        <div className="fee-item">
                          <span>Monthly Fee:</span>
                          <strong>Rs. {feeStructures[cls.id].monthly_fee}</strong>
                        </div>
                        <div className="fee-item">
                          <span>Paper Fund:</span>
                          <strong>Rs. {feeStructures[cls.id].paper_fund}</strong>
                        </div>
                        <div className="fee-item">
                          <span>Effective From:</span>
                          <strong>{new Date(feeStructures[cls.id].effective_from).toLocaleDateString()}</strong>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted">No fee structure defined</p>
                    )}
                    <Link to={`/classes/${cls.id}/fee-structure`} className="btn-link">
                      Manage Fee Structure →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingClass ? 'Edit Class' : 'Add New Class'}</h3>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Class Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Class 1, Nursery, 1st Year"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Class Type *</label>
                <select
                  value={formData.class_type}
                  onChange={(e) => setFormData({ ...formData, class_type: e.target.value })}
                  required
                >
                  <option value="SCHOOL">School</option>
                  <option value="COLLEGE">College</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingClass ? 'Update Class' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClassManagement
