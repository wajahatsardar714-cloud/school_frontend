import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { classService } from '../../services/classService'
import { useFetch } from '../../hooks/useApi'
import './Students.css'

const StudentDashboard = () => {
    const [searchTerm, setSearchTerm] = useState('')

    // Fetch all classes
    const { data: classesResponse, loading, error } = useFetch(
        () => classService.list(),
        [],
        { enabled: true }
    )

    const classes = classesResponse?.data || []

    // Filter classes based on search
    const filteredClasses = useMemo(() => {
        if (!searchTerm) return classes
        return classes.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.class_type.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [classes, searchTerm])

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

            <div className="list-controls">
                <div className="form-group" style={{ flex: 1 }}>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search classes by name or type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="classes-grid">
                {filteredClasses.length === 0 ? (
                    <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                        <p>No classes found matching your search.</p>
                    </div>
                ) : (
                    filteredClasses.map((cls) => (
                        <Link
                            key={cls.id}
                            to={`/students/class/${cls.id}`}
                            className="class-card"
                        >
                            <div className="class-card-header">
                                <div className="class-card-icon">📚</div>
                                <span className={`class-type-badge ${cls.class_type.toLowerCase()}`}>
                                    {cls.class_type}
                                </span>
                            </div>
                            <div className="class-card-body">
                                <h3>{cls.name}</h3>
                                <p className="student-sub-info">
                                    {cls.section_count} sections, {cls.student_count} registered students.
                                </p>
                            </div>
                            <div className="class-card-footer">
                                <span className="badge-status badge-active">Active</span>
                                <span style={{ marginLeft: 'auto' }}>View Students ({cls.student_count}) →</span>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}

export default StudentDashboard
