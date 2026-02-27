import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { sectionService } from '../../services/classService'
import './CompactClassCard.css'

const CompactClassCard = ({ 
  classData, 
  variant = 'management', // 'management' | 'student'
  onEdit,
  onDelete,
  onToggleExpand,
  isExpanded = false,
  expandedContent = null
}) => {
  const {
    id,
    name,
    class_type,
    is_active = true,
    section_count = 0,
    student_count = 0
  } = classData

  const [sections, setSections] = useState([])
  const [loadingSections, setLoadingSections] = useState(false)

  // Fetch sections for student variant to show section-wise student count
  useEffect(() => {
    if (variant === 'student' && id) {
      loadSections()
    }
  }, [variant, id, student_count]) // Re-fetch when student_count changes

  const loadSections = async () => {
    try {
      setLoadingSections(true)
      const response = await sectionService.list(id)
      setSections(response.data || [])
    } catch (err) {
      console.error('Failed to load sections:', err)
      setSections([])
    } finally {
      setLoadingSections(false)
    }
  }

  if (variant === 'student') {
    return (
      <Link
        to={`/students/class/${id}`}
        className="compact-class-card student-variant"
      >
        <div className="compact-card-header">
          <div className="compact-card-icon">📚</div>
          <span className={`compact-type-badge ${class_type.toLowerCase()}`}>
            {class_type}
          </span>
        </div>
        <div className="compact-card-body">
          <h3 className="compact-card-title">{name}</h3>
          {loadingSections ? (
            <p className="compact-card-subtitle">Loading sections...</p>
          ) : sections.length > 0 ? (
            <div className="section-wise-students">
              {sections.map((section) => (
                <div key={section.id} className="section-student-row">
                  <span className="section-name">{section.name}</span>
                  <span className="section-count">{section.student_count || 0}</span>
                </div>
              ))}
              {sections.length > 1 && (
                <div className="total-students-summary">
                  <span>Total Students</span>
                  <span>{sections.reduce((sum, sec) => sum + (sec.student_count || 0), 0)}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="compact-card-subtitle">
              {section_count} sections • {student_count} students
            </p>
          )}
        </div>
        <div className="compact-card-footer">
          <span className="compact-status-badge active">Active</span>
          <span className="compact-view-link">View Students →</span>
        </div>
      </Link>
    )
  }

  return (
    <div className="compact-class-card management-variant">
      <div className="compact-card-header management">
        <div className="compact-card-info">
          <h3 className="compact-card-title">{name}</h3>
          <div className="compact-badges">
            <span className={`compact-badge ${class_type === 'SCHOOL' ? 'primary' : 'secondary'}`}>
              {class_type}
            </span>
            <span className={`compact-badge ${is_active ? 'success' : 'inactive'}`}>
              {is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <div className="compact-card-actions">
          <button 
            onClick={() => onToggleExpand?.(id)} 
            className="compact-btn-icon"
            title={isExpanded ? 'Hide Details' : 'Show Details'}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
          <button 
            onClick={() => onEdit?.(classData)} 
            className="compact-btn-icon"
            title="Edit"
          >
            ✏️
          </button>
          <button 
            onClick={() => onDelete?.(id)} 
            className="compact-btn-icon danger"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
      {isExpanded && expandedContent && (
        <div className="compact-card-expanded">
          {expandedContent}
        </div>
      )}
    </div>
  )
}

CompactClassCard.propTypes = {
  classData: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    class_type: PropTypes.string.isRequired,
    is_active: PropTypes.bool,
    section_count: PropTypes.number,
    student_count: PropTypes.number
  }).isRequired,
  variant: PropTypes.oneOf(['management', 'student']),
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onToggleExpand: PropTypes.func,
  isExpanded: PropTypes.bool,
  expandedContent: PropTypes.node
}

export default CompactClassCard