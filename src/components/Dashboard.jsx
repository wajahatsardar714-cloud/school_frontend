import { Link } from 'react-router-dom'

const Dashboard = () => {
  return (
    <div className="page-content dashboard-enhanced">
      <div className="dashboard-hero">
        <div className="dashboard-welcome">
          <h2>Welcome to the  Portal</h2>
          <p className="dashboard-subtitle">Muslim Public Higher Secondary School - Bahawalpur Road, Adda Laar</p>
        </div>
        {/* <div className="dashboard-contact-badge">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          <span>0300-6246297</span>
        </div> */}
      </div>
      
      <div className="welcome-message">
        <div className="mission-statement">
          <svg className="quote-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
          </svg>
          <p className="mission-text">At Muslim Public Higher Secondary School, we strive for excellence in knowledge, character, and service.</p>
          <p className="mission-tagline">Welcome to the hub of learning & growth!</p>
        </div>
      </div>
      
      <h3 className="section-title">Quick Actions</h3>
      
      <div className="dashboard-actions">
        <Link to="/admission/new-form" className="dashboard-btn gradient-blue">
          <div className="btn-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </div>
          <div className="btn-content">
            <span className="btn-title">New Admission</span>
            <span className="btn-subtitle">Add new student to school</span>
          </div>
        </Link>
        
        <Link to="/students" className="dashboard-btn gradient-green">
          <div className="btn-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="btn-content">
            <span className="btn-title">Manage Students</span>
            <span className="btn-subtitle">View and manage student records</span>
          </div>
        </Link>
        
        <Link to="/voucher-management/faculty" className="dashboard-btn gradient-purple">
          <div className="btn-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div className="btn-content">
            <span className="btn-title">Generate Salary Slip</span>
            <span className="btn-subtitle">Create faculty salary voucher</span>
          </div>
        </Link>
        
        <Link to="/fees/vouchers" className="dashboard-btn gradient-orange">
          <div className="btn-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <div className="btn-content">
            <span className="btn-title">Fee Vouchers</span>
            <span className="btn-subtitle">Generate student fee vouchers</span>
          </div>
        </Link>
        
        <Link to="/analytics" className="dashboard-btn gradient-teal">
          <div className="btn-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </div>
          <div className="btn-content">
            <span className="btn-title">Analytics</span>
            <span className="btn-subtitle">View charts and data insights</span>
          </div>
        </Link>
        
        <Link to="/faculty" className="dashboard-btn gradient-red">
          <div className="btn-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div className="btn-content">
            <span className="btn-title">Faculty Management</span>
            <span className="btn-subtitle">Manage teaching staff</span>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default Dashboard

