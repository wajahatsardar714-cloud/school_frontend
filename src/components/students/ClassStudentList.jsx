import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { studentService } from '../../services/studentService'
import { classService, sectionService } from '../../services/classService'
import { useFetch } from '../../hooks/useApi'
import './Students.css'

const ClassStudentList = () => {
    const { classId } = useParams()
    const navigate = useNavigate()
    const [activeSection, setActiveSection] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')

    // Fetch class details
    const { data: classData } = useFetch(
        () => classService.getById(classId),
        [classId],
        { enabled: !!classId }
    )

    // Fetch sections for this class
    const { data: sectionsResponse } = useFetch(
        () => sectionService.list(classId),
        [classId],
        { enabled: !!classId }
    )

    // Fetch students for this class/section
    const { data: studentsResponse, loading, error } = useFetch(
        () => studentService.list({
            class_id: classId,
            section_id: activeSection,
            is_active: statusFilter === 'ACTIVE' ? true : (statusFilter === 'INACTIVE' ? false : undefined),
            is_expelled: statusFilter === 'EXPELLED' ? true : undefined
        }),
        [classId, activeSection, statusFilter],
        { enabled: !!classId }
    )

    const sections = sectionsResponse?.data || []
    const students = studentsResponse?.data || []

    // Final filtering by search term (local)
    const filteredStudents = useMemo(() => {
        if (!searchTerm) return students
        const lowerSearch = searchTerm.toLowerCase()
        return students.filter(s =>
            s.name.toLowerCase().includes(lowerSearch) ||
            s.roll_no?.toLowerCase().includes(lowerSearch) ||
            s.phone?.includes(searchTerm)
        )
    }, [students, searchTerm])

    if (!classId) {
        return (
            <div className="students-container">
                <div className="alert alert-error">
                    <p>No class selected. Please go back to the dashboard.</p>
                    <Link to="/students" className="btn-secondary">Go to Dashboard</Link>
                </div>
            </div>
        )
    }

    if (loading && !students.length) {
        return (
            <div className="students-container">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading class intake...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="students-container">
            <header className="students-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Link to="/students" className="btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>← Back</Link>
                        <h1>{classData?.data?.name || 'Class Students'}</h1>
                    </div>
                    <p className="student-sub-info">Viewing students for {classData?.data?.name}. Total: {students.length}</p>
                </div>
                <div className="header-actions">
                    <Link to="/admission/new-form" className="btn-primary">
                        + Quick Add
                    </Link>
                </div>
            </header>

            <div className="list-controls">
                <div className="section-tabs">
                    <button
                        className={`section-tab ${activeSection === null ? 'active' : ''}`}
                        onClick={() => setActiveSection(null)}
                    >
                        All Sections
                    </button>
                    {sections.map(s => (
                        <button
                            key={s.id}
                            className={`section-tab ${activeSection === s.id ? 'active' : ''}`}
                            onClick={() => setActiveSection(s.id)}
                        >
                            Section {s.name}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '300px' }}>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by name, roll no..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="EXPELLED">Expelled</option>
                    </select>
                </div>
            </div>

            <div className="student-table-container">
                {error ? (
                    <div className="alert alert-error">{error.message}</div>
                ) : filteredStudents.length === 0 ? (
                    <div className="empty-state">
                        <p>No students found in this {activeSection ? 'section' : 'class'}.</p>
                    </div>
                ) : (
                    <table className="student-table">
                        <thead>
                            <tr>
                                <th>Student Info</th>
                                <th>Roll No</th>
                                <th>Section</th>
                                <th>Parent/Guardian</th>
                                <th>Status</th>
                                <th>Contact</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map(student => (
                                <tr
                                    key={student.id}
                                    className="student-row"
                                    onClick={() => navigate(`/students/${student.id}`)}
                                >
                                    <td>
                                        <div className="student-cell-info">
                                            <div className="student-avatar-small">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <span className="student-name-main">{student.name}</span>
                                                <span className="student-sub-info">{student.gender || 'Not specified'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="student-name-main">{student.roll_no || '-'}</span>
                                    </td>
                                    <td>
                                        <span className="class-type-badge">{student.current_section_name || 'N/A'}</span>
                                    </td>
                                    <td>
                                        <div className="student-sub-info">
                                            <span style={{ color: '#10b981', fontWeight: 500 }}>{student.phone || '-'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge-status ${student.is_expelled ? 'badge-expelled' : (student.is_active ? 'badge-active' : 'badge-inactive')}`}>
                                            {student.is_expelled ? 'Expelled' : (student.is_active ? 'Active' : 'Inactive')}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="student-sub-info">{student.phone || '-'}</span>
                                    </td>
                                    <td>
                                        <button className="btn-secondary" style={{ fontSize: '0.8rem' }}>Details</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

export default ClassStudentList
