/**
 * LazyChart Component
 * 
 * Lazy-loaded chart wrapper with mobile optimization.
 * Uses Intersection Observer for viewport-based loading.
 */

import { useState, useEffect, useRef, memo, lazy, Suspense } from 'react'
import PropTypes from 'prop-types'

// Lazy load Chart.js components
const Line = lazy(() => import('react-chartjs-2').then(mod => ({ default: mod.Line })))
const Doughnut = lazy(() => import('react-chartjs-2').then(mod => ({ default: mod.Doughnut })))
const Bar = lazy(() => import('react-chartjs-2').then(mod => ({ default: mod.Bar })))
const Pie = lazy(() => import('react-chartjs-2').then(mod => ({ default: mod.Pie })))

const chartComponents = {
  line: Line,
  doughnut: Doughnut,
  bar: Bar,
  pie: Pie
}

// Chart loading placeholder
const ChartPlaceholder = ({ height }) => (
  <div 
    className="chart-placeholder"
    style={{ 
      height: height || 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-gray-50)',
      borderRadius: 'var(--radius-md)'
    }}
  >
    <div className="spinner" style={{ width: 24, height: 24 }}></div>
  </div>
)

// Custom hook for intersection observer
const useIntersectionObserver = (ref, options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  
  useEffect(() => {
    if (!ref.current) return
    
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsIntersecting(true)
        observer.disconnect()
      }
    }, {
      threshold: 0.1,
      rootMargin: '100px',
      ...options
    })
    
    observer.observe(ref.current)
    
    return () => observer.disconnect()
  }, [ref, options])
  
  return isIntersecting
}

// Responsive hook for mobile detection
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  )
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [breakpoint])
  
  return isMobile
}

const LazyChart = memo(function LazyChart({
  type = 'line',
  data,
  options = {},
  height = 300,
  mobileHeight = 200,
  title,
  className = ''
}) {
  const containerRef = useRef(null)
  const isVisible = useIntersectionObserver(containerRef)
  const isMobile = useIsMobile()
  
  const ChartComponent = chartComponents[type]
  
  if (!ChartComponent) {
    console.error(`Unknown chart type: ${type}`)
    return null
  }
  
  // Merge mobile-optimized options
  const mergedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    ...options,
    plugins: {
      ...options.plugins,
      legend: {
        ...options.plugins?.legend,
        position: isMobile ? 'bottom' : (options.plugins?.legend?.position || 'top'),
        labels: {
          ...options.plugins?.legend?.labels,
          boxWidth: isMobile ? 10 : 40,
          padding: isMobile ? 8 : 10,
          font: {
            size: isMobile ? 10 : 12,
            ...options.plugins?.legend?.labels?.font
          }
        }
      },
      title: {
        ...options.plugins?.title,
        font: {
          size: isMobile ? 12 : 14,
          ...options.plugins?.title?.font
        }
      }
    },
    scales: options.scales ? {
      ...Object.fromEntries(
        Object.entries(options.scales).map(([key, scale]) => [
          key,
          {
            ...scale,
            ticks: {
              ...scale.ticks,
              font: {
                size: isMobile ? 9 : 11,
                ...scale.ticks?.font
              }
            }
          }
        ])
      )
    } : undefined
  }
  
  const chartHeight = isMobile ? mobileHeight : height

  return (
    <div 
      ref={containerRef}
      className={`lazy-chart ${className}`}
    >
      {title && <h4 className="chart-title">{title}</h4>}
      <div className="chart-wrapper" style={{ height: chartHeight }}>
        {isVisible ? (
          <Suspense fallback={<ChartPlaceholder height={chartHeight} />}>
            <ChartComponent data={data} options={mergedOptions} />
          </Suspense>
        ) : (
          <ChartPlaceholder height={chartHeight} />
        )}
      </div>
    </div>
  )
})

LazyChart.propTypes = {
  type: PropTypes.oneOf(['line', 'doughnut', 'bar', 'pie']),
  data: PropTypes.object.isRequired,
  options: PropTypes.object,
  height: PropTypes.number,
  mobileHeight: PropTypes.number,
  title: PropTypes.string,
  className: PropTypes.string
}

export default LazyChart

/**
 * ChartsGrid - Responsive grid container for multiple charts
 */
export const ChartsGrid = memo(function ChartsGrid({ children, className = '' }) {
  return (
    <div className={`charts-grid ${className}`}>
      {children}
    </div>
  )
})

ChartsGrid.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}

/**
 * ChartCard - Card wrapper for individual charts
 */
export const ChartCard = memo(function ChartCard({ 
  title, 
  subtitle,
  children, 
  className = '' 
}) {
  return (
    <div className={`chart-card ${className}`}>
      {(title || subtitle) && (
        <div className="chart-card-header">
          {title && <h4 className="chart-card-title">{title}</h4>}
          {subtitle && <p className="chart-card-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="chart-card-body">
        {children}
      </div>
    </div>
  )
})

ChartCard.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}
