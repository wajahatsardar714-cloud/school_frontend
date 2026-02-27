import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { classService } from '../../services/classService'
import { useFetch } from '../../hooks/useApi'
import FilterBar from '../common/FilterBar'
import CompactClassCard from '../common/CompactClassCard'
import CSVImportModal from '../common/CSVImportModal'
import StudentSearchBar from './StudentSearchBar'
import './Students.css'

// Custom sorting order for classes
const getClassSortOrder = (className) => {
  const lowerName = className.toLowerCase()
  
  // Check longer/more specific patterns first to avoid partial matches
  if (lowerName.includes('1st year') || lowerName.includes('first year') || lowerName.includes('11th')) return 100
  if (lowerName.includes('2nd year') || lowerName.includes('second year') || lowerName.includes('12th')) return 101
  
  // Then check individual class names
  if (lowerName.includes('pg')) return 1
  if (lowerName.includes('nursery')) return 2
  if (lowerName.includes('prep')) return 3
  if (lowerName.includes('one') || lowerName === '1st') return 4
  if (lowerName.includes('two') || lowerName === '2nd') return 5
  if (lowerName.includes('three') || lowerName === '3rd') return 6
  if (lowerName.includes('four') || lowerName === '4th') return 7
  if (lowerName.includes('five') || lowerName === '5th') return 8
  if (lowerName.includes('six') || lowerName.includes('6th')) return 9
  if (lowerName.includes('seven') || lowerName.includes('7th')) return 10
  if (lowerName.includes('eight') || lowerName.includes('8th')) return 11
  if (lowerName.includes('nine') || lowerName.includes('9th')) return 12
  if (lowerName.includes('ten') || lowerName.includes('10th')) return 13
  
  // Default order for unmatched classes
  return 999
}

const StudentDashboard = () => {
    const [showImportModal, setShowImportModal] = useState(false)
    const [classTypeFilter, setClassTypeFilter] = useState('ALL')
    const [searchTerm, setSearchTerm] = useState('')
    const [refreshKey, setRefreshKey] = useState(0)
    
    // Fetch all classes
    const { data: classesResponse, loading, error, refetch } = useFetch(
        () => classService.list(),
        [refreshKey],
        { enabled: true }
    )

    const classes = classesResponse?.data || []
    
    // Filter and sort classes
    const filteredClasses = useMemo(() => {
        let filtered = classes
        
        // Filter by type
        if (classTypeFilter !== 'ALL') {
            filtered = filtered.filter(c => c.class_type === classTypeFilter)
        }
        
        // Filter by search term
        if (searchTerm.trim()) {
            filtered = filtered.filter(c =>
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.class_type.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }
        
        // Sort classes in custom order
        return filtered.sort((a, b) => {
            const orderA = getClassSortOrder(a.name)
            const orderB = getClassSortOrder(b.name)
            return orderA - orderB
        })
    }, [classes, classTypeFilter, searchTerm])

    if (loading) {
        return (
            <div className="students-container">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading classes...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="students-container">
                <div className="alert alert-error">
                    <p>Error loading classes: {error.message || 'Unknown error'}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="students-container">
            <header className="students-header">
                <div>
                    <h1>Student Directory</h1>
                    <p className="student-sub-info">Search for students by name or browse by class.</p>
                </div>
                <div className="header-actions">
                    <button 
                        className="btn-secondary"
                        onClick={() => setRefreshKey(prev => prev + 1)}
                        disabled={loading}
                        title="Refresh student counts"
                    >
                        🔄 Refresh
                    </button>
                    <button 
                        className="btn-secondary"
                        onClick={() => setShowImportModal(true)}
                    >
                        📁 Import Students
                    </button>
                </div>
            </header>

            {/* Student Search Section */}
            <div className="filter-section">
                <h3 className="filter-section-title">🔍 Search Student</h3>
                <StudentSearchBar isCompact={true} />
            </div>

            {/* Class Browse Section */}
            <div className="filter-section">
                <h3 className="filter-section-title">📚 Browse by Class</h3>
                <div className="class-filter-controls">
                    <FilterBar 
                        activeFilter={classTypeFilter}
                        onFilterChange={setClassTypeFilter}
                    />
                    <input
                        type="text"
                        className="search-input-simple"
                        placeholder="Filter classes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Class Grid - Always visible below filters */}
            <div className="compact-classes-grid">
                {filteredClasses.length === 0 ? (
                    <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                        <p>{searchTerm ? 'No classes found matching your search.' : `No ${classTypeFilter === 'ALL' ? '' : classTypeFilter.toLowerCase()} classes found.`}</p>
                    </div>
                ) : (
                    filteredClasses.map((cls) => (
                        <CompactClassCard
                            key={`${cls.id}-${cls.student_count}`}
                            classData={cls}
                            variant="student"
                        />
                    ))
                )}
            </div>

            <CSVImportModal
                isOpen={showImportModal}
                onClose={() => {
                    setShowImportModal(false)
                    // Refresh classes to update student counts
                    setRefreshKey(prev => prev + 1)
                }}
            />
        </div>
    )
}

export default StudentDashboard
