import { useState, useMemo } from 'react'
import { getClassSortOrder } from '../utils/classSorting'

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