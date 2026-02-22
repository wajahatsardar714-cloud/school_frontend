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
    { headerName: 'First Name', field: 'firstName', editable: true, width: 120 },
    { headerName: 'Last Name', field: 'lastName', editable: true, width: 120 },
    { headerName: 'Email', field: 'email', editable: true, width: 200 },
    { headerName: 'Phone', field: 'phone', editable: true, width: 120 },
    { headerName: 'Roll Number', field: 'rollNumber', editable: true, width: 100 },
    { headerName: 'Class ID', field: 'classId', editable: true, width: 80 },
    { headerName: 'Address', field: 'address', editable: true, width: 200 },
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
        const jsonData = XLSX.utils.sheet_to_json(sheet)

        // Map Excel columns to our format
        const mappedData = jsonData.map((row, index) => ({
          id: index + 1,
          firstName: row['First Name'] || row['firstName'] || '',
          lastName: row['Last Name'] || row['lastName'] || '',
          email: row['Email'] || row['email'] || '',
          phone: row['Phone'] || row['phone'] || '',
          rollNumber: row['Roll Number'] || row['rollNumber'] || row['roll_no'] || '',
          classId: row['Class ID'] || row['classId'] || row['class_id'] || '',
          address: row['Address'] || row['address'] || '',
        }))

        setGridData(mappedData)
        setMessage({ type: 'success', text: `${mappedData.length} rows loaded successfully` })
        setValidationErrors([])
      } catch (error) {
        setMessage({ type: 'error', text: 'Error parsing file: ' + error.message })
      }
    }
    reader.readAsArrayBuffer(file)
  }, [])

  // Validation logic
  const validateData = (data) => {
    const errors = []
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    data.forEach((row, index) => {
      const rowErrors = []
      
      if (!row.firstName?.trim()) rowErrors.push('First Name is required')
      if (!row.lastName?.trim()) rowErrors.push('Last Name is required')
      if (!row.email?.trim()) rowErrors.push('Email is required')
      else if (!emailRegex.test(row.email)) rowErrors.push('Invalid email format')
      if (!row.classId) rowErrors.push('Class ID is required')
      if (!row.rollNumber?.trim()) rowErrors.push('Roll Number is required')

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
    const template = [
      {
        'First Name': 'John',
        'Last Name': 'Doe', 
        'Email': 'john.doe@example.com',
        'Phone': '1234567890',
        'Roll Number': 'STD001',
        'Class ID': '1',
        'Address': '123 Main St'
      }
    ]
    
    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Students')
    XLSX.writeFile(wb, 'student_import_template.xlsx')
  }

  return (
    <div className="bulk-import-container">
      <div className="bulk-import-header">
        <h1>Bulk Student Import</h1>
        <p>Upload an Excel/CSV file to import multiple students at once</p>
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