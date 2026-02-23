/**
 * ResponsiveDataGrid Component
 * 
 * Wraps AG Grid with mobile card view support.
 * Automatically switches between AG Grid (desktop) and card view (mobile).
 * Optimized for performance with lazy loading and memoization.
 */

import { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense } from 'react'
import PropTypes from 'prop-types'
import MobileCardView from './MobileCardView'

// Lazy load AG Grid for performance
const AgGridReact = lazy(() => 
  import('ag-grid-react').then(module => ({ default: module.AgGridReact }))
)

// Custom hook for detecting mobile viewport
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < breakpoint
  })
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }
    
    // Debounced resize handler
    let timeoutId
    const debouncedResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleResize, 100)
    }
    
    window.addEventListener('resize', debouncedResize)
    return () => {
      window.removeEventListener('resize', debouncedResize)
      clearTimeout(timeoutId)
    }
  }, [breakpoint])
  
  return isMobile
}

// AG Grid loading fallback
const GridLoadingFallback = () => (
  <div className="loading-container" style={{ minHeight: '300px' }}>
    <div className="spinner"></div>
    <span>Loading data grid...</span>
  </div>
)

const ResponsiveDataGrid = memo(function ResponsiveDataGrid({
  // AG Grid props
  rowData,
  columnDefs,
  defaultColDef,
  onGridReady,
  onRowClicked,
  onSelectionChanged,
  rowSelection,
  pagination,
  paginationPageSize,
  domLayout,
  getRowId,
  
  // Mobile card view props
  mobileConfig,
  
  // Common props
  loading = false,
  emptyMessage = 'No data available',
  className = '',
  
  // Performance props
  mobileBreakpoint = 768,
  
  // Additional AG Grid props
  ...gridProps
}) {
  const isMobile = useIsMobile(mobileBreakpoint)
  
  // Memoize default column definition
  const mergedDefaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
    minWidth: 100,
    ...defaultColDef
  }), [defaultColDef])
  
  // Memoize grid options for performance
  const gridOptions = useMemo(() => ({
    animateRows: true,
    suppressRowClickSelection: true,
    enableCellTextSelection: true,
    ...gridProps
  }), [gridProps])
  
  // Handle card click for mobile view
  const handleCardClick = useCallback((data) => {
    if (onRowClicked) {
      onRowClicked({ data })
    }
  }, [onRowClicked])
  
  // Render loading state
  if (loading) {
    return (
      <div className={`responsive-data-grid ${className}`}>
        <div className="loading-container">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`responsive-data-grid ${className}`}>
      {/* Desktop: AG Grid */}
      {!isMobile && (
        <div className="ag-grid-desktop">
          <div className="ag-grid-scroll-wrapper">
            <Suspense fallback={<GridLoadingFallback />}>
              <div 
                className="ag-theme-alpine" 
                style={{ width: '100%', height: domLayout === 'autoHeight' ? 'auto' : '500px' }}
              >
                <AgGridReact
                  rowData={rowData}
                  columnDefs={columnDefs}
                  defaultColDef={mergedDefaultColDef}
                  onGridReady={onGridReady}
                  onRowClicked={onRowClicked}
                  onSelectionChanged={onSelectionChanged}
                  rowSelection={rowSelection}
                  pagination={pagination}
                  paginationPageSize={paginationPageSize}
                  domLayout={domLayout}
                  getRowId={getRowId}
                  {...gridOptions}
                />
              </div>
            </Suspense>
          </div>
        </div>
      )}
      
      {/* Mobile: Card View */}
      {isMobile && mobileConfig && (
        <MobileCardView
          data={rowData}
          titleField={mobileConfig.titleField}
          badgeField={mobileConfig.badgeField}
          badgeFormatter={mobileConfig.badgeFormatter}
          fields={mobileConfig.fields}
          actions={mobileConfig.actions}
          onCardClick={handleCardClick}
          emptyMessage={emptyMessage}
          loading={loading}
        />
      )}
      
      {/* Fallback if no mobile config */}
      {isMobile && !mobileConfig && (
        <div className="ag-grid-scroll-wrapper scroll-x-mobile">
          <Suspense fallback={<GridLoadingFallback />}>
            <div 
              className="ag-theme-alpine" 
              style={{ width: '100%', minWidth: '600px', height: domLayout === 'autoHeight' ? 'auto' : '400px' }}
            >
              <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={mergedDefaultColDef}
                onGridReady={onGridReady}
                onRowClicked={onRowClicked}
                pagination={pagination}
                paginationPageSize={paginationPageSize}
                domLayout={domLayout}
                getRowId={getRowId}
                {...gridOptions}
              />
            </div>
          </Suspense>
        </div>
      )}
    </div>
  )
})

ResponsiveDataGrid.propTypes = {
  // AG Grid props
  rowData: PropTypes.array,
  columnDefs: PropTypes.array.isRequired,
  defaultColDef: PropTypes.object,
  onGridReady: PropTypes.func,
  onRowClicked: PropTypes.func,
  onSelectionChanged: PropTypes.func,
  rowSelection: PropTypes.oneOf(['single', 'multiple']),
  pagination: PropTypes.bool,
  paginationPageSize: PropTypes.number,
  domLayout: PropTypes.string,
  getRowId: PropTypes.func,
  
  // Mobile config
  mobileConfig: PropTypes.shape({
    titleField: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
    badgeField: PropTypes.string,
    badgeFormatter: PropTypes.func,
    fields: PropTypes.array.isRequired,
    actions: PropTypes.oneOfType([PropTypes.array, PropTypes.func])
  }),
  
  // Common props
  loading: PropTypes.bool,
  emptyMessage: PropTypes.string,
  className: PropTypes.string,
  mobileBreakpoint: PropTypes.number
}

export default ResponsiveDataGrid

// Export hook for custom implementations
export { useIsMobile }
