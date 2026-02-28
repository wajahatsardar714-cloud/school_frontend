import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { classService } from '../../services/classService'
import { useFetch } from '../../hooks/useApi'
import FilterBar from '../common/FilterBar'
import CompactClassCard from '../common/CompactClassCard'
import CSVImportModal from '../common/CSVImportModal'
import StudentSearchBar from './StudentSearchBar'
import { getClassSortOrder } from '../../utils/classSorting'
import './Students.css'

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
