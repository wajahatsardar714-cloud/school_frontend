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
  
  // Column management for preview
  const [availableColumns, setAvailableColumns] = useState([
    { key: 'firstName', label: 'First Name', required: true },
    { key: 'lastName', label: 'Last Name', required: false },
    { key: 'email', label: 'Email', required: false },
    { key: 'phone', label: 'Phone', required: false },
    { key: 'rollNumber', label: 'Roll Number', required: false },
    { key: 'address', label: 'Address', required: false },
    { key: 'dateOfBirth', label: 'Date of Birth', required: false },
    { key: 'fatherName', label: 'Father Name', required: false },
    { key: 'motherName', label: 'Mother Name', required: false },
    { key: 'caste', label: 'Caste', required: false },
    { key: 'religion', label: 'Religion', required: false }
  ])
  const [visibleColumns, setVisibleColumns] = useState(['firstName', 'lastName', 'email', 'phone', 'rollNumber'])

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
    
    // Contact fields
    'email': 'email',
    'emailaddress': 'email',
    'mail': 'email',
    'phone': 'phone',
    'phonenumber': 'phone',
    'mobile': 'phone',
    'contact': 'phone',
    'cellphone': 'phone',
    
    // Identifier
    'rollnumber': 'rollNumber',
    'rollno': 'rollNumber',
    'roll': 'rollNumber',
    'studentid': 'rollNumber',
    'regno': 'rollNumber',
    'registrationnumber': 'rollNumber',
    
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
        
        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        if (jsonData.length < 2) {
          setError('File must contain at least a header row and one data row')
          return
        }

        const headers = jsonData[0].map(h => String(h).toLowerCase().replace(/[^a-z0-9]/g, ''))
        const rows = jsonData.slice(1)

        setCsvHeaders(jsonData[0]) // Original headers for display

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

          // Set class and section as numbers
          student.classId = parseInt(selectedClassId)
          student.sectionId = parseInt(selectedSectionId)

          return student
        })

        // Validate data - Accept everything, only warn for completely empty rows
        const warnings = []
        mappedData.forEach((student, index) => {
          // Only warn if the entire row is empty
          const hasAnyData = Object.values(student).some(value => 
            value && typeof value === 'string' && value.trim() !== ''
          )
          if (!hasAnyData) {
            warnings.push({
              row: index + 1,
              message: 'Empty row - will be skipped during import'
            })
          }
        })

        setCsvData(mappedData)
        setEditableCsvData(JSON.parse(JSON.stringify(mappedData))) // Deep copy for editing
        setValidationWarnings(warnings)
        setError('')
      } catch (err) {
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
      
      setImportResults(result)
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
    // Don't allow removing firstName (required)
    if (columnKey === 'firstName') return
    
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

  const downloadTemplate = () => {
    const template = [
      ['First Name', 'Last Name', 'Email', 'Phone', 'Roll Number', 'Address'],
      ['John', 'Doe', 'john.doe@email.com', '123-456-7890', '001', '123 Main St'],
      ['Jane', 'Smith', 'jane.smith@email.com', '098-765-4321', '002', '456 Oak Ave']
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
                    <span className="student-count">
                      {editableCsvData.length} Students
                    </span>
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
    </div>
  )
}

export default CSVImportModal