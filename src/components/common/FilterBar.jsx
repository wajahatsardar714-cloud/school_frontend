import PropTypes from 'prop-types'
import './FilterBar.css'

const FilterBar = ({ 
  activeFilter, 
  onFilterChange, 
  options = [
    { value: 'ALL', label: 'All Classes' },
    { value: 'SCHOOL', label: 'School' },
    { value: 'COLLEGE', label: 'College' }
  ],
  label = 'Filter by Type:'
}) => {
  return (
    <div className="filter-bar-thin">
      <div className="filter-group-thin">
        <label className="filter-label-thin">{label}</label>
        <div className="filter-buttons-thin">
          {options.map(option => (
            <button 
              key={option.value}
              className={`filter-btn-thin ${activeFilter === option.value ? 'active' : ''}`}
              onClick={() => onFilterChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

FilterBar.propTypes = {
  activeFilter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  })),
  label: PropTypes.string
}

export default FilterBar