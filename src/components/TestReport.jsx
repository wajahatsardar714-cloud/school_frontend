import { useState, useEffect } from 'react'
import { classService, sectionService } from '../services/classService'
import { useFetch } from '../hooks/useApi'
import { sortClassesByOrder } from '../utils/classOrder'
import { apiClient } from '../services/apiClient'
import './TestReport.css'

const TestReport = () => {
  const [sections, setSections] = useState({})
  const [testReports, setTestReports] = useState({})
  const [loading, setLoading] = useState({})
  const [selectedSections, setSelectedSections] = useState({}) // Track selected section per class
  
  // Upload modal states  
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    class_id: '',
    section_id: '',
    report_date: '',
    file: null
  })
  const [uploading, setUploading] = useState(false)
  const [uploadFromCard, setUploadFromCard] = useState(false) // When true, hide class/section selectors
  
  // Fetch all classes
  const { data: classesResponse, loading: classesLoading, error } = useFetch(() => classService.list(), [])
  const classes = classesResponse?.data || []

  // Sort classes according to specified order
  const sortedClasses = sortClassesByOrder(classes)

  // Load all sections on mount
  useEffect(() => {
    if (classes.length > 0) {
      loadAllSections()
    }
  }, [classes])

  const loadAllSections = async () => {
    const sectionsData = {}
    for (const cls of classes) {
      try {
        const response = await sectionService.list(cls.id)
        sectionsData[cls.id] = response.data || []
      } catch (error) {
        console.error(`Failed to load sections for class ${cls.id}:`, error)
        sectionsData[cls.id] = []
      }
    }
    setSections(sectionsData)
  }

  const handleSectionChange = (classId, sectionId) => {
    setSelectedSections(prev => ({ ...prev, [classId]: sectionId }))
    // Auto-load reports for this section
    if (sectionId) {
      loadTestReports(classId, sectionId)
    }
  }

  const loadTestReports = async (classId, sectionId) => {
    if (!sectionId) return
    
    const key = `${classId}-${sectionId}`
    setLoading(prev => ({ ...prev, [key]: true }))
    
    try {
      const params = new URLSearchParams()
      params.append('class_id', classId)
      params.append('section_id', sectionId)
      
      const response = await apiClient.get(`/api/test-reports?${params.toString()}`)
      setTestReports(prev => ({ ...prev, [key]: response.data || [] }))
    } catch (error) {
      console.error('Failed to load test reports:', error)
      setTestReports(prev => ({ ...prev, [key]: [] }))
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    
    if (!uploadForm.file || !uploadForm.class_id || !uploadForm.section_id || !uploadForm.report_date) {
      alert('Please fill all required fields')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadForm.file)
      formData.append('class_id', uploadForm.class_id)
      formData.append('section_id', uploadForm.section_id)
      formData.append('report_date', uploadForm.report_date)

      await apiClient.post('/api/test-reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      alert('Test report uploaded successfully!')
      setShowUploadModal(false)
      setUploadForm({ class_id: '', section_id: '', report_date: '', file: null })
      setUploadFromCard(false)
      
      // Reload reports
      loadTestReports(uploadForm.class_id, uploadForm.section_id)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload test report: ' + (error.response?.data?.message || error.message))
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (reportId, classId, sectionId) => {
    if (!confirm('Are you sure you want to delete this test report?')) return

    try {
      await apiClient.delete(`/api/test-reports/${reportId}`)
      alert('Test report deleted successfully!')
      
      // Reload reports for the section
      loadTestReports(classId, sectionId)
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete test report: ' + (error.response?.data?.message || error.message))
    }
  }

  const openUploadModal = (classId = '', sectionId = '', fromCard = false) => {
    setUploadForm({ 
      class_id: classId, 
      section_id: sectionId, 
      report_date: new Date().toISOString().split('T')[0], 
      file: null 
    })
    setUploadFromCard(fromCard)
    setShowUploadModal(true)
  }

  if (classesLoading) {
    return (
      <div className="test-report-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading classes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="test-report-container">
        <div className="alert alert-error">
          <p>Error loading classes: {error.message}</p>
        </div>
      </div>
    )
  }

  const classesForDropdown = sortedClasses
  const sectionsForDropdown = uploadForm.class_id ? (sections[uploadForm.class_id] || []) : []

  return (
    <div className="test-report-container">
      <header className="test-report-header">
        <div>
          <h1>📊 Test Reports</h1>
          <p className="test-report-subtitle">Upload and manage test reports for each class and section</p>
        </div>
        <button className="btn-main-upload" onClick={() => openUploadModal('', '', false)}>
          📤 Upload New Report
        </button>
      </header>

      {/* Compact Class Cards */}
      <div className="classes-grid-compact">
        {sortedClasses.map((cls) => {
          const classSections = sections[cls.id] || []
          const selectedSection = selectedSections[cls.id] || ''
          const sectionKey = selectedSection ? `${cls.id}-${selectedSection}` : ''
          const sectionReports = sectionKey ? (testReports[sectionKey] || []) : []
          const isLoading = sectionKey ? loading[sectionKey] : false

          return (
            <div key={cls.id} className="compact-test-card">
              <div className="compact-card-header">
                <div className="compact-card-title-row">
                  <h3 className="compact-class-title">{cls.name}</h3>
                  <span className="compact-class-badge">{cls.class_type}</span>
                </div>
                
                {/* Section Dropdown */}
                <div className="section-selector-row">
                  <select 
                    className="section-dropdown"
                    value={selectedSection}
                    onChange={(e) => handleSectionChange(cls.id, e.target.value)}
                  >
                    <option value="">Select Section</option>
                    {classSections.map(section => (
                      <option key={section.id} value={section.id}>
                        Section {section.name}
                      </option>
                    ))}
                  </select>

                  {/* Show upload buttons only when section is selected */}
                  {selectedSection && (
                    <div className="upload-actions">
                      <button 
                        className="btn-upload-image"
                        onClick={() => openUploadModal(cls.id, selectedSection, true)}
                      >
                        📤 Upload Image
                      </button>
                      <button 
                        className="btn-scan-image"
                        onClick={() => openUploadModal(cls.id, selectedSection, true)}
                      >
                        📸 Scan Image
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Reports list for selected section */}
              {selectedSection && (
                <div className="compact-reports-area">
                  {isLoading ? (
                    <div className="loading-reports">
                      <div className="mini-spinner"></div>
                      <span>Loading...</span>
                    </div>
                  ) : sectionReports.length === 0 ? (
                    <div className="no-reports-compact">
                      <span>📄 No reports uploaded yet</span>
                    </div>
                  ) : (
                    <div className="reports-grid-compact">
                      {sectionReports.map(report => (
                        <div key={report.id} className="report-card-compact">
                          <div className="report-card-left">
                            <span className="report-icon">
                              {report.file_type?.includes('pdf') ? '📄' : '🖼️'}
                            </span>
                            <div className="report-details">
                              <span className="report-name">{report.file_name}</span>
                              <span className="report-meta">
                                {new Date(report.report_date).toLocaleDateString()} · {(report.file_size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          </div>
                          <div className="report-card-actions">
                            <a 
                              href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/${report.file_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-icon-view"
                              title="View"
                            >
                              👁️
                            </a>
                            <button 
                              className="btn-icon-delete"
                              onClick={() => handleDelete(report.id, cls.id, selectedSection)}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content-compact" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-compact">
              <h3>📤 Upload Test Report</h3>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>×</button>
            </div>

            <form onSubmit={handleUpload} className="upload-form-compact">
              {/* Show class/section selectors only when not uploading from card */}
              {!uploadFromCard && (
                <>
                  <div className="form-group-compact">
                    <label>Class *</label>
                    <select
                      value={uploadForm.class_id}
                      onChange={(e) => setUploadForm({ ...uploadForm, class_id: e.target.value, section_id: '' })}
                      required
                    >
                      <option value="">-- Select Class --</option>
                      {classesForDropdown.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>

                  {uploadForm.class_id && (
                    <div className="form-group-compact">
                      <label>Section *</label>
                      <select
                        value={uploadForm.section_id}
                        onChange={(e) => setUploadForm({ ...uploadForm, section_id: e.target.value })}
                        required
                      >
                        <option value="">-- Select Section --</option>
                        {sectionsForDropdown.map(section => (
                          <option key={section.id} value={section.id}>Section {section.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* Always show date and file input */}
              {uploadFromCard && (
                <div className="selected-location-info">
                  <span className="info-label">Uploading to:</span>
                  <span className="info-value">
                    {classes.find(c => c.id === uploadForm.class_id)?.name} - 
                    Section {sections[uploadForm.class_id]?.find(s => s.id === uploadForm.section_id)?.name}
                  </span>
                </div>
              )}

              <div className="form-group-compact">
                <label>Report Date *</label>
                <input
                  type="date"
                  value={uploadForm.report_date}
                  onChange={(e) => setUploadForm({ ...uploadForm, report_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group-compact">
                <label>File (PDF or Image) *</label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                  required
                  className="file-input-compact"
                />
                <small className="file-hint">Max 10MB · PDF, JPEG, PNG</small>
              </div>

              <div className="modal-actions-compact">
                <button 
                  type="button" 
                  className="btn-modal-cancel"
                  onClick={() => {
                    setShowUploadModal(false)
                    setUploadFromCard(false)
                  }}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-modal-upload"
                  disabled={uploading}
                >
                  {uploading ? '⏳ Uploading...' : '📤 Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestReport
