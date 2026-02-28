/**
 * Utility function to get class sort order
 * Defines the sorting sequence for all classes across the application
 * Sequence: PG, Nursery, Prep, One, Two, Three, Four, Five, 6th, 7th, 8th, 9th, 10th, 1st year, 2nd year
 */
export const getClassSortOrder = (className) => {
  if (!className) return 999
  
  const lowerName = className.toLowerCase().trim()
  
  // Exact sequence as specified
  if (lowerName.includes('pg') || lowerName.includes('playgroup')) return 1
  if (lowerName.includes('nursery')) return 2
  if (lowerName.includes('prep') || lowerName.includes('preparatory')) return 3
  if (lowerName.includes('one') || lowerName === '1' || lowerName === 'class one' || lowerName === 'class 1') return 4
  if (lowerName.includes('two') || lowerName === '2' || lowerName === 'class two' || lowerName === 'class 2') return 5
  if (lowerName.includes('three') || lowerName === '3' || lowerName === 'class three' || lowerName === 'class 3') return 6
  if (lowerName.includes('four') || lowerName === '4' || lowerName === 'class four' || lowerName === 'class 4') return 7
  if (lowerName.includes('five') || lowerName === '5' || lowerName === 'class five' || lowerName === 'class 5') return 8
  if (lowerName.includes('6th') || lowerName.includes('six') || lowerName === '6' || lowerName === 'class 6') return 9
  if (lowerName.includes('7th') || lowerName.includes('seven') || lowerName === '7' || lowerName === 'class 7') return 10
  if (lowerName.includes('8th') || lowerName.includes('eight') || lowerName === '8' || lowerName === 'class 8') return 11
  if (lowerName.includes('9th') || lowerName.includes('nine') || lowerName === '9' || lowerName === 'class 9') return 12
  if (lowerName.includes('10th') || lowerName.includes('ten') || lowerName === '10' || lowerName === 'class 10') return 13
  if (lowerName.includes('1st year') || lowerName.includes('first year') || lowerName.includes('11th')) return 14
  if (lowerName.includes('2nd year') || lowerName.includes('second year') || lowerName.includes('12th')) return 15
  
  // Default order for unmatched classes
  return 999
}

/**
 * Sort array of classes by the standard sequence
 * @param {Array} classesArray - Array of class objects with 'name' property
 * @returns {Array} - Sorted array of classes
 */
export const sortClassesBySequence = (classesArray) => {
  if (!Array.isArray(classesArray)) return []
  
  return [...classesArray].sort((a, b) => {
    const orderA = getClassSortOrder(a.name)
    const orderB = getClassSortOrder(b.name)
    
    if (orderA !== orderB) {
      return orderA - orderB
    }
    
    // If same order, sort alphabetically
    return (a.name || '').localeCompare(b.name || '')
  })
}
