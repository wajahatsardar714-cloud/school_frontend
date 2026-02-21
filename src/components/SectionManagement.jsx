import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { classService, sectionService } from '../services/classService'

const SectionManagement = () => {
  const { classId } = useParams()
  const navigate = useNavigate()
  const [classInfo, setClassInfo] = useState(null)
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: ''
  })

  useEffect(() => {
    loadData()
  }, [classId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [classRes, sectionsRes] = await Promise.all([
        classService.getById(classId),
        sectionService.list(classId)
      ])
      setClassInfo(classRes.data)
      setSections(sectionsRes.data || [])
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (section = null) => {
    if (section) {
      setEditingSection(section)
      setFormData({ name: section.name })
    } else {
      setEditingSection(null)
      setFormData({ name: '' })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingSection(null)
    setFormData({ name: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setError(null)

    try {
      if (editingSection) {
        await sectionService.update(editingSection.id, formData)
      } else {
        await sectionService.create({
          class_id: parseInt(classId),
          name: formData.name
        })
      }
      await loadData()
      closeModal()
    } catch (err) {
      setError(err.message || 'Failed to save section')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (sectionId) => {
    if (!confirm('Are you sure you want to delete this section?')) {
      return
    }

    try {
      await sectionService.delete(sectionId)
      await loadData()
    } catch (err) {
      setError(err.message || 'Failed to delete section')
    }
  }

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading sections...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="breadcrumb-nav">
        <Link to="/classes">Classes</Link>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">{classInfo?.name} Sections</span>
      </div>

      <div className="page-header">
        <div>
          <h2>Sections: {classInfo?.name}</h2>
          <p className="text-muted">Manage class sections (A, B, C, etc.)</p>
        </div>
        <div className="header-actions">
          <button onClick={() => openModal()} className="btn-primary">
            + Add Section
          </button>
          <button onClick={() => navigate('/classes')} className="btn-secondary">
            ← Back
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {sections.length === 0 ? (
        <div className="empty-state">
          <p>No sections created yet</p>
          <button onClick={() => openModal()} className="btn-primary">
            Add First Section
          </button>
        </div>
      ) : (
        <div className="sections-grid">
          {sections.map(section => (
            <div key={section.id} className="section-card">
              <div className="section-name">
                <h3>Section {section.name}</h3>
                <div className="capacity-indicator" style={{ marginTop: '0.8rem', width: '100%' }}>
                  {(() => {
                    const studentCount = parseInt(section.student_count) || 0
                    const capacity = 40
                    const occupancyPercent = Math.min(Math.round((studentCount / capacity) * 100), 100)
                    const statusColor = occupancyPercent > 90 ? '#e53e3e' : occupancyPercent > 70 ? '#ecc94b' : '#38a169'
                    return (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.2rem' }}>
                          <span>{studentCount}/{capacity} Students</span>
                          <span>{occupancyPercent}%</span>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: '#edf2f7', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${occupancyPercent}%`, height: '100%', background: statusColor }}></div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
              <div className="section-actions">
                <button onClick={() => openModal(section)} className="btn-secondary btn-sm">
                  Edit
                </button>
                <button onClick={() => handleDelete(section.id)} className="btn-danger btn-sm">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSection ? 'Edit Section' : 'Add New Section'}</h3>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Section Name *</label>
                <input
                  type="text"
                  placeholder="e.g., A, B, C"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={submitting}
                  required
                  maxLength={10}
                />
                <small>Usually a single letter (A-Z) or number</small>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-secondary" disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingSection ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SectionManagement
