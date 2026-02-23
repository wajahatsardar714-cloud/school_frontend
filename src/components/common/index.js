/**
 * Common Components Index
 * 
 * Centralized exports for all common/shared components.
 */

// Mobile-optimized components
export { default as MobileActions, ActionIcons } from './MobileActions'
export { default as MobileCardView, MobileDataCard } from './MobileCardView'
export { default as ResponsiveDataGrid, useIsMobile } from './ResponsiveDataGrid'
export { default as CollapsibleFilters, FilterGroup } from './CollapsibleFilters'
export { default as LazyChart, ChartsGrid, ChartCard } from './LazyChart'
export { 
  default as CompactForm, 
  FormRow, 
  FormGroup, 
  FormActions, 
  FormSection 
} from './CompactForm'

// Existing components
export { default as CompactClassCard } from './CompactClassCard'
export { default as FilterBar } from './FilterBar'
// Add CSVImportModal if needed: export { default as CSVImportModal } from './CSVImportModal'
