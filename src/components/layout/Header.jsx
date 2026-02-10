import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo.png'

const Header = () => {
  const { user, logout } = useAuth()
  
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <img src={logo} alt="School Logo" className="header-logo" />
          <div className="header-title-section">
            <h1 className="header-school-name">Muslim Public Higher Secondary School</h1>
            <p className="header-school-address">Bahawalpur Road, Adda Laar | 0300-6246297</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="user-info">
            <svg className="user-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <div className="user-details">
              <span className="user-email">{user?.email}</span>
              <span className="user-role">{user?.role}</span>
            </div>
          </div>
          <button 
            onClick={logout}
            className="logout-btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header

