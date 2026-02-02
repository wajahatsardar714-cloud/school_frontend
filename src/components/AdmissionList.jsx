import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { studentService } from '../services/studentService'

const AdmissionList = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterClass, setFilterClass] = useState('')

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      setLoading(true)
      const response = await studentService.list({
        is_active: true
      })
      setStudents(response.data || [])
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.roll_no?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = !filterClass || student.class_name === filterClass
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
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="filters-section">
        <input
          type="text"
          placeholder="Search by name or roll number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="filter-select"
        >
          <option value="">All Classes</option>
          <option value="PG">PG</option>
          <option value="Nursery">Nursery</option>
          <option value="Prep">Prep</option>
          <option value="Class 1">Class 1</option>
          <option value="Class 2">Class 2</option>
          <option value="Class 3">Class 3</option>
          <option value="Class 4">Class 4</option>
          <option value="Class 5">Class 5</option>
          <option value="Class 6">Class 6</option>
          <option value="Class 7">Class 7</option>
          <option value="Class 8">Class 8</option>
          <option value="Class 9">Class 9</option>
          <option value="Class 10">Class 10</option>
          <option value="1st Year">1st Year</option>
          <option value="2nd Year">2nd Year</option>
        </select>
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
