/**
 * MobileDataCard Component
 * 
 * Renders AG Grid data as mobile-friendly cards.
 * Replaces AG Grid on screens below 768px.
 */

import { memo, useMemo } from 'react'
import PropTypes from 'prop-types'
import MobileActions from './MobileActions'

const MobileDataCard = memo(function MobileDataCard({
  data,
  titleField,
  badgeField,
  badgeFormatter,
  fields,
  actions,
  onCardClick,
  id
}) {
  const title = useMemo(() => {
    if (typeof titleField === 'function') {
      return titleField(data)
    }
    return data[titleField] || 'N/A'
  }, [data, titleField])
  
  const badge = useMemo(() => {
    if (!badgeField) return null
    const value = data[badgeField]
    if (badgeFormatter) {
      return badgeFormatter(value, data)
    }
    return { label: value, className: '' }
  }, [data, badgeField, badgeFormatter])
  
  const cardActions = useMemo(() => {
    if (!actions) return []
    if (typeof actions === 'function') {
      return actions(data)
    }
    return actions.map(action => ({
      ...action,
      onClick: () => action.onClick?.(data)
    }))
  }, [actions, data])
  
  const handleCardClick = (e) => {
    // Don't trigger card click if clicking on actions
    if (e.target.closest('.mobile-actions-wrapper')) return
    onCardClick?.(data)
  }
  
  return (
    <div 
      className="mobile-data-card" 
      onClick={handleCardClick}
      role={onCardClick ? 'button' : undefined}
      tabIndex={onCardClick ? 0 : undefined}
    >
      <div className="mobile-card-header">
        <h4 className="mobile-card-title">{title}</h4>
        {badge && (
          <span className={`mobile-card-badge ${badge.className}`}>
            {badge.label}
          </span>
        )}
      </div>
      
      <div className="mobile-card-body">
        {fields.map((field, index) => {
          const value = typeof field.value === 'function' 
            ? field.value(data) 
            : data[field.key]
          
          if (value === undefined || value === null || value === '') return null
          
          return (
            <div 
              key={index} 
              className={`mobile-card-field ${field.fullWidth ? 'full-width' : ''}`}
            >
              <span className="mobile-field-label">{field.label}</span>
              <span className="mobile-field-value">
                {field.formatter ? field.formatter(value, data) : value}
              </span>
            </div>
          )
        })}
      </div>
      
      {cardActions.length > 0 && (
        <div className="mobile-card-footer">
          <MobileActions actions={cardActions} id={id || data.id} />
        </div>
      )}
    </div>
  )
})

MobileDataCard.propTypes = {
  data: PropTypes.object.isRequired,
  titleField: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
  badgeField: PropTypes.string,
  badgeFormatter: PropTypes.func,
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      label: PropTypes.string.isRequired,
      value: PropTypes.func,
      formatter: PropTypes.func,
      fullWidth: PropTypes.bool
    })
  ).isRequired,
  actions: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
  onCardClick: PropTypes.func,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
}

/**
 * MobileCardView Component
 * 
 * Container for mobile card view that replaces AG Grid on mobile.
 */
const MobileCardView = memo(function MobileCardView({
  data,
  titleField,
  badgeField,
  badgeFormatter,
  fields,
  actions,
  onCardClick,
  emptyMessage = 'No data available',
  loading = false
}) {
  if (loading) {
    return (
      <div className="mobile-card-view">
        <div className="loading-container">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      </div>
    )
  }
  
  if (!data || data.length === 0) {
    return (
      <div className="mobile-card-view">
        <div className="empty-state">
          <p>{emptyMessage}</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="mobile-card-view">
      {data.map((item, index) => (
        <MobileDataCard
          key={item.id || index}
          data={item}
          titleField={titleField}
          badgeField={badgeField}
          badgeFormatter={badgeFormatter}
          fields={fields}
          actions={actions}
          onCardClick={onCardClick}
          id={item.id || index}
        />
      ))}
    </div>
  )
})

MobileCardView.propTypes = {
  data: PropTypes.array,
  titleField: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
  badgeField: PropTypes.string,
  badgeFormatter: PropTypes.func,
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      label: PropTypes.string.isRequired,
      value: PropTypes.func,
      formatter: PropTypes.func,
      fullWidth: PropTypes.bool
    })
  ).isRequired,
  actions: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
  onCardClick: PropTypes.func,
  emptyMessage: PropTypes.string,
  loading: PropTypes.bool
}

export { MobileDataCard, MobileCardView }
export default MobileCardView
