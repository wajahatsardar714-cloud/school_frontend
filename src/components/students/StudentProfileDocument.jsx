import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { studentService } from '../../services/studentService'
import { useFetch } from '../../hooks/useApi'
import { DOCUMENT_TYPE_LABELS } from '../../utils/documentUtils'
import './StudentProfileDocument.css'

const EMPTY_VALUE = 'Empty'

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return EMPTY_VALUE
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

const formatDate = (value) => {
  if (!value) return EMPTY_VALUE
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE
  return date.toLocaleDateString()
}

const StudentProfileDocument = () => {
  const { studentId } = useParams()
  const [photoUrl, setPhotoUrl] = useState('')
  const [loadingPhoto, setLoadingPhoto] = useState(false)

  const { data: studentResponse, loading: studentLoading, error: studentError } = useFetch(
    () => studentService.getById(studentId),
    [studentId],
    { enabled: !!studentId }
  )

  const { data: docsResponse, loading: docsLoading } = useFetch(
    () => studentService.getDocuments(studentId),
    [studentId],
    { enabled: !!studentId }
  )

  const student = studentResponse?.data || {}
  const documents = docsResponse?.data?.documents || studentResponse?.data?.documents || []

  useEffect(() => {
    document.body.classList.add('student-doc-mode')
    return () => {
      document.body.classList.remove('student-doc-mode')
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    let objectUrl = ''

    const loadPhoto = async () => {
      const photoDoc = documents.find((doc) => doc?.document_type === 'PHOTO')
      if (!photoDoc?.id) {
        setPhotoUrl('')
        return
      }

      try {
        setLoadingPhoto(true)
        const blob = await studentService.downloadDocument(photoDoc.id)
        if (isMounted) {
          objectUrl = URL.createObjectURL(blob)
          setPhotoUrl(objectUrl)
        }
      } catch (error) {
        console.error('Failed to load profile photo:', error)
        if (isMounted) setPhotoUrl('')
      } finally {
        if (isMounted) setLoadingPhoto(false)
      }
    }

    loadPhoto()

    return () => {
      isMounted = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [documents])

  const fatherGuardian = useMemo(() => {
    return student.guardians?.find((guardian) => guardian.relation === 'Father') || null
  }, [student.guardians])

  const profileFields = useMemo(() => {
    return [
      { label: 'Student Name', value: student.name },
      { label: 'Student ID', value: student.id },
      { label: 'Admission Date', value: formatDate(student.admission_date || student.created_at) },
      { label: 'Date of Birth', value: formatDate(student.date_of_birth) },
      { label: 'Gender', value: student.gender },
      { label: 'Phone', value: student.phone },
      { label: 'Email', value: student.email },
      { label: 'CNIC / B-Form', value: student.bay_form },
      { label: 'Father Name', value: student.father_name || fatherGuardian?.name },
      { label: 'Father CNIC', value: student.father_cnic || fatherGuardian?.cnic },
      { label: 'Father Phone', value: student.father_phone || fatherGuardian?.phone },
      { label: 'Father Occupation', value: student.father_occupation || fatherGuardian?.occupation },
      { label: 'Caste', value: student.caste },
      { label: 'Previous School', value: student.previous_school },
      { label: 'Address', value: student.address },
      { label: 'Current Class', value: student.current_enrollment?.class_name },
      { label: 'Current Section', value: student.current_enrollment?.section_name },
      { label: 'Roll Number', value: student.roll_no },
      { label: 'Status', value: student.is_expelled ? 'Expelled' : student.is_active ? 'Active' : 'Inactive' }
    ]
  }, [student, fatherGuardian])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleSaveAsPdf = useCallback(() => {
    window.print()
  }, [])

  const openDocument = useCallback(async (doc) => {
    if (!doc?.id) return
    try {
      const blob = await studentService.downloadDocument(doc.id)
      const objectUrl = URL.createObjectURL(blob)
      const newWindow = window.open(objectUrl, '_blank', 'noopener,noreferrer')
      if (!newWindow) {
        alert('Please allow popups to view documents.')
      }
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000)
    } catch (error) {
      console.error('Failed to open document:', error)
      alert('Failed to open document.')
    }
  }, [])

  if (studentLoading) {
    return (
      <div className="student-document-page">
        <div className="student-document-shell">
          <p className="student-document-loading">Loading profile document...</p>
        </div>
      </div>
    )
  }

  if (studentError || !student?.id) {
    return (
      <div className="student-document-page">
        <div className="student-document-shell">
          <p className="student-document-error">Unable to load student profile document.</p>
          <Link to="/students" className="student-document-back-link">Back to Students</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="student-document-page">
      <div className="student-document-shell">
        <div className="student-document-toolbar no-print">
          <Link to={`/students/${studentId}`} className="student-document-btn secondary">Back to Profile</Link>
          <button type="button" className="student-document-btn" onClick={handleSaveAsPdf}>Save as PDF</button>
          <button type="button" className="student-document-btn primary" onClick={handlePrint}>Print</button>
        </div>

        <article className="student-document-paper" id="student-profile-document">
          <header className="student-document-header">
            <div>
              <p className="student-document-kicker">Admission Profile Document</p>
              <h1>Student Complete Profile</h1>
              <p className="student-document-subtitle">Muslim Public Higher Secondary School</p>
            </div>
            <div className="student-document-photo-box">
              {loadingPhoto ? (
                <span>Loading...</span>
              ) : photoUrl ? (
                <img src={photoUrl} alt="Student" />
              ) : (
                <span>Photo Empty</span>
              )}
            </div>
          </header>

          <section className="student-document-section">
            <h2>Student and Family Information</h2>
            <div className="student-document-grid">
              {profileFields.map((field) => (
                <div className="student-document-item" key={field.label}>
                  <label>{field.label}</label>
                  <p>{formatValue(field.value)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="student-document-section">
            <h2>Documents</h2>
            {docsLoading ? (
              <p className="student-document-muted">Loading documents...</p>
            ) : documents.length === 0 ? (
              <p className="student-document-muted">No document uploaded.</p>
            ) : (
              <div className="student-document-doc-list">
                {documents.map((doc) => (
                  <div className="student-document-doc-row" key={doc.id}>
                    <div>
                      <p className="student-document-doc-name">{doc.file_name || 'Unnamed file'}</p>
                      <p className="student-document-doc-type">{DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type || 'Document'}</p>
                    </div>
                    <button type="button" className="student-document-btn secondary no-print" onClick={() => openDocument(doc)}>
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <footer className="student-document-footer">
            <p>Generated on: {new Date().toLocaleString()}</p>
            <p>For office record and parent copy</p>
          </footer>
        </article>
      </div>
    </div>
  )
}

export default StudentProfileDocument