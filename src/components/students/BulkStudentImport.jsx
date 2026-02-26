import { useState, useCallback, useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import * as XLSX from 'xlsx'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import './BulkStudentImport.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const BulkStudentImport = () => {
  const [gridData, setGridData] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [validationErrors, setValidationErrors] = useState([])

  // AG Grid column definitions
  const columnDefs = useMemo(() => [
    { headerName: 'Sr No', field: 'srNo', editable: true, width: 80 },
    { headerName: 'Name', field: 'name', editable: true, width: 150 },
    { headerName: 'Father Name', field: 'fatherName', editable: true, width: 150 },
    { headerName: 'Contact No', field: 'contactNo', editable: true, width: 120 },
    { headerName: 'Fee', field: 'fee', editable: true, width: 100 },
    { headerName: 'Class ID', field: 'classId', editable: true, width: 80 },
    { headerName: 'Other Fields', field: 'otherFields', editable: false, width: 200 },
  ], [])

  // Grid options
  const gridOptions = useMemo(() => ({
    defaultColDef: {
      sortable: true,
      filter: true,
      resizable: true,
    },
    rowSelection: 'multiple',
    suppressRowClickSelection: true,
    onCellValueChanged: (event) => {
      // Clear validation errors when user edits
      setValidationErrors([])
      setMessage({ type: '', text: '' })
    }
  }), [])

  // File upload handler
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        
        // Smart header detection: Read all rows first to detect where data starts
        const allRows = XLSX.utils.sheet_to_json(sheet, { 
          header: 1, // Get array of arrays (raw rows)
          defval: '' 
        })

        console.log('All rows:', allRows)

        // Detect which row contains the actual column headers
        // Look for keywords like "Name", "Father", "Sr", "Contact", "Fee"
        const headerKeywords = ['name', 'father', 'sr', 'contact', 'fee', 'roll', 'class', 'phone', 'student']
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
            console.log(`Detected header row at index ${i}:`, row)
            break
          }
        }

        // If no header detected, assume first row is header
        if (headerRowIndex === -1) {
          headerRowIndex = 0
          console.log('No header detected, using first row as header')
        }

        // Read data starting from after the header row
        const jsonData = XLSX.utils.sheet_to_json(sheet, { 
          range: headerRowIndex,
          defval: ''
        })

        console.log(`Skipped ${headerRowIndex} header rows, parsed ${jsonData.length} data rows`)

        // Show what columns were detected
        if (jsonData.length > 0) {
          const detectedColumns = Object.keys(jsonData[0])
          console.log('Detected columns:', detectedColumns)
          console.log('First row sample:', jsonData[0])
        }

        // Extract class info from header rows if present
        let detectedClassInfo = ''
        if (headerRowIndex > 0) {
          for (let i = 0; i < headerRowIndex; i++) {
            const row = allRows[i]
            if (row && row.length > 0) {
              const rowText = row.join(' ')
              if (rowText.toLowerCase().includes('class:')) {
                detectedClassInfo = rowText
                console.log('Detected class info:', detectedClassInfo)
              }
            }
          }
        }

        // Map Excel columns to our format with VERY flexible field names
        const mappedData = jsonData.map((row, index) => {
          // Create a normalized version of row keys for easier matching
          const normalizedRow = {}
          Object.keys(row).forEach(key => {
            const normalizedKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
            normalizedRow[normalizedKey] = row[key]
          })

          // Helper function to find value by multiple possible keys
          const findValue = (...possibleKeys) => {
            for (const key of possibleKeys) {
              const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '')
              if (normalizedRow[normalizedKey] !== undefined && normalizedRow[normalizedKey] !== '') {
                return normalizedRow[normalizedKey]
              }
              // Also try exact match
              if (row[key] !== undefined && row[key] !== '') {
                return row[key]
              }
            }
            return ''
          }

          // Extract known fields with multiple variations
          const srNo = findValue('Sr No', 'Sr.No', 'SrNo', 'Sr', 'Serial No', 'S.No', 'S No') || (index + 1)
          const name = findValue('Name', 'Student Name', 'StudentName', 'Student')
          const fatherName = findValue('Father Name', 'FatherName', 'Father', "Father's Name")
          const contactNo = findValue('Contact No', 'ContactNo', 'Contact', 'Phone', 'Mobile', 'Contact Number')
          const fee = findValue('Fee', 'Monthly Fee', 'Fees', 'Amount')
          const classId = findValue('Class ID', 'ClassID', 'Class', 'Grade')
          
          // Collect any other fields (like March, Outstanding Dues, etc.)
          const preservedFields = {}
          Object.keys(row).forEach(key => {
            const value = row[key]
            if (value !== undefined && value !== '') {
              preservedFields[key] = value
            }
          })

          // Log first row for debugging
          if (index === 0) {
            console.log('Mapped first student:', {
              srNo, name, fatherName, contactNo, fee, classId,
              preservedFields
            })
          }

          return {
            id: index + 1,
            srNo,
            name,
            fatherName,
            contactNo,
            fee,
            classId: classId || '1', // Default to class 1
            otherFields: JSON.stringify(preservedFields),
            // Pass all original data for backend processing
            _rawData: row,
            _classInfo: detectedClassInfo // Pass detected class info
          }
        })

        // Filter out completely empty rows
        const validData = mappedData.filter(row => 
          row.name || row.fatherName || row.contactNo || row.fee
        )

        setGridData(validData)
        const skipMessage = headerRowIndex > 0 
          ? ` (${headerRowIndex} header row${headerRowIndex > 1 ? 's' : ''} skipped)` 
          : ''
        setMessage({ 
          type: 'success', 
          text: `${validData.length} rows loaded successfully${skipMessage}` 
        })
        setValidationErrors([])
      } catch (error) {
        console.error('CSV parsing error:', error)
        setMessage({ 
          type: 'error', 
          text: `Error parsing file: ${error.message}. Please ensure your file is in Excel (.xlsx, .xls) or CSV format. Check the browser console (F12) for more details.` 
        })
        setGridData([])
      }
    }
    reader.readAsArrayBuffer(file)
  }, [])

  // Validation logic - Only Name and Father Name are required
  const validateData = (data) => {
    const errors = []

    data.forEach((row, index) => {
      const rowErrors = []
      
      // Core required fields
      if (!row.name?.trim()) rowErrors.push('Name is required')
      if (!row.fatherName?.trim()) rowErrors.push('Father Name is required')
      
      // Optional validations
      // All other fields are optional

      if (rowErrors.length > 0) {
        errors.push({
          row: index + 1,
          errors: rowErrors
        })
      }
    })

    return errors
  }

  // Import handler
  const handleImport = async () => {
    if (!gridData.length) {
      setMessage({ type: 'error', text: 'No data to import' })
      return
    }

    const errors = validateData(gridData)
    if (errors.length > 0) {
      setValidationErrors(errors)
      setMessage({ type: 'error', text: `${errors.length} rows have validation errors` })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/students/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(gridData)
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `Successfully imported ${result.successCount} students${result.duplicates?.length ? `. ${result.duplicates.length} duplicates skipped.` : ''}` 
        })
        setGridData([])
      } else {
        setMessage({ type: 'error', text: result.message || 'Import failed' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error: ' + error.message })
    } finally {
      setLoading(false)
    }
  }

  // Download template
  const downloadTemplate = () => {
    // Create header rows
    const ws = XLSX.utils.aoa_to_sheet([
      ['Muslim Public Higher Secondary School'], // Row 1
      ['Fee Record 2026'], // Row 2
      ['Class Information'], // Row 3
      // Column headers in Row 4
      ['Sr No', 'Name', 'Father Name', 'Contact No', 'Fee', 'March', 'Outstanding Dues'],
      // Sample data starting from Row 5
      [1, 'Nisha Fatima', 'Intazar Ali', '0300-7189442', 4000, '', ''],
      [2, 'Bakhtawar Sharafat', 'Sharafat Ali', '0300-7365689', 5000, '', ''],
      [3, 'Fizza Khan', 'Muhammad Hussain', '0302-8838015', 5000, '', ''],
    ])
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Students')
    XLSX.writeFile(wb, 'student_import_template.xlsx')
  }

  return (
    <div className="bulk-import-container">
      <div className="bulk-import-header">
        <h1>Bulk Student Import</h1>
        <p>Upload an Excel/CSV file to import multiple students at once. Header rows are automatically detected and skipped.</p>
      </div>

      <div className="bulk-import-controls">
        <div className="file-upload-section">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="file-input"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="file-upload-btn">
            📁 Upload File
          </label>
          <button onClick={downloadTemplate} className="btn-secondary">
            📄 Download Template
          </button>
        </div>
        
        <div className="action-buttons">
          <button 
            onClick={handleImport}
            disabled={loading || gridData.length === 0}
            className="btn-primary"
          >
            {loading ? 'Importing...' : `Import ${gridData.length} Students`}
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
          {message.type === 'success' && gridData.length > 0 && (
            <div style={{ marginTop: '10px', fontSize: '0.9em', backgroundColor: '#f0f9ff', padding: '10px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
              <strong>📊 Data Preview:</strong>
              <div style={{ marginTop: '5px' }}>
                <div><strong>Total Students:</strong> {gridData.length}</div>
                {gridData[0] && (
                  <>
                    <div><strong>Sample Data:</strong></div>
                    <div style={{ fontSize: '0.85em', marginTop: '5px', fontFamily: 'monospace', backgroundColor: 'white', padding: '8px', borderRadius: '4px' }}>
                      • Name: {gridData[0].name || '(empty)'}<br/>
                      • Father Name: {gridData[0].fatherName || '(empty)'}<br/>
                      • Contact: {gridData[0].contactNo || '(empty)'}<br/>
                      • Fee: {gridData[0].fee || '(empty)'}<br/>
                      • Sr No: {gridData[0].srNo || '(empty)'}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="validation-errors">
          <h3>Validation Errors:</h3>
          {validationErrors.map((error, index) => (
            <div key={index} className="error-row">
              <strong>Row {error.row}:</strong> {error.errors.join(', ')}
            </div>
          ))}
        </div>
      )}

      <div className="grid-container">
        <div className="ag-theme-alpine" style={{ height: '500px', width: '100%' }}>
          <AgGridReact
            columnDefs={columnDefs}
            rowData={gridData}
            gridOptions={gridOptions}
          />
        </div>
      </div>
    </div>
  )
}

export default BulkStudentImport