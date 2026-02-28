/**
 * Class ordering utility
 * Defines the standard order for classes across the application
 */

export const CLASS_ORDER = [
  'PG',
  'Nursery',
  'Prep',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  '6th',
  '7th',
  '8th',
  '9th',
  '10th',
  '1st Year',
  '2nd Year'
]

/**
 * Sort an array of class objects by the standard order
 * @param {Array} classes - Array of class objects with 'name' property
 * @returns {Array} - Sorted array of classes
 */
export const sortClassesByOrder = (classes) => {
  return [...classes].sort((a, b) => {
    const indexA = CLASS_ORDER.findIndex(order => 
      a.name.toLowerCase().includes(order.toLowerCase()) || 
      order.toLowerCase().includes(a.name.toLowerCase())
    )
    const indexB = CLASS_ORDER.findIndex(order => 
      b.name.toLowerCase().includes(order.toLowerCase()) ||  
      order.toLowerCase().includes(b.name.toLowerCase())
    )
    
    // If both not found, sort alphabetically
    if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name)
    // If only A not found, put it after B
    if (indexA === -1) return 1
    // If only B not found, put it after A
    if (indexB === -1) return -1
    // Both found, sort by order index
    return indexA - indexB
  })
}
