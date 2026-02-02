import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const navigationItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['ADMIN', 'ACCOUNTANT'] },
  { path: '/admission/list', label: 'Students', icon: '🎓', roles: ['ADMIN', 'ACCOUNTANT'] },
  { path: '/classes', label: 'Classes', icon: '📚', roles: ['ADMIN'] },
  { path: '/faculty', label: 'Faculty', icon: '👨‍🏫', roles: ['ADMIN'], subItems: [
    { path: '/faculty', label: 'Manage Faculty', roles: ['ADMIN'] },
    { path: '/faculty/salary-structure', label: 'Salary Structure', roles: ['ADMIN'] },
    { path: '/faculty/salary-vouchers', label: 'Salary Vouchers', roles: ['ADMIN'] }
  ]},
  { path: '/expenses', label: 'Expenses', icon: '💸', roles: ['ADMIN', 'ACCOUNTANT'] },
  { path: '/users', label: 'Users', icon: '👥', roles: ['ADMIN'] },
]

const Sidebar = () => {
  const location = useLocation()
  const { user } = useAuth()
  const [expandedItems, setExpandedItems] = useState({})
  
  const filteredItems = navigationItems.filter(item => 
    item.roles.includes(user?.role)
  )

  const toggleExpand = (path) => {
    setExpandedItems(prev => ({ ...prev, [path]: !prev[path] }))
  }
  
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">🏫</span>
          <span className="logo-text">MPHS</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {filteredItems.map((item) => (
          <div key={item.path}>
            {item.subItems ? (
              <>
                <div
                  className={`nav-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                  onClick={() => toggleExpand(item.path)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-arrow">{expandedItems[item.path] ? '▼' : '▶'}</span>
                </div>
                {expandedItems[item.path] && (
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
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
