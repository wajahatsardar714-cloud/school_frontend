import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { studentService } from '../../services/studentService'
import { feePaymentService } from '../../services/feeService'
import { useFetch } from '../../hooks/useApi'
import './Students.css'

const StudentDetail = () => {
    const { studentId } = useParams()
    const [activeTab, setActiveTab] = useState('overview')

    // Fetch student details
    const { data: studentResponse, loading: studentLoading, error: studentError, refetch: refetchStudent } = useFetch(
        () => studentService.getById(studentId),
        [studentId],
        { enabled: !!studentId }
    )

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

    // Fetch documents
    const { data: docsResponse } = useFetch(
        () => studentService.getDocuments(studentId),
        [studentId],
        { enabled: !!studentId }
    )

    const student = studentResponse?.data || {}
    const feeHistory = feeHistoryResponse?.data?.vouchers || []
    const dueInfo = dueResponse?.data || { total_due: 0 }
    const documents = docsResponse?.data?.documents || student.documents || []

    const handleViewDocument = async (doc) => {
        try {
            const docId = doc.id
            const fileName = doc.file_name

            // Fetch blob to decide how to handle it
            const blob = await studentService.downloadDocument(docId)
            const actualMimeType = blob.type
            const objectUrl = window.URL.createObjectURL(blob)

            // Viewable types: images, pdfs, common text files
            const isViewable = actualMimeType.startsWith('image/') ||
                actualMimeType === 'application/pdf' ||
                actualMimeType.startsWith('text/')

            if (isViewable) {
                // Open in new tab for viewing
                // We use a blank target and Noopener to be safe
                const newWindow = window.open('', '_blank')
                if (newWindow) {
                    newWindow.location.href = objectUrl
                    // Add a title if possible (browser dependent)
                    newWindow.document.title = fileName
                } else {
                    alert('Please allow popups to view documents.')
                }
                setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60000)
            } else {
                // Force download for non-viewable (doc, xls, etc.)
                const link = document.createElement('a')
                link.href = objectUrl
                link.setAttribute('download', fileName)
                document.body.appendChild(link)
                link.click()
                link.remove()
                window.URL.revokeObjectURL(objectUrl)
            }
        } catch (error) {
            console.error('Error viewing document:', error)
            alert('Failed to process document. Please try again.')
        }
    }

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
                </div>
            </div>
        )
    }

    return (
        <div className="students-container">
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
                    <button className="btn-secondary">Edit Profile</button>
                    <button className="btn-primary">Print Card</button>
                </div>
            </header>

            <div className="student-profile-header">
                <div className="profile-avatar-large">
                    {student.name?.charAt(0)}
                </div>
                <div className="profile-main-info">
                    <h2>{student.name}</h2>
                    <div className="profile-badges">
                        <span className={`badge-status ${student.is_active ? 'badge-active' : 'badge-inactive'}`}>
                            {student.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="class-type-badge">{student.current_enrollment?.class_name} - {student.current_enrollment?.section_name}</span>
                        <span className="class-type-badge">Roll: {student.roll_no}</span>
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
                            </div>
                        </div>
                    )}

                    {activeTab === 'financial' && (
                        <div className="profile-card">
                            <h4>💰 Recent Fee History</h4>
                            <div className="student-table-container">
                                <table className="student-table">
                                    <thead>
                                        <tr>
                                            <th>Month/Year</th>
                                            <th>Items</th>
                                            <th>Total</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {feeHistory.length === 0 ? (
                                            <tr><td colSpan="5" className="empty-state">No payment history found.</td></tr>
                                        ) : (
                                            feeHistory.map(v => (
                                                <tr key={v.id}>
                                                    <td><strong>{v.month} {v.year}</strong></td>
                                                    <td>{v.items?.length || 0} items</td>
                                                    <td>Rs. {v.total_amount?.toLocaleString()}</td>
                                                    <td>
                                                        <span className={`badge-status ${v.status === 'PAID' ? 'badge-active' : 'badge-inactive'}`}>
                                                            {v.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button className="btn-secondary" style={{ fontSize: '0.7rem' }}>Receipt</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'documents' && (
                        <div className="profile-card">
                            <h4>📄 Student Documents</h4>
                            <div className="classes-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                                {documents.length === 0 ? (
                                    <p className="empty-state">No documents uploaded yet.</p>
                                ) : (
                                    documents.map(doc => (
                                        <div
                                            key={doc.id}
                                            className="class-card"
                                            style={{ minHeight: 'auto', padding: '1rem', cursor: 'pointer' }}
                                            onClick={() => handleViewDocument(doc)}
                                        >
                                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
                                            <p style={{ fontWeight: 600, fontSize: '0.8rem', margin: 0 }}>{doc.file_name}</p>
                                            <span className="student-sub-info">{doc.document_type}</span>
                                        </div>
                                    ))
                                )}
                                <div className="class-card" style={{ border: '2px dashed #cbd5e0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '120px' }}>
                                    <span style={{ color: '#718096' }}>+ Upload Document</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'guardians' && (
                        <div className="profile-card">
                            <h4>👨‍👩‍👦 Guardians</h4>
                            <div className="info-grid" style={{ gridTemplateColumns: '1fr' }}>
                                {(student.guardians || []).map(g => (
                                    <div key={g.id} style={{ padding: '1rem', border: '1px solid #edf2f7', borderRadius: '10px' }}>
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <label>Name</label>
                                                <span>{g.name}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>Relation</label>
                                                <span>{g.relation}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>Contact</label>
                                                <span>{g.phone}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>CNIC</label>
                                                <span>{g.cnic || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="profile-sidebar">
                    <div className="profile-card" style={{ marginBottom: '1.5rem' }}>
                        <h4>🎓 Enrollment Details</h4>
                        <div className="info-item" style={{ marginBottom: '1rem' }}>
                            <label>Current Status</label>
                            <span className={`badge-status ${student.is_active ? 'badge-active' : 'badge-inactive'}`}>
                                {student.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="info-item" style={{ marginBottom: '1rem' }}>
                            <label>Roll Number</label>
                            <span>{student.roll_no}</span>
                        </div>
                        <div className="info-item" style={{ marginBottom: '1rem' }}>
                            <label>Date of Enrollment</label>
                            <span>{new Date(student.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="profile-card" style={{ borderTop: '4px solid #4a6cf7' }}>
                        <h4>⚡ Quick Actions</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button className="btn-secondary" style={{ width: '100%', textAlign: 'left' }}>📤 Promote Student</button>
                            <button className="btn-secondary" style={{ width: '100%', textAlign: 'left' }}>📑 Transfer Section</button>
                            <button className="btn-secondary" style={{ width: '100%', textAlign: 'left', color: '#e53e3e' }}>⛔ Withdraw Student</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StudentDetail
