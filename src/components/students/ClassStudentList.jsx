import { useState, useMemo, useEffect } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { studentService } from '../../services/studentService'
import { classService, sectionService } from '../../services/classService'
import { useFetch } from '../../hooks/useApi'
import CSVImportModal from '../common/CSVImportModal'
import './Students.css'

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
            phone: student.father_contact_number || student.phone || '',
            individual_monthly_fee: student.individual_monthly_fee || student.effective_monthly_fee || student.class_monthly_fee || 0
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
    
    const handleMarkFree = async () => {
        if (selectedStudents.size === 0) return
        
        const confirmed = window.confirm(
            `Are you sure you want to mark ${selectedStudents.size} student(s) as fee-free? ` +
            `No vouchers will be generated for these students.`
        )
        
        if (!confirmed) return
        
        try {
            const studentIdentifiers = Array.from(selectedStudents).map(key => JSON.parse(key))
            await studentService.markFree({
                student_identifiers: studentIdentifiers,
                class_id: parseInt(classId),
                section_id: activeSection ? parseInt(activeSection) : null
            })
            
            alert(`Successfully marked ${selectedStudents.size} student(s) as fee-free!`)
            setSelectedStudents(new Set())
            window.location.reload()
        } catch (error) {
            console.error('Failed to mark students as free:', error)
            alert('Failed to mark students as free. Please try again.')
        }
    }
    
    const handleUnmarkFree = async () => {
        if (selectedStudents.size === 0) return
        
        const confirmed = window.confirm(
            `Are you sure you want to unmark ${selectedStudents.size} student(s) as fee-free? ` +
            `Vouchers will be generated for these students going forward.`
        )
        
        if (!confirmed) return
        
        try {
            const studentIdentifiers = Array.from(selectedStudents).map(key => JSON.parse(key))
            await studentService.unmarkFree({
                student_identifiers: studentIdentifiers,
                class_id: parseInt(classId),
                section_id: activeSection ? parseInt(activeSection) : null
            })
            
            alert(`Successfully unmarked ${selectedStudents.size} student(s) as fee-free!`)
            setSelectedStudents(new Set())
            window.location.reload()
        } catch (error) {
            console.error('Failed to unmark students:', error)
            alert('Failed to unmark students. Please try again.')
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
                    {selectedStudents.size > 0 && (
                        <>
                            <span className="selected-count">
                                {selectedStudents.size} selected
                            </span>
                            <button 
                                className="btn-success"
                                onClick={handleMarkFree}
                                style={{ marginRight: '0.5rem', background: 'linear-gradient(135deg, #059669, #047857)' }}
                            >
                                ✅ Mark Free
                            </button>
                            <button 
                                className="btn-warning"
                                onClick={handleUnmarkFree}
                                style={{ marginRight: '0.5rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                            >
                                ↩️ Unmark Free
                            </button>
                            <button 
                                className="btn-danger"
                                onClick={() => setShowDeleteModal(true)}
                                style={{ marginRight: '0.5rem' }}
                            >
                                🗑️ Delete Selected
                            </button>
                        </>
                    )}
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
                ) : (
                    <table className="student-table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}>
                                    <input 
                                        type="checkbox"
                                        checked={filteredStudents.length > 0 && selectedStudents.size === filteredStudents.length}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        style={{ transform: 'scale(1.2)' }}
                                    />
                                </th>
                                <th>Sr No</th>
                                <th>Name</th>
                                <th>Father Name</th>
                                <th>Father's Contact Number</th>
                                <th>Fee</th>
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
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <input 
                                            type="checkbox"
                                            checked={selectedStudents.has(JSON.stringify({name: student.name, roll_no: student.roll_no, phone: student.phone}))}
                                            onChange={(e) => handleSelectStudent(student, e.target.checked)}
                                            style={{ transform: 'scale(1.2)' }}
                                            disabled={isEditing}
                                        />
                                    </td>
                                    <td onClick={() => !isEditing && navigate(`/students/${student.id}`)}>
                                        <span className="student-name-main">{student.roll_no || '-'}</span>
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
                                            <span className="student-sub-info" onClick={() => navigate(`/students/${student.id}`)}>{student.father_contact_number || student.phone || '-'}</span>
                                        )}
                                    </td>
                                    <td onClick={(e) => isEditing && e.stopPropagation()}>
                                        {isEditing ? (
                                            <input 
                                                type="number"
                                                value={editFormData.individual_monthly_fee}
                                                onChange={(e) => setEditFormData({...editFormData, individual_monthly_fee: parseFloat(e.target.value) || 0})}
                                                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                            />
                                        ) : (
                                            <span className="student-sub-info" onClick={() => navigate(`/students/${student.id}`)}>
                                                Rs. {(student.individual_monthly_fee || student.effective_monthly_fee || student.class_monthly_fee || 0).toLocaleString()}
                                                {student.is_fee_free && <span style={{ marginLeft: '0.5rem', fontSize: '12px', color: '#059669', fontWeight: 'bold' }}>FREE</span>}
                                            </span>
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
                                            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                                <button 
                                                    className="btn-warning"
                                                    onClick={() => handleEditClick(student)}
                                                    style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button 
                                                    className="btn-primary"
                                                    onClick={() => navigate(`/students/${student.id}`)}
                                                    style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}
                                                >
                                                    👁️ Detail
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                )}
            </div>

            <CSVImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
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
