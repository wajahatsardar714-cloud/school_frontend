import { useState } from 'react'
import { documentService } from '../services/documentService'
import { validateFile, DOCUMENT_TYPE_LABELS } from '../utils/documentUtils'
import './DocumentComponents.css'

export default function DocumentUpload({
    studentId,
    documentType,
    onUploadSuccess,
    onUploadError,
    disabled = false
}) {
    const [selectedFile, setSelectedFile] = useState(null)
    const [description, setDescription] = useState('')
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [error, setError] = useState('')
    const [preview, setPreview] = useState(null)
    const [success, setSuccess] = useState(false)

    const handleFileSelect = (e) => {
        const file = e.target.files[0]
        if (!file) return

        const validationError = validateFile(file)
        if (validationError) {
            setError(validationError)
            setSelectedFile(null)
            setPreview(null)
            return
        }

        setError('')
        setSuccess(false)
        setSelectedFile(file)

        // Create preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreview(reader.result)
            }
            reader.readAsDataURL(file)
        } else {
            setPreview(null)
        }
    }

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file')
            return
        }

        setUploading(true)
        setError('')
        setUploadProgress(0)

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90))
            }, 200)

            const result = await documentService.uploadStudentDocument(
                studentId,
                selectedFile,
                documentType,
                description
            )

            clearInterval(progressInterval)
            setUploadProgress(100)

            // Show success state
            setSuccess(true)

            if (onUploadSuccess) {
                onUploadSuccess(result.data)
            }

            // Reset form after delay
            setTimeout(() => {
                setSelectedFile(null)
                setDescription('')
                setPreview(null)
                setUploadProgress(0)
                setSuccess(false)
            }, 2000)

        } catch (err) {
            setError(err.message || 'Upload failed. Please try again.')
            if (onUploadError) {
                onUploadError(err)
            }
        } finally {
            setUploading(false)
        }
    }

    const handleClear = () => {
        setSelectedFile(null)
        setDescription('')
        setPreview(null)
        setError('')
        setSuccess(false)
    }


    // Scan document using browser APIs (if available)
    const handleScanDocument = async () => {
        // Try to use getUserMedia for camera scan as a fallback
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                // Create a video element to capture image
                const video = document.createElement('video');
                video.srcObject = stream;
                video.play();
                // Show a modal or prompt to user to capture
                alert('A camera window will open. Please capture the document and take a screenshot or use a browser extension to save the image. (Full scanner integration requires additional hardware support.)');
                // Stop the stream after prompt
                setTimeout(() => {
                    stream.getTracks().forEach(track => track.stop());
                }, 3000);
            } else {
                alert('Scanner/camera not supported in this browser.');
            }
        } catch (err) {
            alert('Failed to access scanner/camera.');
        }
    };

    return (
        <div className="document-upload">
            <div className="document-upload-header">
                <h4>{DOCUMENT_TYPE_LABELS[documentType]}</h4>
                {success && <span className="success-badge">✓ Uploaded</span>}
            </div>

            {/* File Input & Scan Button */}
            <div className="file-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                    type="file"
                    id={`file-${documentType}`}
                    accept="image/jpeg,image/jpg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={handleFileSelect}
                    disabled={uploading || disabled}
                    className="file-input"
                />
                <label htmlFor={`file-${documentType}`} className={`file-label ${uploading || disabled ? 'disabled' : ''}`}> 
                    <span className="file-icon">📎</span>
                    <span className="file-text">
                        {selectedFile ? selectedFile.name : 'Choose File'}
                    </span>
                </label>
                <button
                    type="button"
                    className="scan-btn"
                    style={{ marginLeft: '0.5rem', padding: '0.3rem 0.7rem', fontSize: '0.9rem' }}
                    onClick={handleScanDocument}
                    disabled={uploading || disabled}
                    title="Scan document using scanner/camera"
                >
                    📷 Scan
                </button>
                {selectedFile && !uploading && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="clear-btn"
                        disabled={disabled}
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Preview */}
            {preview && (
                <div className="preview">
                    <img src={preview} alt="Preview" />
                </div>
            )}

            {/* Description */}
            {selectedFile && (
                <div className="description-input">
                    <label htmlFor={`desc-${documentType}`}>Description (Optional)</label>
                    <input
                        type="text"
                        id={`desc-${documentType}`}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter description..."
                        disabled={uploading || disabled}
                    />
                </div>
            )}

            {/* Upload Button */}
            {selectedFile && !success && (
                <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading || disabled}
                    className="upload-button"
                >
                    {uploading ? 'Uploading...' : 'Upload Document'}
                </button>
            )}

            {/* Progress Bar */}
            {uploading && (
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${uploadProgress}%` }}
                    />
                    <span className="progress-text">{uploadProgress}%</span>
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div className="success-message">
                    ✓ Document uploaded successfully!
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
        </div>
    )
}
