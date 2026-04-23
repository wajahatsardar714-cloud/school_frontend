import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import jsPDF from 'jspdf'
import { studentService } from '../../services/studentService'
import { useFetch } from '../../hooks/useApi'
import './StudentProfileDocument.css'

const EMPTY_VALUE = 'Empty'

const hasValue = (value) => value !== null && value !== undefined && value !== ''

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

const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onloadend = () => resolve(reader.result)
  reader.onerror = reject
  reader.readAsDataURL(blob)
})

const StudentProfileDocument = () => {
  const { studentId } = useParams()
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoDataUrl, setPhotoDataUrl] = useState('')
  const [loadingPhoto, setLoadingPhoto] = useState(false)

  const { data: studentResponse, loading: studentLoading, error: studentError } = useFetch(
    () => studentService.getById(studentId),
    [studentId],
    { enabled: !!studentId }
  )

  const { data: docsResponse } = useFetch(
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
        setPhotoDataUrl('')
        return
      }

      try {
        setLoadingPhoto(true)
        const blob = await studentService.downloadDocument(photoDoc.id)
        if (isMounted) {
          objectUrl = URL.createObjectURL(blob)
          setPhotoUrl(objectUrl)
          try {
            const dataUrl = await blobToDataUrl(blob)
            if (isMounted) setPhotoDataUrl(String(dataUrl || ''))
          } catch {
            if (isMounted) setPhotoDataUrl('')
          }
        }
      } catch (error) {
        console.error('Failed to load profile photo:', error)
        if (isMounted) {
          setPhotoUrl('')
          setPhotoDataUrl('')
        }
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
    return student.guardians?.find((guardian) => guardian.relation?.toLowerCase() === 'father') || null
  }, [student.guardians])

  const studentInfoFields = useMemo(() => {
    return [
      { label: 'Student Name', value: student.name },
      { label: 'Date of Birth', value: formatDate(student.date_of_birth) },
      { label: 'Gender', value: student.gender },
      { label: 'Phone', value: student.phone },
      { label: 'Email', value: student.email },
      { label: 'CNIC / B-Form', value: student.bay_form }
    ]
  }, [student])

  const fatherInfoFields = useMemo(() => {
    return [
      { label: 'Father Name', value: student.father_name || fatherGuardian?.name },
      { label: 'Father CNIC', value: student.father_cnic || fatherGuardian?.cnic },
      { label: 'Father Phone', value: student.father_phone || fatherGuardian?.phone },
      { label: 'Father Occupation', value: student.father_occupation || fatherGuardian?.occupation }
    ]
  }, [student, fatherGuardian])

  const academicInfoFields = useMemo(() => {
    return [
      { label: 'Admission Date', value: formatDate(student.admission_date || student.created_at) },
      { label: 'Current Class', value: student.current_enrollment?.class_name },
      { label: 'Current Section', value: student.current_enrollment?.section_name },
      { label: 'Status', value: student.is_expelled ? 'Expelled' : student.is_active ? 'Active' : 'Inactive' }
    ]
  }, [student])

  const otherInfoFields = useMemo(() => {
    const fields = [
      { label: 'Address', value: student.address },
      { label: 'Caste', value: student.caste },
      { label: 'Previous School', value: student.previous_school }
    ]

    return fields.filter((field) => hasValue(field.value))
  }, [student])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleSaveAsPdf = useCallback(() => {
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 12
      let y = 16

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(15)
      doc.text('Student Profile Card', margin, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text('Muslim Public Higher Secondary School', margin, y)

      const photoX = pageWidth - margin - 34
      const photoY = 14
      const photoW = 34
      const photoH = 42

      doc.setDrawColor(180, 180, 180)
      doc.rect(photoX, photoY, photoW, photoH)

      if (photoDataUrl && photoDataUrl.startsWith('data:image/')) {
        const format = photoDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG'
        doc.addImage(photoDataUrl, format, photoX + 0.5, photoY + 0.5, photoW - 1, photoH - 1, undefined, 'FAST')
      }

      y = 28
      const renderSection = (title, fields) => {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.text(title, margin, y)
        y += 5

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9.5)

        fields.forEach((field) => {
          const line = `${field.label}: ${formatValue(field.value)}`
          const wrapped = doc.splitTextToSize(line, pageWidth - (margin * 2))
          doc.text(wrapped, margin, y)
          y += (wrapped.length * 4.2)
        })

        y += 2
      }

      renderSection('Student Information', studentInfoFields)
      renderSection('Father Information', fatherInfoFields)
      renderSection('Academic Information', academicInfoFields)

      if (otherInfoFields.length > 0) {
        renderSection('Other Information', otherInfoFields)
      }

      doc.setFontSize(8)
      doc.setTextColor(90, 90, 90)
      doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, 286)

      const safeName = String(student.name || `student-${studentId}`)
        .replace(/[^a-z0-9\-_]+/gi, '_')
        .replace(/^_+|_+$/g, '')
      doc.save(`${safeName || 'student'}-profile-card.pdf`)
    } catch (error) {
      console.error('Failed to save profile PDF:', error)
      alert('Failed to save PDF. Please try again.')
    }
  }, [
    academicInfoFields,
    fatherInfoFields,
    otherInfoFields,
    photoDataUrl,
    student.name,
    studentId,
    studentInfoFields
  ])

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
            <h2>Student Information</h2>
            <div className="student-document-field-list">
              {studentInfoFields.map((field) => (
                <div className="student-document-field-row" key={field.label}>
                  <label>{field.label}</label>
                  <p>{formatValue(field.value)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="student-document-section">
            <h2>Father Information</h2>
            <div className="student-document-field-list">
              {fatherInfoFields.map((field) => (
                <div className="student-document-field-row" key={field.label}>
                  <label>{field.label}</label>
                  <p>{formatValue(field.value)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="student-document-section">
            <h2>Academic Information</h2>
            <div className="student-document-field-list">
              {academicInfoFields.map((field) => (
                <div className="student-document-field-row" key={field.label}>
                  <label>{field.label}</label>
                  <p>{formatValue(field.value)}</p>
                </div>
              ))}
            </div>
          </section>

          {otherInfoFields.length > 0 && (
            <section className="student-document-section">
              <h2>Other Information</h2>
              <div className="student-document-field-list">
                {otherInfoFields.map((field) => (
                  <div className="student-document-field-row" key={field.label}>
                    <label>{field.label}</label>
                    <p>{formatValue(field.value)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

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