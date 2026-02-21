import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { classService } from '../../services/classService'
import { useFetch } from '../../hooks/useApi'
import './Students.css'

const StudentDashboard = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [typeFilter, setTypeFilter] = useState('ALL') // ALL, SCHOOL, COLLEGE

    // Fetch all classes
    const { data: classesResponse, loading, error } = useFetch(
        () => classService.list(),
        [],
        { enabled: true }
    )

    const classes = classesResponse?.data || []

    // Filter classes based on search and type
    const filteredClasses = useMemo(() => {
        return classes.filter(c => {
            const matchesSearch = !searchTerm ||
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.class_type.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesType = typeFilter === 'ALL' || c.class_type === typeFilter

            return matchesSearch && matchesType
        })
    }, [classes, searchTerm, typeFilter])

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
                    <p className="student-sub-info">Select a class to view its students or search across all classes.</p>
                </div>
                <div className="header-actions">
                    <Link to="/admission/new-form" className="btn-primary">
                        + New Admission
                    </Link>
                </div>
            </header>

            <div className="list-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '0.4rem' }}>Search Classes</label>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by name or type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="form-group" style={{ width: '150px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '0.4rem' }}>Filter Type</label>
                    <select
                        className="form-control"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                    >
                        <option value="ALL">All Types</option>
                        <option value="SCHOOL">School</option>
                        <option value="COLLEGE">College</option>
                    </select>
                </div>
            </div>

            <div className="classes-grid">
                {filteredClasses.length === 0 ? (
                    <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                        <p>No classes found matching your search.</p>
                    </div>
                ) : (
                    filteredClasses.map((cls) => {
                        const estimatedCapacity = (parseInt(cls.section_count) || 1) * 40
                        const studentCount = parseInt(cls.student_count) || 0
                        const occupancyPercent = Math.min(Math.round((studentCount / estimatedCapacity) * 100), 100)
                        const statusColor = occupancyPercent > 90 ? '#e53e3e' : occupancyPercent > 70 ? '#ecc94b' : '#38a169'

                        return (
                            <Link
                                key={cls.id}
                                to={`/students/class/${cls.id}`}
                                className="class-card"
                                style={{ display: 'flex', flexDirection: 'column' }}
                            >
                                <div className="class-card-header">
                                    <div className="class-card-icon">📚</div>
                                    <span className={`class-type-badge ${cls.class_type.toLowerCase()}`}>
                                        {cls.class_type}
                                    </span>
                                </div>
                                <div className="class-card-body" style={{ flex: 1 }}>
                                    <h3>{cls.name}</h3>
                                    <p className="student-sub-info">
                                        {cls.section_count} sections, {cls.student_count} students.
                                    </p>

                                    <div className="capacity-indicator" style={{ marginTop: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.3rem' }}>
                                            <span>Occupancy: {occupancyPercent}%</span>
                                            <span>{studentCount}/{estimatedCapacity}</span>
                                        </div>
                                        <div style={{ width: '100%', height: '6px', background: '#edf2f7', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${occupancyPercent}%`, height: '100%', background: statusColor }}></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="class-card-footer">
                                    <span className={`badge-status ${cls.is_active !== false ? 'badge-active' : 'badge-inactive'}`}>
                                        {cls.is_active !== false ? 'Active' : 'Inactive'}
                                    </span>
                                    <span style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>Manage →</span>
                                </div>
                            </Link>
                        )
                    })
                )}
            </div>
        </div>
    )
}

export default StudentDashboard
