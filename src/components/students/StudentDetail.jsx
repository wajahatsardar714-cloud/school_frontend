import React, { useState, useEffect, useCallback, memo, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { studentService } from '../../services/studentService'
import { feePaymentService } from '../../services/feeService'
import { classService, sectionService } from '../../services/classService'
import { useFetch, useMutation } from '../../hooks/useApi'
import { sortClassesBySequence } from '../../utils/classSorting'
import DocumentUpload from '../DocumentUpload'
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from '../../utils/documentUtils'
import './Students.css'

// Image Preview Component - Memoized to prevent infinite re-renders
const ImagePreview = memo(({ doc }) => {
    const [imageSrc, setImageSrc] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        let isMounted = true
        let objectUrl = null

        const loadImage = async () => {
            if (!doc?.id) {
                setError(true)
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                const blob = await studentService.downloadDocument(doc.id)
                
                if (isMounted) {
                    objectUrl = URL.createObjectURL(blob)
                    setImageSrc(objectUrl)
                    setError(false)
                }
            } catch (err) {
                console.error('Failed to load image preview:', err)
                if (isMounted) {
                    setError(true)
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        loadImage()

        // Cleanup function
        return () => {
            isMounted = false
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl)
            }
        }
    }, [doc?.id]) // Only depend on doc.id

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%',
                color: '#64748b'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>⏳</div>
                    <span style={{ fontSize: '0.7rem' }}>Loading...</span>
                </div>
            </div>
        )
    }

    if (error || !imageSrc) {
        return (
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🖼️</div>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Image Preview</span>
            </div>
        )
    }

    return (
        <img 
            src={imageSrc}
            alt={doc.file_name}
            style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
            }}
            onError={() => setError(true)}
        />
    )
})

const StudentDetail = () => {
    const { studentId } = useParams()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('overview')

    // Modal states
    const [showStatusModal, setShowStatusModal] = useState(false)
    const [statusAction, setStatusAction] = useState(null) // 'activate' | 'deactivate' | 'expel' | 'clearExpulsion'

    const [showEnrollmentModal, setShowEnrollmentModal] = useState(false)
    const [enrollmentAction, setEnrollmentAction] = useState(null) // 'promote' | 'transfer'

    // Permanent delete modal (replaces Withdraw)
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    const [showEditModal, setShowEditModal] = useState(false)
    const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false)
    const [selectedDocumentType, setSelectedDocumentType] = useState(DOCUMENT_TYPES.CUSTOM)

    // Additional states for document modals (placeholder implementations)
    const [showDocEditModal, setShowDocEditModal] = useState(false)  
    const [showDocDeleteModal, setShowDocDeleteModal] = useState(false)
    const [selectedDoc, setSelectedDoc] = useState(null)
    const [docEditType, setDocEditType] = useState('')
    const [updatingDoc, setUpdatingDoc] = useState(false)
    const [deletingDoc, setDeletingDoc] = useState(false)
    const [editFormData, setEditFormData] = useState({
        name: '',
        phone: '',
        address: '',
        caste: '',
        previous_school: '',
        bay_form: '',
        yearly_package_amount: ''
    })

    // Fetch student details
    const { data: studentResponse, loading: studentLoading, error: studentError, refetch: refetchStudent } = useFetch(
        () => studentService.getById(studentId),
        [studentId],
        { enabled: !!studentId }
    )

    // (mutation)
    const { execute: updateStudent, loading: updating } = useMutation(
        (data) => studentService.update(studentId, data),
        {
            onSuccess: () => {
                refetchStudent();
                setShowEditModal(false);
            }
        }
    )

    const openEditModal = () => {
        const s = studentResponse?.data || {}
        setEditFormData({
            name: s.name || '',
            phone: s.phone || '',
            address: s.address || '',
            caste: s.caste || '',
            previous_school: s.previous_school || '',
            bay_form: s.bay_form || '',
            yearly_package_amount: currentYearlyPackage || ''
        })
        setShowEditModal(true)
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        try {
            const { yearly_package_amount, ...studentData } = editFormData
            await updateStudent(studentData)
            // If college student and yearly package is set, create/update the voucher
            if (isCollegeStudent && yearly_package_amount && parseFloat(yearly_package_amount) > 0) {
                try {
                    await studentService.setYearlyPackage(studentId, parseFloat(yearly_package_amount))
                } catch (pkgError) {
                    alert(pkgError.message || 'Student saved but failed to set yearly package')
                }
            }
        } catch (error) {
            alert(error.message || 'Failed to update student')
        }
    }

    // Status mutations
    const { execute: activateStudent, loading: activating } = useMutation(
        () => studentService.activate(studentId),
        { onSuccess: () => { refetchStudent(); setShowStatusModal(false); } }
    )

    const { execute: deactivateStudent, loading: deactivating } = useMutation(
        () => studentService.deactivate(studentId),
        { onSuccess: () => { refetchStudent(); setShowStatusModal(false); } }
    )

    const { execute: expelStudent, loading: expelling } = useMutation(
        () => studentService.expel(studentId),
        { onSuccess: () => { refetchStudent(); setShowStatusModal(false); } }
    )

    const { execute: clearExpulsion, loading: clearingExpulsion } = useMutation(
        () => studentService.clearExpulsion(studentId),
        { onSuccess: () => { refetchStudent(); setShowStatusModal(false); } }
    )

    // Permanently delete student (triggered by Withdraw button)
    const { execute: deleteStudent, loading: deleting } = useMutation(
        () => studentService.delete(studentId),
        {
            onSuccess: () => {
                setShowDeleteModal(false)
                navigate('/students')
            }
        }
    )

    const handleDeleteStudent = async () => {
        try {
            await deleteStudent()
        } catch (error) {
            alert(error.message || 'Failed to delete student')
        }
    }

    const handleStatusAction = async () => {
        try {
            switch (statusAction) {
                case 'activate': await activateStudent(); break;
                case 'deactivate': await deactivateStudent(); break;
                case 'expel': await expelStudent(); break;
                case 'clearExpulsion': await clearExpulsion(); break;
                default: break;
            }
        } catch (error) {
            console.error(`Error during ${statusAction}:`, error)
            alert(error.message || `Failed to ${statusAction} student`)
        }
    }
    const { execute: promoteStudent, loading: promoting } = useMutation(
        (data) => studentService.promote(studentId, data),
        { onSuccess: () => { refetchStudent(); setShowEnrollmentModal(false); } }
    )

    const { execute: transferStudent, loading: transferring } = useMutation(
        (data) => studentService.transfer(studentId, data),
        { onSuccess: () => { refetchStudent(); setShowEnrollmentModal(false); } }
    )

    // Data for modals
    const [selectedClass, setSelectedClass] = useState('')
    const [selectedSection, setSelectedSection] = useState('')

    const { data: classesData } = useFetch(() => classService.list(), [])
    const { data: sectionsData } = useFetch(
        () => sectionService.list(selectedClass),
        [selectedClass],
        { enabled: !!selectedClass }
    )

    // Fetch class fee when a class is selected (shown in promote/transfer modal)
    const { data: classFeeData } = useFetch(
        () => classService.getFeeStructure(selectedClass),
        [selectedClass],
        { enabled: !!selectedClass }
    )

    // Filter classes based on enrollment action and student type
    const availableClasses = useMemo(() => {
        const classes = sortClassesBySequence(classesData?.data || [])
        
        if (enrollmentAction === 'promote' && isCollegeStudent) {
            // College students can only be promoted to other college classes
            return classes.filter(c => c.class_type === 'COLLEGE')
        }
        
        // For school students promoting or any transfer, show all classes
        return classes
    }, [classesData, enrollmentAction, isCollegeStudent])

    const handleEnrollmentAction = async (e) => {
        e.preventDefault()
        try {
            if (enrollmentAction === 'promote') {
                await promoteStudent({
                    class_id: selectedClass,
                    section_id: selectedSection,
                    force: true  // Always allow; outstanding dues carry forward to next voucher
                })
            } else if (enrollmentAction === 'transfer') {
                await transferStudent({
                    class_id: selectedClass,
                    section_id: selectedSection
                })
            }
        } catch (error) {
            alert(error.message || `Failed to ${enrollmentAction} student`)
        }
    }

    // Fetch fee history (only if financial tab is active or for summary)
    const { data: feeHistoryResponse } = useFetch(
        () => feePaymentService.getStudentHistory(studentId),
        [studentId],
        { enabled: !!studentId }
    )

    // Fetch current due
    const { data: dueResponse } = useFetch(
        () => feePaymentService.getStudentDue(studentId),
        [studentId],
        { enabled: !!studentId }
    )

    // Fetch documents — expose refetch so upload success can refresh the list
    const { data: docsResponse, refetch: refetchDocs } = useFetch(
        () => studentService.getDocuments(studentId),
        [studentId],
        { enabled: !!studentId }
    )

    const student = studentResponse?.data || {}
    const feeHistory = feeHistoryResponse?.data?.history || feeHistoryResponse?.history || []
    const dueInfo = dueResponse?.data || { total_due: 0 }

    // Derive yearly package from fee history for college students
    const currentYearlyPackage = useMemo(() => {
        if (!feeHistory.length) return null
        const yearlyVoucher = feeHistory.find(v => 
            v.items?.some(i => i.item_type === 'YEARLY_PACKAGE')
        )
        if (!yearlyVoucher) return null
        const pkgItem = yearlyVoucher.items.find(i => i.item_type === 'YEARLY_PACKAGE')
        return pkgItem ? parseFloat(pkgItem.amount) : null
    }, [feeHistory])

    const isCollegeStudent = student?.current_enrollment?.class_type === 'COLLEGE'

    // Derive documents safely — depend on the raw response value, not the derived `student` object
    // (which recreates `{}` every render and makes the dep unstable)
    const docsArray = docsResponse?.data?.documents
    const studentDocsArray = studentResponse?.data?.documents
    const documents = React.useMemo(() => {
        if (Array.isArray(docsArray)) return docsArray
        if (Array.isArray(studentDocsArray)) return studentDocsArray
        return []
    }, [docsArray, studentDocsArray])

    // Memoize document handlers to prevent re-renders
    const handleViewDocument = useCallback(async (doc) => {
        if (!doc?.id) {
            alert('Invalid document')
            return
        }
        
        try {
            const docId = doc.id
            const fileName = doc.file_name || 'document'

            const blob = await studentService.downloadDocument(docId)
            const actualMimeType = blob.type
            const objectUrl = window.URL.createObjectURL(blob)

            const isViewable = actualMimeType.startsWith('image/') ||
                actualMimeType === 'application/pdf' ||
                actualMimeType.startsWith('text/')

            if (isViewable) {
                const newWindow = window.open('', '_blank')
                if (newWindow) {
                    newWindow.location.href = objectUrl
                    newWindow.document.title = fileName
                } else {
                    alert('Please allow popups to view documents.')
                }
                setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60000)
            } else {
                const link = document.createElement('a')
                link.href = objectUrl
                link.setAttribute('download', fileName)
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000)
            }
        } catch (error) {
            console.error('Error viewing document:', error)
            alert('Failed to view document.')
        }
    }, [])

    // Handle document upload success — refetch docs list in-place, no full page reload
    const handleDocumentUploadSuccess = useCallback(() => {
        setShowDocumentUploadModal(false)
        refetchDocs()
    }, [refetchDocs])

    const handleDocumentUploadError = useCallback((error) => {
        console.error('Document upload failed:', error)
        alert('Failed to upload document. Please try again.')
    }, [])

    // Placeholder functions to prevent crashes
    const handleUpdateDoc = (e) => {
        e.preventDefault()
        alert('Document edit functionality is not yet implemented.')
    }

    const handleDeleteDoc = () => {
        alert('Document delete functionality is not yet implemented.')
    }

    const handleDownloadDocument = useCallback(async (doc, e) => {
        if (e) e.stopPropagation()
        
        if (!doc?.id) {
            alert('Invalid document')
            return
        }
        
        try {
            const docId = doc.id
            const fileName = doc.file_name || 'document'

            const blob = await studentService.downloadDocument(docId)
            const objectUrl = window.URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.href = objectUrl
            link.setAttribute('download', fileName)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(objectUrl)
        } catch (error) {
            console.error('Error downloading document:', error)
            alert('Failed to download document. Please try again.')
        }
    }, [])

    if (studentLoading) {
        return (
            <div className="students-container">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Gathering student profile...</p>
                </div>
            </div>
        )
    }

    if (studentError) {
        return (
            <div className="students-container">
                <div className="alert alert-error">
                    <p>Failed to load profile: {studentError.message}</p>
                    <Link 
                        to="/students" 
                        className="btn-primary" 
                        style={{ marginTop: '1rem', display: 'inline-block' }}
                    >
                        ← Back to Students
                    </Link>
                </div>
            </div>
        )
    }

    // Check if student data exists
    if (!studentLoading && (!student || !student.id)) {
        return (
            <div className="students-container">
                <div className="alert alert-error">
                    <p>Student not found</p>
                    <Link 
                        to="/students" 
                        className="btn-primary" 
                        style={{ marginTop: '1rem', display: 'inline-block' }}
                    >
                        ← Back to Students
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="students-container">
            {/* Document Edit Modal */}
            {showDocEditModal && (
                <div className="modal-overlay" onClick={() => setShowDocEditModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Edit Document Type</h3>
                            <button className="modal-close" onClick={() => setShowDocEditModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleUpdateDoc}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Document Type</label>
                                    <select
                                        value={docEditType}
                                        onChange={(e) => setDocEditType(e.target.value)}
                                        required
                                        className="form-control"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                    >
                                        <option value="PHOTO">PHOTO</option>
                                        <option value="BAY_FORM">BAY_FORM</option>
                                        <option value="FATHER_CNIC">FATHER_CNIC</option>
                                        <option value="BIRTH_CERTIFICATE">BIRTH_CERTIFICATE</option>
                                        <option value="CUSTOM">CUSTOM</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowDocEditModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={updatingDoc}>
                                    {updatingDoc ? 'Saving...' : 'Update Type'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Document Delete Modal */}
            {showDocDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDocDeleteModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Delete Document</h3>
                            <button className="modal-close" onClick={() => setShowDocDeleteModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete <strong>{selectedDoc?.file_name}</strong>?</p>
                            <p style={{ color: '#e53e3e', fontSize: '0.8rem', marginTop: '0.5rem' }}>This action cannot be undone.</p>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowDocDeleteModal(false)}>Cancel</button>
                            <button className="btn-danger" onClick={handleDeleteDoc} disabled={deletingDoc}>
                                {deletingDoc ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="students-header">
                <div>
                    <Link
                        to={student.current_enrollment?.class_id || student.class_id ? `/students/class/${student.current_enrollment?.class_id || student.class_id}` : '/students'}
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.8rem' }}
                    >
                        ← Back to {student.current_enrollment?.class_name || 'Class'}
                    </Link>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={openEditModal}>Edit Profile</button>
                    <button className="btn-primary">Print Card</button>
                </div>
            </header>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3>Edit Student Profile</h3>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div className="modal-body">
                                <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            value={editFormData.name}
                                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                            required
                                            className="form-control"
                                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>CNIC / B-Form</label>
                                        <input
                                            type="text"
                                            value={editFormData.bay_form}
                                            onChange={(e) => setEditFormData({ ...editFormData, bay_form: e.target.value })}
                                            className="form-control"
                                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone</label>
                                        <input
                                            type="text"
                                            value={editFormData.phone}
                                            onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                            className="form-control"
                                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Caste</label>
                                        <input
                                            type="text"
                                            value={editFormData.caste}
                                            onChange={(e) => setEditFormData({ ...editFormData, caste: e.target.value })}
                                            className="form-control"
                                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label>Previous School</label>
                                        <input
                                            type="text"
                                            value={editFormData.previous_school}
                                            onChange={(e) => setEditFormData({ ...editFormData, previous_school: e.target.value })}
                                            className="form-control"
                                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label>Address</label>
                                        <textarea
                                            value={editFormData.address}
                                            onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                                            className="form-control"
                                            rows="2"
                                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                                        ></textarea>
                                    </div>
                                    {isCollegeStudent && (
                                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                            <label>Yearly Package (Rs.)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={editFormData.yearly_package_amount}
                                                onChange={(e) => setEditFormData({ ...editFormData, yearly_package_amount: e.target.value })}
                                                className="form-control"
                                                placeholder="Enter yearly package amount"
                                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                                            />
                                            {currentYearlyPackage ? (
                                                <small style={{ color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                                                    Current: Rs. {currentYearlyPackage.toLocaleString()} — editing will update the existing voucher
                                                </small>
                                            ) : (
                                                <small style={{ color: '#38a169', marginTop: '0.25rem', display: 'block' }}>
                                                    A yearly fee voucher will be auto-created on save
                                                </small>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={updating}>
                                    {updating ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Status Confirmation Modal */}
            {showStatusModal && (
                <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Confirm Action</h3>
                            <button className="modal-close" onClick={() => setShowStatusModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to <strong>{statusAction === 'clearExpulsion' ? 'clear expulsion for' : statusAction}</strong> this student?</p>
                            {statusAction === 'expel' && (
                                <p className="alert alert-error" style={{ fontSize: '0.8rem', marginTop: '1rem' }}>
                                    Warning: Expelling a student will deactivate their account and end their current enrollment.
                                </p>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowStatusModal(false)}>Cancel</button>
                            <button
                                className={`btn-${statusAction === 'expel' ? 'danger' : 'primary'}`}
                                onClick={handleStatusAction}
                                disabled={activating || deactivating || expelling || clearingExpulsion}
                            >
                                {activating || deactivating || expelling || clearingExpulsion ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Enrollment Modal (Promote / Transfer) */}
            {showEnrollmentModal && (
                <div className="modal-overlay" onClick={() => setShowEnrollmentModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>{enrollmentAction === 'promote' ? '📤 Promote Student' : '📑 Transfer Student'}</h3>
                            <button className="modal-close" onClick={() => setShowEnrollmentModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleEnrollmentAction}>
                            <div className="modal-body">
                                {/* Current class info */}
                                {student.current_enrollment && (
                                    <div style={{ background: '#f0f4ff', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.88rem', color: '#4a5568' }}>
                                        <strong>Current:</strong> {student.current_enrollment.class_name} — {student.current_enrollment.section_name}
                                        {dueInfo.total_due > 0 && (
                                            <span style={{ marginLeft: '0.75rem', color: '#e53e3e', fontWeight: 600 }}>
                                                | Outstanding: Rs. {dueInfo.total_due?.toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {dueInfo.total_due > 0 && (
                                    <div style={{ background: '#fffbeb', border: '1px solid #f6e05e', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.83rem', color: '#744210' }}>
                                        ⚠️ <strong>Outstanding dues of Rs. {dueInfo.total_due?.toLocaleString()} will carry forward.</strong> The next voucher generated in the new class will include these dues as arrears plus the new class monthly fee.
                                    </div>
                                )}

                                {enrollmentAction === 'transfer' ? (
                                    /* Transfer: locked to current class */
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <label>Class (locked — transfers stay within the same class)</label>
                                        <div style={{ padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#f7fafc', color: '#4a5568', fontWeight: 600 }}>
                                            {student.current_enrollment?.class_name || '—'}
                                        </div>
                                    </div>
                                ) : (
                                    /* Promote: free class selection */
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <label>Select Target Class</label>
                                        <select
                                            value={selectedClass}
                                            onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(''); }}
                                            required
                                            className="form-control"
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                        >
                                            <option value="">-- Choose Class --</option>
                                            {availableClasses.map(c => (
                                                <option key={c.id} value={c.id}>{c.name} {isCollegeStudent && enrollmentAction === 'promote' ? '(College)' : ''}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Show new class fee for promote */}
                                {enrollmentAction === 'promote' && selectedClass && classFeeData?.data && (
                                    <div style={{ background: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: '6px', padding: '0.6rem 1rem', marginBottom: '1rem', fontSize: '0.83rem', color: '#276749' }}>
                                        💰 New class monthly fee: <strong>Rs. {(classFeeData.data.monthly_fee || classFeeData.data[0]?.monthly_fee || 0)?.toLocaleString()}</strong>
                                        {dueInfo.total_due > 0 && (
                                            <span> &nbsp;|&nbsp; First voucher total: <strong>Rs. {((classFeeData.data.monthly_fee || classFeeData.data[0]?.monthly_fee || 0) + (dueInfo.total_due || 0))?.toLocaleString()}</strong></span>
                                        )}
                                    </div>
                                )}

                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label>Select Target Section</label>
                                    <select
                                        value={selectedSection}
                                        onChange={(e) => setSelectedSection(e.target.value)}
                                        required
                                        className="form-control"
                                        disabled={!selectedClass}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                    >
                                        <option value="">-- Choose Section --</option>
                                        {sectionsData?.data?.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.student_count || 0} students)</option>
                                        ))}
                                    </select>
                                </div>

                                <p style={{ fontSize: '0.8rem', color: '#718096', marginTop: '0.5rem' }}>
                                    {enrollmentAction === 'promote'
                                        ? 'Monthly fee will be updated to the new class fee structure. Outstanding dues carry forward as arrears on the next voucher.'
                                        : 'Monthly fee and outstanding dues remain unchanged. Student will be placed at the next available serial number in the new section.'}
                                </p>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowEnrollmentModal(false)}>Cancel</button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={promoting || transferring || !selectedSection}
                                >
                                    {promoting || transferring ? 'Processing...' : enrollmentAction === 'promote' ? 'Promote' : 'Transfer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Permanent Delete Modal (Withdraw) */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                        <div className="modal-header">
                            <h3>⚠️ Withdraw & Delete Student</h3>
                            <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p>You are about to <strong>permanently delete</strong> <strong style={{ color: '#e53e3e' }}>{student.name}</strong> from the system.</p>
                            <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '6px', padding: '0.75rem 1rem', marginTop: '1rem', fontSize: '0.85rem', color: '#742a2a' }}>
                                <strong>This action cannot be undone.</strong> All records will be permanently removed:
                                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
                                    <li>Student enrolment &amp; class history</li>
                                    <li>All fee vouchers &amp; payment records</li>
                                    <li>All documents</li>
                                    <li>Guardian links</li>
                                </ul>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            <button
                                className="btn-danger"
                                onClick={handleDeleteStudent}
                                disabled={deleting}
                                style={{ background: '#e53e3e', color: 'white', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '6px', cursor: 'pointer' }}
                            >
                                {deleting ? 'Deleting...' : 'Yes, Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Upload Modal */}
            {showDocumentUploadModal && (
                <div className="modal-overlay" onClick={() => setShowDocumentUploadModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header">
                            <h3>Upload New Document</h3>
                            <button className="modal-close" onClick={() => setShowDocumentUploadModal(false)}>×</button>
                        </div>
                        <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label htmlFor="documentType" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Document Type
                                </label>
                                <select
                                    id="documentType"
                                    value={selectedDocumentType}
                                    onChange={(e) => setSelectedDocumentType(e.target.value)}
                                    className="form-control"
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.5rem', 
                                        borderRadius: '4px', 
                                        border: '1px solid #cbd5e0',
                                        backgroundColor: 'white'
                                    }}
                                >
                                    {Object.entries(DOCUMENT_TYPE_LABELS).map(([type, label]) => (
                                        <option key={type} value={type}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <DocumentUpload
                                studentId={studentId}
                                documentType={selectedDocumentType}
                                onUploadSuccess={handleDocumentUploadSuccess}
                                onUploadError={handleDocumentUploadError}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="student-profile-header">
                <div className="profile-avatar-large">
                    {student.name?.charAt(0)}
                </div>
                <div className="profile-main-info">
                    <h2>{student.name}</h2>
                    <div className="profile-badges">
                        <span className={`badge-status ${student.is_active ? 'badge-active' : 'badge-inactive'}`}>
                            {student.is_expelled ? 'Expelled' : (student.is_active ? 'Active' : 'Deactivated')}
                        </span>
                        <span className="class-type-badge">{student.current_enrollment?.class_name || 'N/A'} - {student.current_enrollment?.section_name || 'N/A'}</span>
                    </div>
                    <p style={{ marginTop: '1rem', color: '#718096' }}>
                        Registered since {new Date(student.created_at).toLocaleDateString()}
                    </p>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <p className="student-sub-info">Total Outstanding</p>
                    <h3 style={{ color: dueInfo.total_due > 0 ? '#e53e3e' : '#38a169', fontSize: '2rem', margin: 0 }}>
                        Rs. {dueInfo.total_due?.toLocaleString()}
                    </h3>
                </div>
            </div>

            <nav className="detail-tabs">
                <button className={`detail-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                <button className={`detail-tab ${activeTab === 'financial' ? 'active' : ''}`} onClick={() => setActiveTab('financial')}>Fee History</button>
                <button className={`detail-tab ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>Documents</button>
                <button className={`detail-tab ${activeTab === 'guardians' ? 'active' : ''}`} onClick={() => setActiveTab('guardians')}>Guardians</button>
            </nav>

            <div className="profile-content-grid">
                <div className="profile-main-column">
                    {activeTab === 'overview' && (
                        <div className="profile-card">
                            <h4>👤 Basic Information</h4>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Father's Name</label>
                                    <span>{student.guardians?.find(g => g.relation === 'Father')?.name || 'N/A'}</span>
                                </div>
                                <div className="info-item">
                                    <label>CNIC/B-Form</label>
                                    <span>{student.bay_form || 'N/A'}</span>
                                </div>
                                <div className="info-item">
                                    <label>Date of Birth</label>
                                    <span>{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div className="info-item">
                                    <label>Gender</label>
                                    <span>{student.gender}</span>
                                </div>
                                <div className="info-item">
                                    <label>Phone</label>
                                    <span>{student.phone || 'N/A'}</span>
                                </div>
                                <div className="info-item">
                                    <label>Address</label>
                                    <span>{student.address || 'N/A'}</span>
                                </div>
                                <div className="info-item">
                                    <label>Caste</label>
                                    <span>{student.caste || 'N/A'}</span>
                                </div>
                                <div className="info-item">
                                    <label>Previous School</label>
                                    <span>{student.previous_school || 'N/A'}</span>
                                </div>
                            </div>
                            {isCollegeStudent && (
                                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                                    <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem' }}>🎓 Yearly Package</h4>
                                    {currentYearlyPackage ? (
                                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Package Amount</label>
                                                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Rs. {currentYearlyPackage.toLocaleString()}</span>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Outstanding</label>
                                                <span style={{ fontSize: '1.1rem', fontWeight: 600, color: dueInfo.total_due > 0 ? '#e53e3e' : '#38a169' }}>
                                                    Rs. {(dueInfo.total_due || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p style={{ color: '#64748b', margin: 0, fontSize: '0.85rem' }}>
                                            No yearly package set. Click "Edit Profile" to assign one.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'financial' && (
                        <div className="profile-card">
                            <h4>💰 Payment History</h4>
                            <div className="student-table-container">
                                <table className="student-table">
                                    <thead>
                                        <tr>
                                            <th>Month</th>
                                            <th>Class</th>
                                            <th>Total</th>
                                            <th>Discount</th>
                                            <th>Net</th>
                                            <th>Paid</th>
                                            <th>Due</th>
                                            <th>Status</th>
                                            <th>Due Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {feeHistory.length === 0 ? (
                                            <tr><td colSpan="10" className="empty-state">No fee history found</td></tr>
                                        ) : (
                                            feeHistory.map(record => {
                                                const isOverdue = record.status !== 'PAID' && record.due_date && new Date(record.due_date) < new Date()
                                                return (
                                                    <tr key={record.voucher_id} className={isOverdue ? 'row-overdue' : ''}>
                                                        <td><strong>{new Date(record.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</strong></td>
                                                        <td>{record.class_name}</td>
                                                        <td>Rs. {record.total_fee?.toLocaleString()}</td>
                                                        <td>{record.discount_amount > 0 ? <span style={{ color: '#38a169' }}>-Rs. {record.discount_amount?.toLocaleString()}</span> : '-'}</td>
                                                        <td><strong>Rs. {record.net_amount?.toLocaleString()}</strong></td>
                                                        <td>Rs. {record.paid_amount?.toLocaleString()}</td>
                                                        <td><span style={{ color: record.due_amount > 0 ? '#e53e3e' : '#38a169', fontWeight: 600 }}>Rs. {record.due_amount?.toLocaleString()}</span></td>
                                                        <td><span className={`badge-status ${record.status === 'PAID' ? 'badge-active' : 'badge-inactive'}`}>{record.status} {isOverdue && '(Overdue)'}</span></td>
                                                        <td>{record.due_date ? <span style={{ color: isOverdue ? '#e53e3e' : 'inherit' }}>{new Date(record.due_date).toLocaleDateString()}</span> : '-'}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                                <button className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.3rem' }} onClick={() => window.open(`/fees/vouchers?id=${record.voucher_id}`, '_blank')}>👁️</button>
                                                                {record.status !== 'PAID' && <button className="btn-primary" style={{ fontSize: '0.7rem', padding: '0.3rem' }} onClick={() => window.location.href = `/fees/payments?voucher_id=${record.voucher_id}`}>💳</button>}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'documents' && (
                        <div className="profile-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.5rem' }}>📄</span>
                                    Student Documents
                                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal' }}>({documents.length || 0})</span>
                                </h4>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <button 
                                        className="btn-primary" 
                                        style={{ fontSize: '0.85rem', padding: '0.6rem 1.2rem', borderRadius: '6px' }}
                                        onClick={() => setShowDocumentUploadModal(true)}
                                    >
                                        📤 Upload New
                                    </button>
                                </div>
                            </div>
                            
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                                gap: '1rem',
                                marginTop: '1.5rem'
                            }}>
                                {documents.length === 0 ? (
                                    <div style={{ 
                                        gridColumn: '1 / -1',
                                        textAlign: 'center', 
                                        padding: '2rem',
                                        background: '#f8fafc',
                                        borderRadius: '8px',
                                        border: '1px dashed #cbd5e0'
                                    }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }}>📄</div>
                                        <p style={{ color: '#64748b', margin: 0 }}>No documents uploaded</p>
                                    </div>
                                ) : (
                                    documents.map(doc => {
                                        if (!doc || !doc.id) return null
                                        
                                        const isImage = doc.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                                        const isPDF = doc.file_name?.toLowerCase()?.includes('.pdf')
                                        
                                        return (
                                            <div key={doc.id} style={{
                                                background: 'white',
                                                borderRadius: '8px',
                                                border: '1px solid #e2e8f0',
                                                overflow: 'hidden',
                                                transition: 'box-shadow 0.2s ease',
                                                cursor: 'pointer'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                                            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                                            >
                                                {/* Document Preview */}
                                                <div 
                                                    onClick={() => handleViewDocument(doc)} 
                                                    style={{
                                                        height: '120px',
                                                        background: '#f8fafc',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        position: 'relative',
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    {isImage ? (
                                                        <ImagePreview doc={doc} />
                                                    ) : (
                                                        <div style={{ textAlign: 'center' }}>
                                                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                                                                {isPDF ? '📄' : '📋'}
                                                            </div>
                                                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                                                {isPDF ? 'PDF Document' : 'File'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Selection Checkbox */}

                                                </div>
                                                
                                                {/* Document Info */}
                                                <div style={{ padding: '1rem' }}>
                                                    <h6 style={{ 
                                                        margin: '0 0 0.25rem 0', 
                                                        fontWeight: 600, 
                                                        fontSize: '0.9rem',
                                                        overflow: 'hidden', 
                                                        textOverflow: 'ellipsis', 
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {doc.file_name}
                                                    </h6>
                                                    <p style={{ 
                                                        margin: '0 0 1rem 0', 
                                                        fontSize: '0.75rem', 
                                                        color: '#64748b'
                                                    }}>
                                                        {doc.document_type || 'Document'}
                                                    </p>
                                                    
                                                    {/* Action Buttons */}
                                                    <div style={{ 
                                                        display: 'flex',
                                                        gap: '0.5rem'
                                                    }}>
                                                        <button 
                                                            className="btn-secondary" 
                                                            style={{ 
                                                                fontSize: '0.75rem', 
                                                                padding: '0.4rem 0.8rem',
                                                                flex: 1,
                                                                border: '1px solid #e2e8f0'
                                                            }} 
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleViewDocument(doc)
                                                            }}
                                                        >
                                                            👁️ View
                                                        </button>
                                                        <button 
                                                            className="btn-secondary" 
                                                            style={{ 
                                                                fontSize: '0.75rem', 
                                                                padding: '0.4rem 0.8rem',
                                                                flex: 1,
                                                                border: '1px solid #e2e8f0'
                                                            }} 
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDownloadDocument(doc, e)
                                                            }}
                                                        >
                                                            📥 Download
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'guardians' && (
                        <div className="profile-card">
                            <h4>👨‍👩‍👦 Guardians</h4>
                            <div className="info-grid" style={{ gridTemplateColumns: '1fr' }}>
                                {(student.guardians || []).map(g => (
                                    <div key={g.id} style={{ padding: '1rem', border: '1px solid #edf2f7', borderRadius: '10px', marginBottom: '1rem' }}>
                                        <div className="info-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                                            <div className="info-item"><label>Name</label><span>{g.name}</span></div>
                                            <div className="info-item"><label>Relation</label><span>{g.relation}</span></div>
                                            <div className="info-item"><label>Phone</label><span>{g.phone}</span></div>
                                            <div className="info-item"><label>CNIC</label><span>{g.cnic || 'N/A'}</span></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="profile-sidebar">
                    <div className="profile-card" style={{ marginBottom: '1.5rem' }}>
                        <h4>🎓 Enrollment</h4>
                        <div className="info-item" style={{ marginBottom: '0.75rem' }}>
                            <label>Status</label>
                            <span className={`badge-status ${student.is_active ? 'badge-active' : 'badge-inactive'}`}>
                                {student.is_expelled ? 'Expelled' : (student.is_active ? 'Active' : 'Inactive')}
                            </span>
                        </div>
                        <div className="info-item" style={{ marginBottom: '0.75rem' }}>
                            <label>Roll No</label>
                            <span>{student.roll_no}</span>
                        </div>
                        <div className="info-item">
                            <label>Enrolled</label>
                            <span>{student.created_at ? new Date(student.created_at).toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>

                    <div className="profile-card" style={{ borderTop: '4px solid #4a6cf7', marginBottom: '1.5rem' }}>
                        <h4>⚡ Enrollment Actions</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <button className="btn-secondary" style={{ width: '100%', textAlign: 'left' }} onClick={() => { setEnrollmentAction('promote'); setSelectedClass(''); setSelectedSection(''); setShowEnrollmentModal(true); }} disabled={!student.is_active || student.is_expelled}>📤 Promote</button>
                            <button className="btn-secondary" style={{ width: '100%', textAlign: 'left' }} onClick={() => { setEnrollmentAction('transfer'); setSelectedClass(student.current_enrollment?.class_id ? String(student.current_enrollment.class_id) : ''); setSelectedSection(''); setShowEnrollmentModal(true); }} disabled={!student.is_active || student.is_expelled || !student.current_enrollment}>📑 Transfer</button>
                            <button className="btn-secondary" style={{ width: '100%', textAlign: 'left', color: '#e53e3e' }} onClick={() => setShowDeleteModal(true)}>⛔ Withdraw</button>
                        </div>
                    </div>

                    <div className="profile-card" style={{ borderTop: '4px solid #e53e3e' }}>
                        <h4>🔐 Status Management</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {student.is_expelled ? (
                                <button className="btn-primary" style={{ width: '100%', textAlign: 'left' }} onClick={() => { setStatusAction('clearExpulsion'); setShowStatusModal(true); }}>✅ Clear Expulsion</button>
                            ) : (
                                <>
                                    {student.is_active ? (
                                        <button className="btn-secondary" style={{ width: '100%', textAlign: 'left', color: '#b7791f' }} onClick={() => { setStatusAction('deactivate'); setShowStatusModal(true); }}>⏸️ Deactivate</button>
                                    ) : (
                                        <button className="btn-secondary" style={{ width: '100%', textAlign: 'left', color: '#38a169' }} onClick={() => { setStatusAction('activate'); setShowStatusModal(true); }}>▶️ Activate</button>
                                    )}
                                    <button className="btn-secondary" style={{ width: '100%', textAlign: 'left', color: '#e53e3e' }} onClick={() => { setStatusAction('expel'); setShowStatusModal(true); }}>🛑 Expel</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StudentDetail
