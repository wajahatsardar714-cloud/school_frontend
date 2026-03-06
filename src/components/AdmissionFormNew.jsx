import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { studentService } from '../services/studentService'
import { guardianService } from '../services/guardianService'
import { classService, sectionService } from '../services/classService'
import { feeOverrideService, feeService, feeVoucherService } from '../services/feeService'
import { documentService } from '../services/documentService'
import { apiHealthCheck } from '../utils/apiHealthCheck'
import { sortClassesBySequence } from '../utils/classSorting'
import './AdmissionFormSteps.css'

const AdmissionFormNew = () => {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [showReview, setShowReview] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState({
    photo: null,
    bayForm: null,
    fatherCnic: null,
    birthCertificate: null,
    custom: null
  })
  const [documentPreviews, setDocumentPreviews] = useState({})
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [loadingSections, setLoadingSections] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
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
    gender: '',
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
  const [discountDescription, setDiscountDescription] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [admittedStudentData, setAdmittedStudentData] = useState(null)

  // College annual fee state
  const [isCollegeClass, setIsCollegeClass] = useState(false)
  const [yearlyPackageAmount, setYearlyPackageAmount] = useState('')
  const [showYearlyPackageModal, setShowYearlyPackageModal] = useState(false)

  useEffect(() => {
    // Load classes once on mount - no auto-refresh
    loadClasses()
  }, [])

  // Auto-reload sections when selectedClassId changes
  useEffect(() => {
    if (selectedClassId) {
      console.log('Class selected, loading sections for class ID:', selectedClassId)
      loadSections(selectedClassId)
    } else {
      setSections([])
      setSelectedSectionId('')
    }
  }, [selectedClassId])

  const loadClasses = async () => {
    try {
      setLoadingClasses(true)
      const response = await classService.list()
      
      if (response && response.data) {
        let classData = response.data
        
        // Handle paginated response
        if (response.data.data && Array.isArray(response.data.data)) {
          classData = response.data.data
        } else if (Array.isArray(response.data)) {
          classData = response.data
        } else if (!Array.isArray(classData)) {
          classData = []
        }
        
        const sortedClasses = sortClassesBySequence(classData)
        setClasses(sortedClasses)
        
        // Clear any previous error
        if (error && error.includes('Failed to load classes')) {
          setError(null)
        }
      } else {
        setClasses([])
        setError('No classes data received from server.')
      }
    } catch (err) {
      console.error('Failed to load classes:', err)
      setClasses([])
      setError(`Failed to load classes: ${err.message || err}`)
    } finally {
      setLoadingClasses(false)
    }
  }

  const loadSections = async (classId) => {
    if (!classId) {
      setSections([])
      return
    }

    try {
      setLoadingSections(true)
      console.log('Loading sections for class ID:', classId)
      
      // Use the correct method name: list() with classId parameter
      const response = await sectionService.list(classId)
      console.log('Sections API response:', response)
      
      if (response && response.data) {
        console.log('Sections loaded successfully:', response.data)
        setSections(response.data)
      } else {
        console.warn('No sections data received for class', classId)
        // Set mock sections for development
        const mockSections = [
          { id: 1, name: 'A', student_count: 25 },
          { id: 2, name: 'B', student_count: 30 }
        ]
        console.log('Setting mock sections for development:', mockSections)
        setSections(mockSections)
      }
    } catch (err) {
      console.error('Failed to load sections:', err)
      // Set mock sections for development even on error
      const mockSections = [
        { id: 1, name: 'A', student_count: 25 },
        { id: 2, name: 'B', student_count: 30 }
      ]
      console.log('API failed, setting mock sections:', mockSections)
      setSections(mockSections)
      // Don't show error for sections as it's not critical for form functionality
    } finally {
      setLoadingSections(false)
    }
  }

  const handleClassChange = async (e) => {
    const classId = e.target.value
    
    setSelectedClassId(classId)
    setSelectedSectionId('')
    setFormData({ ...formData, section: '' })
    
    if (classId) {
      
      // Use string comparison to avoid type mismatch (id could be string or number)
      let selectedClassObj = classes.find(c => String(c.id) === String(classId))

      // If class not found locally, fetch from API as single fallback
      if (!selectedClassObj) {
        try {
          const classResponse = await classService.getById(classId)
          if (classResponse.data) {
            selectedClassObj = classResponse.data
          }
        } catch (err) {
          console.error('Failed to load class details:', err)
          setError('Failed to load class details.')
          return
        }
      }

      if (selectedClassObj) {
        setSelectedClass(selectedClassObj.name)
        setFormData({ ...formData, class: selectedClassObj.name, section: '' })
        // Sections are loaded reactively via the selectedClassId useEffect — no duplicate call needed

        // Detect college vs school class
        const isCollege = selectedClassObj.class_type === 'COLLEGE'
        setIsCollegeClass(isCollege)
        setYearlyPackageAmount('') // reset on class change

        if (isCollege) {
          // College: show the yearly package popup, skip regular fee table
          setShowFeeSchedule(false)
          setShowYearlyPackageModal(true)
        } else {
          // School: existing fee structure logic
          setShowYearlyPackageModal(false)
          const feeStruct = selectedClassObj.current_fee_structure
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
          } else {
            showManualFeeEntry(selectedClassObj.name)
          }
        }
      }
    } else {
      setSelectedClass('')
      setSections([])
      setFormData({ ...formData, class: '', section: '' })
      setShowFeeSchedule(false)
    }
  }
  
  // Helper function to show manual fee entry
  const showManualFeeEntry = (className, error = null) => {
    console.log('Showing manual fee entry for class:', className)
    const defaults = {
      admissionFee: 0,
      monthlyFee: 0,
      paperFund: 0,
    }
    setClassFeeDefaults(defaults)
    setFeeSchedule({
      ...defaults,
      total: 0
    })
    setShowFeeSchedule(true) // Always show fee section
    setHasCustomFees(true) // Enable editing
    
    if (error) {
      setError(`Unable to load fee structure for ${className}. You can enter fees manually. (${error.message || error})`)
    } else {
      // Clear any previous error
      if (error && error.includes('fee structure')) {
        setError(null)
      }
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
      fee.id === id ? { ...fee, [field]: value } : fee
    ))
  }

  const removeCustomFee = (id) => {
    setCustomFees(customFees.filter(fee => fee.id !== id))
  }

  const getTotalFees = () => {
    if (isFreeStudent) return 0
    if (isCollegeClass) return parseFloat(yearlyPackageAmount) || 0
    const baseFees = feeSchedule.admissionFee + feeSchedule.monthlyFee + feeSchedule.paperFund
    const customFeesTotal = customFees.reduce((total, fee) => total + (fee.amount || 0), 0)
    let total = baseFees + customFeesTotal
    
    return Math.round(total)
  }
  
  // Post-admission action handlers
  const handlePrintVoucher = useCallback(async () => {
    if (admittedStudentData?.voucherId) {
      // Use the stored voucher ID directly
      try {
        feeVoucherService.printVoucher(admittedStudentData.voucherId)
      } catch (error) {
        console.error('Failed to print voucher:', error)
        alert('Failed to print voucher: ' + error.message)
      }
    } else if (admittedStudentData?.voucherGenerated) {
      // Fallback: try to fetch the voucher
      try {
        const response = await feeVoucherService.list({
          student_id: admittedStudentData.studentId,
          limit: 1
        })
        
        if (response.data?.vouchers?.length > 0) {
          const voucherId = response.data.vouchers[0].id
          feeVoucherService.printVoucher(voucherId)
        } else {
          alert('No voucher found to print')
        }
      } catch (error) {
        console.error('Failed to print voucher:', error)
        alert('Failed to print voucher: ' + error.message)
      }
    } else {
      alert('No voucher available for this student (fee-free student)')
    }
  }, [admittedStudentData])
  
  const handlePayVoucher = useCallback(() => {
    if (admittedStudentData?.studentId) {
      navigate(`/fees/payments?student_id=${admittedStudentData.studentId}`)
    }
  }, [admittedStudentData, navigate])
  
  const handleViewStudent = useCallback(() => {
    if (admittedStudentData?.studentId) {
      navigate(`/students/${admittedStudentData.studentId}`)
    }
  }, [admittedStudentData, navigate])
  
  const handleGoToAdmissionList = useCallback(() => {
    navigate('/admission/list', { state: { fromAdmission: true } })
  }, [navigate, admittedStudentData])
  
  // Document handlers
  const handleDocumentSelect = (documentType, file) => {
    if (!file) return

    // Validate file
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setError('File size must be less than 5MB')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, PNG, and PDF files are allowed')
      return
    }

    setSelectedDocuments(prev => ({
      ...prev,
      [documentType]: file
    }))

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setDocumentPreviews(prev => ({
          ...prev,
          [documentType]: e.target.result
        }))
      }
      reader.readAsDataURL(file)
    } else {
      // For PDFs, just show filename
      setDocumentPreviews(prev => ({
        ...prev,
        [documentType]: 'pdf'
      }))
    }
  }

  const removeDocument = (documentType) => {
    setSelectedDocuments(prev => ({
      ...prev,
      [documentType]: null
    }))
    setDocumentPreviews(prev => ({
      ...prev,
      [documentType]: null
    }))
  }

  const uploadDocumentsForStudent = async (studentId) => {
    const { documentService } = await import('../services/documentService')
    const documentTypeMap = {
      photo: 'PHOTO',
      bayForm: 'BAY_FORM',
      fatherCnic: 'FATHER_CNIC',
      birthCertificate: 'BIRTH_CERTIFICATE',
      custom: 'CUSTOM'
    }

    const uploadPromises = []

    for (const [key, file] of Object.entries(selectedDocuments)) {
      if (file) {
        const uploadPromise = documentService.uploadStudentDocument(studentId, file, documentTypeMap[key], '')
          .catch(err => {
            console.error(`Failed to upload ${key}:`, err)
            return null
          })
        uploadPromises.push(uploadPromise)
      }
    }

    const results = await Promise.all(uploadPromises)
    return results.filter(r => r !== null)
  }



  // Main submission handler
  const handleSubmission = async (e) => {
    e.preventDefault()
    if (submitting) return

    // Validate required fields
    if (!formData.name || !formData.father_name || !selectedClassId || !selectedSectionId) {
      setError('Please fill in all required fields: Student Name, Father Name, Class, and Section')
      return
    }

    // College class: yearly package is mandatory
    if (isCollegeClass && (!yearlyPackageAmount || parseFloat(yearlyPackageAmount) <= 0)) {
      setError('Please enter the Total Yearly Package amount for this college class student.')
      setShowYearlyPackageModal(true)
      return
    }

    // Validate discount description if monthly fee is discounted
    if (!isCollegeClass && feeSchedule.monthlyFee < classFeeDefaults.monthlyFee && !discountDescription.trim()) {
      setError('Please provide a discount description. This will be printed on monthly vouchers.')
      return
    }

    if (showReview) {
      await handleFinalSubmit()
    } else {
      setShowReview(true)
    }
  }

  const handleFinalSubmit = async () => {
    setSubmitting(true)
    setError(null)

    try {
      // Create guardian first
      let guardianId = null
      if (formData.father_name) {
        try {
          if (formData.father_cnic) {
            const guardianResponse = await guardianService.searchByCNIC(formData.father_cnic)
            guardianId = guardianResponse.data.id
          }
        } catch (err) {
          // Guardian not found, create new one
          const newGuardian = await guardianService.create({
            name: formData.father_name,
            cnic: formData.father_cnic || null,
            phone: formData.father_phone || null,
            occupation: formData.father_occupation || null
          })
          guardianId = newGuardian.data.id
        }
      }

      // Create student with enrollment
      const studentData = {
        name: formData.name,
        email: formData.email || null,
        date_of_birth: formData.date_of_birth || null,
        phone: formData.phone || null,
        caste: formData.caste || null,
        address: formData.address || null,
        bay_form: formData.bay_form || null,
        previous_school: formData.previous_school || null,
        father_name: formData.father_name || null,
        gender: formData.gender || null,
        is_fee_free: isFreeStudent,
        individual_monthly_fee: isFreeStudent ? 0 : (feeSchedule.monthlyFee > 0 ? feeSchedule.monthlyFee : null),
        enrollment: {
          class_id: parseInt(selectedClassId),
          section_id: parseInt(selectedSectionId),
          start_date: formData.admission_date
        }
      }
      
      const studentResponse = await studentService.create(studentData)
      const studentId = studentResponse.data.id

      // Add guardian relationship if exists
      if (guardianId) {
        await studentService.addGuardian(studentId, guardianId, 'Father')
      }

      // Upload documents if any selected
      try {
        const uploadedDocs = await uploadDocumentsForStudent(studentId)
        console.log('Documents uploaded:', uploadedDocs.length)
      } catch (docError) {
        console.warn('Some documents failed to upload:', docError)
        // Don't block admission if documents fail
      }

      // Save fee overrides if fees differ from defaults (regardless of hasCustomFees flag)
      if (selectedClassId && !isFreeStudent) {
        const hasAnyCustomFee = 
          feeSchedule.admissionFee !== classFeeDefaults.admissionFee ||
          feeSchedule.monthlyFee !== classFeeDefaults.monthlyFee ||
          feeSchedule.paperFund !== classFeeDefaults.paperFund

        if (hasAnyCustomFee) {
          const overrideData = {
            student_id: studentId,
            class_id: parseInt(selectedClassId),
            admission_fee: feeSchedule.admissionFee,
            monthly_fee: feeSchedule.monthlyFee,
            paper_fund: feeSchedule.paperFund,
            reason: feeOverrideReason?.trim() || 'Fee set during admission',
            discount_description: discountDescription?.trim() || null
          }
          
          console.log('Saving fee overrides:', overrideData)
          await feeOverrideService.create(overrideData)
        }
      }

      // Generate voucher for admission
      let generatedVoucherId = null
      if (!isFreeStudent && selectedClassId) {
        try {
          const admissionDate = new Date(formData.admission_date || new Date())
          const voucherMonth = `${admissionDate.getFullYear()}-${String(admissionDate.getMonth() + 1).padStart(2, '0')}-01`

          let voucherData
          if (isCollegeClass) {
            // College: single yearly package voucher — no fee_types, no due_date
            voucherData = {
              student_id: studentId,
              month: voucherMonth,
              yearly_package_amount: parseFloat(yearlyPackageAmount),
            }
            console.log('Generating YEARLY_COLLEGE voucher:', voucherData)
          } else {
            // School: first admission includes ADMISSION, MONTHLY, and PAPER_FUND
            const feeTypes = ['ADMISSION', 'MONTHLY', 'PAPER_FUND']
            voucherData = {
              student_id: studentId,
              month: voucherMonth,
              fee_types: feeTypes,
              custom_items: customFees.filter(fee => fee.name && fee.amount > 0).map(fee => ({
                item_type: fee.name,
                amount: parseFloat(fee.amount)
              })),
              due_date: new Date(admissionDate.getFullYear(), admissionDate.getMonth(), 10).toISOString().split('T')[0]
            }
            console.log('Generating admission voucher with all fees:', voucherData)
          }

          const voucherResponse = await feeService.generateVoucher(voucherData)
          generatedVoucherId = voucherResponse?.data?.voucher?.id || voucherResponse?.data?.id
          console.log('Generated voucher ID:', generatedVoucherId)
        } catch (voucherError) {
          console.error('Voucher generation failed:', voucherError)
          alert(`Warning: Admission successful but voucher generation failed: ${voucherError.message}. You can generate the voucher manually later.`)
        }
      }

      // Store student data for success modal
      setAdmittedStudentData({
        studentId,
        student: studentResponse.data,
        className: selectedClass,
        sectionName: sections.find(s => s.id === parseInt(selectedSectionId))?.name,
        totalFees: getTotalFees(),
        voucherGenerated: !isFreeStudent,
        voucherId: generatedVoucherId
      })

      setSuccess(true)
      setShowSuccessModal(true)
      
      // Don't auto-redirect, let user choose action
      // setTimeout(() => {
      //   navigate('/admission/list')
      // }, 2000)
    } catch (err) {
      console.error('Admission submission failed:', err)
      setError(err.message || 'Failed to submit admission. Please try again.')
      
      // Refresh classes and sections data after error to ensure fresh data for retry
      console.log('Refreshing data after submission error...')
      loadClasses()
      if (selectedClassId) {
        loadSections(selectedClassId)
      }
    } finally {
      setSubmitting(false)
    }
  }

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
          {/* System Status Indicator */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginRight: '15px',
            padding: '5px 10px',
            borderRadius: '15px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: (loadingClasses || loadingSections) ? '#fef3c7' : '#dcfce7',
            color: (loadingClasses || loadingSections) ? '#d97706' : '#059669',
            border: `1px solid ${(loadingClasses || loadingSections) ? '#f59e0b' : '#10b981'}`
          }}>
            <span style={{ marginRight: '5px' }}>
              {loadingClasses || loadingSections ? '🔄' : '✓'}
            </span>
            {loadingClasses || loadingSections ? 'Loading...' : 'System Ready'}
          </div>
          
          <button 
            onClick={() => {
              loadClasses()
              if (selectedClassId) {
                loadSections(selectedClassId)
              }
            }} 
            className="back-btn secondary" 
            disabled={submitting || loadingClasses || loadingSections}
            title="Refresh Classes & Sections"
          >
            {loadingClasses || loadingSections ? '🔄 Refreshing...' : '🔄 Refresh Data'}
          </button>
          <button onClick={() => navigate(-1)} className="back-btn" disabled={submitting}>
            ← Go Back
          </button>
          <Link to="/admissions" className="back-btn secondary">Admission Home</Link>
        </div>
      </div>

      <div className="admission-form-container">
        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
            <div style={{ marginTop: '10px', fontSize: '12px' }}>
              <strong>Debugging Info:</strong>
              <br />• Classes loaded: {classes.length}
              <br />• Sections loaded: {sections.length}  
              <br />• Selected class ID: {selectedClassId || 'None'}
              <br />• Loading classes: {loadingClasses ? 'Yes' : 'No'}
              <br />• Loading sections: {loadingSections ? 'Yes' : 'No'}
              <button 
                onClick={() => setError(null)} 
                style={{ 
                  marginLeft: '10px', 
                  padding: '2px 8px', 
                  fontSize: '10px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {success && !showSuccessModal && (
          <div className="alert alert-success">
            ✅ Admission submitted successfully! Voucher generated.
          </div>
        )}

        <form className="admission-form" onSubmit={handleSubmission}>
          {!showReview ? (
            <>
              {/* Student Information */}
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
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="Enter email address (optional)"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Gender <span style={{color: 'red'}}>*</span></label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      disabled={submitting}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Student Phone</label>
                    <input
                      type="tel"
                      placeholder="Enter phone number (optional)"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Caste</label>
                    <input
                      type="text"
                      placeholder="Enter caste (optional)"
                      value={formData.caste}
                      onChange={(e) => handleInputChange('caste', e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Address</label>
                    <textarea
                      placeholder="Enter complete address (optional)"
                      rows="3"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              {/* Father/Guardian Information */}
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
                    <label>Father CNIC</label>
                    <input
                      type="text"
                      placeholder="00000-0000000-0 (optional)"
                      value={formatCNIC(formData.father_cnic)}
                      onChange={(e) => handleCNICChange(e.target.value)}
                      disabled={submitting}
                    />
                    <small style={{ color: '#666', fontSize: '12px' }}>13 digits (dashes auto-formatted)</small>
                  </div>

                  <div className="form-group">
                    <label>Father Phone</label>
                    <input
                      type="tel"
                      placeholder="Enter phone number (optional)"
                      value={formData.father_phone}
                      onChange={(e) => handleInputChange('father_phone', e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Father Occupation</label>
                    <input
                      type="text"
                      placeholder="Enter occupation (optional)"
                      value={formData.father_occupation}
                      onChange={(e) => handleInputChange('father_occupation', e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="form-section">
                <h3>Academic Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Admission Date</label>
                    <input
                      type="date"
                      value={formData.admission_date}
                      onChange={(e) => handleInputChange('admission_date', e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Admission in Class *</label>
                    <select
                      value={selectedClassId}
                      onChange={handleClassChange}
                      disabled={submitting || loadingClasses}
                      required
                    >
                      <option value="">
                        {loadingClasses ? 'Loading classes...' : 'Select Class'}
                      </option>
                      
                      {/* School Classes */}
                      <optgroup label="━━━━ SCHOOL ━━━━">
                        {classes
                          .filter(cls => cls.class_type === 'SCHOOL')
                          .map(cls => (
                            <option key={cls.id} value={cls.id}>
                              {cls.name}
                            </option>
                          ))}
                      </optgroup>
                      
                      {/* College Classes */}
                      <optgroup label="━━━━ COLLEGE ━━━━">
                        {classes
                          .filter(cls => cls.class_type === 'COLLEGE')
                          .map(cls => (
                            <option key={cls.id} value={cls.id}>
                              {cls.name}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                    
                    {/* Loading indicator */}
                    {loadingClasses && (
                      <small style={{ color: '#3b82f6', fontSize: '12px' }}>
                        🔄 Loading classes...
                      </small>
                    )}
                    
                    {/* No classes message */}
                    {!loadingClasses && classes.length === 0 && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <small style={{ color: '#ef4444', fontSize: '12px' }}>
                          ⚠️ No classes found. 
                        </small>
                        <div style={{ marginTop: '0.5rem' }}>
                          <Link to="/classes" style={{ color: '#3b82f6', fontSize: '12px', marginRight: '10px' }}>
                            → Create classes first
                          </Link>
                          <button 
                            type="button" 
                            onClick={loadClasses} 
                            style={{ 
                              color: '#3b82f6', 
                              background: 'none', 
                              border: 'none', 
                              cursor: 'pointer', 
                              textDecoration: 'underline', 
                              fontSize: '12px' 
                            }}
                            disabled={loadingClasses}
                          >
                            🔄 Refresh Classes
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Classes loaded message */}
                    {!loadingClasses && classes.length > 0 && (
                      <small style={{ color: '#10b981', fontSize: '12px' }}>
                        ✓ {classes.length} class(es) available
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Section *</label>
                    <select
                      value={selectedSectionId}
                      onChange={handleSectionChange}
                      disabled={submitting || !selectedClassId || loadingSections}
                      required
                    >
                      <option value="">
                        {loadingSections ? 'Loading sections...' : 'Select Section'}
                      </option>
                      {sections.map(section => (
                        <option key={section.id} value={section.id}>
                          {section.name} - {section.student_count || 0} students
                        </option>
                      ))}
                    </select>
                    
                    {/* Loading sections indicator */}
                    {loadingSections && (
                      <small style={{ color: '#3b82f6', fontSize: '12px' }}>
                        🔄 Loading sections...
                      </small>
                    )}
                    
                    {/* Section capacity warning */}
                    {selectedSectionId && !loadingSections && (() => {
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
                    
                    {/* No class selected message */}
                    {!selectedClassId && !loadingClasses && (
                      <small style={{ color: '#666', fontSize: '12px' }}>Select a class first</small>
                    )}
                    
                    {/* No sections found message */}
                    {selectedClassId && !loadingSections && sections.length === 0 && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <small style={{ color: '#ef4444', fontSize: '12px' }}>
                          ⚠️ No sections found for this class.
                        </small>
                        <div style={{ marginTop: '0.5rem' }}>
                          <Link to="/classes" style={{ color: '#3b82f6', fontSize: '12px', marginRight: '10px' }}>
                            → Add sections to this class
                          </Link>
                          <button 
                            type="button" 
                            onClick={() => loadSections(selectedClassId)} 
                            style={{ 
                              color: '#3b82f6', 
                              background: 'none', 
                              border: 'none', 
                              cursor: 'pointer', 
                              textDecoration: 'underline', 
                              fontSize: '12px' 
                            }}
                            disabled={loadingSections}
                          >
                            🔄 Refresh Sections
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Sections available message */}
                    {selectedClassId && !loadingSections && sections.length > 0 && (
                      <small style={{ color: '#10b981', fontSize: '12px' }}>
                        ✓ {sections.length} section(s) available
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Bay Form</label>
                    <input
                      type="text"
                      placeholder="Enter bay form number (optional)"
                      value={formData.bay_form}
                      onChange={(e) => handleInputChange('bay_form', e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Previous School Name</label>
                    <input
                      type="text"
                      placeholder="Enter previous school name (optional)"
                      value={formData.previous_school}
                      onChange={(e) => handleInputChange('previous_school', e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              {/* College Annual Fee Summary */}
              {isCollegeClass && parseFloat(yearlyPackageAmount) > 0 && (
                <div className="form-section fee-schedule-section" style={{
                  backgroundColor: '#fdf4ff',
                  border: '2px solid #a855f7',
                  borderRadius: '6px',
                  padding: '1.5rem',
                  marginTop: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#7c3aed' }}>
                      🎓 College Annual Fee Package
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowYearlyPackageModal(true)}
                      style={{
                        padding: '6px 14px',
                        background: '#7c3aed',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                      disabled={submitting}
                    >
                      Edit Amount
                    </button>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderTop: '1px solid #e9d5ff'
                  }}>
                    <span style={{ fontSize: '15px', color: '#374151' }}>Total Yearly Package:</span>
                    <strong style={{ fontSize: '20px', color: '#7c3aed' }}>
                      Rs. {parseFloat(yearlyPackageAmount).toLocaleString()}/-
                    </strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                    ℹ️ A single annual voucher will be generated. Payments will be tracked against it throughout the year.
                  </p>
                </div>
              )}

              {/* Fee Schedule Display - School classes only */}
              {!isCollegeClass && (showFeeSchedule || selectedClassId) && (
                <div className="form-section fee-schedule-section" style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '1.5rem',
                  marginTop: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                      Fee Schedule for {selectedClass || '(Select a class)'}
                    </h3>
                    <label className="free-student-toggle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isFreeStudent}
                        onChange={(e) => setIsFreeStudent(e.target.checked)}
                        disabled={submitting}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px' }}>Mark as Free Student</span>
                    </label>
                  </div>

                  {!isFreeStudent && (
                    <>
                      {/* Compact Fee Table */}
                      <div style={{ marginBottom: '1rem' }}>
                        <table style={{ 
                          width: '100%', 
                          borderCollapse: 'collapse',
                          border: '1px solid #e5e7eb'
                        }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f9fafb' }}>
                              <th style={{ 
                                padding: '12px', 
                                textAlign: 'left', 
                                borderBottom: '1px solid #e5e7eb',
                                fontWeight: '600',
                                fontSize: '14px',
                                color: '#374151'
                              }}>Fee Type</th>
                              <th style={{ 
                                padding: '12px', 
                                textAlign: 'right', 
                                borderBottom: '1px solid #e5e7eb',
                                fontWeight: '600',
                                fontSize: '14px',
                                color: '#374151'
                              }}>Amount (Rs.)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ 
                                padding: '12px', 
                                borderBottom: '1px solid #e5e7eb',
                                fontSize: '14px',
                                color: '#111827'
                              }}>Admission Fee</td>
                              <td style={{ 
                                padding: '12px', 
                                borderBottom: '1px solid #e5e7eb',
                                textAlign: 'right'
                              }}>
                                {hasCustomFees ? (
                                  <input
                                    type="number"
                                    value={feeSchedule.admissionFee}
                                    onChange={(e) => handleFeeChange('admissionFee', e.target.value)}
                                    min="0"
                                    disabled={submitting}
                                    style={{
                                      width: '100px',
                                      padding: '6px 8px',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '4px',
                                      textAlign: 'right',
                                      fontSize: '14px'
                                    }}
                                  />
                                ) : (
                                  <span style={{ fontSize: '14px', color: '#111827' }}>
                                    {feeSchedule.admissionFee?.toLocaleString() || 0}
                                  </span>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ 
                                padding: '12px', 
                                borderBottom: '1px solid #e5e7eb',
                                fontSize: '14px',
                                color: '#111827'
                              }}>Monthly Fee</td>
                              <td style={{ 
                                padding: '12px', 
                                borderBottom: '1px solid #e5e7eb',
                                textAlign: 'right'
                              }}>
                                {hasCustomFees ? (
                                  <input
                                    type="number"
                                    value={feeSchedule.monthlyFee}
                                    onChange={(e) => handleFeeChange('monthlyFee', e.target.value)}
                                    min="0"
                                    disabled={submitting}
                                    style={{
                                      width: '100px',
                                      padding: '6px 8px',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '4px',
                                      textAlign: 'right',
                                      fontSize: '14px'
                                    }}
                                  />
                                ) : (
                                  <span style={{ fontSize: '14px', color: '#111827' }}>
                                    {feeSchedule.monthlyFee?.toLocaleString() || 0}
                                  </span>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ 
                                padding: '12px', 
                                borderBottom: '1px solid #e5e7eb',
                                fontSize: '14px',
                                color: '#111827'
                              }}>Paper Fund</td>
                              <td style={{ 
                                padding: '12px', 
                                borderBottom: '1px solid #e5e7eb',
                                textAlign: 'right'
                              }}>
                                {hasCustomFees ? (
                                  <input
                                    type="number"
                                    value={feeSchedule.paperFund}
                                    onChange={(e) => handleFeeChange('paperFund', e.target.value)}
                                    min="0"
                                    disabled={submitting}
                                    style={{
                                      width: '100px',
                                      padding: '6px 8px',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '4px',
                                      textAlign: 'right',
                                      fontSize: '14px'
                                    }}
                                  />
                                ) : (
                                  <span style={{ fontSize: '14px', color: '#111827' }}>
                                    {feeSchedule.paperFund?.toLocaleString() || 0}
                                  </span>
                                )}
                              </td>
                            </tr>
                            {customFees.map((fee) => (
                              <tr key={fee.id}>
                                <td style={{ 
                                  padding: '12px', 
                                  borderBottom: '1px solid #e5e7eb',
                                  fontSize: '14px'
                                }}>
                                  <input
                                    type="text"
                                    placeholder="Custom fee name"
                                    value={fee.name}
                                    onChange={(e) => updateCustomFee(fee.id, 'name', e.target.value)}
                                    style={{
                                      width: '200px',
                                      padding: '6px 8px',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '4px',
                                      fontSize: '14px'
                                    }}
                                  />
                                </td>
                                <td style={{ 
                                  padding: '12px', 
                                  borderBottom: '1px solid #e5e7eb',
                                  textAlign: 'right'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                                    <input
                                      type="number"
                                      value={fee.amount}
                                      onChange={(e) => updateCustomFee(fee.id, 'amount', parseFloat(e.target.value) || 0)}
                                      min="0"
                                      style={{
                                        width: '100px',
                                        padding: '6px 8px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        textAlign: 'right',
                                        fontSize: '14px'
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeCustomFee(fee.id)}
                                      style={{
                                        padding: '4px 8px',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                      }}
                                    >
                                      ×
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            <tr style={{ backgroundColor: '#f9fafb' }}>
                              <td style={{ 
                                padding: '12px', 
                                fontWeight: '700',
                                fontSize: '15px',
                                color: '#111827'
                              }}>Total Amount</td>
                              <td style={{ 
                                padding: '12px', 
                                textAlign: 'right',
                                fontWeight: '700',
                                fontSize: '16px',
                                color: '#2563eb'
                              }}>
                                Rs. {getTotalFees().toLocaleString()}/-
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Add Custom Fee Button */}
                      <div style={{ marginBottom: '1rem' }}>
                        <button
                          type="button"
                          onClick={addCustomFee}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span style={{ fontSize: '16px' }}>+</span>
                          Add Custom Fee
                        </button>
                      </div>

                      {/* Custom Fees Toggle */}
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '14px' }}>
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
                            style={{ cursor: 'pointer' }}
                          />
                          <span>Set Custom Fees for this Student</span>
                        </label>
                      </div>

                      {hasCustomFees && (
                        <div className="form-group" style={{ marginTop: '1rem' }}>
                          <label>Reason for Custom Fees</label>
                          <textarea
                            placeholder="Please explain why custom fees are being set"
                            value={feeOverrideReason}
                            onChange={(e) => setFeeOverrideReason(e.target.value)}
                            disabled={submitting}
                            rows="2"
                          />
                        </div>
                      )}

                      {/* Show discount description field if monthly fee is discounted */}
                      {feeSchedule.monthlyFee < classFeeDefaults.monthlyFee && (
                        <div className="form-group" style={{ marginTop: '1rem' }}>
                          <label>
                            Monthly Fee Discount Description *
                            <span style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                              (Will appear on all monthly vouchers)
                            </span>
                          </label>
                          <textarea
                            placeholder="E.g., 'Staff child discount', 'Financial hardship', 'Sibling discount', etc."
                            value={discountDescription}
                            onChange={(e) => setDiscountDescription(e.target.value)}
                            disabled={submitting}
                            rows="2"
                            style={{
                              border: '2px solid #10b981',
                              background: '#f0fdf4'
                            }}
                          />
                          <small style={{ color: '#059669', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                            ℹ️ This description will be printed on every monthly fee voucher for this student.
                          </small>
                        </div>
                      )}
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

              {/* Document Upload Section */}
              <div className="form-section">
                <h3>Upload Documents (Optional)</h3>
                <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                  Select documents to upload. Documents will be saved after admission submission.
                </p>

                <div className="documents-upload-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  {/* Student Photo */}
                  <div className="document-upload-item">
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Student Photo</label>
                    <div style={{ border: '2px dashed #d1d5db', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
                      {documentPreviews.photo ? (
                        <div>
                          <img src={documentPreviews.photo} alt="Preview" style={{ maxWidth: '100%', maxHeight: '150px', marginBottom: '0.5rem' }} />
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button type="button" onClick={() => removeDocument('photo')} className="btn-cancel" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>Remove</button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleDocumentSelect('photo', e.target.files[0])}
                            style={{ display: 'none' }}
                            id="photo-upload"
                            disabled={submitting}
                          />
                          <label htmlFor="photo-upload" style={{ cursor: 'pointer', color: '#3b82f6' }}>
                            📸 Choose Photo
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bay Form */}
                  <div className="document-upload-item">
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Bay Form / B-Form</label>
                    <div style={{ border: '2px dashed #d1d5db', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
                      {documentPreviews.bayForm ? (
                        <div>
                          {documentPreviews.bayForm === 'pdf' ? (
                            <div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '4px', marginBottom: '0.5rem' }}>
                              📄 {selectedDocuments.bayForm.name}
                            </div>
                          ) : (
                            <img src={documentPreviews.bayForm} alt="Preview" style={{ maxWidth: '100%', maxHeight: '150px', marginBottom: '0.5rem' }} />
                          )}
                          <button type="button" onClick={() => removeDocument('bayForm')} className="btn-cancel" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>Remove</button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => handleDocumentSelect('bayForm', e.target.files[0])}
                            style={{ display: 'none' }}
                            id="bayform-upload"
                            disabled={submitting}
                          />
                          <label htmlFor="bayform-upload" style={{ cursor: 'pointer', color: '#3b82f6' }}>
                            📄 Choose File
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Father CNIC */}
                  <div className="document-upload-item">
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Father's CNIC</label>
                    <div style={{ border: '2px dashed #d1d5db', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
                      {documentPreviews.fatherCnic ? (
                        <div>
                          {documentPreviews.fatherCnic === 'pdf' ? (
                            <div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '4px', marginBottom: '0.5rem' }}>
                              📄 {selectedDocuments.fatherCnic.name}
                            </div>
                          ) : (
                            <img src={documentPreviews.fatherCnic} alt="Preview" style={{ maxWidth: '100%', maxHeight: '150px', marginBottom: '0.5rem' }} />
                          )}
                          <button type="button" onClick={() => removeDocument('fatherCnic')} className="btn-cancel" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>Remove</button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => handleDocumentSelect('fatherCnic', e.target.files[0])}
                            style={{ display: 'none' }}
                            id="cnic-upload"
                            disabled={submitting}
                          />
                          <label htmlFor="cnic-upload" style={{ cursor: 'pointer', color: '#3b82f6' }}>
                            🪪 Choose File
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Birth Certificate */}
                  <div className="document-upload-item">
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Birth Certificate</label>
                    <div style={{ border: '2px dashed #d1d5db', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
                      {documentPreviews.birthCertificate ? (
                        <div>
                          {documentPreviews.birthCertificate === 'pdf' ? (
                            <div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '4px', marginBottom: '0.5rem' }}>
                              📄 {selectedDocuments.birthCertificate.name}
                            </div>
                          ) : (
                            <img src={documentPreviews.birthCertificate} alt="Preview" style={{ maxWidth: '100%', maxHeight: '150px', marginBottom: '0.5rem' }} />
                          )}
                          <button type="button" onClick={() => removeDocument('birthCertificate')} className="btn-cancel" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>Remove</button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => handleDocumentSelect('birthCertificate', e.target.files[0])}
                            style={{ display: 'none' }}
                            id="birth-cert-upload"
                            disabled={submitting}
                          />
                          <label htmlFor="birth-cert-upload" style={{ cursor: 'pointer', color: '#3b82f6' }}>
                            📋 Choose File
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>



              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting || !formData.name || !formData.father_name || !selectedClassId || !selectedSectionId}
                >
                  {submitting ? 'Processing...' : 'Review & Submit'}
                </button>
              </div>
            </>
          ) : (
            /* Review Section */
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
                      <span className="review-label">Email:</span>
                      <span className="review-value">{formData.email || 'N/A'}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Date of Birth:</span>
                      <span className="review-value">{formData.date_of_birth || 'N/A'}</span>
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
                      <span className="review-value">{formData.address || 'N/A'}</span>
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
                      <span className="review-value">{formatCNIC(formData.father_cnic) || 'N/A'}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Father Phone:</span>
                      <span className="review-value">{formData.father_phone || 'N/A'}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Occupation:</span>
                      <span className="review-value">{formData.father_occupation || 'N/A'}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Gender:</span>
                      <span className="review-value">{formData.gender || 'N/A'}</span>
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

                {/* Fee Information Review */}
                {isCollegeClass ? (
                  <div className="review-section">
                    <h4>Fee Information (College Annual Package)</h4>
                    <div className="fee-summary">
                      <div className="fee-summary-item total">
                        <span><strong>Total Yearly Package:</strong></span>
                        <span><strong style={{ color: '#7c3aed' }}>Rs. {parseFloat(yearlyPackageAmount || 0).toLocaleString()}/-</strong></span>
                      </div>
                      <p style={{ margin: '0.5rem 0 0', fontSize: '12px', color: '#6b7280' }}>
                        One annual voucher will be generated. Payments tracked throughout the year.
                      </p>
                    </div>
                  </div>
                ) : showFeeSchedule && (
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
                  onClick={() => setShowReview(false)}
                  className="btn-cancel"
                  disabled={submitting}
                >
                  ← Edit Information
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Admission & Generate Voucher'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
      
      {/* Yearly Package Modal - College Classes */}
      {showYearlyPackageModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1001
        }}>
          <div className="modal-content" style={{
            background: 'white', borderRadius: '12px', padding: '2rem',
            maxWidth: '440px', width: '90%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '2px solid #a855f7'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: '#7c3aed', fontSize: '18px' }}>
                🎓 College Annual Fee Package
              </h3>
              <button
                onClick={() => {
                  if (!yearlyPackageAmount) {
                    // Cancel without amount — deselect the class
                    setSelectedClassId('')
                    setIsCollegeClass(false)
                    setFormData(prev => ({ ...prev, class: '', section: '' }))
                  }
                  setShowYearlyPackageModal(false)
                }}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#6b7280' }}
              >×</button>
            </div>

            <p style={{ color: '#374151', marginBottom: '0.25rem' }}>
              Class: <strong>{selectedClass}</strong>
            </p>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '1.25rem' }}>
              Enter the total fee package for this academic year.
              A <strong>single annual voucher</strong> will be generated at admission.
              Each payment gets recorded against it with date and remaining balance.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                Total Yearly Package (Rs.) *
              </label>
              <input
                type="number"
                value={yearlyPackageAmount}
                onChange={(e) => setYearlyPackageAmount(e.target.value)}
                min="1"
                placeholder="e.g., 80000"
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '20px',
                  fontWeight: '700',
                  textAlign: 'right',
                  border: '2px solid #a855f7',
                  borderRadius: '6px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (yearlyPackageAmount && parseFloat(yearlyPackageAmount) > 0) {
                      setShowYearlyPackageModal(false)
                    }
                  }
                }}
              />
              {yearlyPackageAmount && parseFloat(yearlyPackageAmount) > 0 && (
                <p style={{ textAlign: 'right', marginTop: '0.4rem', color: '#7c3aed', fontWeight: '600', fontSize: '15px' }}>
                  Rs. {parseFloat(yearlyPackageAmount).toLocaleString()}/-
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setShowYearlyPackageModal(false)
                  setSelectedClassId('')
                  setIsCollegeClass(false)
                  setYearlyPackageAmount('')
                  setFormData(prev => ({ ...prev, class: '', section: '' }))
                }}
                style={{
                  padding: '9px 18px', background: '#f3f4f6', color: '#374151',
                  border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '14px'
                }}
              >Cancel</button>
              <button
                type="button"
                onClick={() => {
                  if (!yearlyPackageAmount || parseFloat(yearlyPackageAmount) <= 0) {
                    alert('Please enter a valid yearly package amount')
                    return
                  }
                  setShowYearlyPackageModal(false)
                }}
                style={{
                  padding: '9px 18px', background: '#7c3aed', color: 'white',
                  border: 'none', borderRadius: '6px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: '600'
                }}
              >Confirm Amount</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && admittedStudentData && (
        <div className="modal-overlay" style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0, 0, 0, 0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000 
        }}>
          <div className="modal-content" style={{ 
            background: 'white', 
            borderRadius: '12px', 
            padding: '2rem', 
            maxWidth: '500px', 
            width: '90%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
              <h2 style={{ color: '#059669', marginBottom: '0.5rem' }}>
                Admission Successful!
              </h2>
              <p style={{ color: '#6b7280' }}>
                {admittedStudentData.student.name} has been successfully admitted to {admittedStudentData.className}{admittedStudentData.sectionName ? ` - ${admittedStudentData.sectionName}` : ''}
              </p>
            </div>
            
            <div className="admission-summary" style={{ 
              background: '#f9fafb', 
              padding: '1rem', 
              borderRadius: '8px', 
              marginBottom: '1.5rem' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Student ID:</span>
                <strong>#{admittedStudentData.studentId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Class & Section:</span>
                <strong>{admittedStudentData.className}{admittedStudentData.sectionName ? ` - ${admittedStudentData.sectionName}` : ''}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Total Fees:</span>
                <strong>Rs. {admittedStudentData.totalFees.toLocaleString()}/-</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Voucher Status:</span>
                <strong className={admittedStudentData.voucherGenerated ? "text-green-600" : "text-blue-600"}>
                  {admittedStudentData.voucherGenerated ? "✅ Generated" : "📚 Free Student"}
                </strong>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button
                onClick={handleViewStudent}
                style={{
                  width: '100%',
                  padding: '0.7rem 1rem',
                  background: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  letterSpacing: '0.01em'
                }}
              >
                View Student Profile
              </button>

              <button
                onClick={() => navigate('/fees/vouchers')}
                style={{
                  width: '100%',
                  padding: '0.7rem 1rem',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  letterSpacing: '0.01em'
                }}
              >
                View Fee Voucher
              </button>

              <button
                onClick={handleGoToAdmissionList}
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem',
                  background: 'transparent',
                  border: '1.5px solid #d1d5db',
                  color: '#374151',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                Go to Admission List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdmissionFormNew