import { useState } from 'react'
import { Link } from 'react-router-dom'
import { classService } from '../../services/classService'
import { useFetch } from '../../hooks/useApi'
import { useClassFilter } from '../../hooks/useClassFilter'
import FilterBar from '../common/FilterBar'
import CompactClassCard from '../common/CompactClassCard'
import CSVImportModal from '../common/CSVImportModal'
import './Students.css'

const StudentDashboard = () => {
    const [showImportModal, setShowImportModal] = useState(false)
    
    // Fetch all classes
    const { data: classesResponse, loading, error } = useFetch(
        () => classService.list(),
        [],
        { enabled: true }
    )

    const classes = classesResponse?.data || []
    
    // Use custom hook for filtering
    const { 
        filteredClasses, 
        classTypeFilter, 
        searchTerm,
        setClassTypeFilter, 
        setSearchTerm 
    } = useClassFilter(classes)

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
                    <p className="student-sub-info">Select a class to view its students or search across all classes.</p>
                </div>
                <div className="header-actions">
                    <button 
                        className="btn-secondary"
                        onClick={() => setShowImportModal(true)}
                        style={{ marginRight: '0.5rem' }}
                    >
                        📁 Import Students
                    </button>
                    <Link to="/admission/new-form" className="btn-primary">
                        + New Admission
                    </Link>
                </div>
            </header>

            <div className="list-controls-thin">
                <FilterBar 
                    activeFilter={classTypeFilter}
                    onFilterChange={setClassTypeFilter}
                />
                
                <div className="search-section">
                    <input
                        type="text"
                        className="search-input-thin"
                        placeholder="Search classes by name or type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="compact-classes-grid">
                {filteredClasses.length === 0 ? (
                    <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                        <p>{searchTerm ? 'No classes found matching your search.' : `No ${classTypeFilter === 'ALL' ? '' : classTypeFilter.toLowerCase()} classes found.`}</p>
                    </div>
                ) : (
                    filteredClasses.map((cls) => (
                        <CompactClassCard
                            key={cls.id}
                            classData={cls}
                            variant="student"
                        />
                    ))
                )}
            </div>

            <CSVImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
            />
        </div>
    )
}

export default StudentDashboard
