import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { classService, sectionService } from '../services/classService'
import { studentService } from '../services/studentService'
import { useClassFilter } from '../hooks/useClassFilter'
import FilterBar from './common/FilterBar'
import CompactClassCard from './common/CompactClassCard'

const ClassManagement = () => {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [expandedClassId, setExpandedClassId] = useState(null)
  const [sections, setSections] = useState({})
  const [feeStructures, setFeeStructures] = useState({})
  
  // Use custom hook for filtering
  const { filteredClasses, classTypeFilter, setClassTypeFilter } = useClassFilter(classes)
  
  const [formData, setFormData] = useState({
    name: '',
    class_type: 'SCHOOL',
    numberOfSections: 0,
    sectionNames: []
  })
  const [creatingClass, setCreatingClass] = useState(false)

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
      // Fee structure is already in the class data as current_fee_structure
      const classData = classes.find(c => c.id === classId)
      if (classData?.current_fee_structure && !feeStructures[classId]) {
        setFeeStructures(prev => ({ ...prev, [classId]: classData.current_fee_structure }))
      }
    }
  }

  const openModal = (cls = null) => {
    if (cls) {
      setEditingClass(cls)
      setFormData({
        name: cls.name,
        class_type: cls.class_type,
        numberOfSections: 0,
        sectionNames: []
      })
    } else {
      setEditingClass(null)
      setFormData({
        name: '',
        class_type: 'SCHOOL',
        numberOfSections: 0,
        sectionNames: []
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingClass(null)
    setFormData({ name: '', class_type: 'SCHOOL', numberOfSections: 0, sectionNames: [] })
  }

  const handleNumberOfSectionsChange = (num) => {
    const count = parseInt(num) || 0
    const currentNames = formData.sectionNames
    let newNames = []
    
    for (let i = 0; i < count; i++) {
      // Preserve existing names or use default
      newNames.push(currentNames[i] || `Section ${String.fromCharCode(65 + i)}`)
    }
    
    setFormData({
      ...formData,
      numberOfSections: count,
      sectionNames: newNames
    })
  }

  const handleSectionNameChange = (index, value) => {
    const newNames = [...formData.sectionNames]
    newNames[index] = value
    setFormData({ ...formData, sectionNames: newNames })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setCreatingClass(true)

    try {
      if (editingClass) {
        // Update existing class (no section creation on edit)
        await classService.update(editingClass.id, {
          name: formData.name,
          class_type: formData.class_type
        })
      } else {
        // Create new class
        const classResponse = await classService.create({
          name: formData.name,
          class_type: formData.class_type
        })
        
        const newClassId = classResponse.data?.id
        
        // Create sections if any
        if (newClassId && formData.numberOfSections > 0) {
          const sectionPromises = formData.sectionNames.map(sectionName => 
            sectionService.create({
              name: sectionName,
              class_id: newClassId
            })
          )
          
          await Promise.all(sectionPromises)
        }
      }
      await loadClasses()
      closeModal()
    } catch (err) {
      setError(err.message || 'Failed to save class')
    } finally {
      setCreatingClass(false)
    }
  }

  const handleDelete = async (classId) => {
    try {
      // Find the class name for better user experience
      const currentClass = classes.find(cls => cls.id === classId)
      const className = currentClass?.name || 'this class'

      // Check if class has students
      const studentsResponse = await studentService.list({ class_id: classId })
      const studentCount = studentsResponse.data?.length || 0
      
      let confirmed = false
      if (studentCount > 0) {
        confirmed = confirm(
          `⚠️ Warning: The class "${className}" contains ${studentCount} student(s).\n\n` +
          `Deleting this class will remove all students from it.\n` +
          `Are you sure you want to proceed?`
        )
      } else {
        confirmed = confirm(
          `Are you sure you want to delete the class "${className}"?\n\n` +
          `This action cannot be undone.`
        )
      }
      
      if (!confirmed) {
        return
      }

      // Delete the class (use force=true if it has students)
      await classService.delete(classId, studentCount > 0)
      await loadClasses()
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to delete class')
    }
  }

  const renderExpandedContent = (cls) => {
    const feeData = feeStructures[cls.id] || cls.current_fee_structure
    return (
      <div className="class-expanded-row">
        <div className="detail-actions">
          <Link to={`/classes/${cls.id}/sections`} className="btn-link-sm">📂 Sections</Link>
          <Link to={`/classes/${cls.id}/fee-structure`} className="btn-link-sm">💰 Fees</Link>
        </div>
        <div className="detail-inline">
          <span className="detail-label">Sections:</span>
          {sections[cls.id]?.length > 0 ? (
            <span className="detail-chips">
              {sections[cls.id].map(section => (
                <span key={section.id} className="section-chip-sm">{section.name}</span>
              ))}
            </span>
          ) : (
            <span className="text-muted-sm">None</span>
          )}
        </div>
        <div className="detail-inline">
          <span className="detail-label">Monthly Fee:</span>
          {feeData ? (
            <span className="detail-values">
              <strong>Rs. {feeData.monthly_fee}</strong>
            </span>
          ) : (
            <span className="text-muted-sm">Not defined</span>
          )}
        </div>
      </div>
    )
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
        <div className="page-actions">
          <Link to="/students/bulk-import" className="btn-secondary" style={{ marginRight: '10px' }}>
            📊 Bulk Import Students
          </Link>
          <button onClick={() => openModal()} className="btn-primary">
            + Add New Class
          </button>
        </div>
      </div>

      <FilterBar 
        activeFilter={classTypeFilter}
        onFilterChange={setClassTypeFilter}
      />

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {filteredClasses.length === 0 ? (
        <div className="empty-state">
          <p>{classTypeFilter === 'ALL' ? 'No classes found' : `No ${classTypeFilter.toLowerCase()} classes found`}</p>
          <button onClick={() => openModal()} className="btn-primary">
            Add First Class
          </button>
        </div>
      ) : (
        <div className="compact-classes-list">
          {filteredClasses.map(cls => (
            <CompactClassCard
              key={cls.id}
              classData={cls}
              variant="management"
              onEdit={openModal}
              onDelete={handleDelete}
              onToggleExpand={toggleExpand}
              isExpanded={expandedClassId === cls.id}
              expandedContent={expandedClassId === cls.id ? renderExpandedContent(cls) : null}
            />
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

              {!editingClass && (
                <>
                  <div className="form-group">
                    <label>Number of Sections</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      placeholder="0"
                      value={formData.numberOfSections}
                      onChange={(e) => handleNumberOfSectionsChange(e.target.value)}
                    />
                  </div>

                  {formData.numberOfSections > 0 && (
                    <div className="form-group">
                      <label>Section Names</label>
                      <div className="sections-input-grid">
                        {formData.sectionNames.map((name, index) => (
                          <input
                            key={index}
                            type="text"
                            placeholder={`Section ${index + 1}`}
                            value={name}
                            onChange={(e) => handleSectionNameChange(index, e.target.value)}
                            required
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={creatingClass}>
                  {creatingClass ? 'Creating...' : (editingClass ? 'Update Class' : 'Create Class')}
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
