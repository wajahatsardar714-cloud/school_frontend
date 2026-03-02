import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { studentService } from '../services/studentService'
import { guardianService } from '../services/guardianService'
import { classService, sectionService } from '../services/classService'
import { feeOverrideService, feeService } from '../services/feeService'
import { sortClassesBySequence } from '../utils/classSorting'
import DocumentUpload from './DocumentUpload'
import DocumentList from './DocumentList'
import { DOCUMENT_TYPES } from '../utils/documentUtils'
import { apiHealthCheck } from '../utils/apiHealthCheck'
import './AdmissionFormSteps.css'

const AdmissionForm = () => {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [showReview, setShowReview] = useState(false)
  const [uploadedDocuments, setUploadedDocuments] = useState([])

  const [formData, setFormData] = useState({
    name: '',
    roll_no: '',
    date_of_birth: '',
    phone: '',
    caste: '',
    address: '',
    bay_form: '',
    previous_school: '',
    father_name: '',
    father_cnic: '',
    father_phone: '',
    father_occupation: '',
    admission_date: new Date().toISOString().split('T')[0], // Default to today
    class: '',
    section: ''
  })

  const [selectedClass, setSelectedClass] = useState('')
  const [feeSchedule, setFeeSchedule] = useState({
    admissionFee: 0,
    monthlyFee: 0,
    paperFund: 0,
    total: 0
  })
  const [classFeeDefaults, setClassFeeDefaults] = useState({
    admissionFee: 0,
    monthlyFee: 0,
    paperFund: 0,
  })
  const [customFees, setCustomFees] = useState([])
  const [isFreeStudent, setIsFreeStudent] = useState(false)
  const [showFeeSchedule, setShowFeeSchedule] = useState(false)
  const [hasCustomFees, setHasCustomFees] = useState(false)
  const [feeOverrideReason, setFeeOverrideReason] = useState('')

  useEffect(() => {
    loadClasses()
    // Auto-refresh classes and sections every 10 seconds for real-time updates
    const interval = setInterval(() => {
      loadClasses()
      if (selectedClassId) {
        loadSections(selectedClassId)
      }
    }, 10000) // Reduced to 10 seconds for faster updates

    return () => clearInterval(interval)
  }, [])

  // Refresh classes when component gains focus (user switches back to tab)
  useEffect(() => {
    const handleFocus = () => {
      loadClasses()
      if (selectedClassId) {
        loadSections(selectedClassId)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [selectedClassId])

  // Auto-reload sections when selectedClassId changes
  useEffect(() => {
    if (selectedClassId) {
      console.log('selectedClassId changed, reloading sections:', selectedClassId)
      loadSections(selectedClassId)
    } else {
      setSections([])
    }
  }, [selectedClassId])

  // Sort classes using centralized sorting
  const sortedClasses = useMemo(
    () => sortClassesBySequence(classes),
    [classes]
  )

  const loadClasses = async () => {
    try {
      console.log('Loading classes...')
      const response = await classService.list()
      console.log('Classes response:', response)
      
      // Handle different response formats
      let classesData = []
      if (response?.data?.data) {
        // Paginated response format
        classesData = response.data.data
      } else if (Array.isArray(response?.data)) {
        // Direct array format
        classesData = response.data
      } else if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        // Check if data property contains array
        classesData = response.data.data || response.data.classes || []
      }
      
      setClasses(classesData)
      console.log('Loaded classes:', classesData)
      
      if (classesData.length === 0) {
        setError('No classes found. Please create classes first or check your connection.')
      } else {
        setError(null) // Clear error if classes loaded successfully
      }
    } catch (err) {
      console.error('Failed to load classes:', err)
      setError(`Failed to load classes: ${err.response?.data?.message || err.message}. Please check your connection and try again.`)
    }
  }

  const loadSections = async (classId) => {
    if (!classId) {
      setSections([])
      return
    }
    
    try {
      console.log('Loading sections for class:', classId)
      const response = await sectionService.list(classId)
      console.log('Sections response:', response)
      
      // Handle different response formats
      let sectionsData = []
      if (response?.data?.data) {
        // Paginated response format
        sectionsData = response.data.data
      } else if (Array.isArray(response?.data)) {
        // Direct array format
        sectionsData = response.data
      } else if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        // Check if data property contains array
        sectionsData = response.data.data || response.data.sections || []
      }
      
      setSections(sectionsData)
      console.log('Loaded sections:', sectionsData)
      
      if (sectionsData.length === 0) {
        console.warn(`No sections found for class ${classId}`)
        // Don't set error for empty sections, just log it
      } else {
        // Clear any previous section-related errors
        if (error && error.includes('sections')) {
          setError(null)
        }
      }
    } catch (err) {
      console.error('Failed to load sections:', err)
      setSections([])
      // Only set error if it's a real API failure, not just empty results
      if (err.response?.status !== 404) {
        setError(`Failed to load sections: ${err.response?.data?.message || err.message}`)
      }
    }
  }

  const handleClassChange = async (e) => {
    const classId = e.target.value
    setSelectedClassId(classId)
    setSelectedSectionId('') // Reset section when class changes
    const selectedClass = classes.find(c => c.id === parseInt(classId))
    
    if (selectedClass) {
      setSelectedClass(selectedClass.name)
      setFormData({ ...formData, class: selectedClass.name, section: '' })

      // Load sections immediately and force refresh
      console.log('Class selected, loading sections for class ID:', classId)
      await loadSections(classId)
      
      // Get fee structure from the class object (it's already loaded)
      const feeStruct = selectedClass.current_fee_structure
      if (feeStruct) {
        const defaults = {
          admissionFee: parseFloat(feeStruct.admission_fee) || 0,
          monthlyFee: parseFloat(feeStruct.monthly_fee) || 0,
          paperFund: parseFloat(feeStruct.paper_fund) || 0,
        }
        setClassFeeDefaults(defaults)
        setFeeSchedule({
          ...defaults,
          total: defaults.admissionFee + defaults.monthlyFee + defaults.paperFund
        })
        setShowFeeSchedule(true)
      }
    } else {
      setSelectedClass('')
      setSections([])
      setFormData({ ...formData, class: '', section: '' })
      setShowFeeSchedule(false)
    }
  }

  const handleSectionChange = (e) => {
    const sectionId = e.target.value
    setSelectedSectionId(sectionId)
    const selectedSection = sections.find(s => s.id === parseInt(sectionId))
    setFormData({ ...formData, section: selectedSection?.name || '' })
  }

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
  }

  const formatCNIC = (value) => {
    // Remove all non-digits
    const digitsOnly = value.replace(/\D/g, '')

    // Limit to 13 digits
    const limited = digitsOnly.slice(0, 13)

    // Format as XXXXX-XXXXXXX-X for display
    if (limited.length > 12) {
      return `${limited.slice(0, 5)}-${limited.slice(5, 12)}-${limited.slice(12)}`
    } else if (limited.length > 5) {
      return `${limited.slice(0, 5)}-${limited.slice(5)}`
    }
    return limited
  }

  const handleCNICChange = (value) => {
    // Remove all non-digits for storage
    const digitsOnly = value.replace(/\D/g, '')
    setFormData({ ...formData, father_cnic: digitsOnly })
  }

  const handleFeeChange = (field, value) => {
    const newFeeSchedule = { ...feeSchedule, [field]: Number(value) }
    if (field !== 'total') {
      newFeeSchedule.total = newFeeSchedule.admissionFee + newFeeSchedule.monthlyFee + newFeeSchedule.paperFund
    }
    setFeeSchedule(newFeeSchedule)
  }

  const addCustomFee = () => {
    setCustomFees([...customFees, { id: Date.now(), name: '', amount: 0 }])
  }

  const updateCustomFee = (id, field, value) => {
    setCustomFees(customFees.map(fee =>
      fee.id === id ? { ...fee, [field]: field === 'amount' ? Number(value) : value } : fee
    ))
  }

  const removeCustomFee = (id) => {
    setCustomFees(customFees.filter(fee => fee.id !== id))
  }

  const getTotalFees = () => {
    if (isFreeStudent) return 0
    const baseFees = feeSchedule.admissionFee + feeSchedule.monthlyFee + feeSchedule.paperFund
    const customFeesTotal = customFees.reduce((total, fee) => total + (fee.amount || 0), 0)
    return baseFees + customFeesTotal
  }

  const handleBasicInfoSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setError(null)

    try {
      let guardianId = null

      if (formData.father_cnic) {
        try {
          const guardianResponse = await guardianService.searchByCNIC(formData.father_cnic)
          guardianId = guardianResponse.data.id
        } catch (err) {
          const newGuardian = await guardianService.create({
            name: formData.father_name,
            cnic: formData.father_cnic,
            phone: formData.father_phone,
            occupation: formData.father_occupation
          })
          guardianId = newGuardian.data.id
        }
      }

      const studentData = {
        name: formData.name,
        roll_no: formData.roll_no,
        date_of_birth: formData.date_of_birth,
        phone: formData.phone,
        caste: formData.caste,
        address: formData.address,
        bay_form: formData.bay_form,
        previous_school: formData.previous_school
      }
      
      const studentResponse = await studentService.create(studentData)
      const studentId = studentResponse.data.id
      setCreatedStudentId(studentId)

      if (guardianId) {
        await studentService.addGuardian(studentId, guardianId, 'Father')
      }

      // Move to document upload step
      setCurrentStep(2)
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to create student. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFinalSubmit = async () => {
    if (submitting) return

    setSubmitting(true)
    setError(null)

    try {
      // Enroll student in class and section
      if (createdStudentId && selectedClassId && selectedSectionId && formData.admission_date) {
        await studentService.enroll(
          createdStudentId,
          parseInt(selectedClassId),
          parseInt(selectedSectionId),
          formData.admission_date
        )
      }

      // Save fee override if custom fees are set
      if (createdStudentId && selectedClassId && hasCustomFees && !isFreeStudent) {
        const hasAnyCustomFee =
          feeSchedule.admissionFee !== classFeeDefaults.admissionFee ||
          feeSchedule.monthlyFee !== classFeeDefaults.monthlyFee ||
          feeSchedule.paperFund !== classFeeDefaults.paperFund

        if (hasAnyCustomFee) {
          const overrideData = {
            student_id: createdStudentId,
            class_id: parseInt(selectedClassId),
            admission_fee: feeSchedule.admissionFee !== classFeeDefaults.admissionFee ? feeSchedule.admissionFee : null,
            monthly_fee: feeSchedule.monthlyFee !== classFeeDefaults.monthlyFee ? feeSchedule.monthlyFee : null,
            paper_fund: feeSchedule.paperFund !== classFeeDefaults.paperFund ? feeSchedule.paperFund : null,
            reason: feeOverrideReason || 'Custom fees set during admission'
          }

          try {
            await feeOverrideService.create(overrideData)
            console.log('Fee override saved successfully')
          } catch (feeErr) {
            console.error('Failed to save fee override:', feeErr)
            // Don't fail the whole admission, just log the error
          }
        }
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/admission/list')
      }, 2000)
    } catch (err) {
      setError(err.message || 'Failed to complete admission. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDocumentUploaded = (document) => {
    setUploadedDocuments(prev => [...prev, document])
  }

  const handleDocumentDeleted = (documentId) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId))
  }

  const isHigherClass = selectedClass === '1st Year' || selectedClass === '2nd Year'

  return (
    <div className="page-content">
      <div className="breadcrumb-nav">
        <Link to="/admissions">Admission</Link>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">New Admission Form</span>
      </div>

      <div className="form-header">
        <h2>New Admission Form</h2>
        <div className="header-actions">
          <button onClick={() => navigate(-1)} className="back-btn" disabled={submitting}>
            ← Go Back
          </button>
          <Link to="/admissions" className="back-btn secondary">Admission Home</Link>
        </div>
      </div>

      <div className="admission-form-container">
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            ✅ Admission submitted successfully! Redirecting...
          </div>
        )}

        {/* Step Indicator */}
        <div className="steps-indicator">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Basic Information</div>
          </div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Upload Documents</div>
          </div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Academic Details</div>
          </div>
          <div className={`step ${currentStep >= 4 ? 'active' : ''} ${currentStep > 4 ? 'completed' : ''}`}>
            <div className="step-number">4</div>
            <div className="step-label">Review & Submit</div>
          </div>
        </div>

        <form className="admission-form" onSubmit={handleBasicInfoSubmit}>
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <>
              <div className="form-section">
                <h3>Student Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Student Name *</label>
                    <input
                      type="text"
                      placeholder="Enter student name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Roll Number</label>
                    <input
                      type="text"
                      placeholder="Enter roll number"
                      value={formData.roll_no}
                      onChange={(e) => handleInputChange('roll_no', e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Date of Birth *</label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Student Phone</label>
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Caste</label>
                    <input
                      type="text"
                      placeholder="Enter caste"
                      value={formData.caste}
                      onChange={(e) => handleInputChange('caste', e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Address *</label>
                    <textarea
                      placeholder="Enter complete address"
                      rows="3"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Father/Guardian Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Father Name *</label>
                    <input
                      type="text"
                      placeholder="Enter father name"
                      value={formData.father_name}
                      onChange={(e) => handleInputChange('father_name', e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Father CNIC *</label>
                    <input
                      type="text"
                      placeholder="00000-0000000-0"
                      value={formatCNIC(formData.father_cnic)}
                      onChange={(e) => handleCNICChange(e.target.value)}
                      disabled={submitting}
                      required
                    />
                    <small style={{ color: '#666', fontSize: '12px' }}>13 digits (dashes auto-formatted)</small>
                  </div>

                  <div className="form-group">
                    <label>Father Phone *</label>
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      value={formData.father_phone}
                      onChange={(e) => handleInputChange('father_phone', e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Father/Guardian Occupation</label>
                    <input
                      type="text"
                      placeholder="Enter occupation"
                      value={formData.father_occupation}
                      onChange={(e) => handleInputChange('father_occupation', e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Previous School Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Bay Form</label>
                    <input
                      type="text"
                      placeholder="Enter bay form number"
                      value={formData.bay_form}
                      onChange={(e) => handleInputChange('bay_form', e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Previous School Name</label>
                    <input
                      type="text"
                      placeholder="Enter previous school name"
                      value={formData.previous_school}
                      onChange={(e) => handleInputChange('previous_school', e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="btn-cancel"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Creating Student...' : 'Next: Upload Documents'}
                </button>
              </div>
            </>
          )}

          {/* Step 2: Document Upload */}
          {currentStep === 2 && createdStudentId && (
            <>
              <div className="form-section">
                <h3>Upload Required Documents</h3>
                <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                  Please upload the following documents. Required documents are marked with *.
                </p>

                <div className="documents-upload-grid">
                  <DocumentUpload
                    studentId={createdStudentId}
                    documentType={DOCUMENT_TYPES.PHOTO}
                    onUploadSuccess={handleDocumentUploaded}
                    disabled={submitting}
                  />

                  <DocumentUpload
                    studentId={createdStudentId}
                    documentType={DOCUMENT_TYPES.BAY_FORM}
                    onUploadSuccess={handleDocumentUploaded}
                    disabled={submitting}
                  />

                  <DocumentUpload
                    studentId={createdStudentId}
                    documentType={DOCUMENT_TYPES.FATHER_CNIC}
                    onUploadSuccess={handleDocumentUploaded}
                    disabled={submitting}
                  />

                  <DocumentUpload
                    studentId={createdStudentId}
                    documentType={DOCUMENT_TYPES.BIRTH_CERTIFICATE}
                    onUploadSuccess={handleDocumentUploaded}
                    disabled={submitting}
                  />

                  <DocumentUpload
                    studentId={createdStudentId}
                    documentType={DOCUMENT_TYPES.CUSTOM}
                    onUploadSuccess={handleDocumentUploaded}
                    disabled={submitting}
                  />
                </div>

                {uploadedDocuments.length > 0 && (
                  <div style={{ marginTop: '2rem' }}>
                    <DocumentList
                      key={uploadedDocuments.length}
                      studentId={createdStudentId}
                      onDocumentDeleted={handleDocumentDeleted}
                    />
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="btn-cancel"
                  disabled={submitting}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="btn-submit"
                  disabled={submitting}
                >
                  Next: Academic Details
                </button>
              </div>
            </>
          )}

          {/* Step 3: Academic Information */}
          {currentStep === 3 && (
            <>
              <div className="form-section">
                <h3>Academic Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Admission Date *</label>
                    <input
                      type="date"
                      onChange={(e) => handleInputChange('admission_date', e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Admission in Class *</label>
                    <select
                      value={selectedClassId}
                      onChange={handleClassChange}
                      disabled={submitting}
                      required
                    >
                      <option value="">Select Class</option>
                      {sortedClasses.map(cls => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} ({cls.class_type}) - {cls.student_count || 0} students
                        </option>
                      ))}
                    </select>
                    {classes.length === 0 && (
                      <small style={{ color: '#ef4444', fontSize: '12px' }}>
                        ⚠️ No classes found. <Link to="/classes" style={{ color: '#3b82f6' }}>Create classes first</Link>
                        <button 
                          type="button" 
                          onClick={loadClasses} 
                          style={{ marginLeft: '10px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          Refresh
                        </button>
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Section *</label>
                    <select
                      value={selectedSectionId}
                      onChange={handleSectionChange}
                      disabled={submitting || !selectedClassId}
                      required
                    >
                      <option value="">Select Section</option>
                      {sections.map(section => (
                        <option key={section.id} value={section.id}>
                          {section.name} - {section.student_count || 0} students
                        </option>
                      ))}
                    </select>
                    {selectedSectionId && (() => {
                      const selectedSection = sections.find(s => s.id === parseInt(selectedSectionId))
                      if (selectedSection) {
                        const studentCount = parseInt(selectedSection.student_count) || 0
                        const capacity = 80
                        const isFull = studentCount >= capacity
                        const isNearFull = studentCount >= (capacity * 0.9)

                        return (
                          <div style={{ marginTop: '0.4rem', fontSize: '12px' }}>
                            <span style={{ color: isFull ? '#ef4444' : isNearFull ? '#f59e0b' : '#10b981' }}>
                              {isFull ? '⚠️ Section is FULL' : isNearFull ? '⚠️ Section is near capacity' : '✓ Space available'}
                              ({studentCount}/{capacity} students)
                            </span>
                          </div>
                        )
                      }
                      return null
                    })()}
                    {!selectedClassId && (
                      <small style={{ color: '#666', fontSize: '12px' }}>Select a class first</small>
                    )}
                    {selectedClassId && sections.length === 0 && (
                      <small style={{ color: '#ef4444', fontSize: '12px' }}>
                        ⚠️ No sections found for this class. Contact administrator to add sections.
                        <button 
                          type="button" 
                          onClick={() => loadSections(selectedClassId)} 
                          style={{ marginLeft: '10px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          Refresh
                        </button>
                      </small>
                    )}
                    {selectedClassId && sections.length > 0 && (
                      <small style={{ color: '#10b981', fontSize: '12px' }}>
                        ✓ {sections.length} section(s) available
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Bay Form</label>
                    <input
                      type="text"
                      placeholder="Enter bay form number"
                      value={formData.bay_form}
                      onChange={(e) => handleInputChange('bay_form', e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Previous School Name</label>
                    <input
                      type="text"
                      placeholder="Enter previous school name"
                      value={formData.previous_school}
                      onChange={(e) => handleInputChange('previous_school', e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              {showFeeSchedule && (
                <div className="form-section fee-schedule-section">
                  <div className="fee-header">
                    <h3>Fee Schedule for {selectedClass}</h3>
                    <div className="fee-controls">
                      <label className="free-student-toggle">
                        <input
                          type="checkbox"
                          checked={isFreeStudent}
                          onChange={(e) => setIsFreeStudent(e.target.checked)}
                          disabled={submitting}
                        />
                        Mark as Free Student
                      </label>
                    </div>
                  </div>

                  {!isFreeStudent && (
                    <>
                      {/* Class Default Fees Display */}
                      <div className="class-defaults-box" style={{
                        backgroundColor: '#f3f4f6',
                        padding: '1rem',
                        borderRadius: '6px',
                        marginBottom: '1rem'
                      }}>
                        <h4 style={{ fontSize: '14px', marginBottom: '0.5rem', color: '#374151' }}>
                          Class Default Fees:
                        </h4>
                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '13px' }}>
                          <span>Admission: <strong>Rs. {classFeeDefaults.admissionFee}</strong></span>
                          <span>Monthly: <strong>Rs. {classFeeDefaults.monthlyFee}</strong></span>
                          <span>Paper Fund: <strong>Rs. {classFeeDefaults.paperFund}</strong></span>
                        </div>
                      </div>

                      {/* Custom Fees Toggle */}
                      <div style={{ marginBottom: '1rem' }}>
                        <label className="free-student-toggle">
                          <input
                            type="checkbox"
                            checked={hasCustomFees}
                            onChange={(e) => {
                              setHasCustomFees(e.target.checked)
                              if (!e.target.checked) {
                                // Reset to defaults
                                setFeeSchedule({
                                  ...classFeeDefaults,
                                  total: classFeeDefaults.admissionFee + classFeeDefaults.monthlyFee + classFeeDefaults.paperFund
                                })
                                setFeeOverrideReason('')
                              }
                            }}
                            disabled={submitting}
                          />
                          Set Custom Fees for this Student
                        </label>
                      </div>

                      <div className="fee-schedule-box">
                        <div className="fee-table">
                          <div className="fee-table-header">
                            <div className="fee-column">Fee Type</div>
                            <div className="fee-column">Amount (Rs.)</div>
                          </div>

                          <div className="fee-row">
                            <label>Admission Fee</label>
                            <input
                              type="number"
                              value={feeSchedule.admissionFee}
                              onChange={(e) => handleFeeChange('admissionFee', e.target.value)}
                              min="0"
                              disabled={submitting || !hasCustomFees}
                              style={{
                                backgroundColor: hasCustomFees ? 'white' : '#f3f4f6',
                                fontWeight: feeSchedule.admissionFee !== classFeeDefaults.admissionFee ? 'bold' : 'normal',
                                color: feeSchedule.admissionFee !== classFeeDefaults.admissionFee ? '#059669' : 'inherit'
                              }}
                            />
                          </div>

                          <div className="fee-row">
                            <label>Monthly Fee</label>
                            <input
                              type="number"
                              value={feeSchedule.monthlyFee}
                              onChange={(e) => handleFeeChange('monthlyFee', e.target.value)}
                              min="0"
                              disabled={submitting || !hasCustomFees}
                              style={{
                                backgroundColor: hasCustomFees ? 'white' : '#f3f4f6',
                                fontWeight: feeSchedule.monthlyFee !== classFeeDefaults.monthlyFee ? 'bold' : 'normal',
                                color: feeSchedule.monthlyFee !== classFeeDefaults.monthlyFee ? '#059669' : 'inherit'
                              }}
                            />
                          </div>

                          <div className="fee-row">
                            <label>Paper Fund</label>
                            <input
                              type="number"
                              value={feeSchedule.paperFund}
                              onChange={(e) => handleFeeChange('paperFund', e.target.value)}
                              min="0"
                              disabled={submitting || !hasCustomFees}
                              style={{
                                backgroundColor: hasCustomFees ? 'white' : '#f3f4f6',
                                fontWeight: feeSchedule.paperFund !== classFeeDefaults.paperFund ? 'bold' : 'normal',
                                color: feeSchedule.paperFund !== classFeeDefaults.paperFund ? '#059669' : 'inherit'
                              }}
                            />
                          </div>

                          {/* Reason for custom fees */}
                          {hasCustomFees && (
                            <div className="fee-row" style={{ gridTemplateColumns: '1fr' }}>
                              <label style={{ marginBottom: '0.5rem' }}>Reason for Custom Fees *</label>
                              <textarea
                                value={feeOverrideReason}
                                onChange={(e) => setFeeOverrideReason(e.target.value)}
                                placeholder="e.g., Scholarship, Sibling discount, Special agreement"
                                rows="2"
                                required={hasCustomFees}
                                disabled={submitting}
                                style={{
                                  width: '100%',
                                  padding: '0.5rem',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '4px',
                                  resize: 'vertical'
                                }}
                              />
                            </div>
                          )}

                          {customFees.map(fee => (
                            <div key={fee.id} className="fee-row custom-fee-row">
                              <input
                                type="text"
                                placeholder="Fee name"
                                value={fee.name}
                                onChange={(e) => updateCustomFee(fee.id, 'name', e.target.value)}
                                className="fee-name-input"
                                disabled={submitting}
                              />
                              <div className="custom-fee-amount">
                                <input
                                  type="number"
                                  value={fee.amount}
                                  onChange={(e) => updateCustomFee(fee.id, 'amount', e.target.value)}
                                  min="0"
                                  placeholder="Amount"
                                  disabled={submitting}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeCustomFee(fee.id)}
                                  className="remove-fee-btn"
                                  disabled={submitting}
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}

                          <div className="fee-actions">
                            <button
                              type="button"
                              onClick={addCustomFee}
                              className="add-fee-btn"
                              disabled={submitting}
                            >
                              + Add Custom Fee
                            </button>
                          </div>

                          <div className="fee-row total-row">
                            <label><strong>Total Amount</strong></label>
                            <div className="total-amount">
                              <strong>Rs. {getTotalFees().toLocaleString()}/-</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {isFreeStudent && (
                    <div className="free-student-notice">
                      <div className="notice-box">
                        <h4>📚 Free Student</h4>
                        <p>This student has been marked as a free student. No fees will be charged.</p>
                        <div className="total-amount free">
                          <strong>Total Amount: Rs. 0/-</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="btn-cancel"
                  disabled={submitting}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="btn-submit"
                  disabled={submitting}
                >
                  Next: Review & Submit
                </button>
              </div>
            </>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <>
              <div className="form-section">
                <h3>Review & Submit</h3>
                <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                  Please review all information before submitting the admission.
                </p>

                {/* Student Information Review */}
                <div className="review-section">
                  <h4>Student Information</h4>
                  <div className="review-grid">
                    <div className="review-item">
                      <span className="review-label">Name:</span>
                      <span className="review-value">{formData.name}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Roll Number:</span>
                      <span className="review-value">{formData.roll_no || 'N/A'}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Date of Birth:</span>
                      <span className="review-value">{formData.date_of_birth}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Phone:</span>
                      <span className="review-value">{formData.phone || 'N/A'}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Caste:</span>
                      <span className="review-value">{formData.caste || 'N/A'}</span>
                    </div>
                    <div className="review-item full-width">
                      <span className="review-label">Address:</span>
                      <span className="review-value">{formData.address}</span>
                    </div>
                  </div>
                </div>

                {/* Guardian Information Review */}
                <div className="review-section">
                  <h4>Father/Guardian Information</h4>
                  <div className="review-grid">
                    <div className="review-item">
                      <span className="review-label">Father Name:</span>
                      <span className="review-value">{formData.father_name}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Father CNIC:</span>
                      <span className="review-value">{formatCNIC(formData.father_cnic)}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Father Phone:</span>
                      <span className="review-value">{formData.father_phone}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Occupation:</span>
                      <span className="review-value">{formData.father_occupation || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Academic Information Review */}
                <div className="review-section">
                  <h4>Academic Information</h4>
                  <div className="review-grid">
                    <div className="review-item">
                      <span className="review-label">Admission Date:</span>
                      <span className="review-value">{formData.admission_date}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Class:</span>
                      <span className="review-value">{selectedClass}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Section:</span>
                      <span className="review-value">{formData.section}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Bay Form:</span>
                      <span className="review-value">{formData.bay_form || 'N/A'}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Previous School:</span>
                      <span className="review-value">{formData.previous_school || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Documents Review */}
                {createdStudentId && (
                  <div className="review-section">
                    <h4>Uploaded Documents</h4>
                    <DocumentList
                      key={uploadedDocuments.length}
                      studentId={createdStudentId}
                      onDocumentDeleted={handleDocumentDeleted}
                    />
                  </div>
                )}

                {/* Fee Information Review */}
                {showFeeSchedule && (
                  <div className="review-section">
                    <h4>Fee Information</h4>
                    {isFreeStudent ? (
                      <div className="free-student-badge">
                        📚 Free Student - No fees applicable
                      </div>
                    ) : (
                      <div className="fee-summary">
                        <div className="fee-summary-item">
                          <span>Admission Fee:</span>
                          <span>Rs. {feeSchedule.admissionFee.toLocaleString()}/-</span>
                        </div>
                        <div className="fee-summary-item">
                          <span>Monthly Fee:</span>
                          <span>Rs. {feeSchedule.monthlyFee.toLocaleString()}/-</span>
                        </div>
                        <div className="fee-summary-item">
                          <span>Paper Fund:</span>
                          <span>Rs. {feeSchedule.paperFund.toLocaleString()}/-</span>
                        </div>
                        {customFees.map(fee => (
                          <div key={fee.id} className="fee-summary-item">
                            <span>{fee.name}:</span>
                            <span>Rs. {fee.amount.toLocaleString()}/-</span>
                          </div>
                        ))}
                        <div className="fee-summary-item total">
                          <span><strong>Total Amount:</strong></span>
                          <span><strong>Rs. {getTotalFees().toLocaleString()}/-</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="btn-cancel"
                  disabled={submitting}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  className="btn-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Admission'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}

export default AdmissionForm
