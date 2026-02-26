import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { studentService } from '../services/studentService'
import { classService } from '../services/classService'

const AdmissionList = () => {
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterStatus, setFilterStatus] = useState('active') // active, inactive, expelled, all
  const [isClearing, setIsClearing] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [studentsRes, classesRes] = await Promise.all([
        studentService.list({ is_active: filterStatus === 'all' ? undefined : (filterStatus === 'active') }),
        classService.list()
      ])
      setStudents(studentsRes.data || [])
      setClasses(classesRes.data || [])
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [filterStatus])

  const loadStudents = async () => {
    try {
      const response = await studentService.list({
        is_active: filterStatus === 'all' ? undefined : (filterStatus === 'active')
      })
      setStudents(response.data || [])
    } catch (err) {
      console.error('Failed to load students:', err)
    }
  }

  const handleClearAdmissionList = async () => {
    if (!window.confirm('Are you sure you want to clear all students from the admission list? This will deactivate all active students but preserve their data in other modules.')) {
      return
    }

    try {
      setIsClearing(true)
      const response = await studentService.bulkDeactivate()
      
      if (response.success) {
        alert(`Successfully deactivated ${response.data.deactivatedCount} student(s) from admission list`)
        // Reload the students list
        await loadStudents()
      } else {
        alert('Failed to clear admission list: ' + (response.message || 'Unknown error'))
      }
    } catch (err) {
      console.error('Failed to clear admission list:', err)
      alert('Failed to clear admission list: ' + (err.message || 'Unknown error'))
    } finally {
      setIsClearing(false)
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchTerm ||
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.roll_no?.toLowerCase().includes(searchTerm.toLowerCase())

    const studentClassId = student.current_enrollment?.class_id || student.class_id
    const matchesClass = !filterClass || String(studentClassId) === String(filterClass)

    return matchesSearch && matchesClass
  })

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading students...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Admission List</h2>
        <div className="header-actions">
          <Link to="/admission/new-form" className="btn-primary">
            + New Admission
          </Link>
          <button 
            onClick={handleClearAdmissionList}
            className="btn-danger"
            disabled={isClearing || filteredStudents.filter(s => s.is_active).length === 0}
            style={{ marginLeft: '10px' }}
          >
            {isClearing ? 'Clearing...' : 'Clear Admission List'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="filters-section" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Search by name or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
          />
        </div>
        <div className="form-group" style={{ width: '200px' }}>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="filter-select"
            style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
          >
            <option value="">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ width: '150px' }}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
            style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expelled">Expelled</option>
            <option value="all">All Statuses</option>
          </select>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="empty-state">
          <p>No students found</p>
          <Link to="/admission/new-form" className="btn-primary">
            Add First Student
          </Link>
        </div>
      ) : (
        <div className="students-grid">
          {filteredStudents.map(student => (
            <Link
              key={student.id}
              to={`/admission/view-detail/${student.id}`}
              className="student-card"
            >
              <div className="student-avatar">
                {student.name?.charAt(0).toUpperCase()}
              </div>
              <div className="student-info">
                <h3>{student.name}</h3>
                {student.roll_no && <p className="roll-no">Roll No: {student.roll_no}</p>}
                {student.class_name && (
                  <p className="class-info">
                    {student.class_name} {student.section_name ? `- ${student.section_name}` : ''}
                  </p>
                )}
                {student.phone && <p className="phone">📞 {student.phone}</p>}
              </div>
              <div className="student-status">
                <span className={`badge ${student.is_active ? 'badge-success' : 'badge-inactive'}`}>
                  {student.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdmissionList
