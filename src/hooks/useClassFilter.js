import { useState, useMemo } from 'react'

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

/**
 * Custom hook for filtering classes by type and search term
 * @param {Array} classes - Array of class objects
 * @param {string} initialFilter - Initial filter value (default: 'ALL')
 * @returns {Object} - Filter state and methods
 */
export const useClassFilter = (classes = [], initialFilter = 'ALL') => {
  const [classTypeFilter, setClassTypeFilter] = useState(initialFilter)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredClasses = useMemo(() => {
    let filtered = classes
    
    // Filter by type
    if (classTypeFilter !== 'ALL') {
      filtered = filtered.filter(c => c.class_type === classTypeFilter)
    }
    
    // Filter by search term
    if (searchTerm) {
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

  return {
    classTypeFilter,
    searchTerm,
    filteredClasses,
    setClassTypeFilter,
    setSearchTerm,
    hasActiveFilters: classTypeFilter !== 'ALL' || searchTerm !== '',
    resetFilters: () => {
      setClassTypeFilter('ALL')
      setSearchTerm('')
    }
  }
}