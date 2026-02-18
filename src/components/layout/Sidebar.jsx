import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo.png'

// Icon components
const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
)

const IconStudents = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconClasses = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
)

const IconGuardians = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconFaculty = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const IconFees = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

const IconExpenses = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
)

const IconAnalytics = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)

const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const navigationItems = [
  { path: '/dashboard', label: 'Dashboard', icon: <IconDashboard />, roles: ['ADMIN', 'ACCOUNTANT'] },
  { path: '/students', label: 'Students', icon: <IconStudents />, roles: ['ADMIN', 'ACCOUNTANT'] },
  { path: '/classes', label: 'Classes', icon: <IconClasses />, roles: ['ADMIN'] },
  { path: '/guardians', label: 'Guardians', icon: <IconGuardians />, roles: ['ADMIN', 'ACCOUNTANT'] },
  {
    path: '/faculty', label: 'Faculty', icon: <IconFaculty />, roles: ['ADMIN'], subItems: [
      { path: '/faculty', label: 'Manage Faculty', roles: ['ADMIN'] },
      { path: '/faculty/salary-structure', label: 'Salary Structure', roles: ['ADMIN'] },
      { path: '/faculty/salary-vouchers', label: 'Salary Vouchers', roles: ['ADMIN'] }
    ]
  },
  {
    path: '/fees', label: 'Fee Management', icon: <IconFees />, roles: ['ADMIN', 'ACCOUNTANT'], subItems: [
      { path: '/fees/vouchers', label: 'Fee Vouchers', roles: ['ADMIN', 'ACCOUNTANT'] },
      { path: '/fees/payments', label: 'Payments', roles: ['ADMIN', 'ACCOUNTANT'] },
      { path: '/fees/discounts', label: 'Discounts', roles: ['ADMIN', 'ACCOUNTANT'] },
      { path: '/fees/defaulters', label: 'Defaulters', roles: ['ADMIN', 'ACCOUNTANT'] },
      { path: '/fees/statistics', label: 'Statistics', roles: ['ADMIN', 'ACCOUNTANT'] },
      { path: '/fees/student-history', label: 'Student History', roles: ['ADMIN', 'ACCOUNTANT'] }
    ]
  },
  { path: '/expenses', label: 'Expenses', icon: <IconExpenses />, roles: ['ADMIN', 'ACCOUNTANT'] },
  { path: '/analytics', label: 'Analytics', icon: <IconAnalytics />, roles: ['ADMIN'] },
  { path: '/users', label: 'Users', icon: <IconUsers />, roles: ['ADMIN'] },
]

const Sidebar = () => {
  const location = useLocation()
  const { user } = useAuth()
  const [expandedItems, setExpandedItems] = useState({})
  const [isCollapsed, setIsCollapsed] = useState(false)

  const filteredItems = navigationItems.filter(item =>
    item.roles.includes(user?.role?.toUpperCase())
  )

  const toggleExpand = (path) => {
    setExpandedItems(prev => ({ ...prev, [path]: !prev[path] }))
  }

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev)
  }

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <img src={logo} alt="MPHS Logo" className="sidebar-logo" />
          {!isCollapsed && <span className="logo-text">MPHS</span>}
        </div>
        <button className="sidebar-toggle" onClick={toggleSidebar} title={isCollapsed ? "Expand menu" : "Collapse menu"}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isCollapsed ? (
              <>
                <line x1="17" y1="10" x2="3" y2="10" />
                <line x1="21" y1="6" x2="3" y2="6" />
                <line x1="21" y1="14" x2="3" y2="14" />
                <line x1="17" y1="18" x2="3" y2="18" />
              </>
            ) : (
              <>
                <line x1="21" y1="10" x2="7" y2="10" />
                <line x1="21" y1="6" x2="3" y2="6" />
                <line x1="21" y1="14" x2="3" y2="14" />
                <line x1="21" y1="18" x2="7" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      <nav className="sidebar-nav">
        {filteredItems.map((item) => (
          <div key={item.path}>
            {item.subItems ? (
              <>
                <div
                  className={`nav-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                  onClick={() => !isCollapsed && toggleExpand(item.path)}
                  title={isCollapsed ? item.label : ''}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!isCollapsed && (
                    <>
                      <span className="nav-label">{item.label}</span>
                      <span className="nav-arrow">{expandedItems[item.path] ? '▼' : '▶'}</span>
                    </>
                  )}
                </div>
                {!isCollapsed && expandedItems[item.path] && (
                  <div className="sub-nav">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.path}
                        to={subItem.path}
                        className={`sub-nav-item ${location.pathname === subItem.path ? 'active' : ''}`}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                to={item.path}
                className={`nav-item ${location.pathname === item.path || location.pathname.startsWith(item.path + '/') ? 'active' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <span className="nav-icon">{item.icon}</span>
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
              </Link>
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
