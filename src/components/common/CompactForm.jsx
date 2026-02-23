/**
 * CompactForm Component
 * 
 * Responsive form wrapper that provides optimized mobile layout.
 * Automatically stacks fields on mobile with compact spacing.
 */

import { memo } from 'react'
import PropTypes from 'prop-types'

/**
 * FormRow - Responsive row container for form fields
 */
export const FormRow = memo(function FormRow({ children, columns = 2, className = '' }) {
  return (
    <div 
      className={`form-row form-row-${columns} ${className}`}
      style={{ '--form-columns': columns }}
    >
      {children}
    </div>
  )
})

FormRow.propTypes = {
  children: PropTypes.node.isRequired,
  columns: PropTypes.oneOf([1, 2, 3, 4]),
  className: PropTypes.string
}

/**
 * FormGroup - Single form field container with label
 */
export const FormGroup = memo(function FormGroup({ 
  label, 
  htmlFor, 
  required = false, 
  error,
  hint,
  fullWidth = false,
  className = '',
  children 
}) {
  return (
    <div className={`form-group ${fullWidth ? 'full-width' : ''} ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={htmlFor}>
          {label}
          {required && <span className="required-mark">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <span className="form-hint">{hint}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  )
})

FormGroup.propTypes = {
  label: PropTypes.string,
  htmlFor: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.string,
  hint: PropTypes.string,
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node.isRequired
}

/**
 * FormActions - Sticky bottom form actions container
 */
export const FormActions = memo(function FormActions({ 
  children, 
  sticky = true,
  align = 'right',
  className = '' 
}) {
  return (
    <div className={`form-actions ${sticky ? 'sticky' : ''} align-${align} ${className}`}>
      {children}
    </div>
  )
})

FormActions.propTypes = {
  children: PropTypes.node.isRequired,
  sticky: PropTypes.bool,
  align: PropTypes.oneOf(['left', 'center', 'right', 'stretch']),
  className: PropTypes.string
}

/**
 * FormSection - Grouped form fields with optional title
 */
export const FormSection = memo(function FormSection({ 
  title, 
  description,
  collapsible = false,
  defaultExpanded = true,
  children,
  className = ''
}) {
  return (
    <div className={`form-section ${className}`}>
      {title && (
        <div className="form-section-header">
          <h4 className="form-section-title">{title}</h4>
          {description && <p className="form-section-description">{description}</p>}
        </div>
      )}
      <div className="form-section-content">
        {children}
      </div>
    </div>
  )
})

FormSection.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  collapsible: PropTypes.bool,
  defaultExpanded: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}

/**
 * CompactForm - Main form wrapper
 */
const CompactForm = memo(function CompactForm({ 
  onSubmit, 
  children,
  className = '',
  ...props 
}) {
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit?.(e)
  }

  return (
    <form 
      className={`compact-form ${className}`}
      onSubmit={handleSubmit}
      {...props}
    >
      {children}
    </form>
  )
})

CompactForm.propTypes = {
  onSubmit: PropTypes.func,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}

export default CompactForm

/**
 * CSS for CompactForm (add to mobile-responsive.css or App.css)
 * 
 * .compact-form { ... }
 * .form-row { display: grid; grid-template-columns: repeat(var(--form-columns, 2), 1fr); gap: var(--spacing-md); }
 * @media (max-width: 767px) { .form-row { grid-template-columns: 1fr; } }
 * .form-group.full-width { grid-column: 1 / -1; }
 * .form-actions.sticky { position: sticky; bottom: 0; ... }
 * .required-mark { color: var(--color-error); margin-left: 2px; }
 * .form-hint { font-size: var(--font-size-xs); color: var(--color-text-secondary); }
 * .form-error { font-size: var(--font-size-xs); color: var(--color-error); }
 */
