import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { studentService } from '../services/studentService'
import { classService } from '../services/classService'
import { sortClassesBySequence } from '../utils/classSorting'

const AdmissionList = () => {
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterStatus, setFilterStatus] = useState('active') // active, inactive, expelled, all
  const [isClearing, setIsClearing] = useState(false)
  
  // Date range filter - default to last 3 days
  const getDefaultStartDate = () => {
    const date = new Date()
    date.setDate(date.getDate() - 3)
    return date.toISOString().split('T')[0]
  }
  
  const [startDate, setStartDate] = useState(getDefaultStartDate())
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    loadInitialData()
  }, [])

  // Sort classes using centralized sorting
  const sortedClasses = useMemo(
    () => sortClassesBySequence(classes),
    [classes]
  )

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
    
    // Filter by date range (admission date = created_at)
    let matchesDate = true
    if (startDate || endDate) {
      const admissionDate = student.created_at ? new Date(student.created_at).toISOString().split('T')[0] : null
      if (admissionDate) {
        if (startDate && admissionDate < startDate) matchesDate = false
        if (endDate && admissionDate > endDate) matchesDate = false
      }
    }

    return matchesSearch && matchesClass && matchesDate
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

      {/* Date Range Filter */}
      <div className="filters-section" style={{ 
        backgroundColor: '#f8fafc', 
        padding: '1.5rem', 
        borderRadius: '8px', 
        marginBottom: '1.5rem',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
          {/* Date Range */}
          <div className="form-group" style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
            />
          </div>
          <div className="form-group" style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
            />
          </div>
          
          {/* Search */}
          <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
            />
          </div>
          
          {/* Class Filter */}
          <div className="form-group" style={{ minWidth: '180px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Class
            </label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
            >
              <option value="">All Classes</option>
              {sortedClasses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          {/* Status Filter */}
          <div className="form-group" style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expelled">Expelled</option>
              <option value="all">All Statuses</option>
            </select>
          </div>
          
          {/* Quick filters */}
          <div className="form-group" style={{ minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Quick Filters
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  setStartDate(getDefaultStartDate())
                  setEndDate(new Date().toISOString().split('T')[0])
                }}
                style={{ 
                  padding: '0.6rem 0.8rem', 
                  fontSize: '0.75rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Last 3 Days
              </button>
              <button
                onClick={() => {
                  const date = new Date()
                  date.setDate(date.getDate() - 7)
                  setStartDate(date.toISOString().split('T')[0])
                  setEndDate(new Date().toISOString().split('T')[0])
                }}
                style={{ 
                  padding: '0.6rem 0.8rem', 
                  fontSize: '0.75rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Last 7 Days
              </button>
            </div>
          </div>
        </div>
        
        {/* Results count */}
        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
          Showing <strong>{filteredStudents.length}</strong> student(s)
          {startDate && endDate && ` from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredStudents.map(student => {
            const fatherGuardian = student.guardians?.find(g => g.relation === 'Father')
            
            return (
              <div
                key={student.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '0.75rem 1rem',
                  gap: '1rem',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                className="admission-list-card"
              >
                {/* Student Avatar */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  flexShrink: 0
                }}>
                  {student.name?.charAt(0).toUpperCase()}
                </div>
                
                {/* Student Name */}
                <div style={{ minWidth: '180px', flex: '1' }}>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem', color: '#1e293b' }}>
                    {student.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    {student.created_at && `Admitted: ${new Date(student.created_at).toLocaleDateString()}`}
                  </div>
                </div>
                
                {/* Father Name */}
                <div style={{ minWidth: '170px', flex: '1' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Father</div>
                  <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>
                    {fatherGuardian?.name || 'N/A'}
                  </div>
                </div>
                
                {/* Class */}
                <div style={{ minWidth: '120px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Class</div>
                  <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>
                    {student.class_name || 'N/A'}
                  </div>
                </div>
                
                {/* Section */}
                <div style={{ minWidth: '100px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Section</div>
                  <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>
                    {student.section_name || 'N/A'}
                  </div>
                </div>
                
                {/* Status Badge */}
                <div style={{ minWidth: '80px' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: student.is_active ? '#dcfce7' : '#fee2e2',
                    color: student.is_active ? '#059669' : '#dc2626'
                  }}>
                    {student.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                {/* Detail Button */}
                <Link
                  to={`/students/${student.id}`}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    textDecoration: 'none',
                    transition: 'background-color 0.2s',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                >
                  Details
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AdmissionList
