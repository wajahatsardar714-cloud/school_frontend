import { useState, useMemo, useEffect } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { studentService } from '../../services/studentService'
import { classService, sectionService } from '../../services/classService'
import { useFetch } from '../../hooks/useApi'
import CSVImportModal from '../common/CSVImportModal'
import './Students.css'

// Inline component to set/update annual package for a 0-fee student
const PackageInput = ({ student, onSaved }) => {
    const existing = student.yearly_package_amount || 0
    const [editing, setEditing] = useState(false)
    const [value, setValue] = useState(existing > 0 ? existing : '')
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        const amount = parseFloat(value)
        if (!amount || amount <= 0) { alert('Enter a valid package amount'); return }
        setSaving(true)
        try {
            await studentService.setYearlyPackage(student.id, amount)
            setEditing(false)
            onSaved()
        } catch (err) {
            alert('Failed to set package: ' + (err.message || 'Unknown error'))
        } finally {
            setSaving(false)
        }
    }

    if (editing) {
        return (
            <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                <input
                    type="number"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder="Amount"
                    style={{ width: '90px', padding: '0.3rem', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '0.85rem' }}
                    autoFocus
                />
                <button onClick={handleSave} disabled={saving} style={{ padding: '0.3rem 0.5rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                    {saving ? '...' : '✓'}
                </button>
                <button onClick={() => setEditing(false)} style={{ padding: '0.3rem 0.5rem', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
            </div>
        )
    }
    return (
        <span
            onClick={() => { setValue(existing > 0 ? existing : ''); setEditing(true) }}
            style={{ cursor: 'pointer', color: existing > 0 ? '#3b82f6' : '#9ca3af', fontSize: '0.85rem', textDecoration: 'underline dotted' }}
            title="Click to set annual package"
        >
            {existing > 0 ? `Rs. ${existing.toLocaleString()} /yr` : '+ Set Package'}
        </span>
    )
}

const ClassStudentList = () => {
    const { classId } = useParams()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [activeSection, setActiveSection] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [showImportModal, setShowImportModal] = useState(false)
    
    // Bulk selection states
    const [selectedStudents, setSelectedStudents] = useState(new Set())
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    
    // Editing state
    const [editingStudentId, setEditingStudentId] = useState(null)
    const [editFormData, setEditFormData] = useState({})
    const [isSaving, setIsSaving] = useState(false)

    // Check URL params for pre-selected section
    useEffect(() => {
        const sectionParam = searchParams.get('section')
        if (sectionParam) {
            setActiveSection(parseInt(sectionParam))
        }
    }, [searchParams])

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
    const [refreshKey, setRefreshKey] = useState(0)
    const { data: studentsResponse, loading, error } = useFetch(
        () => studentService.list({
            class_id: classId,
            section_id: activeSection,
            is_active: statusFilter === 'ACTIVE' ? true : (statusFilter === 'INACTIVE' ? false : undefined),
            is_expelled: statusFilter === 'EXPELLED' ? true : undefined
        }),
        [classId, activeSection, statusFilter, refreshKey],
        { enabled: !!classId }
    )

    // Debug logging
    useEffect(() => {
        console.log('🔍 ClassStudentList Debug:');
        console.log('  classId:', classId);
        console.log('  activeSection:', activeSection);
        console.log('  statusFilter:', statusFilter);
        console.log('  studentsResponse:', studentsResponse);
        console.log('  loading:', loading);
        console.log('  error:', error);
        if (studentsResponse) {
            console.log('  studentsResponse.data:', studentsResponse.data);
            console.log('  students count:', studentsResponse.data?.length || 0);
        }
    }, [classId, activeSection, statusFilter, studentsResponse, loading, error])

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

    // Group students by section when showing all sections
    const groupedStudents = useMemo(() => {
        if (activeSection !== null) {
            return null // Don't group when showing specific section
        }

        const groups = {}
        filteredStudents.forEach(student => {
            const sectionName = student.current_section_name || 'No Section'
            if (!groups[sectionName]) {
                groups[sectionName] = []
            }
            groups[sectionName].push(student)
        })

        // Sort section names and return array of {sectionName, students}
        return Object.keys(groups)
            .sort()
            .map(sectionName => ({
                sectionName,
                students: groups[sectionName].sort((a, b) => {
                    // Sort students by serial_number if available, otherwise by roll_no
                    const aSerial = a.serial_number || parseInt(a.roll_no) || 999999
                    const bSerial = b.serial_number || parseInt(b.roll_no) || 999999
                    return aSerial - bSerial
                })
            }))
    }, [filteredStudents, activeSection])
    
    // Bulk selection handlers
    const handleSelectAll = (checked) => {
        if (checked) {
            const studentIdentifiers = filteredStudents.map(s => ({
                name: s.name,
                roll_no: s.roll_no,
                phone: s.phone
            }))
            setSelectedStudents(new Set(studentIdentifiers.map(s => JSON.stringify(s))))
        } else {
            setSelectedStudents(new Set())
        }
    }
    
    const handleSelectStudent = (student, checked) => {
        const studentIdentifier = {
            name: student.name,
            roll_no: student.roll_no,
            phone: student.phone
        }
        const studentKey = JSON.stringify(studentIdentifier)
        const newSelected = new Set(selectedStudents)
        if (checked) {
            newSelected.add(studentKey)
        } else {
            newSelected.delete(studentKey)
        }
        setSelectedStudents(newSelected)
    }
    
    const handleBulkDelete = async () => {
        if (selectedStudents.size === 0) return
        
        setIsDeleting(true)
        try {
            // Convert selected student keys back to objects
            const studentIdentifiers = Array.from(selectedStudents).map(key => JSON.parse(key))
            console.log('🗑️ Attempting to delete students:', studentIdentifiers)
            console.log('📍 From class:', classId, 'section:', activeSection)
            
            // Send student identifiers with class/section context
            const response = await studentService.bulkDelete({
                student_identifiers: studentIdentifiers,
                class_id: parseInt(classId),
                section_id: activeSection ? parseInt(activeSection) : null
            })
            console.log('✅ Delete response:', response)
            
            // Clear selections and close modal
            setSelectedStudents(new Set())
            setShowDeleteModal(false)
            
            // Show success message with details
            const deletedCount = response.data?.deletedCount || 0
            const notFoundCount = response.data?.notFoundIds?.length || 0
            
            let message = `Successfully deleted ${deletedCount} student(s).`
            if (notFoundCount > 0) {
                message += ` ${notFoundCount} student(s) were not found in this class/section.`
            }
            alert(message)
            
            // Refresh the students list
            window.location.reload() // Simple refresh for now
            
        } catch (error) {
            console.error('❌ Bulk delete failed:', error)
            
            // Show detailed error message
            let errorMessage = 'Failed to delete selected students.'  
            if (error.response?.data?.message) {
                errorMessage += ` Error: ${error.response.data.message}`
            } else if (error.message) {
                errorMessage += ` Error: ${error.message}`
            }
            errorMessage += ' Please try again or contact support.'
            
            alert(errorMessage)
        } finally {
            setIsDeleting(false)
        }
    }
    
    // Edit handlers
    const handleEditClick = (student) => {
        setEditingStudentId(student.id)
        setEditFormData({
            name: student.name,
            father_name: student.father_name || student.father_guardian_name || '',
            phone: student.phone || '',
            individual_monthly_fee: student.individual_monthly_fee ?? student.effective_monthly_fee ?? student.class_monthly_fee ?? 0
        })
    }
    
    const handleCancelEdit = () => {
        setEditingStudentId(null)
        setEditFormData({})
    }
    
    const handleSaveEdit = async (studentId) => {
        setIsSaving(true)
        try {
            await studentService.updateBasicInfo(studentId, editFormData)
            alert('Student details updated successfully!')
            setEditingStudentId(null)
            setEditFormData({})
            window.location.reload() // Refresh to show updated data
        } catch (error) {
            console.error('Failed to update student:', error)
            alert('Failed to update student details. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }
    


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
                    {/* Checkbox & Delete functionality commented out
                    {selectedStudents.size > 0 && (
                        <>
                            <span className="selected-count">
                                {selectedStudents.size} selected
                            </span>
                            <button 
                                className="btn-danger"
                                onClick={() => setShowDeleteModal(true)}
                                style={{ marginRight: '0.5rem' }}
                            >
                                🗑️ Delete Selected
                            </button>
                        </>
                    )}
                    */}
                    {activeSection && (
                        <button 
                            className="btn-secondary"
                            onClick={() => setShowImportModal(true)}
                            style={{ marginRight: '0.5rem' }}
                        >
                            📁 Import CSV
                        </button>
                    )}
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
                ) : activeSection !== null ? (
                    // Show single section table
                    <table className="student-table">
                        <thead>
                            <tr>
                                {/* Checkbox column commented out
                                <th style={{ width: '50px' }}>
                                    <input 
                                        type="checkbox"
                                        checked={filteredStudents.length > 0 && selectedStudents.size === filteredStudents.length}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        style={{ transform: 'scale(1.2)' }}
                                    />
                                </th>
                                */}
                                <th>Sr No</th>
                                <th>Name</th>
                                <th>Father Name</th>
                                <th>Father's Contact Number</th>
                                <th>{classData?.data?.class_type === 'COLLEGE' ? 'Pending' : 'Monthly Fee'}</th>
                                <th style={{ width: '100px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map(student => {
                                const isEditing = editingStudentId === student.id
                                return (
                                <tr
                                    key={`${student.name}-${student.roll_no}`}
                                    className={`student-row ${selectedStudents.has(JSON.stringify({name: student.name, roll_no: student.roll_no, phone: student.phone})) ? 'selected' : ''}`}
                                >
                                    {/* Checkbox cell commented out
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <input 
                                            type="checkbox"
                                            checked={selectedStudents.has(JSON.stringify({name: student.name, roll_no: student.roll_no, phone: student.phone}))}
                                            onChange={(e) => handleSelectStudent(student, e.target.checked)}
                                            style={{ transform: 'scale(1.2)' }}
                                            disabled={isEditing}
                                        />
                                    </td>
                                    */}
                                    <td onClick={() => !isEditing && navigate(`/students/${student.id}`)}>
                                        <span className="student-name-main">{filteredStudents.indexOf(student) + 1}</span>
                                    </td>
                                    <td onClick={(e) => isEditing && e.stopPropagation()}>
                                        {isEditing ? (
                                            <input 
                                                type="text"
                                                value={editFormData.name}
                                                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                                                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                            />
                                        ) : (
                                            <span className="student-name-main" onClick={() => navigate(`/students/${student.id}`)}>{student.name}</span>
                                        )}
                                    </td>
                                    <td onClick={(e) => isEditing && e.stopPropagation()}>
                                        {isEditing ? (
                                            <input 
                                                type="text"
                                                value={editFormData.father_name}
                                                onChange={(e) => setEditFormData({...editFormData, father_name: e.target.value})}
                                                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                            />
                                        ) : (
                                            <span className="student-sub-info" onClick={() => navigate(`/students/${student.id}`)}>{student.father_name || student.father_guardian_name || '-'}</span>
                                        )}
                                    </td>
                                    <td onClick={(e) => isEditing && e.stopPropagation()}>
                                        {isEditing ? (
                                            <input 
                                                type="tel"
                                                value={editFormData.phone}
                                                onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                                                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                            />
                                        ) : (
                                            <span className="student-sub-info" onClick={() => navigate(`/students/${student.id}`)}>{student.phone || '-'}</span>
                                        )}
                                    </td>
                                    <td onClick={(e) => isEditing && e.stopPropagation()}>
                                        {classData?.data?.class_type === 'COLLEGE' ? (
                                            // College students - show pending amount or "Complete"
                                            <span 
                                                className={`student-sub-info ${student.pending_amount === 0 ? 'text-success' : 'text-danger'}`} 
                                                onClick={() => navigate(`/students/${student.id}`)}
                                                style={{ 
                                                    color: student.pending_amount === 0 ? '#059669' : '#dc2626',
                                                    fontWeight: student.pending_amount === 0 ? 'bold' : 'normal'
                                                }}
                                            >
                                                {student.pending_amount === 0 ? 'Complete' : `Rs. ${student.pending_amount.toLocaleString()}`}
                                            </span>
                                        ) : (
                                            // School students - show monthly fee; if 0 allow setting annual package
                                            (student.individual_monthly_fee ?? student.effective_monthly_fee ?? 0) === 0 ? (
                                                <PackageInput student={student} onSaved={() => setRefreshKey(k => k + 1)} />
                                            ) : isEditing ? (
                                                <input 
                                                    type="number"
                                                    value={editFormData.individual_monthly_fee}
                                                    onChange={(e) => setEditFormData({...editFormData, individual_monthly_fee: parseFloat(e.target.value) || 0})}
                                                    style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                                />
                                            ) : (
                                                <span className="student-sub-info" onClick={() => navigate(`/students/${student.id}`)}>
                                                    Rs. {(student.individual_monthly_fee ?? student.effective_monthly_fee ?? 0).toLocaleString()}
                                                </span>
                                            )
                                        )}
                                    </td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        {isEditing ? (
                                            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                                <button 
                                                    className="btn-success"
                                                    onClick={() => handleSaveEdit(student.id)}
                                                    disabled={isSaving}
                                                    style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', background: 'linear-gradient(135deg, #059669, #047857)' }}
                                                >
                                                    {isSaving ? '...' : '💾 Save'}
                                                </button>
                                                <button 
                                                    className="btn-secondary"
                                                    onClick={handleCancelEdit}
                                                    disabled={isSaving}
                                                    style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}
                                                >
                                                    ✕ Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <button 
                                                    className="btn-primary"
                                                    onClick={() => navigate(`/students/${student.id}`)}
                                                    style={{ fontSize: '1rem', padding: '0.4rem 0.7rem' }}
                                                >
                                                    Detail
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                ) : (
                    // Show grouped sections when activeSection is null
                    <div className="grouped-sections">
                        {groupedStudents?.map((sectionGroup, sectionIndex) => (
                            <div key={sectionGroup.sectionName} className="section-group">
                                <div className="section-header">
                                    <h3>{classData?.data?.name || 'Class'} - {sectionGroup.sectionName}</h3>
                                    <span className="section-student-count">({sectionGroup.students.length} students)</span>
                                </div>
                                
                                <table className="student-table">
                                    <thead>
                                        <tr>
                                            {/* Checkbox column commented out
                                            <th style={{ width: '50px' }}>
                                                <input 
                                                    type="checkbox"
                                                    checked={sectionGroup.students.every(student => 
                                                        selectedStudents.has(JSON.stringify({name: student.name, roll_no: student.roll_no, phone: student.phone}))
                                                    )}
                                                    onChange={(e) => {
                                                        sectionGroup.students.forEach(student => {
                                                            handleSelectStudent(student, e.target.checked)
                                                        })
                                                    }}
                                                    style={{ transform: 'scale(1.2)' }}
                                                />
                                            </th>
                                            */}
                                            <th>Sr No</th>
                                            <th>Name</th>
                                            <th>Father Name</th>
                                            <th>Father's Contact Number</th>
                                            <th>{classData?.data?.class_type === 'COLLEGE' ? 'Pending' : 'Monthly Fee'}</th>
                                            <th style={{ width: '100px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sectionGroup.students.map((student, studentIndex) => {
                                            const isEditing = editingStudentId === student.id
                                            return (
                                            <tr
                                                key={`${student.name}-${student.roll_no}`}
                                                className={`student-row ${selectedStudents.has(JSON.stringify({name: student.name, roll_no: student.roll_no, phone: student.phone})) ? 'selected' : ''}`}
                                            >
                                                {/* Checkbox cell commented out
                                                <td onClick={(e) => e.stopPropagation()}>
                                                    <input 
                                                        type="checkbox"
                                                        checked={selectedStudents.has(JSON.stringify({name: student.name, roll_no: student.roll_no, phone: student.phone}))}
                                                        onChange={(e) => handleSelectStudent(student, e.target.checked)}
                                                        style={{ transform: 'scale(1.2)' }}
                                                        disabled={isEditing}
                                                    />
                                                </td>
                                                */}
                                                <td onClick={() => !isEditing && navigate(`/students/${student.id}`)}>
                                                    <span className="student-name-main">{studentIndex + 1}</span>
                                                </td>
                                                <td onClick={(e) => isEditing && e.stopPropagation()}>
                                                    {isEditing ? (
                                                        <input 
                                                            type="text"
                                                            value={editFormData.name}
                                                            onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                                                            style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                                        />
                                                    ) : (
                                                        <span className="student-name-main" onClick={() => navigate(`/students/${student.id}`)}>{student.name}</span>
                                                    )}
                                                </td>
                                                <td onClick={(e) => isEditing && e.stopPropagation()}>
                                                    {isEditing ? (
                                                        <input 
                                                            type="text"
                                                            value={editFormData.father_name}
                                                            onChange={(e) => setEditFormData({...editFormData, father_name: e.target.value})}
                                                            style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                                        />
                                                    ) : (
                                                        <span className="student-sub-info" onClick={() => navigate(`/students/${student.id}`)}>{student.father_name || student.father_guardian_name || '-'}</span>
                                                    )}
                                                </td>
                                                <td onClick={(e) => isEditing && e.stopPropagation()}>
                                                    {isEditing ? (
                                                        <input 
                                                            type="tel"
                                                            value={editFormData.phone}
                                                            onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                                                            style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                                        />
                                                    ) : (
                                                        <span className="student-sub-info" onClick={() => navigate(`/students/${student.id}`)}>{student.phone || '-'}</span>
                                                    )}
                                                </td>
                                                <td onClick={(e) => isEditing && e.stopPropagation()}>
                                                    {classData?.data?.class_type === 'COLLEGE' ? (
                                                        // College students - show pending amount or "Complete"
                                                        <span 
                                                            className={`student-sub-info ${student.pending_amount === 0 ? 'text-success' : 'text-danger'}`} 
                                                            onClick={() => navigate(`/students/${student.id}`)}
                                                            style={{ 
                                                                color: student.pending_amount === 0 ? '#059669' : '#dc2626',
                                                                fontWeight: student.pending_amount === 0 ? 'bold' : 'normal'
                                                            }}
                                                        >
                                                            {student.pending_amount === 0 ? 'Complete' : `Rs. ${student.pending_amount.toLocaleString()}`}
                                                        </span>
                                                    ) : (
                                                        // School students - show monthly fee; if 0 allow setting annual package
                                                        (student.individual_monthly_fee ?? student.effective_monthly_fee ?? 0) === 0 ? (
                                                            <PackageInput student={student} onSaved={() => setRefreshKey(k => k + 1)} />
                                                        ) : isEditing ? (
                                                            <input 
                                                                type="number"
                                                                value={editFormData.individual_monthly_fee}
                                                                onChange={(e) => setEditFormData({...editFormData, individual_monthly_fee: parseFloat(e.target.value) || 0})}
                                                                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                                            />
                                                        ) : (
                                                            <span className="student-sub-info" onClick={() => navigate(`/students/${student.id}`)}>
                                                                Rs. {(student.individual_monthly_fee ?? student.effective_monthly_fee ?? 0).toLocaleString()}
                                                            </span>
                                                        )
                                                    )}
                                                </td>
                                                <td onClick={(e) => e.stopPropagation()}>
                                                    {isEditing ? (
                                                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                                            <button 
                                                                className="btn-success"
                                                                onClick={() => handleSaveEdit(student.id)}
                                                                disabled={isSaving}
                                                                style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', background: 'linear-gradient(135deg, #059669, #047857)' }}
                                                            >
                                                                {isSaving ? '...' : '💾 Save'}
                                                            </button>
                                                            <button 
                                                                className="btn-secondary"
                                                                onClick={handleCancelEdit}
                                                                disabled={isSaving}
                                                                style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}
                                                            >
                                                                ✕ Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                            {/* Edit button commented out
                                                            <button 
                                                                className="btn-warning"
                                                                onClick={() => handleEditClick(student)}
                                                                style={{ fontSize: '1rem', padding: '0.4rem 0.7rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                                                            >
                                                                ✏️
                                                            </button>
                                                            */}
                                                            <button 
                                                                className="btn-primary"
                                                                onClick={() => navigate(`/students/${student.id}`)}
                                                                style={{ fontSize: '1rem', padding: '0.4rem 0.7rem' }}
                                                            >
                                                                Detail
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )})}
                                    </tbody>
                                </table>
                                
                                {sectionIndex < groupedStudents.length - 1 && (
                                    <div className="section-divider"></div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <CSVImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImportSuccess={() => {
                    console.log('✅ CSV import successful, refreshing student list...')
                    setRefreshKey(prev => prev + 1) // Trigger refresh
                    setShowImportModal(false)
                }}
                preselectedClassId={classId}
                preselectedSectionId={activeSection}
            />

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>⚠️ Confirm Bulk Deletion</h2>
                            <button 
                                className="btn-icon" 
                                onClick={() => setShowDeleteModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="warning-message">
                                <p><strong>Warning:</strong> You are about to permanently delete <strong>{selectedStudents.size}</strong> student{selectedStudents.size > 1 ? 's' : ''} from the database.</p>
                                <p>This action will:</p>
                                <ul>
                                    <li>Remove all student records permanently</li>
                                    <li>Delete all associated data (fees, documents, etc.)</li>
                                    <li>Update class strength in all modules</li>
                                    <li><strong>This cannot be undone!</strong></li>
                                </ul>
                                <p>Are you absolutely sure you want to proceed?</p>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button 
                                className="btn-secondary"
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn-danger"
                                onClick={handleBulkDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : `Yes, Delete ${selectedStudents.size} Student${selectedStudents.size > 1 ? 's' : ''}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ClassStudentList
