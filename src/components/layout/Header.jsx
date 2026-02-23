import { useAuth } from '../../context/AuthContext'
import { useState, useCallback, memo } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import logo from '../../assets/logo.png'

const Header = memo(function Header({ onMenuClick }) {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev)
  }, [])

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Mobile Menu Toggle - Opens Sidebar */}
        <button
          className="mobile-menu-toggle show-mobile-only"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        
        {/* Logo & School Info */}
        <div className="header-brand">
          <img src={logo} alt="School Logo" className="header-logo" />
          <div className="header-info">
            <h1 className="header-school-name">Muslim Public Higher Secondary School</h1>
            <p className="header-school-address">Bahawalpur Road, Adda Laar</p>
          </div>
        </div>

        {/* Empty div to maintain header layout */}
        <div className="header-spacer"></div>
      </div>
    </header>
  )
})

Header.propTypes = {
  onMenuClick: PropTypes.func
}

Header.defaultProps = {
  onMenuClick: () => {}
}

export default Header
