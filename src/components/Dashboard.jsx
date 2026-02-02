import { Link } from 'react-router-dom'

const Dashboard = () => {
  return (
    <div className="page-content">
      <h2>Welcome to Dashboard</h2>
      
      <div className="welcome-message">
        <p>At Muslim Public Higher Secondary School, we strive for excellence in knowledge, character, and service.</p>
        <p>Welcome to the hub of learning & growth!</p>
      </div>
      
      <div className="dashboard-actions">
        <Link to="/admission/new-form" className="dashboard-btn blue">
          <span className="btn-icon">📝</span>
          <span className="btn-title">New Admission</span>
          <span className="btn-subtitle">Add new student to school</span>
        </Link>
        
        <Link to="/voucher-management/faculty" className="dashboard-btn blue">
          <span className="btn-icon">💰</span>
          <span className="btn-title">Generate Salary Slip</span>
          <span className="btn-subtitle">Create faculty salary voucher</span>
        </Link>
        
        <Link to="/voucher-management" className="dashboard-btn blue">
          <span className="btn-icon">🧾</span>
          <span className="btn-title">Generate Vouchers</span>
          <span className="btn-subtitle">Create student fee vouchers</span>
        </Link>
        
        <Link to="/analytics" className="dashboard-btn blue">
          <span className="btn-icon">📊</span>
          <span className="btn-title">Analytics</span>
          <span className="btn-subtitle">View charts and data insights</span>
        </Link>
      </div>
    </div>
  )
}

export default Dashboard
