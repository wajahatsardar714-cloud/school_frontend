import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { classService } from '../../services/classService'
import { studentService } from '../../services/studentService'
import { useFetch } from '../../hooks/useApi'
import FilterBar from '../common/FilterBar'
import CompactClassCard from '../common/CompactClassCard'
import CSVImportModal from '../common/CSVImportModal'
import StudentSearchBar from './StudentSearchBar'
import PrintStudentsModal from './PrintStudentsModal'
import { getClassSortOrder } from '../../utils/classSorting'
import './Students.css'

const StudentDashboard = () => {
    const [showImportModal, setShowImportModal] = useState(false)
    const [showPrintModal, setShowPrintModal] = useState(false)
    const [classTypeFilter, setClassTypeFilter] = useState('ALL')
    const [searchTerm, setSearchTerm] = useState('')
    const [refreshKey, setRefreshKey] = useState(0)
    const [specialFilter, setSpecialFilter] = useState('')
    const [specialStudents, setSpecialStudents] = useState([])
    const [specialLoading, setSpecialLoading] = useState(false)
    const [specialError, setSpecialError] = useState(null)

    useEffect(() => {
        if (!specialFilter) {
            setSpecialStudents([])
            setSpecialError(null)
            return
        }
        const fetchSpecial = async () => {
            setSpecialLoading(true)
            setSpecialError(null)
            try {
                const filters = specialFilter === 'expelled'
                    ? { is_expelled: true }
                    : { is_active: false, is_expelled: false }
                const res = await studentService.list(filters)
                setSpecialStudents(res?.data?.students || res?.data || [])
            } catch (err) {
                setSpecialError(err.message || 'Failed to load students')
            } finally {
                setSpecialLoading(false)
            }
        }
        fetchSpecial()
    }, [specialFilter])

    const handleDeleteSpecialStudent = async (studentId) => {
        if (!window.confirm('Permanently delete this student and all their records?')) return
        try {
            await studentService.delete(studentId)
            setSpecialStudents(prev => prev.filter(s => s.id !== studentId))
        } catch (err) {
            alert('Failed to delete student: ' + (err.message || 'Unknown error'))
        }
    }
    
    // Fetch all classes
    const { data: classesResponse, loading, error, refetch } = useFetch(
        () => classService.list(),
        [refreshKey],
        { enabled: true }
    )

    const classes = classesResponse?.data || []
    
    // Calculate total students count
    const totalStudents = useMemo(() => {
        return classes.reduce((sum, cls) => sum + (parseInt(cls.student_count) || 0), 0)
    }, [classes])
    
    // Filter and sort classes
    const filteredClasses = useMemo(() => {
        let filtered = classes
        
        // Filter by type
        if (classTypeFilter !== 'ALL') {
            filtered = filtered.filter(c => c.class_type === classTypeFilter)
        }
        
        // Filter by search term
        if (searchTerm.trim()) {
            filtered = filtered.filter(c =>
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.class_type.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }
        
        // Sort classes in custom order
        return filtered.sort((a, b) => {
            const orderA = getClassSortOrder(a.name)
            const orderB = getClassSortOrder(b.name)
            return orderA - orderB
        })
    }, [classes, classTypeFilter, searchTerm])

    if (loading) {
        return (
            <div className="students-container">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading classes...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="students-container">
                <div className="alert alert-error">
                    <p>Error loading classes: {error.message || 'Unknown error'}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="students-container">
            <header className="students-header">
                <div>
                    <h1>Student Directory</h1>
                    <p className="student-sub-info">Search for students by name or browse by class.</p>
                </div>
                <div className="header-actions">
                    <button 
                        className="btn-secondary"
                        onClick={() => setRefreshKey(prev => prev + 1)}
                        disabled={loading}
                        title="Refresh student counts"
                    >
                        🔄 Refresh
                    </button>
                    <button 
                        className="btn-secondary"
                        onClick={() => setShowPrintModal(true)}
                        title="Print class/section student list"
                    >
                        🖨️ Print
                    </button>
                    <button 
                        className="btn-secondary"
                        onClick={() => setShowImportModal(true)}
                    >
                        📁 Import Students
                    </button>
                </div>
            </header>

            {/* Student Search Section */}
            <div className="filter-section">
                <h3 className="filter-section-title">🔍 Search Student</h3>
                <StudentSearchBar isCompact={true} />
            </div>

            {/* Two-column filter row */}
            <div className="dual-filter-row">
                {/* Class Browse Section - half width */}
                <div className="filter-section filter-section-half">
                    <h3 className="filter-section-title">📚 Browse by Class</h3>
                    <div className="class-filter-controls">
                        <FilterBar 
                            activeFilter={classTypeFilter}
                            onFilterChange={setClassTypeFilter}
                        />
                        <input
                            type="text"
                            className="search-input-simple"
                            placeholder="Filter classes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Special Students Filter - half width */}
                <div className="filter-section filter-section-half">
                    <h3 className="filter-section-title">⚠️ Special Students</h3>
                    <select
                        className="special-filter-select"
                        value={specialFilter}
                        onChange={(e) => setSpecialFilter(e.target.value)}
                    >
                        <option value="">— Select category —</option>
                        <option value="expelled">Expelled Students</option>
                        <option value="inactive">Inactive Students</option>
                    </select>
                    {specialFilter && (
                        <p className="special-filter-hint">
                            {specialLoading ? 'Loading…' : `${specialStudents.length} student(s) found`}
                        </p>
                    )}
                </div>
            </div>

            {/* Total Students Count Bar */}
            <div className="total-students-bar">
                <span className="total-students-text">Total Students: {totalStudents}</span>
            </div>

            {/* Special Students List */}
            {specialFilter && (
                <div className="special-students-section">
                    <h3 className="special-students-title">
                        {specialFilter === 'expelled' ? '🚫 Expelled Students' : '💤 Inactive Students'}
                    </h3>
                    {specialLoading && (
                        <div className="special-loading"><div className="spinner"></div><span>Loading…</span></div>
                    )}
                    {specialError && (
                        <div className="alert alert-error"><p>{specialError}</p></div>
                    )}
                    {!specialLoading && !specialError && specialStudents.length === 0 && (
                        <p className="special-empty">No {specialFilter === 'expelled' ? 'expelled' : 'inactive'} students found.</p>
                    )}
                    <div className="special-students-grid">
                        {specialStudents.map(student => (
                            <div key={student.id} className="special-student-card">
                                <div className="special-student-info">
                                    <span className="special-student-name">{student.name}</span>
                                    <span className="special-student-meta">Father: {student.father_name || student.father_guardian_name || '—'}</span>
                                    <span className="special-student-meta">Class: {student.class_name || '—'}</span>
                                    <span className="special-student-meta">Section: {student.section_name || '—'}</span>
                                </div>
                                <button
                                    className="special-student-delete-btn"
                                    title="Delete student permanently"
                                    onClick={() => handleDeleteSpecialStudent(student.id)}
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Class Grid - Always visible below filters */}
            <div className="compact-classes-grid">
                {filteredClasses.length === 0 ? (
                    <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                        <p>{searchTerm ? 'No classes found matching your search.' : `No ${classTypeFilter === 'ALL' ? '' : classTypeFilter.toLowerCase()} classes found.`}</p>
                    </div>
                ) : (
                    filteredClasses.map((cls) => (
                        <CompactClassCard
                            key={`${cls.id}-${cls.student_count}`}
                            classData={cls}
                            variant="student"
                        />
                    ))
                )}
            </div>

            <CSVImportModal
                isOpen={showImportModal}
                onClose={() => {
                    setShowImportModal(false)
                    // Refresh classes to update student counts
                    setRefreshKey(prev => prev + 1)
                }}
            />

            <PrintStudentsModal
                isOpen={showPrintModal}
                onClose={() => setShowPrintModal(false)}
            />
        </div>
    )
}

export default StudentDashboard
