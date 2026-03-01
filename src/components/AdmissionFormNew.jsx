import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { studentService } from '../services/studentService'
import { guardianService } from '../services/guardianService'
import { classService, sectionService } from '../services/classService'
import { feeOverrideService, feeService, discountService, feeVoucherService } from '../services/feeService'
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
  const [showVoucherPreview, setShowVoucherPreview] = useState(false)
  const [voucherPreview, setVoucherPreview] = useState(null)
  const [hasCustomFees, setHasCustomFees] = useState(false)
  const [feeOverrideReason, setFeeOverrideReason] = useState('')
  const [discountDescription, setDiscountDescription] = useState('')
  
  // Discount integration states
  const [hasDiscount, setHasDiscount] = useState(false)
  const [discountType, setDiscountType] = useState('PERCENTAGE')
  const [discountValue, setDiscountValue] = useState('')
  const [discountReason, setDiscountReason] = useState('')
  const [discountDuration, setDiscountDuration] = useState('permanent') // 'permanent' or 'admission_only'
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [admittedStudentData, setAdmittedStudentData] = useState(null)

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
      console.log('Loading classes...')
      
      // Remove health check to avoid delays in development
      const response = await classService.list()
      console.log('Classes API response:', response)
      
      if (response && response.data) {
        console.log('Classes loaded successfully:', response.data)
        
        // Sort classes in proper sequence: PG (Playgroup) to 2nd Year
        const sortedClasses = sortClassesBySequence(response.data)
        console.log('Classes sorted in sequence:', sortedClasses)
        
        setClasses(sortedClasses)
        
        // Clear any previous error
        if (error && error.includes('Failed to load classes')) {
          setError(null)
        }
      } else {
        console.warn('No classes data received')
        setClasses([])
      }
    } catch (err) {
      console.error('Failed to load classes:', err)
      setError(`Failed to load classes: ${err.message || err}`)
      setClasses([])
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
        setSections([])
      }
    } catch (err) {
      console.error('Failed to load sections:', err)
      setSections([])
      // Don't show error for sections as it's not critical for form functionality
    } finally {
      setLoadingSections(false)
    }
  }

  const handleClassChange = async (e) => {
    const classId = e.target.value
    console.log('Class selection changed to:', classId)
    
    setSelectedClassId(classId)
    setSelectedSectionId('')
    setFormData({ ...formData, section: '' })
    
    if (classId) {
      const selectedClassObj = classes.find(c => c.id === parseInt(classId))
      if (selectedClassObj) {
        setSelectedClass(selectedClassObj.name)
        setFormData({ ...formData, class: selectedClassObj.name, section: '' })
        
        console.log('Loading sections and fee structure for class:', selectedClassObj.name)
        
        // Load sections for the selected class - this will be handled by useEffect
        // But we also trigger it manually to be sure
        await loadSections(classId)
        
        // Load fee structure using classService.getById
        try {
          console.log('Fetching class details for fee structure...')
          const classResponse = await classService.getById(classId)
          console.log('Class details response:', classResponse)
          
          // Check both possible field names
          const feeStruct = classResponse.data?.current_fee_structure || classResponse.data?.fee_structure
          console.log('Fee structure data:', feeStruct)
          
          if (feeStruct) {
            console.log('Fee structure found:', feeStruct)
            const defaults = {
              admissionFee: parseFloat(feeStruct.admission_fee) || 0,
              monthlyFee: parseFloat(feeStruct.monthly_fee) || 0,
              paperFund: parseFloat(feeStruct.paper_fund) || 0,
            }
            console.log('Parsed fee defaults:', defaults)
            setClassFeeDefaults(defaults)
            setFeeSchedule({
              ...defaults,
              total: defaults.admissionFee + defaults.monthlyFee + defaults.paperFund
            })
            setShowFeeSchedule(true)
            console.log('Fee schedule updated and showFeeSchedule set to true')
          } else {
            console.warn('No fee structure found for class. Response data:', classResponse.data)
            // Still show the fee section but with zero values so user can enter custom fees
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
            setShowFeeSchedule(true) // Show it anyway
            setHasCustomFees(true) // Enable editing
            console.log('No fee structure, showing empty form for custom fees')
          }
        } catch (err) {
          console.error('Failed to load fee structure:', err)
          console.error('Error details:', err.response?.data || err.message)
          // Show fee section anyway so user can enter fees manually
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
          setShowFeeSchedule(true)
          setHasCustomFees(true)
          setError(`Unable to load fee structure for ${selectedClassObj.name}. You can enter fees manually.`)
        }
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
    
    // Generate voucher preview when both class and section are selected
    setTimeout(() => generateVoucherPreview(), 100) // Small delay to ensure state updates
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
    
    // Regenerate voucher preview when fees change
    setTimeout(() => generateVoucherPreview(), 100)
  }

  const addCustomFee = () => {
    setCustomFees([...customFees, { id: Date.now(), name: '', amount: 0 }])
  }

  const updateCustomFee = (id, field, value) => {
    setCustomFees(customFees.map(fee => 
      fee.id === id ? { ...fee, [field]: value } : fee
    ))
    // Regenerate voucher preview when custom fees change
    setTimeout(() => generateVoucherPreview(), 100)
  }

  const removeCustomFee = (id) => {
    setCustomFees(customFees.filter(fee => fee.id !== id))
    // Regenerate voucher preview when custom fees change
    setTimeout(() => generateVoucherPreview(), 100)
  }

  const getTotalFees = () => {
    if (isFreeStudent) return 0
    const baseFees = feeSchedule.admissionFee + feeSchedule.monthlyFee + feeSchedule.paperFund
    const customFeesTotal = customFees.reduce((total, fee) => total + (fee.amount || 0), 0)
    let total = baseFees + customFeesTotal
    
    // Apply discount if enabled
    if (hasDiscount && discountValue) {
      const discountAmount = discountType === 'PERCENTAGE' 
        ? (total * parseFloat(discountValue)) / 100
        : parseFloat(discountValue)
      total = Math.max(0, total - discountAmount)
    }
    
    return Math.round(total)
  }
  
  // Post-admission action handlers
  const handlePrintVoucher = useCallback(async () => {
    if (admittedStudentData?.voucherGenerated) {
      try {
        // Get the latest voucher for this student
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
    }
  }, [admittedStudentData])
  
  const handlePayVoucher = useCallback(() => {
    if (admittedStudentData?.studentId) {
      navigate(`/fees/payment?student_id=${admittedStudentData.studentId}`)
    }
  }, [admittedStudentData, navigate])
  
  const handleViewStudent = useCallback(() => {
    if (admittedStudentData?.studentId) {
      navigate(`/students/${admittedStudentData.studentId}`)
    }
  }, [admittedStudentData, navigate])
  
  const handleGoToAdmissionList = useCallback(() => {
    navigate('/admission/list')
  }, [navigate])
  
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

  // Generate instant voucher preview
  const generateVoucherPreview = () => {
    if (!selectedClassId || !selectedSectionId || isFreeStudent) {
      setVoucherPreview(null)
      setShowVoucherPreview(false)
      return
    }

    const totalFees = getTotalFees()
    const currentDate = new Date()
    const voucherData = {
      studentName: formData.name || 'Student Name',
      fatherName: formData.father_name || 'Father Name',
      className: selectedClass,
      sectionName: sections.find(s => s.id === parseInt(selectedSectionId))?.name || '',
      admissionDate: formData.admission_date || currentDate.toISOString().split('T')[0],
      fees: {
        admissionFee: feeSchedule.admissionFee,
        monthlyFee: feeSchedule.monthlyFee,
        paperFund: feeSchedule.paperFund,
        customFees: customFees,
        total: totalFees
      },
      voucherNumber: `ADM-${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${Math.random().toString().substr(2, 6)}`,
      issueDate: currentDate.toLocaleDateString('en-US'),
      dueDate: new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US') // 30 days from now
    }
    
    setVoucherPreview(voucherData)
    setShowVoucherPreview(true)
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

    // Validate discount description if monthly fee is discounted
    if (feeSchedule.monthlyFee < classFeeDefaults.monthlyFee && !discountDescription.trim()) {
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
        roll_no: formData.roll_no || null,
        date_of_birth: formData.date_of_birth || null,
        phone: formData.phone || null,
        caste: formData.caste || null,
        address: formData.address || null,
        bay_form: formData.bay_form || null,
        previous_school: formData.previous_school || null,
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
            reason: feeOverrideReason || 'Fee set during admission'
          }
          
          // Add discount description if monthly fee is reduced
          if (feeSchedule.monthlyFee < classFeeDefaults.monthlyFee && discountDescription) {
            overrideData.discount_description = discountDescription
          }
          
          console.log('Saving fee overrides:', overrideData)
          await feeOverrideService.create(overrideData)
        }
      }

      // Apply discount if enabled (permanent or admission-only)
      if (hasDiscount && discountValue && !isFreeStudent) {
        const discountData = {
          student_id: studentId,
          class_id: parseInt(selectedClassId),
          discount_type: discountType,
          discount_value: parseFloat(discountValue),
          reason: discountReason || 'Discount applied during admission',
          effective_from: formData.admission_date,
          is_permanent: discountDuration === 'permanent',
          for_month: discountDuration === 'admission_only' ? formData.admission_date : null
        }
        
        console.log('Applying discount:', discountData)
        await discountService.create(discountData)
      }

      // Generate voucher for admission (includes all fees on first admission)
      if (!isFreeStudent && selectedClassId) {
        try {
          // For first admission, include ADMISSION, MONTHLY, and PAPER_FUND fees
          const feeTypes = ['ADMISSION', 'MONTHLY', 'PAPER_FUND']
          
          const voucherData = {
            student_id: studentId,
            month: formData.admission_date || new Date().toISOString().split('T')[0],
            fee_types: feeTypes,
            custom_items: customFees.filter(fee => fee.name && fee.amount > 0).map(fee => ({
              item_type: fee.name,
              amount: parseFloat(fee.amount)
            })),
            due_date: (() => {
              const admissionDate = new Date(formData.admission_date || new Date())
              // Set due date to 10th of admission month
              return new Date(admissionDate.getFullYear(), admissionDate.getMonth(), 10).toISOString().split('T')[0]
            })()
          }
          
          console.log('Generating admission voucher with all fees:', voucherData)
          await feeService.generateVoucher(voucherData)
        } catch (voucherError) {
          console.error('Voucher generation failed:', voucherError)
          // Don't block admission if voucher fails, but log to user
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
        voucherGenerated: !isFreeStudent
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
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      disabled={submitting}
                    />
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

              {/* Fee Schedule Display */}
              {showFeeSchedule && (
                <div className="form-section fee-schedule-section" style={{
                  backgroundColor: '#fef9e7',
                  border: '2px solid #f4d03f',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  marginTop: '1rem'
                }}>
                  <div className="fee-header">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      💰 Fee Structure for {selectedClass}
                    </h3>
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
                        backgroundColor: '#e8f5e9',
                        padding: '1.25rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        border: '1px solid #66bb6a'
                      }}>
                        <h4 style={{ fontSize: '15px', marginBottom: '0.75rem', color: '#2e7d32', fontWeight: '600' }}>
                          📊 Standard Class Fees:
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', fontSize: '14px' }}>
                          <div style={{ padding: '0.5rem', backgroundColor: 'white', borderRadius: '4px', textAlign: 'center' }}>
                            <div style={{ color: '#666', fontSize: '12px', marginBottom: '0.25rem' }}>Admission Fee</div>
                            <div style={{ fontWeight: 'bold', color: '#2e7d32', fontSize: '16px' }}>Rs. {classFeeDefaults.admissionFee}</div>
                          </div>
                          <div style={{ padding: '0.5rem', backgroundColor: 'white', borderRadius: '4px', textAlign: 'center' }}>
                            <div style={{ color: '#666', fontSize: '12px', marginBottom: '0.25rem' }}>Monthly Fee</div>
                            <div style={{ fontWeight: 'bold', color: '#2e7d32', fontSize: '16px' }}>Rs. {classFeeDefaults.monthlyFee}</div>
                          </div>
                          <div style={{ padding: '0.5rem', backgroundColor: 'white', borderRadius: '4px', textAlign: 'center' }}>
                            <div style={{ color: '#666', fontSize: '12px', marginBottom: '0.25rem' }}>Paper Fund</div>
                            <div style={{ fontWeight: 'bold', color: '#2e7d32', fontSize: '16px' }}>Rs. {classFeeDefaults.paperFund}</div>
                          </div>
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

                          <div className="fee-row total-row">
                            <label><strong>Total Amount</strong></label>
                            <div className="total-amount">
                              <strong>Rs. {getTotalFees().toLocaleString()}/-</strong>
                            </div>
                          </div>
                        </div>
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

                      {/* Discount Section */}
                      {!isFreeStudent && (
                        <div className="form-group" style={{ marginTop: '2rem' }}>
                          <div className="checkbox-wrapper">
                            <input
                              type="checkbox"
                              id="hasDiscount"
                              checked={hasDiscount}
                              onChange={(e) => setHasDiscount(e.target.checked)}
                              disabled={submitting}
                            />
                            <label htmlFor="hasDiscount" style={{ marginLeft: '0.5rem' }}>
                              🎯 Apply Discount
                            </label>
                          </div>

                          {hasDiscount && (
                            <div style={{ marginTop: '1rem', padding: '1rem', border: '2px solid #3b82f6', borderRadius: '8px', background: '#f0f9ff' }}>
                              <div className="discount-options">
                                <div className="form-row">
                                  <div className="form-group" style={{ flex: 1 }}>
                                    <label>Discount Type</label>
                                    <select
                                      value={discountType}
                                      onChange={(e) => setDiscountType(e.target.value)}
                                      disabled={submitting}
                                    >
                                      <option value="PERCENTAGE">Percentage (%)</option>
                                      <option value="FLAT">Fixed Amount (Rs.)</option>
                                    </select>
                                  </div>
                                  <div className="form-group" style={{ flex: 1 }}>
                                    <label>Discount Value</label>
                                    <input
                                      type="number"
                                      placeholder={discountType === 'PERCENTAGE' ? '10' : '500'}
                                      value={discountValue}
                                      onChange={(e) => setDiscountValue(e.target.value)}
                                      min="0"
                                      max={discountType === 'PERCENTAGE' ? '100' : undefined}
                                      disabled={submitting}
                                    />
                                  </div>
                                </div>

                                <div className="form-group">
                                  <label>Duration</label>
                                  <div className="radio-group">
                                    <div className="radio-option">
                                      <input
                                        type="radio"
                                        id="permanent"
                                        name="discountDuration"
                                        value="permanent"
                                        checked={discountDuration === 'permanent'}
                                        onChange={(e) => setDiscountDuration(e.target.value)}
                                        disabled={submitting}
                                      />
                                      <label htmlFor="permanent">🔄 Permanent (All future vouchers)</label>
                                    </div>
                                    <div className="radio-option">
                                      <input
                                        type="radio"
                                        id="admission_only"
                                        name="discountDuration"
                                        value="admission_only"
                                        checked={discountDuration === 'admission_only'}
                                        onChange={(e) => setDiscountDuration(e.target.value)}
                                        disabled={submitting}
                                      />
                                      <label htmlFor="admission_only">📅 Admission Only (This voucher only)</label>
                                    </div>
                                  </div>
                                </div>

                                <div className="form-group">
                                  <label>Discount Reason</label>
                                  <input
                                    type="text"
                                    placeholder="e.g., Staff child, Sibling discount, Financial hardship"
                                    value={discountReason}
                                    onChange={(e) => setDiscountReason(e.target.value)}
                                    disabled={submitting}
                                  />
                                </div>

                                {discountValue && (
                                  <div className="discount-preview" style={{ marginTop: '1rem', padding: '0.75rem', background: '#dcfce7', borderRadius: '6px' }}>
                                    <div style={{ fontSize: '0.875rem', color: '#059669' }}>
                                      💰 Discount Preview:
                                      {(() => {
                                        const baseFees = feeSchedule.admissionFee + feeSchedule.monthlyFee + feeSchedule.paperFund
                                        const customFeesTotal = customFees.reduce((total, fee) => total + (fee.amount || 0), 0)
                                        const totalBeforeDiscount = baseFees + customFeesTotal
                                        
                                        if (discountType === 'PERCENTAGE') {
                                          const discountAmount = Math.round((totalBeforeDiscount * parseFloat(discountValue || 0)) / 100)
                                          return ` ${discountValue}% off = Rs. ${discountAmount.toLocaleString()} discount`
                                        } else {
                                          return ` Rs. ${parseFloat(discountValue || 0).toLocaleString()} off`
                                        }
                                      })()}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
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

              {/* Voucher Preview Section */}
              {showVoucherPreview && voucherPreview && (
                <div className="form-section voucher-preview-section">
                  <h3>📋 Voucher Preview</h3>
                  <div className="voucher-preview">
                    <div className="voucher-header">
                      <h4>ADMISSION FEE VOUCHER</h4>
                      <div className="voucher-meta">
                        <span>Voucher #: {voucherPreview.voucherNumber}</span>
                        <span>Issue Date: {voucherPreview.issueDate}</span>
                        <span>Due Date: {voucherPreview.dueDate}</span>
                      </div>
                    </div>
                    
                    <div className="voucher-body">
                      <div className="student-info">
                        <div className="info-row">
                          <span>Student Name:</span>
                          <span>{voucherPreview.studentName}</span>
                        </div>
                        <div className="info-row">
                          <span>Father Name:</span>
                          <span>{voucherPreview.fatherName}</span>
                        </div>
                        <div className="info-row">
                          <span>Class:</span>
                          <span>{voucherPreview.className}</span>
                        </div>
                        <div className="info-row">
                          <span>Section:</span>
                          <span>{voucherPreview.sectionName}</span>
                        </div>
                        <div className="info-row">
                          <span>Admission Date:</span>
                          <span>{voucherPreview.admissionDate}</span>
                        </div>
                      </div>
                      
                      <div className="fee-breakdown">
                        <h5>Fee Breakdown: <small style={{fontWeight: 'normal', color: '#6b7280'}}>(Click to edit amounts)</small></h5>
                        <div className="fee-items">
                          <div className="fee-item editable">
                            <span>Admission Fee:</span>
                            <div className="editable-amount">
                              <span>Rs. </span>
                              <input
                                type="number"
                                value={feeSchedule.admissionFee}
                                onChange={(e) => handleFeeChange('admissionFee', e.target.value)}
                                className="inline-fee-input"
                                min="0"
                                step="50"
                              />
                              <span>/-</span>
                            </div>
                          </div>
                          <div className="fee-item editable">
                            <span>Monthly Fee:</span>
                            <div className="editable-amount">
                              <span>Rs. </span>
                              <input
                                type="number"
                                value={feeSchedule.monthlyFee}
                                onChange={(e) => handleFeeChange('monthlyFee', e.target.value)}
                                className="inline-fee-input"
                                min="0"
                                step="50"
                              />
                              <span>/-</span>
                            </div>
                          </div>
                          <div className="fee-item editable">
                            <span>Paper Fund:</span>
                            <div className="editable-amount">
                              <span>Rs. </span>
                              <input
                                type="number"
                                value={feeSchedule.paperFund}
                                onChange={(e) => handleFeeChange('paperFund', e.target.value)}
                                className="inline-fee-input"
                                min="0"
                                step="25"
                              />
                              <span>/-</span>
                            </div>
                          </div>
                          {customFees.map((fee, index) => (
                            <div key={fee.id || index} className="fee-item custom-fee-item">
                              <input
                                type="text"
                                placeholder="Enter fee name"
                                value={fee.name}
                                onChange={(e) => updateCustomFee(fee.id || index, 'name', e.target.value)}
                                className="custom-fee-name-input"
                              />
                              <div className="editable-amount">
                                <span>Rs. </span>
                                <input
                                  type="number"
                                  value={fee.amount}
                                  onChange={(e) => updateCustomFee(fee.id || index, 'amount', parseFloat(e.target.value) || 0)}
                                  className="inline-fee-input"
                                  min="0"
                                  step="50"
                                />
                                <span>/-</span>
                                <button
                                  type="button"
                                  onClick={() => removeCustomFee(fee.id || index)}
                                  className="remove-fee-btn"
                                  title="Remove fee"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                          <div className="add-custom-fee">
                            <button
                              type="button"
                              onClick={addCustomFee}
                              className="add-fee-btn"
                            >
                              + Add Custom Fee
                            </button>
                          </div>
                          <div className="fee-item total">
                            <strong>
                              <span>Total Amount:</span>
                              <span>Rs. {getTotalFees()}/-</span>
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="voucher-footer">
                      <p><strong>Note:</strong> This is a preview. The actual voucher will be generated after submission.</p>
                    </div>
                  </div>
                </div>
              )}

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
                      <span className="review-label">Roll Number:</span>
                      <span className="review-value">{formData.roll_no || 'N/A'}</span>
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
                {admittedStudentData.student.name} has been successfully admitted to {admittedStudentData.className} - {admittedStudentData.sectionName}
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
                <strong>{admittedStudentData.className} - {admittedStudentData.sectionName}</strong>
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
            
            <div className="action-buttons" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              {admittedStudentData.voucherGenerated && (
                <>
                  <button
                    onClick={handlePrintVoucher}
                    className="btn-action"
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '600'
                    }}
                  >
                    🖨️ Print Voucher
                  </button>
                  <button
                    onClick={handlePayVoucher}
                    className="btn-action"
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'linear-gradient(135deg, #10b981, #047857)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '600'
                    }}
                  >
                    💳 Pay Now
                  </button>
                </>
              )}
              
              <button
                onClick={handleViewStudent}
                className="btn-action"
                style={{
                  padding: '0.75rem 1rem',
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  gridColumn: admittedStudentData.voucherGenerated ? 'auto' : '1 / -1'
                }}
              >
                👤 View Student
              </button>
              
              {!admittedStudentData.voucherGenerated && (
                <button
                  onClick={handleGoToAdmissionList}
                  className="btn-action"
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}
                >
                  📋 View All Admissions
                </button>
              )}
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleGoToAdmissionList}
                style={{
                  background: 'transparent',
                  border: '2px solid #d1d5db',
                  color: '#6b7280',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                {admittedStudentData.voucherGenerated ? "📋 View All Admissions" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdmissionFormNew