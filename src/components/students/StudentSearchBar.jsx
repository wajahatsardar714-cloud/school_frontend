import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { studentService } from '../../services/studentService'
import './StudentSearchBar.css'

const StudentSearchBar = ({ isCompact = false }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState(null)
  const searchRef = useRef(null)
  const navigate = useNavigate()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Search students with debouncing
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        setLoading(true)
        setError(null)
        try {
          const response = await studentService.search(searchTerm.trim())
          const students = response.data || []
          
          // Debug: Log the first student to see the data structure
          if (students.length > 0) {
            console.log('Student search result sample:', students[0])
          }
          
          setSearchResults(students)
          setShowResults(true)
        } catch (err) {
          console.error('Search error:', err)
          setError('Failed to search students')
          setSearchResults([])
        } finally {
          setLoading(false)
        }
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [searchTerm])

  const handleViewDetails = (studentId) => {
    navigate(`/students/${studentId}`)
    setShowResults(false)
    setSearchTerm('')
  }

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const clearSearch = () => {
    setSearchTerm('')
    setSearchResults([])
    setShowResults(false)
  }

  return (
    <div className={`student-search-bar ${isCompact ? 'compact' : ''}`} ref={searchRef}>
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="student-search-input"
          placeholder="Search students by name..."
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
        />
        {searchTerm && (
          <button className="clear-search-btn" onClick={clearSearch}>
            ✕
          </button>
        )}
        {loading && <span className="search-loading">⏳</span>}
      </div>

      {showResults && (
        <div className="search-results-dropdown">
          {error && (
            <div className="search-error">
              <p>{error}</p>
            </div>
          )}

          {!error && searchResults.length === 0 && (
            <div className="no-results">
              <p>No students found matching "{searchTerm}"</p>
            </div>
          )}

          {!error && searchResults.length > 0 && (
            <>
              <div className="search-results-header">
                <p>Found {searchResults.length} student{searchResults.length > 1 ? 's' : ''}</p>
              </div>
              <div className="search-results-list">
                {searchResults.map((student) => {
                  // Extract father name from guardians array or direct field
                  const fatherName = student.father_name || 
                                   student.guardians?.find(g => g.relation === 'Father')?.name || 
                                   'N/A'
                  
                  // Extract class name - try multiple possible structures
                  const className = student.current_enrollment?.class_name || 
                                  student.current_class_name || 
                                  student.current_class?.name || 
                                  'Not Enrolled'
                  
                  // Extract section name - try multiple possible structures
                  const sectionName = student.current_enrollment?.section_name || 
                                    student.current_section_name || 
                                    student.current_section?.name || 
                                    'N/A'
                  
                  return (
                    <div key={student.id} className={`search-result-item ${isCompact ? 'compact' : ''}`}>
                      <div className="student-card-left">
                        <div className="student-avatar">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="student-card-info">
                          <div className="student-name-row">
                            <span className="student-name-highlight">{student.name}</span>
                          </div>
                          <div className="student-meta-grid">
                            <div className="meta-item">
                              <span className="meta-label">Father</span>
                              <span className="meta-value">{fatherName}</span>
                            </div>
                            <div className="meta-item">
                              <span className="meta-label">Class</span>
                              <span className="meta-value">{className}</span>
                            </div>
                            <div className="meta-item">
                              <span className="meta-label">Section</span>
                              <span className="meta-value">{sectionName}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        className="btn-view-details-compact"
                        onClick={() => handleViewDetails(student.id)}
                      >
                        View Details →
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
  )
}

StudentSearchBar.propTypes = {
  isCompact: PropTypes.bool
}

export default StudentSearchBar
