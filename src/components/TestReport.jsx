import { useState, useEffect, useMemo, useCallback } from 'react'
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
  const [scanMode, setScanMode] = useState(false) // true for scan, false for regular upload
  
  // Date filtering states
  const [globalDateFilter, setGlobalDateFilter] = useState({startDate: '', endDate: ''})
  const [cardDateFilters, setCardDateFilters] = useState({}) // Per-card date filters
  
  // Full report modal states
  const [showReportModal, setShowReportModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  
  // Fetch all classes
  const { data: classesResponse, loading: classesLoading, error } = useFetch(() => classService.list(), [])
  const classes = classesResponse?.data || []
  const [classFilter, setClassFilter] = useState('all')

  // Memoize sorted and filtered classes for performance
  const sortedClasses = useMemo(() => sortClassesByOrder(classes), [classes])
  
  const filteredClasses = useMemo(() => {
    return sortedClasses.filter((cls) => {
      const type = (cls.class_type || '').toLowerCase()
      if (classFilter === 'school') return type === 'school'
      if (classFilter === 'college') return type === 'college'
      return true
    })
  }, [sortedClasses, classFilter])

  // Memoize dropdown data for performance
  const classesForDropdown = useMemo(() => sortedClasses, [sortedClasses])
  const sectionsForDropdown = useMemo(() => 
    uploadForm.class_id ? (sections[uploadForm.class_id] || []) : [], 
    [sections, uploadForm.class_id]
  )

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

  const handleSectionChange = useCallback((classId, sectionId) => {
    setSelectedSections(prev => ({ ...prev, [classId]: sectionId }))
    // Auto-load reports for this section
    if (sectionId) {
      loadTestReports(classId, sectionId)
    }
  }, [])

  const loadTestReports = useCallback(async (classId, sectionId) => {
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
  }, [])

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

      // Don't set Content-Type - browser will set it automatically with boundary
      await apiClient.post('/api/test-reports', formData)

      alert('Test report uploaded successfully!')
      
      // Save class_id and section_id BEFORE resetting the form
      const classId = uploadForm.class_id
      const sectionId = uploadForm.section_id
      
      setShowUploadModal(false)
      setUploadForm({ class_id: '', section_id: '', report_date: '', file: null })
      setUploadFromCard(false)
      
      // Ensure the section is selected in the dropdown
      setSelectedSections(prev => ({ ...prev, [classId]: sectionId }))
      
      // Reload reports using saved values
      loadTestReports(classId, sectionId)
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

  // Date filtering functions
  const filterReportsByDateRange = useCallback((reports, startDate, endDate) => {
    if (!startDate && !endDate) return reports
    
    return reports.filter(report => {
      const reportDate = new Date(report.report_date)
      const start = startDate ? new Date(startDate) : null
      const end = endDate ? new Date(endDate) : null
      
      if (start && end) {
        return reportDate >= start && reportDate <= end
      } else if (start) {
        return reportDate >= start
      } else if (end) {
        return reportDate <= end
      }
      return true
    })
  }, [])

  const updateCardDateFilter = useCallback((cardKey, startDate, endDate) => {
    setCardDateFilters(prev => ({
      ...prev,
      [cardKey]: { startDate, endDate }
    }))
  }, [])

  const openReportModal = useCallback((report) => {
    setSelectedReport(report)
    setShowReportModal(true)
  }, [])

  const closeReportModal = useCallback(() => {
    setSelectedReport(null)
    setShowReportModal(false)
  }, [])

  // Get filtered reports for a specific card
  const getFilteredReports = useCallback((sectionKey) => {
    const reports = testReports[sectionKey] || []
    const cardFilter = cardDateFilters[sectionKey]
    const { startDate: globalStart, endDate: globalEnd } = globalDateFilter
    
    let filteredReports = reports
    
    // Apply global filter first
    if (globalStart || globalEnd) {
      filteredReports = filterReportsByDateRange(filteredReports, globalStart, globalEnd)
    }
    
    // Apply card-specific filter
    if (cardFilter && (cardFilter.startDate || cardFilter.endDate)) {
      filteredReports = filterReportsByDateRange(filteredReports, cardFilter.startDate, cardFilter.endDate)
    }
    
    // Sort by report date (newest first)
    return filteredReports.sort((a, b) => new Date(b.report_date) - new Date(a.report_date))
  }, [testReports, cardDateFilters, globalDateFilter, filterReportsByDateRange])

  const openUploadModal = useCallback((classId = '', sectionId = '', fromCard = false, isScan = false) => {
    setUploadForm({ 
      class_id: classId, 
      section_id: sectionId, 
      report_date: new Date().toISOString().split('T')[0], 
      file: null 
    })
    setUploadFromCard(fromCard)
    setScanMode(isScan)
    setShowUploadModal(true)
  }, [])

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

  return (
    <div className="test-reports-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-title-section">
            <h1 className="page-title">Test Reports</h1>
            <p className="page-description">Upload and manage test reports for each class and section</p>
          </div>
          <div className="header-actions">
            <div className="global-date-filter">
              <span className="filter-label">Global Date Filter</span>
              <div className="date-filter-inputs">
                <input
                  type="date"
                  className="date-input"
                  placeholder="Start Date"
                  value={globalDateFilter.startDate}
                  onChange={(e) => setGlobalDateFilter(prev => ({...prev, startDate: e.target.value}))}
                />
                <span className="date-separator">to</span>
                <input
                  type="date"
                  className="date-input"
                  placeholder="End Date"
                  value={globalDateFilter.endDate}
                  onChange={(e) => setGlobalDateFilter(prev => ({...prev, endDate: e.target.value}))}
                />
                {(globalDateFilter.startDate || globalDateFilter.endDate) && (
                  <button 
                    className="btn-clear-filter"
                    onClick={() => setGlobalDateFilter({startDate: '', endDate: ''})}
                    title="Clear global filter"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="filter-bar">
              <span className="filter-label">Class Type</span>
              <div className="filter-pill-group">
                <button 
                  className={`filter-pill ${classFilter === 'all' ? 'active' : ''}`}
                  type="button"
                  onClick={() => setClassFilter('all')}
                >
                  All
                </button>
                <button 
                  className={`filter-pill ${classFilter === 'school' ? 'active' : ''}`}
                  type="button"
                  onClick={() => setClassFilter('school')}
                >
                  School
                </button>
                <button 
                  className={`filter-pill ${classFilter === 'college' ? 'active' : ''}`}
                  type="button"
                  onClick={() => setClassFilter('college')}
                >
                  College
                </button>
              </div>
            </div>
            <div className="upload-buttons-group">
              <button 
                className="btn-primary btn-upload-new" 
                onClick={() => openUploadModal('', '', false, false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Upload Report
              </button>
              <button 
                className="btn-secondary btn-scan-new" 
                onClick={() => openUploadModal('', '', false, true)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                Scan Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Class Cards Grid */}
      <div className="classes-container">
        {filteredClasses.map((cls) => {
          const classSections = sections[cls.id] || []
          const selectedSection = selectedSections[cls.id] || ''
          const sectionKey = selectedSection ? `${cls.id}-${selectedSection}` : ''
          const allSectionReports = sectionKey ? (testReports[sectionKey] || []) : []
          const filteredSectionReports = sectionKey ? getFilteredReports(sectionKey) : []
          const isLoading = sectionKey ? loading[sectionKey] : false
          const typeClass = (cls.class_type || '').toLowerCase() === 'college' ? 'college-card' : 'school-card'
          const cardDateFilter = cardDateFilters[sectionKey] || {startDate: '', endDate: ''}

          return (
            <div key={cls.id} className={`class-card ${typeClass}`}>
              {/* Card Header */}
              <div className="card-header">
                <div className="class-info">
                  <h3 className="class-title">{cls.name}</h3>
                  <span className="school-badge">{cls.class_type}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="card-body">
                {/* Section Selection */}
                <div className="section-selection">
                  <label className="section-label">Select Section</label>
                  <div className="section-controls">
                    <select 
                      className="section-dropdown"
                      value={selectedSection}
                      onChange={(e) => handleSectionChange(cls.id, e.target.value)}
                    >
                      <option value="">Choose section...</option>
                      {classSections.map(section => (
                        <option key={section.id} value={section.id}>
                          Section {section.name}
                        </option>
                      ))}
                    </select>

                    {/* Action Buttons - Only show when section is selected */}
                    {selectedSection && (
                      <div className="action-buttons">
                        <button 
                          className="btn-primary btn-action"
                          onClick={() => openUploadModal(cls.id, selectedSection, true, false)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21,15 16,10 5,21"/>
                          </svg>
                          Upload Image
                        </button>
                        <button 
                          className="btn-secondary btn-action"
                          onClick={() => openUploadModal(cls.id, selectedSection, true, true)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                            <circle cx="12" cy="13" r="4"/>
                          </svg>
                          Scan Image
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Date Filter */}
                {selectedSection && (
                  <div className="card-date-filter">
                    <label className="filter-label">Filter by Date</label>
                    <div className="date-filter-inputs">
                      <input
                        type="date"
                        className="date-input small"
                        placeholder="Start Date"
                        value={cardDateFilter.startDate}
                        onChange={(e) => updateCardDateFilter(sectionKey, e.target.value, cardDateFilter.endDate)}
                      />
                      <span className="date-separator">to</span>
                      <input
                        type="date"
                        className="date-input small"
                        placeholder="End Date"
                        value={cardDateFilter.endDate}
                        onChange={(e) => updateCardDateFilter(sectionKey, cardDateFilter.startDate, e.target.value)}
                      />
                      {(cardDateFilter.startDate || cardDateFilter.endDate) && (
                        <button 
                          className="btn-clear-filter small"
                          onClick={() => updateCardDateFilter(sectionKey, '', '')}
                          title="Clear card filter"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Reports Section */}
                {selectedSection && (
                  <div className="reports-section">
                    <div className="reports-header">
                      <h4 className="reports-title">Uploaded Reports</h4>
                      <span className="reports-count">
                        {isLoading ? '...' : `${filteredSectionReports.length} ${filteredSectionReports.length === 1 ? 'report' : 'reports'}`}
                        {allSectionReports.length !== filteredSectionReports.length && (
                          <span className="filter-info"> (filtered from {allSectionReports.length})</span>
                        )}
                      </span>
                    </div>

                    <div className="reports-content">
                      {isLoading ? (
                        <div className="loading-state">
                          <div className="loading-spinner"></div>
                          <span className="loading-text">Loading reports...</span>
                        </div>
                      ) : filteredSectionReports.length === 0 ? (
                        <div className="empty-state">
                          <div className="empty-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14,2 14,8 20,8"/>
                              <line x1="16" y1="13" x2="8" y2="13"/>
                              <line x1="16" y1="17" x2="8" y2="17"/>
                              <polyline points="10,9 9,9 8,9"/>
                            </svg>
                          </div>
                          <h5 className="empty-title">
                            {allSectionReports.length === 0 ? 'No reports yet' : 'No reports in date range'}
                          </h5>
                          <p className="empty-description">
                            {allSectionReports.length === 0 
                              ? 'Upload your first test report for this section'
                              : 'Try adjusting your date filter or upload a new report'
                            }
                          </p>
                          <button 
                            className="btn-primary btn-empty-action"
                            onClick={() => openUploadModal(cls.id, selectedSection, true, false)}
                          >
                            Upload Report
                          </button>
                        </div>
                      ) : (
                        <div className="reports-preview-list">
                          {filteredSectionReports.map(report => (
                            <div 
                              key={report.id} 
                              className="report-preview-item"
                              onClick={() => openReportModal(report)}
                            >
                              <div className="report-preview-info">
                                <div className="report-preview-icon">
                                  {report.file_type?.includes('pdf') ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                      <polyline points="14,2 14,8 20,8"/>
                                      <line x1="16" y1="13" x2="8" y2="13"/>
                                      <line x1="16" y1="17" x2="8" y2="17"/>
                                    </svg>
                                  ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                      <circle cx="8.5" cy="8.5" r="1.5"/>
                                      <polyline points="21,15 16,10 5,21"/>
                                    </svg>
                                  )}
                                </div>
                                <div className="report-preview-details">
                                  <span className="report-preview-filename">{report.file_name}</span>
                                  <div className="report-preview-metadata">
                                    <span className="report-date">
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                        <line x1="16" y1="2" x2="16" y2="6"/>
                                        <line x1="8" y1="2" x2="8" y2="6"/>
                                        <line x1="3" y1="10" x2="21" y2="10"/>
                                      </svg>
                                      {new Date(report.report_date).toLocaleDateString()}
                                    </span>
                                    <span className="report-size">{(report.file_size / 1024).toFixed(1)} KB</span>
                                  </div>
                                </div>
                              </div>
                              <div className="report-preview-actions">
                                <button 
                                  className="btn-icon btn-delete"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete(report.id, cls.id, selectedSection)
                                  }}
                                  title="Delete report"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3,6 5,6 21,6"/>
                                    <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                                  </svg>
                                </button>
                                <div className="preview-indicator">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                  </svg>
                                  <span>Click to view full report</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Full Report Modal */}
      {showReportModal && selectedReport && (
        <div className="modal-overlay" onClick={closeReportModal}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Test Report - {selectedReport.file_name}</h3>
              <button 
                className="btn-close" 
                onClick={closeReportModal}
                type="button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="report-modal-content">
              <div className="report-modal-info">
                <div className="report-info-item">
                  <span className="info-label">Report Date:</span>
                  <span className="info-value">{new Date(selectedReport.report_date).toLocaleDateString()}</span>
                </div>
                <div className="report-info-item">
                  <span className="info-label">File Size:</span>
                  <span className="info-value">{(selectedReport.file_size / 1024).toFixed(1)} KB</span>
                </div>
                <div className="report-info-item">
                  <span className="info-label">File Type:</span>
                  <span className="info-value">{selectedReport.file_type || 'Unknown'}</span>
                </div>
              </div>
              <div className="report-viewer">
                {selectedReport.file_type?.includes('pdf') ? (
                  <iframe 
                    src={`${import.meta.env.VITE_API_BASE_URL || 'https://api.mphsslar.com'}/${selectedReport.file_path}`}
                    className="pdf-viewer"
                    title={selectedReport.file_name}
                  />
                ) : (
                  <img 
                    src={`${import.meta.env.VITE_API_BASE_URL || 'https://api.mphsslar.com'}/${selectedReport.file_path}`}
                    alt={selectedReport.file_name}
                    className="image-viewer"
                  />
                )}
              </div>
              <div className="report-modal-actions">
                <a 
                  href={`${import.meta.env.VITE_API_BASE_URL || 'https://api.mphsslar.com'}/${selectedReport.file_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download
                </a>
                <button 
                  className="btn-danger"
                  onClick={() => {
                    // Extract class and section info from report context
                    const reportClasses = filteredClasses.filter(cls => {
                      const classSections = sections[cls.id] || []
                      return classSections.some(section => {
                        const sectionKey = `${cls.id}-${section.id}`
                        const sectionReports = testReports[sectionKey] || []
                        return sectionReports.some(r => r.id === selectedReport.id)
                      })
                    })
                    
                    if (reportClasses.length > 0) {
                      const cls = reportClasses[0]
                      const classSections = sections[cls.id] || []
                      const targetSection = classSections.find(section => {
                        const sectionKey = `${cls.id}-${section.id}`
                        const sectionReports = testReports[sectionKey] || []
                        return sectionReports.some(r => r.id === selectedReport.id)
                      })
                      
                      if (targetSection) {
                        closeReportModal()
                        handleDelete(selectedReport.id, cls.id, targetSection.id)
                      }
                    }
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                  </svg>
                  Delete Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{scanMode ? 'Scan Test Report' : 'Upload Test Report'}</h3>
              <button 
                className="btn-close" 
                onClick={() => {
                  setShowUploadModal(false)
                  setScanMode(false)
                }}
                type="button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpload} className="upload-form">
              {/* Location Info for Card Uploads */}
              {uploadFromCard && (
                <div className="upload-location">
                  <div className="location-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  <div className="location-details">
                    <span className="location-label">Uploading to:</span>
                    <span className="location-value">
                      {classes.find(c => c.id === uploadForm.class_id)?.name} - 
                      Section {sections[uploadForm.class_id]?.find(s => s.id === uploadForm.section_id)?.name}
                    </span>
                  </div>
                </div>
              )}

              {/* Class Selection (for main upload button) */}
              {!uploadFromCard && (
                <>
                  <div className="form-group">
                    <label className="form-label">Class</label>
                    <select
                      className="form-select"
                      value={uploadForm.class_id}
                      onChange={(e) => setUploadForm({ ...uploadForm, class_id: e.target.value, section_id: '' })}
                      required
                    >
                      <option value="">Select class...</option>
                      {classesForDropdown.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>

                  {uploadForm.class_id && (
                    <div className="form-group">
                      <label className="form-label">Section</label>
                      <select
                        className="form-select"
                        value={uploadForm.section_id}
                        onChange={(e) => setUploadForm({ ...uploadForm, section_id: e.target.value })}
                        required
                      >
                        <option value="">Select section...</option>
                        {sectionsForDropdown.map(section => (
                          <option key={section.id} value={section.id}>Section {section.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* Report Date */}
              <div className="form-group">
                <label className="form-label">Report Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={uploadForm.report_date}
                  onChange={(e) => setUploadForm({ ...uploadForm, report_date: e.target.value })}
                  required
                />
              </div>

              {/* File Upload */}
              <div className="form-group">
                <label className="form-label">File</label>
                <div className="file-upload-area">
                  <input
                    type="file"
                    accept={scanMode ? "image/*" : ".pdf,image/*"}
                    onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                    required
                    className="file-input"
                    id="file-input"
                  />
                  <label htmlFor="file-input" className="file-upload-label">
                    <div className="upload-icon">
                      {scanMode ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17,8 12,3 7,8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                      )}
                    </div>
                    <div className="upload-text">
                      <span className="upload-main-text">
                        {uploadForm.file ? uploadForm.file.name : 
                         scanMode ? 'Scan or select image file' : 'Drop your file here or click to browse'}
                      </span>
                      <span className="upload-sub-text">
                        {scanMode ? 'JPEG, PNG up to 10MB' : 'PDF, JPEG, PNG up to 10MB'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowUploadModal(false)
                    setUploadFromCard(false)
                    setScanMode(false)
                  }}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <div className="button-spinner"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {scanMode ? (
                          <>
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                            <circle cx="12" cy="13" r="4"/>
                          </>
                        ) : (
                          <>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7,10 12,15 17,10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </>
                        )}
                      </svg>
                      {scanMode ? 'Scan Report' : 'Upload Report'}
                    </>
                  )}
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
