/**
 * CollapsibleFilters Component
 * 
 * Mobile-optimized filter section that collapses on small screens.
 * Expands to show full filter options when toggled.
 */

import { useState, useCallback, memo } from 'react'
import PropTypes from 'prop-types'

const ChevronIcon = ({ isExpanded }) => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    style={{ 
      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 0.2s ease'
    }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
)

const CollapsibleFilters = memo(function CollapsibleFilters({
  children,
  title = 'Filters',
  defaultExpanded = false,
  activeFiltersCount = 0,
  onClearAll,
  className = ''
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  return (
    <div className={`collapsible-filters ${className}`}>
      {/* Toggle button - visible only on mobile */}
      <button 
        className="filters-toggle"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        aria-controls="filter-content"
      >
        <span className="filters-toggle-content">
          <FilterIcon />
          <span>{title}</span>
          {activeFiltersCount > 0 && (
            <span className="filters-badge">{activeFiltersCount}</span>
          )}
        </span>
        <ChevronIcon isExpanded={isExpanded} />
      </button>
      
      {/* Filter content */}
      <div 
        id="filter-content"
        className={`filters-content ${isExpanded ? 'expanded' : ''}`}
      >
        {children}
        
        {/* Clear all button */}
        {activeFiltersCount > 0 && onClearAll && (
          <button 
            className="filters-clear-btn"
            onClick={onClearAll}
            type="button"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  )
})

CollapsibleFilters.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  defaultExpanded: PropTypes.bool,
  activeFiltersCount: PropTypes.number,
  onClearAll: PropTypes.func,
  className: PropTypes.string
}

export default CollapsibleFilters

/**
 * FilterGroup - Individual filter field wrapper
 */
export const FilterGroup = memo(function FilterGroup({
  label,
  htmlFor,
  children,
  className = ''
}) {
  return (
    <div className={`filter-group ${className}`}>
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
    </div>
  )
})

FilterGroup.propTypes = {
  label: PropTypes.string,
  htmlFor: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}
