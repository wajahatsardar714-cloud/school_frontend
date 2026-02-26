import { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import { studentService } from '../../services/studentService'
import { classService, sectionService } from '../../services/classService'
import './CSVImportModal.css'

/**
 * Enhanced CSV Import Modal with Professional Design & Drag & Drop
 * 
 * Features:
 * - Two-column layout with drag & drop support
 * - Professional SaaS-style UI
 * - Flexible CSV field mapping
 * - Real-time validation with clean error display
 * - Sticky table headers with scrollable preview
 * - Mobile responsive design
 */
const CSVImportModal = ({ 
  isOpen, 
  onClose, 
  preselectedClassId = null, 
  preselectedSectionId = null,
  onImportSuccess = null
}) => {
  const [step, setStep] = useState(1) // 1: Class/Section selection, 2: File upload & preview, 3: Results
  const [selectedClassId, setSelectedClassId] = useState(preselectedClassId)
  const [selectedSectionId, setSelectedSectionId] = useState(preselectedSectionId)
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(false)
  const [csvData, setCsvData] = useState([])
  const [csvHeaders, setCsvHeaders] = useState([])
  const [importResults, setImportResults] = useState(null)
  const [error, setError] = useState('')
  const [validationWarnings, setValidationWarnings] = useState([])
  const [editableCsvData, setEditableCsvData] = useState([])
  
  // Drag & Drop states
  const [dragActive, setDragActive] = useState(false)
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef(null)
  
  // Full screen edit mode
  const [fullScreenEdit, setFullScreenEdit] = useState(false)
  
  // Column management for preview
  const [availableColumns, setAvailableColumns] = useState([
    { key: 'name', label: 'Student Name', required: true },
    { key: 'fatherName', label: 'Father Name', required: true },
    { key: 'firstName', label: 'First Name', required: false },
    { key: 'lastName', label: 'Last Name', required: false },
    { key: 'phone', label: 'Contact/Phone', required: false },
    { key: 'fee', label: 'Fee', required: false },
    { key: 'email', label: 'Email', required: false },
    { key: 'rollNumber', label: 'Roll/Sr Number', required: false },
    { key: 'address', label: 'Address', required: false },
    { key: 'dateOfBirth', label: 'Date of Birth', required: false },
    { key: 'motherName', label: 'Mother Name', required: false },
    { key: 'caste', label: 'Caste', required: false },
    { key: 'religion', label: 'Religion', required: false }
  ])
  const [visibleColumns, setVisibleColumns] = useState(['name', 'fatherName', 'phone', 'fee', 'rollNumber'])

  // If class and section are preselected, skip to step 2
  useEffect(() => {
    if (preselectedClassId && preselectedSectionId) {
      setStep(2)
    } else {
      setStep(1)
    }
  }, [preselectedClassId, preselectedSectionId])

  // Load classes when modal opens
  useEffect(() => {
    if (isOpen && step === 1) {
      loadClasses()
    }
  }, [isOpen, step])

  // Load sections when class is selected
  useEffect(() => {
    if (selectedClassId) {
      loadSections(selectedClassId)
    }
  }, [selectedClassId])

  const loadClasses = async () => {
    try {
      setLoading(true)
      const response = await classService.list()
      setClasses(response.data || [])
    } catch (err) {
      setError('Failed to load classes: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadSections = async (classId) => {
    try {
      setLoading(true)
      const response = await sectionService.list(classId)
      setSections(response.data || [])
    } catch (err) {
      setError('Failed to load sections: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setCsvData([])
    setEditableCsvData([])
    setImportResults(null)
    setError('')
    setValidationWarnings([])
    setFileName('')
    setDragActive(false)
    onClose()
  }

  // Comprehensive field mapping for flexible CSV import
  const fieldMappings = {
    // Name fields 
    'firstname': 'firstName',
    'fname': 'firstName',
    'first': 'firstName',
    'givenname': 'firstName',
    'forename': 'firstName',
    'lastname': 'lastName',
    'lname': 'lastName',
    'last': 'lastName',
    'secondname': 'lastName',
    'surname': 'lastName',
    'familyname': 'lastName',
    'name': 'name',
    'studentname': 'name',
    'fullname': 'name',
    
    // Serial Number / Sr No
    'srno': 'rollNumber',
    'sr': 'rollNumber',
    'sno': 'rollNumber',
    'serialno': 'rollNumber',
    'serialnumber': 'rollNumber',
    
    // Contact fields
    'email': 'email',
    'emailaddress': 'email',
    'mail': 'email',
    'phone': 'phone',
    'phonenumber': 'phone',
    'mobile': 'phone',
    'contact': 'phone',
    'contactno': 'phone',
    'contactnumber': 'phone',
    'cellphone': 'phone',
    
    // Identifier
    'rollnumber': 'rollNumber',
    'rollno': 'rollNumber',
    'roll': 'rollNumber',
    'studentid': 'rollNumber',
    'regno': 'rollNumber',
    'registrationnumber': 'rollNumber',
    
    // Fee
    'fee': 'fee',
    'fees': 'fee',
    'monthlyfee': 'fee',
    'amount': 'fee',
    
    // Address
    'address': 'address',
    'homeaddress': 'address',
    'location': 'address',
    
    // Other common fields
    'dateofbirth': 'dateOfBirth',
    'dob': 'dateOfBirth',
    'birthdate': 'dateOfBirth',
    'bayform': 'bayForm',
    'bform': 'bayForm',
    'caste': 'caste',
    'previousschool': 'previousSchool',
    'lastschool': 'previousSchool',
    'fathername': 'fatherName',
    'father': 'fatherName',
    'mothername': 'motherName',
    'mother': 'motherName',
    'guardianname': 'guardianName',
    'guardian': 'guardianName',
    'gender': 'gender',
    'sex': 'gender',
    'bloodgroup': 'bloodGroup',
    'religion': 'religion',
    'nationality': 'nationality',
    
    // Additional fields that shouldn't be ignored
    'march': 'march',
    'outstandingdues': 'outstandingDues',
    'dues': 'outstandingDues',
  }

  // Drag & Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      setFileName(file.name)
      processCSV(file)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFileName(file.name)
      processCSV(file)
    }
  }

  const processCSV = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        // Convert to JSON - get all rows as arrays first
        const allRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
        
        if (allRows.length < 2) {
          setError('File must contain at least a header row and one data row')
          return
        }

        console.log('All CSV rows:', allRows)

        // Smart header detection: Find the row with actual column names
        const headerKeywords = ['name', 'father', 'sr', 'contact', 'fee', 'roll', 'phone', 'email', 'student']
        let headerRowIndex = -1

        for (let i = 0; i < Math.min(10, allRows.length); i++) {
          const row = allRows[i]
          if (!row || row.length === 0) continue
          
          // Check if this row contains header-like text
          const rowText = row.map(cell => String(cell || '').toLowerCase()).join(' ')
          const matchCount = headerKeywords.filter(keyword => rowText.includes(keyword)).length
          
          // If we find multiple keywords, this is likely the header row
          if (matchCount >= 2) {
            headerRowIndex = i
            console.log(`📋 Detected header row at index ${i}:`, row)
            break
          }
        }

        // If no header detected, assume first row is header
        if (headerRowIndex === -1) {
          headerRowIndex = 0
          console.log('⚠️ No header detected, using first row as header')
        }

        const originalHeaders = allRows[headerRowIndex]
        const headers = originalHeaders.map(h => String(h).toLowerCase().replace(/[^a-z0-9]/g, ''))
        const rows = allRows.slice(headerRowIndex + 1)

        console.log('📄 Original headers:', originalHeaders)
        console.log('🔤 Normalized headers:', headers)
        console.log(`📊 Data rows: ${rows.length}, Skipped ${headerRowIndex} header row(s)`)

        setCsvHeaders(originalHeaders) // Original headers for display

        // Map CSV data to our fields
        const mappedData = rows.map((row, index) => {
          const student = {}
          
          headers.forEach((header, columnIndex) => {
            const value = row[columnIndex]
            const mappedField = fieldMappings[header] || header
            
            if (value !== undefined && value !== null && value !== '') {
              student[mappedField] = String(value).trim()
            }
          })

          // If we have a full "name" field, and no firstName/lastName, use name as full name
          if (student.name && !student.firstName && !student.lastName) {
            // Keep as is - backend will handle it
          }

          // Set class and section as numbers
          student.classId = parseInt(selectedClassId)
          student.sectionId = parseInt(selectedSectionId)

          return student
        })

        // Filter out completely empty rows
        const validData = mappedData.filter(student => {
          const hasData = Object.keys(student).some(key => 
            key !== 'classId' && key !== 'sectionId' && 
            student[key] && String(student[key]).trim() !== ''
          )
          return hasData
        })

        console.log('✅ Mapped data - first student:', validData[0])
        console.log(`📊 Total valid students: ${validData.length}`)

        // Validate data - Accept everything, only warn for useful info
        const warnings = []
        validData.forEach((student, index) => {
          // Warn if missing name or father name (soft requirement)
          if (!student.name && !student.firstName) {
            warnings.push({
              row: index + 1,
              message: 'Missing student name - please review'
            })
          }
          if (!student.fatherName) {
            warnings.push({
              row: index + 1,
              message: 'Missing father name - please review'
            })
          }
        })

        setCsvData(validData)
        setEditableCsvData(JSON.parse(JSON.stringify(validData))) // Deep copy for editing
        setValidationWarnings(warnings)
        setError('')
      } catch (err) {
        console.error('CSV Processing error:', err)
        setError('Error processing file: ' + err.message)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleImport = async () => {
    if (!editableCsvData.length) {
      setError('No data to import')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      // Prepare data for import - accept everything with minimal processing
      const importData = editableCsvData.map((student, index) => {
        // Build full name if not provided - auto-generate if needed
        let fullName = student.name
        if (!fullName && (student.firstName || student.lastName)) {
          fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim()
        }
        if (!fullName) {
          fullName = `Student ${index + 1}` // Auto-generate name
        }
        
        return {
          ...student,
          name: fullName,
          classId: parseInt(selectedClassId) || 1, // Default to class 1
          sectionId: parseInt(selectedSectionId) || 1, // Default to section 1
          // Let backend handle all other fields - no validation here
        }
      })

      console.log('🚀 Sending data without frontend validation:', {
        count: importData.length,
        sample: importData[0]
      })
      
      const result = await studentService.bulkCreate(importData)
      
      console.log('✅ Import successful:', result)
      
      // API returns { success: true, data: {...} } - extract the data part
      setImportResults(result.data || result)
      setStep(3)
      
      // Call success callback if provided
      if (onImportSuccess) {
        onImportSuccess(result)
      }
    } catch (err) {
      console.error('Import error:', err)
      
      // Use simple error message - don't show validation details
      const errorMessage = err.response?.data?.message || err.message || 'Import failed'
      setError(`Import failed: ${errorMessage}`)
      
      // Log details for debugging but don't show to user
      if (err.response?.data) {
        console.error('Error details:', err.response.data)
      }
    } finally {
      setLoading(false)
    }
  }

  // Column management functions
  const addColumn = (columnKey) => {
    if (!visibleColumns.includes(columnKey)) {
      setVisibleColumns([...visibleColumns, columnKey])
      
      // Add the field to all existing data rows
      const updatedData = editableCsvData.map(student => ({
        ...student,
        [columnKey]: student[columnKey] || '' // Initialize empty if doesn't exist
      }))
      setEditableCsvData(updatedData)
    }
  }

  const removeColumn = (columnKey) => {
    // Don't allow removing name or fatherName (required)
    if (columnKey === 'name' || columnKey === 'fatherName') return
    
    setVisibleColumns(visibleColumns.filter(col => col !== columnKey))
  }

  const handleCellEdit = (rowIndex, field, value) => {
    const updatedData = [...editableCsvData]
    updatedData[rowIndex] = {
      ...updatedData[rowIndex],
      [field]: value
    }
    
    // If firstName or lastName is updated, rebuild the name field
    if (field === 'firstName' || field === 'lastName') {
      const firstName = field === 'firstName' ? value : updatedData[rowIndex].firstName || ''
      const lastName = field === 'lastName' ? value : updatedData[rowIndex].lastName || ''
      updatedData[rowIndex].name = `${firstName} ${lastName}`.trim()
    }
    
    setEditableCsvData(updatedData)
  }

  const deleteRow = (rowIndex) => {
    if (window.confirm('Are you sure you want to delete this student row?')) {
      const updatedData = editableCsvData.filter((_, index) => index !== rowIndex)
      setEditableCsvData(updatedData)
      setCsvData(updatedData) // Also update the original data
      
      // Show notification
      const studentName = editableCsvData[rowIndex]?.name || editableCsvData[rowIndex]?.firstName || 'Student'
      console.log(`🗑️ Deleted row ${rowIndex + 1}: ${studentName}`)
    }
  }

  const downloadTemplate = () => {
    const template = [
      ['Muslim Public Higher Secondary School'], // Row 1
      ['Fee Record 2026'], // Row 2  
      ['Class Information'], // Row 3
      ['Sr No', 'Name', 'Father Name', 'Contact No', 'Fee', 'March', 'Outstanding Dues'], // Headers Row 4
      [1, 'Muhammad Ahmad Salar', 'Muhammad Ashraf', '0300-2673686', 1200, '', ''], // Data Row 5
      [2, 'Ali Haider', 'Nasir Hussain', '0300-6774954', 1200, '', ''],
      [3, 'Abdul Hadi Sabir', 'Muhammad Sabir', '0306-9458339', 1200, '', '']
    ]
    
    const ws = XLSX.utils.aoa_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Student Template')
    XLSX.writeFile(wb, 'student_import_template.xlsx')
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="csv-modal">

        {/* HEADER */}
        <div className="modal-header">
          <div>
            <h2>Import Students</h2>
            <p>Upload & review before importing</p>
          </div>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        {/* BODY */}
        <div className="modal-body">
          
          {/* STEP 1 - CLASS/SECTION SELECTION */}
          {step === 1 && (
            <div className="step-content">
              <div className="info-card">
                <h3>📌 Select Target Location</h3>
                <p>Choose the class and section where students will be imported</p>
              </div>

              <div className="form-card">
                <div className="form-row">
                  <div className="form-group">
                    <label>Class</label>
                    <select 
                      value={selectedClassId || ''} 
                      onChange={(e) => setSelectedClassId(parseInt(e.target.value))}
                      disabled={loading}
                      className="form-select"
                    >
                      <option value="">Select a class</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedClassId && (
                    <div className="form-group">
                      <label>Section</label>
                      <select 
                        value={selectedSectionId || ''} 
                        onChange={(e) => setSelectedSectionId(parseInt(e.target.value))}
                        disabled={loading}
                        className="form-select"
                      >
                        <option value="">Select a section</option>
                        {sections.map(section => (
                          <option key={section.id} value={section.id}>
                            Section {section.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 - UPLOAD & PREVIEW */}
          {step === 2 && (
            <div className="step-content">
              <div className="target-card">
                <span className="badge">Target</span>
                <p>
                  {classes.find(c => c.id == selectedClassId)?.name} - 
                  Section {sections.find(s => s.id == selectedSectionId)?.name}
                </p>
              </div>

              <div className="modal-body-grid">
                
                {/* LEFT SIDE - UPLOAD */}
                <div className="upload-card">
                  <h3>Upload CSV</h3>

                  <div
                    className={`drop-zone ${dragActive ? 'active' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="drop-content">
                      <div className="upload-icon">📁</div>
                      <p>Drag & drop your CSV file here</p>
                      <span>or click to browse</span>
                      {fileName && <div className="file-name">📄 {fileName}</div>}
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv,.xlsx,.xls"
                    hidden
                    onChange={handleFileSelect}
                  />

                  <button
                    onClick={downloadTemplate}
                    className="secondary-btn"
                  >
                    📥 Download Sample Template
                  </button>
                </div>

                {/* RIGHT SIDE - PREVIEW */}
                <div className="preview-card">
                  <div className="preview-header">
                    <h3>Preview</h3>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span className="student-count">
                        {editableCsvData.length} Students
                      </span>
                      {editableCsvData.length > 0 && (
                        <button
                          onClick={() => setFullScreenEdit(true)}
                          className="secondary-btn"
                          style={{ padding: '5px 12px', fontSize: '0.85rem' }}
                        >
                          🔍 Full Screen Edit
                        </button>
                      )}
                    </div>
                  </div>

                  {csvHeaders.length > 0 && (
                    <div className="detected-fields">
                      <strong>Detected fields:</strong> {csvHeaders.join(', ')}
                    </div>
                  )}

                  {/* No validation warnings shown - accept everything */}

                  {/* Column Management */}
                  <div className="column-management">
                    <div className="column-controls">
                      <label>Add Field:</label>
                      <select 
                        onChange={(e) => {
                          if (e.target.value) {
                            addColumn(e.target.value)
                            e.target.value = ''
                          }
                        }}
                        value=""
                      >
                        <option value="">Select field to add...</option>
                        {availableColumns
                          .filter(col => !visibleColumns.includes(col.key))
                          .map(col => (
                            <option key={col.key} value={col.key}>{col.label}</option>
                          ))
                        }
                      </select>
                    </div>
                  </div>

                  {editableCsvData.length > 0 ? (
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th style={{ width: '40px' }}>❌</th>
                            <th>#</th>
                            {visibleColumns.map(colKey => {
                              const column = availableColumns.find(col => col.key === colKey)
                              return (
                                <th key={colKey}>
                                  <div className="column-header">
                                    <span>{column.label} {column.required && '*'}</span>
                                    {!column.required && (
                                      <button 
                                        className="remove-column-btn"
                                        onClick={() => removeColumn(colKey)}
                                        title="Remove column"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>
                                </th>
                              )
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {editableCsvData.map((student, index) => {
                            const hasError = !student.firstName && !student.lastName && !student.name

                            return (
                              <tr key={index} className={hasError ? 'row-error' : ''}>
                                <td className="delete-cell" style={{ textAlign: 'center', padding: '4px' }}>
                                  <button
                                    onClick={() => deleteRow(index)}
                                    className="delete-row-btn"
                                    title="Delete this row"
                                    style={{
                                      background: '#fee',
                                      border: '1px solid #fcc',
                                      borderRadius: '4px',
                                      padding: '4px 8px',
                                      cursor: 'pointer',
                                      fontSize: '0.85rem'
                                    }}
                                  >
                                    🗑️
                                  </button>
                                </td>
                                <td className="row-number">{index + 1}</td>
                                {visibleColumns.map(colKey => {
                                  const column = availableColumns.find(col => col.key === colKey)
                                  return (
                                    <td key={colKey}>
                                      <input
                                        type={colKey === 'email' ? 'email' : colKey === 'dateOfBirth' ? 'date' : 'text'}
                                        value={student[colKey] || (colKey === 'firstName' && student.name?.split(' ')[0]) || (colKey === 'lastName' && student.name?.split(' ').slice(1).join(' ')) || ''}
                                        onChange={(e) => handleCellEdit(index, colKey, e.target.value)}
                                        className={hasError && column.required ? 'error' : (!student[colKey] && colKey === 'rollNumber' ? 'auto-generate' : '')}
                                        placeholder={colKey === 'rollNumber' ? 'Auto-generate' : `Enter ${column.label.toLowerCase()}`}
                                      />
                                    </td>
                                  )
                                })}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-preview">
                      <p>Upload a CSV file to see preview</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* STEP 3 - RESULTS */}
          {step === 3 && (
            <div className="results-card">
              <div className="success-header">
                <h3>Import Complete!</h3>
                <p>Students have been successfully imported</p>
              </div>

              {importResults && (
                <div className="import-summary">
                  <p><strong>✅ Total imported:</strong> {importResults.successCount || 0}</p>
                  <p><strong>⚠️ Warnings:</strong> {importResults.warningCount || 0}</p>
                  <p><strong>❌ Failed:</strong> {importResults.errorCount || 0}</p>
                  
                  {importResults.warnings?.length > 0 && (
                    <div className="warning-summary">
                      <strong>Warnings encountered:</strong>
                      <ul>
                        {importResults.warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="modal-footer">
          {step === 1 && (
            <>
              <button className="cancel-btn" onClick={handleClose}>
                Cancel
              </button>
              <button 
                className="primary-btn" 
                disabled={!selectedClassId || !selectedSectionId || loading}
                onClick={() => setStep(2)}
              >
                Next: Upload CSV
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button className="cancel-btn" onClick={handleClose}>
                Cancel
              </button>
              <button
                className="primary-btn"
                disabled={editableCsvData.length === 0 || loading}
                onClick={handleImport}
              >
                {loading ? 'Importing...' : `Import ${editableCsvData.length} Students`}
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <button 
                className="cancel-btn" 
                onClick={() => {
                  setStep(2)
                  setCsvData([])
                  setEditableCsvData([])
                  setImportResults(null)
                  setFileName('')
                }}
              >
                Import More
              </button>
              <button className="primary-btn" onClick={handleClose}>
                Done
              </button>
            </>
          )}
        </div>

        {error && (
          <div className="error-overlay">
            <div className="error-card">
              <strong>Error occurred:</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

      </div>

      {/* FULL SCREEN EDIT MODAL */}
      {fullScreenEdit && (
        <div className="fullscreen-edit-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'white',
          zIndex: 10000,
          overflow: 'auto',
          padding: '20px'
        }}>
          <div style={{ maxWidth: '100%', margin: '0 auto' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '10px',
              padding: '15px',
              background: '#f8f9fa',
              borderRadius: '8px',
              position: 'sticky',
              top: '0',
              zIndex: 100,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div>
                <h2 style={{ margin: '0 0 5px 0' }}>Full Screen Edit Mode</h2>
                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                  {editableCsvData.length} Students - Edit all fields or delete unwanted rows
                </p>
              </div>
              <button
                onClick={() => setFullScreenEdit(false)}
                style={{
                  padding: '10px 20px',
                  background: '#0066cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                ✓ Done Editing
              </button>
            </div>

            <div style={{ overflowX: 'auto', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', position: 'relative' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: '0', background: '#f8f9fa', zIndex: 50, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <tr>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #dee2e6', textAlign: 'center', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase' }}>DELETE</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #dee2e6', textAlign: 'center', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase' }}>#</th>
                    {visibleColumns.map(colKey => {
                      const column = availableColumns.find(col => col.key === colKey)
                      return (
                        <th key={colKey} style={{ padding: '12px 8px', borderBottom: '2px solid #dee2e6', fontSize: '0.9rem', minWidth: '150px', fontWeight: '700', textTransform: 'uppercase' }}>
                          {column.label} {column.required && <span style={{ color: 'red' }}>*</span>}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {editableCsvData.map((student, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e9ecef' }}>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button
                          onClick={() => deleteRow(index)}
                          style={{
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '500'
                          }}
                          title="Delete this row"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: '#666' }}>
                        {index + 1}
                      </td>
                      {visibleColumns.map(colKey => {
                        const column = availableColumns.find(col => col.key === colKey)
                        const isEmpty = !student[colKey] || String(student[colKey]).trim() === ''
                        return (
                          <td key={colKey} style={{ padding: '8px' }}>
                            <input
                              type={colKey === 'email' ? 'email' : colKey === 'dateOfBirth' ? 'date' : 'text'}
                              value={student[colKey] || ''}
                              onChange={(e) => handleCellEdit(index, colKey, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: isEmpty && column.required ? '2px solid #ff6b6b' : '1px solid #ced4da',
                                borderRadius: '4px',
                                fontSize: '0.9rem',
                                backgroundColor: isEmpty && column.required ? '#fff5f5' : 'white'
                              }}
                              placeholder={`Enter ${column.label.toLowerCase()}`}
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CSVImportModal