import { useState, useEffect } from 'react'
import { documentService } from '../services/documentService'
import { apiClient } from '../services/apiClient'
import { API_BASE_URL } from '../config/api'
import { formatFileSize, getDocumentTypeLabel, isImageFile } from '../utils/documentUtils'
import './DocumentComponents.css'

export default function DocumentList({
    studentId,
    documentType = null,
    onDocumentDeleted,
    onDocumentView
}) {
    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (studentId) {
            fetchDocuments()
        }
    }, [studentId, documentType])

    // Debug logging
    useEffect(() => {
        console.log('DocumentList mounted. StudentId:', studentId)
    }, [studentId])

    const fetchDocuments = async () => {
        try {
            console.log('Fetching documents for student:', studentId)
            setLoading(true)
            const result = await documentService.getStudentDocuments(studentId, documentType)
            console.log('Documents fetched:', result)

            // Defensively ensure we always set an array
            const docs = Array.isArray(result.data) ? result.data : []
            setDocuments(docs)
            setError('')
        } catch (err) {
            console.error('Error fetching documents:', err)
            setError('Failed to load documents')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (documentId, fileName) => {
        if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
            return
        }

        try {
            await documentService.deleteDocument(documentId)
            setDocuments(documents.filter(doc => doc.id !== documentId))

            if (onDocumentDeleted) {
                onDocumentDeleted(documentId)
            }
        } catch (err) {
            alert('Failed to delete document: ' + err.message)
            console.error(err)
        }
    }

    const handleView = async (document) => {
        try {
            // Use download endpoint to fetch blob and view it, bypassing direct R2 SSL issues
            const token = apiClient.getToken() // Assuming token is here or use apiClient
            // We'll use the service which handles auth
            const url = `${API_BASE_URL || ''}/api/documents/${document.id}/download`

            console.log('Viewing document via proxy:', url)

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token || ''}`
                }
            })

            if (!response.ok) throw new Error('Failed to fetch document')

            const blob = await response.blob()
            const objectUrl = window.URL.createObjectURL(blob)
            window.open(objectUrl, '_blank')

            // Cleanup timeout
            setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60000)

            if (onDocumentView) {
                onDocumentView(document)
            }
        } catch (err) {
            alert('Failed to open document: ' + err.message)
            console.error(err)
        }
    }

    const handleDownload = async (document) => {
        try {
            await documentService.downloadDocument(document.id, document.file_name)
        } catch (err) {
            alert('Failed to download document: ' + err.message)
            console.error(err)
        }
    }

    if (loading) {
        return (
            <div className="document-list">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading documents...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="document-list">
                <div className="error-state">
                    <p>{error}</p>
                    <button onClick={fetchDocuments} className="retry-btn">
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    if (documents.length === 0) {
        return (
            <div className="document-list">
                <div className="empty-state">
                    <div className="empty-icon">📄</div>
                    <p>No documents uploaded yet</p>
                </div>
            </div>
        )
    }

    return (
        <div className="document-list">
            <div className="document-list-header">
                <h4>Uploaded Documents ({documents.length})</h4>
                <button onClick={fetchDocuments} className="refresh-btn" title="Refresh">
                    ↻
                </button>
            </div>

            <div className="documents-grid">
                {documents.map(doc => (
                    <div key={doc.id} className="document-card">
                        <div className="document-icon">
                            {isImageFile(doc.mime_type) ? '🖼️' : '📄'}
                        </div>

                        <div className="document-info">
                            <div className="document-type-badge">
                                {getDocumentTypeLabel(doc.document_type)}
                            </div>
                            <p className="file-name" title={doc.file_name}>
                                {doc.file_name}
                            </p>
                            <p className="file-size">{formatFileSize(doc.file_size)}</p>
                            {doc.description && (
                                <p className="description" title={doc.description}>
                                    {doc.description}
                                </p>
                            )}
                            <p className="upload-date">
                                {new Date(doc.uploaded_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>

                        <div className="document-actions">
                            <button
                                onClick={() => handleView(doc)}
                                className="btn-view"
                                title="View"
                            >
                                👁️ View
                            </button>
                            <button
                                onClick={() => handleDownload(doc)}
                                className="btn-download"
                                title="Download"
                            >
                                ⬇️ Download
                            </button>
                            <button
                                onClick={() => handleDelete(doc.id, doc.file_name)}
                                className="btn-delete"
                                title="Delete"
                            >
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
