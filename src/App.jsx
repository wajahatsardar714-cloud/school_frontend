import { BrowserRouter as Router, Routes, Route, Link, useLocation, useParams, useNavigate } from 'react-router-dom'
import React, { useState } from 'react'
import './App.css'

// Login Component
const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    
    // Simple validation - accept any non-empty values or skip validation for demo
    const newErrors = {}
    
    // For demo purposes, allow empty credentials
    // if (!email) newErrors.email = 'Email is required'
    // if (!password) newErrors.password = 'Password is required'
    
    setErrors(newErrors)
    
    // Navigate to dashboard regardless of credentials for demo
    navigate('/dashboard')
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h2 className="welcome-title">Welcome back</h2>
          <p className="welcome-subtitle">Sign in to your account</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>
          
          <button type="submit" className="sign-in-btn">
            Sign in
          </button>
        </form>
        
        <div className="login-footer">
          <p>Don't have an account? <span className="signup-link">Contact Admin</span></p>
          <p style={{marginTop: '10px', fontSize: '12px', color: '#666'}}>
            For testing: <Link to="/dashboard" style={{color: '#3b82f6', textDecoration: 'underline'}}>Go to Dashboard</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// Page Components
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

// Admission Components
const AdmissionHome = () => {
  return (
    <div className="page-content">
      <h2>Welcome to Admission</h2>
      <div className="admission-actions">
        <Link to="/admission/new-form" className="action-btn primary">
          <span className="btn-icon">📝</span>
          <span>New Admission Form</span>
        </Link>
        <Link to="/admission/list" className="action-btn secondary">
          <span className="btn-icon">📋</span>
          <span>Admission List</span>
        </Link>
      </div>
    </div>
  )
}

const AdmissionForm = () => {
  const [selectedClass, setSelectedClass] = useState('')
  const [feeSchedule, setFeeSchedule] = useState({
    admissionFee: 0,
    monthlyFee: 0,
    paperFund: 0,
    total: 0
  })
  const [customFees, setCustomFees] = useState([])
  const [isFreeStudent, setIsFreeStudent] = useState(false)
  const [showFeeSchedule, setShowFeeSchedule] = useState(false)

  // Fee schedule based on the provided image
  const defaultFeeSchedule = {
    'PG': { admissionFee: 1500, monthlyFee: 1300, paperFund: 1500, total: 4300 },
    'Nursery': { admissionFee: 1500, monthlyFee: 1300, paperFund: 1500, total: 4300 },
    'Prep': { admissionFee: 1500, monthlyFee: 1300, paperFund: 1500, total: 4300 },
    'Class 1': { admissionFee: 1500, monthlyFee: 1400, paperFund: 1500, total: 4400 },
    'Class 2': { admissionFee: 1500, monthlyFee: 1500, paperFund: 1500, total: 4500 },
    'Class 3': { admissionFee: 1500, monthlyFee: 1700, paperFund: 1500, total: 4700 },
    'Class 4': { admissionFee: 1500, monthlyFee: 1800, paperFund: 2000, total: 5300 },
    'Class 5': { admissionFee: 1500, monthlyFee: 1900, paperFund: 2000, total: 5400 },
    'Class 6': { admissionFee: 2000, monthlyFee: 2000, paperFund: 2000, total: 6000 },
    'Class 7': { admissionFee: 2000, monthlyFee: 2200, paperFund: 2000, total: 6200 },
    'Class 8': { admissionFee: 2000, monthlyFee: 2400, paperFund: 2000, total: 6400 },
    'Class 9': { admissionFee: 2000, monthlyFee: 3000, paperFund: 5000, total: 10000 },
    'Class 10': { admissionFee: 2000, monthlyFee: 3000, paperFund: 5000, total: 10000 },
    '1st Year': { admissionFee: 3000, monthlyFee: 4000, paperFund: 8000, total: 15000 },
    '2nd Year': { admissionFee: 3000, monthlyFee: 4000, paperFund: 8000, total: 15000 }
  }
  
  const handleClassChange = (e) => {
    const className = e.target.value
    setSelectedClass(className)
    
    if (className && defaultFeeSchedule[className]) {
      setFeeSchedule(defaultFeeSchedule[className])
      setShowFeeSchedule(true)
    } else {
      setShowFeeSchedule(false)
    }
  }

  const handleFeeChange = (field, value) => {
    const newFeeSchedule = { ...feeSchedule, [field]: Number(value) }
    if (field !== 'total') {
      newFeeSchedule.total = newFeeSchedule.admissionFee + newFeeSchedule.monthlyFee + newFeeSchedule.paperFund
    }
    setFeeSchedule(newFeeSchedule)
  }

  const addCustomFee = () => {
    const newId = Date.now()
    setCustomFees([...customFees, { id: newId, name: '', amount: 0 }])
  }

  const updateCustomFee = (id, field, value) => {
    setCustomFees(customFees.map(fee => 
      fee.id === id ? { ...fee, [field]: field === 'amount' ? Number(value) : value } : fee
    ))
  }

  const removeCustomFee = (id) => {
    setCustomFees(customFees.filter(fee => fee.id !== id))
  }

  const getTotalFees = () => {
    if (isFreeStudent) return 0
    const baseFees = feeSchedule.admissionFee + feeSchedule.monthlyFee + feeSchedule.paperFund
    const customFeesTotal = customFees.reduce((total, fee) => total + (fee.amount || 0), 0)
    return baseFees + customFeesTotal
  }
  
  const isHigherClass = selectedClass === '1st Year' || selectedClass === '2nd Year'
  const navigate = useNavigate()

  const goBack = () => {
    navigate(-1)
  }
  
  return (
    <div className="page-content">
      <div className="breadcrumb-nav">
        <Link to="/admission">Admission</Link>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">New Admission Form</span>
      </div>
      
      <div className="form-header">
        <h2>New Admission Form</h2>
        <div className="header-actions">
          <button onClick={goBack} className="back-btn">← Go Back</button>
          <Link to="/admission" className="back-btn secondary">Admission Home</Link>
        </div>
      </div>
      
      <div className="admission-form-container">
        <form className="admission-form">
          <div className="form-section">
            <h3>Student Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Student Name *</label>
                <input type="text" placeholder="Enter student name" required />
              </div>
              
              <div className="form-group">
                <label>Date of Birth *</label>
                <input type="date" required />
              </div>
              
              <div className="form-group">
                <label>Student Phone</label>
                <input type="tel" placeholder="Enter phone number" />
              </div>
              
              <div className="form-group">
                <label>Caste</label>
                <input type="text" placeholder="Enter caste" />
              </div>
              
              <div className="form-group full-width">
                <label>Address *</label>
                <textarea placeholder="Enter complete address" rows="3" required></textarea>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Father/Guardian Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Father Name *</label>
                <input type="text" placeholder="Enter father name" required />
              </div>
              
              <div className="form-group">
                <label>Father CNIC *</label>
                <input type="text" placeholder="00000-0000000-0" required />
              </div>
              
              <div className="form-group">
                <label>Father Phone *</label>
                <input type="tel" placeholder="Enter phone number" required />
              </div>
              
              <div className="form-group">
                <label>Father/Guardian Occupation</label>
                <input type="text" placeholder="Enter occupation" />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Academic Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Admission Date *</label>
                <input type="date" required />
              </div>
              
              <div className="form-group">
                <label>Admission in Class *</label>
                <select required value={selectedClass} onChange={handleClassChange}>
                  <option value="">Select Class</option>
                  <option value="PG">PG</option>
                  <option value="Nursery">Nursery</option>
                  <option value="Prep">Prep</option>
                  <option value="Class 1">Class 1</option>
                  <option value="Class 2">Class 2</option>
                  <option value="Class 3">Class 3</option>
                  <option value="Class 4">Class 4</option>
                  <option value="Class 5">Class 5</option>
                  <option value="Class 6">Class 6</option>
                  <option value="Class 7">Class 7</option>
                  <option value="Class 8">Class 8</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Class 10">Class 10</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Section *</label>
                <select required>
                  <option value="">Select Section</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Bay Form</label>
                <input type="text" placeholder="Enter bay form number" />
              </div>
              
              <div className="form-group">
                <label>Previous School Name</label>
                <input type="text" placeholder="Enter previous school name" />
              </div>
            </div>
          </div>

          {showFeeSchedule && (
            <div className="form-section fee-schedule-section">
              <div className="fee-header">
                <h3>Fee Schedule for {selectedClass}</h3>
                <div className="fee-controls">
                  <label className="free-student-toggle">
                    <input 
                      type="checkbox" 
                      checked={isFreeStudent}
                      onChange={(e) => setIsFreeStudent(e.target.checked)}
                    />
                    Mark as Free Student
                  </label>
                </div>
              </div>

              {!isFreeStudent && (
                <div className="fee-schedule-box">
                  <div className="fee-table">
                    <div className="fee-table-header">
                      <div className="fee-column">Fee Type</div>
                      <div className="fee-column">Amount (Rs.)</div>
                    </div>
                    
                    <div className="fee-row">
                      <label>Admission Fee</label>
                      <input
                        type="number"
                        value={feeSchedule.admissionFee}
                        onChange={(e) => handleFeeChange('admissionFee', e.target.value)}
                        min="0"
                      />
                    </div>
                    
                    <div className="fee-row">
                      <label>Monthly Fee</label>
                      <input
                        type="number"
                        value={feeSchedule.monthlyFee}
                        onChange={(e) => handleFeeChange('monthlyFee', e.target.value)}
                        min="0"
                      />
                    </div>
                    
                    <div className="fee-row">
                      <label>Paper Fund</label>
                      <input
                        type="number"
                        value={feeSchedule.paperFund}
                        onChange={(e) => handleFeeChange('paperFund', e.target.value)}
                        min="0"
                      />
                    </div>

                    {customFees.map(fee => (
                      <div key={fee.id} className="fee-row custom-fee-row">
                        <input
                          type="text"
                          placeholder="Fee name (e.g., Lab Fee)"
                          value={fee.name}
                          onChange={(e) => updateCustomFee(fee.id, 'name', e.target.value)}
                          className="fee-name-input"
                        />
                        <div className="custom-fee-amount">
                          <input
                            type="number"
                            value={fee.amount}
                            onChange={(e) => updateCustomFee(fee.id, 'amount', e.target.value)}
                            min="0"
                            placeholder="Amount"
                          />
                          <button 
                            type="button"
                            onClick={() => removeCustomFee(fee.id)}
                            className="remove-fee-btn"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="fee-actions">
                      <button 
                        type="button"
                        onClick={addCustomFee}
                        className="add-fee-btn"
                      >
                        + Add Custom Fee
                      </button>
                    </div>
                    
                    <div className="fee-row total-row">
                      <label><strong>Total Amount</strong></label>
                      <div className="total-amount">
                        <strong>Rs. {getTotalFees().toLocaleString()}/-</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isFreeStudent && (
                <div className="free-student-notice">
                  <div className="notice-box">
                    <h4>📚 Free Student</h4>
                    <p>This student has been marked as a free student. No fees will be charged.</p>
                    <div className="total-amount free">
                      <strong>Total Amount: Rs. 0/-</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {isHigherClass && (
            <div className="form-section conditional-section">
              <h3>Previous Academic Records</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>9th Class Roll No *</label>
                  <input 
                    type="text" 
                    placeholder="Enter 9th class roll number" 
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label>9th Class Marks *</label>
                  <input 
                    type="number" 
                    placeholder="Enter total marks (out of 1100)" 
                    min="0" 
                    max="1100" 
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label>10th Class Roll No *</label>
                  <input 
                    type="text" 
                    placeholder="Enter 10th class roll number" 
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label>10th Class Marks *</label>
                  <input 
                    type="number" 
                    placeholder="Enter total marks (out of 1100)" 
                    min="0" 
                    max="1100" 
                    required 
                  />
                </div>
              </div>
            </div>
          )}

          <div className="form-section">
            <h3>Documents Upload</h3>
            <div className="upload-section">
              <div className="upload-group">
                <label>Student Photo *</label>
                <div className="file-upload-container">
                  <input type="file" id="student-photo" accept="image/*" className="file-input" />
                  <label htmlFor="student-photo" className="file-upload-btn">
                    <span className="upload-icon">📷</span>
                    <span>Upload Photo</span>
                  </label>
                  <small className="upload-help">Max size: 2MB (JPG, PNG)</small>
                </div>
              </div>
              
              <div className="upload-group">
                <label>Bay Form *</label>
                <div className="file-upload-container">
                  <input type="file" id="bay-form" accept="image/*,.pdf" className="file-input" />
                  <label htmlFor="bay-form" className="file-upload-btn">
                    <span className="upload-icon">📄</span>
                    <span>Upload Bay Form</span>
                  </label>
                  <small className="upload-help">PDF or Image</small>
                </div>
              </div>
              
              <div className="upload-group">
                <label>Father CNIC *</label>
                <div className="file-upload-container">
                  <input type="file" id="father-cnic" accept="image/*,.pdf" className="file-input" />
                  <label htmlFor="father-cnic" className="file-upload-btn">
                    <span className="upload-icon">🆔</span>
                    <span>Upload CNIC</span>
                  </label>
                  <small className="upload-help">Both sides scan</small>
                </div>
              </div>
              
              <div className="upload-group">
                <label>Birth Certificate</label>
                <div className="file-upload-container">
                  <input type="file" id="birth-cert" accept="image/*,.pdf" className="file-input" />
                  <label htmlFor="birth-cert" className="file-upload-btn">
                    <span className="upload-icon">📋</span>
                    <span>Upload Certificate</span>
                  </label>
                  <small className="upload-help">Optional document</small>
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={goBack} className="btn-cancel">Go Back</button>
            <Link to="/admission" className="btn-secondary">Admission Home</Link>
            <button type="submit" className="btn-submit">Submit Admission</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const AdmissionList = () => {
  const dummyStudents = [
    {
      id: 1,
      rollNo: "2024-001",
      studentName: "Muhammad Ali",
      fatherName: "Abdul Rahman",
      class: "10th",
      admissionDate: "2024-03-15",
      phone: "0300-1234567",
      address: "House 123, Block A, Lahore",
      hasPhoto: true,
      documents: ["Bay Form", "CNIC"],
      fatherCnic: "12345-6789012-3",
      occupation: "Business",
      bayForm: "BF-2024-001",
      previousSchool: "ABC Primary School"
    },
    {
      id: 2,
      rollNo: "2024-002",
      studentName: "Fatima Khan",
      fatherName: "Ahmed Khan",
      class: "9th",
      admissionDate: "2024-03-20",
      phone: "0301-2345678",
      address: "Street 5, Model Town, Karachi",
      hasPhoto: true,
      documents: ["Birth Certificate"],
      fatherCnic: "12345-6789013-4",
      occupation: "Engineer",
      bayForm: "BF-2024-002",
      previousSchool: "XYZ Girls School"
    },
    {
      id: 3,
      rollNo: "2024-003",
      studentName: "Hassan Ahmed",
      fatherName: "Muhammad Ahmed",
      class: "8th",
      admissionDate: "2024-04-01",
      phone: "0302-3456789",
      address: "Colony Road, Islamabad",
      hasPhoto: false,
      documents: ["Bay Form", "Domicile", "Previous School Certificate"],
      fatherCnic: "12345-6789014-5",
      occupation: "Teacher",
      bayForm: "BF-2024-003",
      previousSchool: "Government High School"
    },
    {
      id: 4,
      rollNo: "2024-004",
      studentName: "Aisha Malik",
      fatherName: "Tariq Malik",
      class: "11th",
      admissionDate: "2024-04-10",
      phone: "0303-4567890",
      address: "Defence Housing, Lahore",
      hasPhoto: true,
      documents: ["CNIC", "Birth Certificate"],
      fatherCnic: "12345-6789015-6",
      occupation: "Doctor",
      bayForm: "BF-2024-004",
      previousSchool: "Elite High School"
    },
    {
      id: 5,
      rollNo: "2024-005",
      studentName: "Omar Farooq",
      fatherName: "Usman Farooq",
      class: "7th",
      admissionDate: "2024-04-15",
      phone: "0304-5678901",
      address: "Gulshan Block, Faisalabad",
      hasPhoto: false,
      documents: ["Bay Form"],
      fatherCnic: "12345-6789016-7",
      occupation: "Shopkeeper",
      bayForm: "BF-2024-005",
      previousSchool: "City Public School"
    },
    {
      id: 6,
      rollNo: "2024-006",
      studentName: "Mariam Sheikh",
      fatherName: "Abdullah Sheikh",
      class: "12th",
      admissionDate: "2024-05-01",
      phone: "0305-6789012",
      address: "Satellite Town, Rawalpindi",
      hasPhoto: true,
      documents: ["Bay Form", "CNIC", "Previous School Certificate"],
      fatherCnic: "12345-6789017-8",
      occupation: "Government Officer",
      bayForm: "BF-2024-006",
      previousSchool: "Convent School"
    },
    {
      id: 7,
      rollNo: "2024-007",
      studentName: "Bilal Hussain",
      fatherName: "Ali Hussain",
      class: "6th",
      admissionDate: "2024-05-10",
      phone: "0306-7890123",
      address: "New City, Peshawar",
      hasPhoto: false,
      documents: [],
      fatherCnic: "12345-6789018-9",
      occupation: "Driver",
      bayForm: "BF-2024-007",
      previousSchool: "Local Primary School"
    },
    {
      id: 8,
      rollNo: "2024-008",
      studentName: "Zara Iqbal",
      fatherName: "Muhammad Iqbal",
      class: "9th",
      admissionDate: "2024-05-20",
      phone: "0307-8901234",
      address: "Garden Town, Lahore",
      hasPhoto: true,
      documents: ["Bay Form", "Birth Certificate", "Custom Document"],
      fatherCnic: "12345-6789019-0",
      occupation: "Banker",
      bayForm: "BF-2024-008",
      previousSchool: "Smart Kids School"
    },
    {
      id: 9,
      rollNo: "2024-009",
      studentName: "Saad Raza",
      fatherName: "Imran Raza",
      class: "5th",
      admissionDate: "2024-06-01",
      phone: "0308-9012345",
      address: "Johar Town, Karachi",
      hasPhoto: false,
      documents: ["CNIC"],
      fatherCnic: "12345-6789020-1",
      occupation: "Mechanic",
      bayForm: "BF-2024-009",
      previousSchool: "Bright Future School"
    },
    {
      id: 10,
      rollNo: "2024-010",
      studentName: "Hira Batool",
      fatherName: "Syed Ali",
      class: "Play Group",
      admissionDate: "2024-06-15",
      phone: "0309-0123456",
      address: "University Town, Islamabad",
      hasPhoto: true,
      documents: ["Bay Form", "Birth Certificate"],
      fatherCnic: "12345-6789021-2",
      occupation: "Professor",
      bayForm: "BF-2024-010",
      previousSchool: "First time admission"
    }
  ]

  return (
    <div className="page-content">
      <div className="list-header">
        <h2>Admission List</h2>
        <Link to="/admission" className="back-btn">← Back to Admission</Link>
      </div>
      
      <div className="filter-section">
        <div className="date-filters">
          <div className="filter-group">
            <label>From Date:</label>
            <input type="date" />
          </div>
          <div className="filter-group">
            <label>To Date:</label>
            <input type="date" />
          </div>
          <button className="filter-btn">Filter</button>
          <button className="clear-btn">Clear</button>
        </div>
      </div>

      <div className="students-preview">
        {dummyStudents.map((student, index) => (
          <div key={student.id} className="student-card">
            <div className="student-info">
              <div className="student-header">
                <h3>{student.studentName}</h3>
                <span className="roll-number">Roll No: {student.rollNo}</span>
              </div>
              <div className="student-details">
                <p><strong>Class:</strong> {student.class} - Section: {student.section || 'A'}</p>
                <p><strong>Father:</strong> {student.fatherName}</p>
                <p><strong>Admission Date:</strong> {student.admissionDate}</p>
              </div>
            </div>
            <div className="student-actions">
              <Link to={`/admission/view-detail/${student.id}`} className="view-detail-btn">
                View Detail
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Student Detail View Component
const StudentViewDetail = () => {
  const { id } = useParams()
  
  // In a real app, this would fetch from an API based on the ID
  const student = {
    id: parseInt(id),
    rollNo: `2024-00${id}`,
    studentName: id === '1' ? 'Muhammad Ali' : id === '2' ? 'Fatima Khan' : 'Hassan Ahmed',
    fatherName: id === '1' ? 'Abdul Rahman' : id === '2' ? 'Ahmed Khan' : 'Muhammad Ahmed',
    class: id === '1' ? 'Ten' : id === '2' ? 'Nine' : '1st Year',
    section: id === '1' ? 'A' : id === '2' ? 'B' : 'A',
    admissionDate: '2024-03-15',
    phone: '0300-1234567',
    address: 'House 123, Block A, Lahore',
    hasPhoto: true,
    documents: ['Bay Form', 'CNIC', 'Birth Certificate'],
    fatherCnic: '12345-6789012-3',
    occupation: 'Business',
    bayForm: 'BF-2024-001',
    previousSchool: 'ABC Primary School',
    caste: 'Pakistani',
    dateOfBirth: '2008-05-15',
    // Previous marks for higher classes
    ninthRollNo: id === '3' ? '2022-045' : '',
    ninthMarks: id === '3' ? '850' : '',
    tenthRollNo: id === '3' ? '2023-067' : '',
    tenthMarks: id === '3' ? '920' : ''
  }
  
  const isHigherClass = student.class === '1st Year' || student.class === '2nd Year'

  return (
    <div className="page-content">
      <div className="form-header">
        <h2>Student Admission Form - {student.studentName}</h2>
        <Link to="/admission/list" className="back-btn">← Back to List</Link>
      </div>
      
      <div className="admission-form-container">
        <div className="admission-form view-mode">
          <div className="form-section">
            <h3>Student Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Roll Number</label>
                <input type="text" value={student.rollNo} readOnly className="readonly-input" />
              </div>
              
              <div className="form-group">
                <label>Student Name *</label>
                <input type="text" value={student.studentName} readOnly className="readonly-input" />
              </div>
              
              <div className="form-group">
                <label>Date of Birth *</label>
                <input type="text" value={student.dateOfBirth} readOnly className="readonly-input" />
              </div>
              
              <div className="form-group">
                <label>Student Phone</label>
                <input type="text" value={student.phone} readOnly className="readonly-input" />
              </div>
              
              <div className="form-group">
                <label>Caste</label>
                <input type="text" value={student.caste} readOnly className="readonly-input" />
              </div>
              
              <div className="form-group full-width">
                <label>Address *</label>
                <textarea value={student.address} readOnly className="readonly-input" rows="2" />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Father/Guardian Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Father Name *</label>
                <input type="text" value={student.fatherName} readOnly className="readonly-input" />
              </div>
              
              <div className="form-group">
                <label>Father CNIC *</label>
                <input type="text" value={student.fatherCnic} readOnly className="readonly-input" />
              </div>
              
              <div className="form-group">
                <label>Father Phone *</label>
                <input type="text" value={student.phone} readOnly className="readonly-input" />
              </div>
              
              <div className="form-group">
                <label>Father Occupation</label>
                <input type="text" value={student.occupation} readOnly className="readonly-input" />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Academic Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Admission Date *</label>
                <input type="text" value={student.admissionDate} readOnly className="readonly-input" />
              </div>
              
              <div className="form-group">
                <label>Class *</label>
                <input type="text" value={student.class} readOnly className="readonly-input" />
              </div>
              
              <div className="form-group">
                <label>Section *</label>
                <input type="text" value={student.section} readOnly className="readonly-input" />
              </div>
              
              <div className="form-group">
                <label>Bay Form Number *</label>
                <input type="text" value={student.bayForm} readOnly className="readonly-input" />
              </div>
              
              <div className="form-group">
                <label>Previous School</label>
                <input type="text" value={student.previousSchool} readOnly className="readonly-input" />
              </div>
            </div>
          </div>

          {isHigherClass && (
            <div className="form-section">
              <h3>Previous Academic Records</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>9th Class Roll No</label>
                  <input type="text" value={student.ninthRollNo} readOnly className="readonly-input" />
                </div>
                
                <div className="form-group">
                  <label>9th Class Marks</label>
                  <input type="text" value={student.ninthMarks} readOnly className="readonly-input" />
                </div>
                
                <div className="form-group">
                  <label>10th Class Roll No</label>
                  <input type="text" value={student.tenthRollNo} readOnly className="readonly-input" />
                </div>
                
                <div className="form-group">
                  <label>10th Class Marks</label>
                  <input type="text" value={student.tenthMarks} readOnly className="readonly-input" />
                </div>
              </div>
            </div>
          )}

          <div className="form-section">
            <h3>Documents Upload</h3>
            <div className="upload-section view-mode">
              <div className="upload-group">
                <label>Student Photo *</label>
                <div className="uploaded-file">
                  <span className="file-icon">📷</span>
                  <span className="file-name">student_photo.jpg</span>
                  <span className="file-status uploaded">✓ Uploaded</span>
                </div>
              </div>
              
              <div className="upload-group">
                <label>Bay Form *</label>
                <div className="uploaded-file">
                  <span className="file-icon">📄</span>
                  <span className="file-name">bay_form.pdf</span>
                  <span className="file-status uploaded">✓ Uploaded</span>
                </div>
              </div>
              
              <div className="upload-group">
                <label>Father CNIC *</label>
                <div className="uploaded-file">
                  <span className="file-icon">🆔</span>
                  <span className="file-name">father_cnic.jpg</span>
                  <span className="file-status uploaded">✓ Uploaded</span>
                </div>
              </div>
              
              <div className="upload-group">
                <label>Birth Certificate</label>
                <div className="uploaded-file">
                  <span className="file-icon">📋</span>
                  <span className="file-name">birth_certificate.pdf</span>
                  <span className="file-status uploaded">✓ Uploaded</span>
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <Link to="/admission/list" className="btn-cancel">Back to List</Link>
            <button className="btn-submit">Edit Information</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Faculty Management Components
const FacultyManagement = () => {
  return (
    <div className="page-content">
      <h2>Welcome to Faculty Management</h2>
      <div className="admission-actions">
        <Link to="/faculty-management/add-faculty" className="action-btn primary">
          <span className="btn-icon">👤</span>
          <span>Add Faculty Member</span>
        </Link>
        <Link to="/faculty-management/list" className="action-btn secondary">
          <span className="btn-icon">📋</span>
          <span>Faculty List</span>
        </Link>
        <Link to="/voucher-management/faculty" className="action-btn tertiary">
          <span className="btn-icon">💰</span>
          <span>Faculty Salary</span>
        </Link>
      </div>
    </div>
  )
}

const AddFacultyForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    fatherHusbandName: '',
    cnic: '',
    phone: '',
    gender: '',
    role: '',
    customRole: '',
    salary: ''
  })
  const [showCustomRole, setShowCustomRole] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Show custom role input when "Other" is selected
    if (name === 'role') {
      setShowCustomRole(value === 'Other')
      if (value !== 'Other') {
        setFormData(prev => ({ ...prev, customRole: '' }))
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Save faculty data to localStorage for demo
    const existingFaculty = JSON.parse(localStorage.getItem('facultyMembers') || '[]')
    const finalRole = formData.role === 'Other' ? formData.customRole : formData.role
    const newFaculty = {
      id: Date.now(),
      name: formData.name,
      fatherHusbandName: formData.fatherHusbandName,
      cnic: formData.cnic,
      phone: formData.phone,
      gender: formData.gender,
      role: finalRole,
      salary: parseFloat(formData.salary)
    }
    existingFaculty.push(newFaculty)
    localStorage.setItem('facultyMembers', JSON.stringify(existingFaculty))
    alert('Faculty member added successfully!')
    setFormData({
      name: '',
      fatherHusbandName: '',
      cnic: '',
      phone: '',
      gender: '',
      role: '',
      customRole: '',
      salary: ''
    })
    setShowCustomRole(false)
  }

  const navigate = useNavigate()

  const goBack = () => {
    navigate(-1)
  }

  return (
    <div className="page-content">
      <div className="breadcrumb-nav">
        <Link to="/faculty-management">Faculty Management</Link>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">Add Faculty</span>
      </div>
      
      <div className="form-header">
        <h2>Add New Faculty Member</h2>
        <div className="header-actions">
          <button onClick={goBack} className="back-btn">← Go Back</button>
          <Link to="/faculty-management" className="back-btn secondary">Faculty Home</Link>
        </div>
      </div>
      
      <div className="admission-form-container">
        <form className="admission-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Name *</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter full name" 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label>Father / Husband Name *</label>
                <input 
                  type="text" 
                  name="fatherHusbandName"
                  value={formData.fatherHusbandName}
                  onChange={handleInputChange}
                  placeholder="Enter father/husband name" 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label>CNIC *</label>
                <input 
                  type="text" 
                  name="cnic"
                  value={formData.cnic}
                  onChange={handleInputChange}
                  placeholder="00000-0000000-0" 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label>Phone *</label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number" 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label>Gender *</label>
                <select 
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Professional Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Role *</label>
                <select 
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Role</option>
                  <option value="Principal">Principal</option>
                  <option value="Vice Principal">Vice Principal</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Coordinator">Coordinator</option>
                  <option value="Computer Operator">Computer Operator</option>
                  <option value="Lab Assistant">Lab Assistant</option>
                  <option value="Librarian">Librarian</option>
                  <option value="Clerk">Clerk</option>
                  <option value="Peon">Peon</option>
                  <option value="Other">Other (Specify)</option>
                </select>
              </div>
              
              {showCustomRole && (
                <div className="form-group">
                  <label>Specify Role *</label>
                  <input 
                    type="text" 
                    name="customRole"
                    value={formData.customRole}
                    onChange={handleInputChange}
                    placeholder="Enter custom role" 
                    required
                  />
                </div>
              )}
              
              <div className="form-group">
                <label>Monthly Salary (PKR) *</label>
                <input 
                  type="number" 
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  placeholder="Enter monthly salary" 
                  min="0"
                  step="0.01"
                  required 
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={goBack} className="btn-cancel">Go Back</button>
            <Link to="/faculty-management" className="btn-secondary">Faculty Home</Link>
            <button type="submit" className="btn-submit">Add Faculty Member</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Faculty List Component
const FacultyList = () => {
  // Initialize faculty data with hardcoded teachers from the attachment
  const [facultyMembers, setFacultyMembers] = useState([
    {
      id: 1,
      name: "Prof. Muhammad Tariq",
      fatherHusbandName: "Abdul Malik",
      cnic: "12345-6789012-3",
      phone: "0300-1234567",
      gender: "Male",
      role: "Principal",
      salary: 85000,
      joiningDate: "2020-01-15"
    },
    {
      id: 2,
      name: "Mrs. Fatima Sheikh",
      fatherHusbandName: "Sheikh Abdullah",
      cnic: "12345-6789012-4",
      phone: "0301-2345678",
      gender: "Female",
      role: "Teacher",
      salary: 45000,
      joiningDate: "2021-03-20"
    },
    {
      id: 3,
      name: "Mr. Hassan Ali",
      fatherHusbandName: "Ali Ahmed",
      cnic: "12345-6789012-5",
      phone: "0302-3456789",
      gender: "Male",
      role: "Coordinator",
      salary: 55000,
      joiningDate: "2020-08-10"
    },
    {
      id: 4,
      name: "Ms. Aisha Khan",
      fatherHusbandName: "Khan Sahib",
      cnic: "12345-6789012-6",
      phone: "0303-4567890",
      gender: "Female",
      role: "Computer Operator",
      salary: 35000,
      joiningDate: "2022-01-05"
    },
    {
      id: 5,
      name: "Mr. Bilal Ahmed",
      fatherHusbandName: "Ahmed Hassan",
      cnic: "12345-6789012-7",
      phone: "0304-5678901",
      gender: "Male",
      role: "Lab Assistant",
      salary: 28000,
      joiningDate: "2022-06-15"
    }
  ])

  const formatCurrency = (amount) => {
    return `PKR ${amount.toLocaleString('en-PK')}`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PK')
  }

  const navigate = useNavigate()

  const goBack = () => {
    navigate(-1)
  }

  return (
    <div className="page-content">
      <div className="breadcrumb-nav">
        <Link to="/faculty-management">Faculty Management</Link>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">Faculty List</span>
      </div>
      
      <div className="form-header">
        <h2>Faculty Members List</h2>
        <div className="header-actions">
          <button onClick={goBack} className="back-btn">← Go Back</button>
          <Link to="/faculty-management" className="back-btn secondary">Faculty Home</Link>
        </div>
      </div>
      
      <div className="faculty-list-container">
        <div className="faculty-stats">
          <div className="stat-item">
            <span className="stat-number">{facultyMembers.length}</span>
            <span className="stat-label">Total Faculty</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{facultyMembers.filter(f => f.gender === 'Male').length}</span>
            <span className="stat-label">Male</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{facultyMembers.filter(f => f.gender === 'Female').length}</span>
            <span className="stat-label">Female</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{formatCurrency(facultyMembers.reduce((total, f) => total + f.salary, 0))}</span>
            <span className="stat-label">Total Monthly Salary</span>
          </div>
        </div>

        <div className="faculty-table-wrapper">
          <table className="faculty-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Name</th>
                <th>Father/Husband Name</th>
                <th>CNIC</th>
                <th>Phone</th>
                <th>Gender</th>
                <th>Role</th>
                <th>Monthly Salary</th>
                <th>Joining Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {facultyMembers.map((faculty, index) => (
                <tr key={faculty.id}>
                  <td>{index + 1}</td>
                  <td className="name-cell">{faculty.name}</td>
                  <td>{faculty.fatherHusbandName}</td>
                  <td className="cnic-cell">{faculty.cnic}</td>
                  <td className="phone-cell">{faculty.phone}</td>
                  <td>
                    <span className={`gender-badge ${faculty.gender.toLowerCase()}`}>
                      {faculty.gender}
                    </span>
                  </td>
                  <td>
                    <span className="role-badge">
                      {faculty.role}
                    </span>
                  </td>
                  <td className="salary-cell">{formatCurrency(faculty.salary)}</td>
                  <td>{formatDate(faculty.joiningDate)}</td>
                  <td>
                    <Link 
                      to={`/faculty-management/edit/${faculty.id}`}
                      className="edit-btn"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="faculty-actions">
          <Link to="/faculty-management/add-faculty" className="btn-submit">
            Add New Faculty Member
          </Link>
        </div>
      </div>
    </div>
  )
}

// Edit Faculty Form Component
const EditFacultyForm = () => {
  const { id } = useParams()
  
  // Same hardcoded data as in FacultyList
  const facultyData = [
    {
      id: 1,
      name: "Prof. Muhammad Tariq",
      fatherHusbandName: "Abdul Malik",
      cnic: "12345-6789012-3",
      phone: "0300-1234567",
      gender: "Male",
      role: "Principal",
      salary: 85000,
      joiningDate: "2020-01-15"
    },
    {
      id: 2,
      name: "Mrs. Fatima Sheikh",
      fatherHusbandName: "Sheikh Abdullah",
      cnic: "12345-6789012-4",
      phone: "0301-2345678",
      gender: "Female",
      role: "Teacher",
      salary: 45000,
      joiningDate: "2021-03-20"
    },
    {
      id: 3,
      name: "Mr. Hassan Ali",
      fatherHusbandName: "Ali Ahmed",
      cnic: "12345-6789012-5",
      phone: "0302-3456789",
      gender: "Male",
      role: "Coordinator",
      salary: 55000,
      joiningDate: "2020-08-10"
    },
    {
      id: 4,
      name: "Ms. Aisha Khan",
      fatherHusbandName: "Khan Sahib",
      cnic: "12345-6789012-6",
      phone: "0303-4567890",
      gender: "Female",
      role: "Computer Operator",
      salary: 35000,
      joiningDate: "2022-01-05"
    },
    {
      id: 5,
      name: "Mr. Bilal Ahmed",
      fatherHusbandName: "Ahmed Hassan",
      cnic: "12345-6789012-7",
      phone: "0304-5678901",
      gender: "Male",
      role: "Lab Assistant",
      salary: 28000,
      joiningDate: "2022-06-15"
    }
  ]

  const faculty = facultyData.find(f => f.id === parseInt(id))
  
  const [formData, setFormData] = useState({
    name: faculty?.name || '',
    fatherHusbandName: faculty?.fatherHusbandName || '',
    cnic: faculty?.cnic || '',
    phone: faculty?.phone || '',
    gender: faculty?.gender || '',
    role: faculty?.role || '',
    customRole: '',
    salary: faculty?.salary || ''
  })
  
  const [showCustomRole, setShowCustomRole] = useState(false)

  React.useEffect(() => {
    if (faculty) {
      setFormData({
        name: faculty.name,
        fatherHusbandName: faculty.fatherHusbandName,
        cnic: faculty.cnic,
        phone: faculty.phone,
        gender: faculty.gender,
        role: faculty.role,
        customRole: '',
        salary: faculty.salary
      })
    }
  }, [faculty])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (name === 'role') {
      setShowCustomRole(value === 'Other')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // In a real application, this would update the faculty member in the database
    alert('Faculty member updated successfully!')
  }

  if (!faculty) {
    return (
      <div className="page-content">
        <div className="form-header">
          <h2>Faculty Not Found</h2>
          <Link to="/faculty-management/list" className="back-btn">← Back to Faculty List</Link>
        </div>
      </div>
    )
  }

  const navigate = useNavigate()

  const goBack = () => {
    navigate(-1)
  }

  return (
    <div className="page-content">
      <div className="breadcrumb-nav">
        <Link to="/faculty-management">Faculty Management</Link>
        <span className="breadcrumb-separator">›</span>
        <Link to="/faculty-management/list">Faculty List</Link>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">Edit Faculty</span>
      </div>
      
      <div className="form-header">
        <h2>Edit Faculty Member - {faculty.name}</h2>
        <div className="header-actions">
          <button onClick={goBack} className="back-btn">← Go Back</button>
          <Link to="/faculty-management/list" className="back-btn secondary">Faculty List</Link>
          <Link to="/faculty-management" className="back-btn tertiary">Faculty Home</Link>
        </div>
      </div>
      
      <div className="admission-form-container">
        <form className="admission-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Faculty Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter full name" 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label>Father/Husband Name *</label>
                <input 
                  type="text" 
                  name="fatherHusbandName"
                  value={formData.fatherHusbandName}
                  onChange={handleInputChange}
                  placeholder="Enter father/husband name" 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label>CNIC *</label>
                <input 
                  type="text" 
                  name="cnic"
                  value={formData.cnic}
                  onChange={handleInputChange}
                  placeholder="XXXXX-XXXXXXX-X" 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label>Phone Number *</label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="03XX-XXXXXXX" 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label>Gender *</label>
                <select 
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Role/Position *</label>
                <select 
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Role</option>
                  <option value="Principal">Principal</option>
                  <option value="Vice Principal">Vice Principal</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Coordinator">Coordinator</option>
                  <option value="Computer Operator">Computer Operator</option>
                  <option value="Lab Assistant">Lab Assistant</option>
                  <option value="Librarian">Librarian</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Security Guard">Security Guard</option>
                  <option value="Cleaner">Cleaner</option>
                  <option value="Peon">Peon</option>
                  <option value="Other">Other (Specify)</option>
                </select>
              </div>
              
              {showCustomRole && (
                <div className="form-group">
                  <label>Specify Role *</label>
                  <input 
                    type="text" 
                    name="customRole"
                    value={formData.customRole}
                    onChange={handleInputChange}
                    placeholder="Enter custom role" 
                    required
                  />
                </div>
              )}
              
              <div className="form-group">
                <label>Monthly Salary (PKR) *</label>
                <input 
                  type="number" 
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  placeholder="Enter monthly salary" 
                  min="0"
                  step="0.01"
                  required 
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={goBack} className="btn-cancel">Go Back</button>
            <Link to="/faculty-management/list" className="btn-secondary">Faculty List</Link>
            <button type="submit" className="btn-submit">Update Faculty Member</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const FacultyVoucher = () => {
  const [selectedFaculty, setSelectedFaculty] = useState('')
  const [advancePayment, setAdvancePayment] = useState('')
  const [bonusType, setBonusType] = useState('amount') // 'amount' or 'percentage'
  const [bonusValue, setBonusValue] = useState('')
  const [facultyMembers, setFacultyMembers] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7))

  React.useEffect(() => {
    // Initialize dummy data if none exists
    let faculty = JSON.parse(localStorage.getItem('facultyMembers') || '[]')
    
    if (faculty.length === 0) {
      faculty = [
        {
          id: 1,
          name: "Prof. Muhammad Tariq",
          fatherHusbandName: "Abdul Malik",
          cnic: "12345-6789012-3",
          phone: "0300-1234567",
          gender: "Male",
          role: "Principal",
          salary: 80000
        },
        {
          id: 2,
          name: "Mrs. Fatima Sheikh",
          fatherHusbandName: "Ahmed Sheikh",
          cnic: "12345-6789013-4",
          phone: "0301-2345678",
          gender: "Female",
          role: "Teacher",
          salary: 65000
        },
        {
          id: 3,
          name: "Mr. Hassan Ali",
          fatherHusbandName: "Ali Ahmed",
          cnic: "12345-6789014-5",
          phone: "0302-3456789",
          gender: "Male",
          role: "Coordinator",
          salary: 55000
        },
        {
          id: 4,
          name: "Ms. Aisha Khan",
          fatherHusbandName: "Khan Sahib",
          cnic: "12345-6789015-6",
          phone: "0303-4567890",
          gender: "Female",
          role: "Computer Operator",
          salary: 45000
        },
        {
          id: 5,
          name: "Mr. Bilal Ahmed",
          fatherHusbandName: "Ahmed Hussain",
          cnic: "12345-6789016-7",
          phone: "0304-5678901",
          gender: "Male",
          role: "Lab Assistant",
          salary: 35000
        }
      ]
      localStorage.setItem('facultyMembers', JSON.stringify(faculty))
    }
    
    setFacultyMembers(faculty)
  }, [])

  const selectedFacultyData = facultyMembers.find(f => f.id == selectedFaculty)
  
  const calculateFinalSalary = () => {
    if (!selectedFacultyData) return 0
    
    let finalSalary = selectedFacultyData.salary
    
    // Subtract advance payment
    if (advancePayment) {
      finalSalary -= parseFloat(advancePayment)
    }
    
    // Add bonus
    if (bonusValue) {
      if (bonusType === 'percentage') {
        finalSalary += (selectedFacultyData.salary * parseFloat(bonusValue)) / 100
      } else {
        finalSalary += parseFloat(bonusValue)
      }
    }
    
    return Math.max(0, finalSalary)
  }

  const calculateBonus = () => {
    if (!bonusValue || !selectedFacultyData) return 0
    
    if (bonusType === 'percentage') {
      return (selectedFacultyData.salary * parseFloat(bonusValue)) / 100
    } else {
      return parseFloat(bonusValue)
    }
  }

  const formatCurrency = (amount) => {
    return `PKR ${amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const printVoucher = () => {
    window.print()
  }

  return (
    <div className="page-content">
      <div className="form-header">
        <h2>Faculty Voucher Generation</h2>
        <Link to="/voucher-management" className="back-btn">← Back to Voucher Management</Link>
      </div>
      
      <div className="admission-form-container">
        <div className="admission-form">
          <div className="form-section">
            <h3>Select Faculty Member</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Faculty Member *</label>
                <select 
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value)}
                  required
                >
                  <option value="">Select Faculty Member</option>
                  {facultyMembers.map(faculty => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name} - {faculty.role}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Salary Month *</label>
                <input 
                  type="month" 
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(e.target.value)}
                  required 
                />
              </div>
            </div>
          </div>

          {selectedFacultyData && (
            <>
              <div className="form-section">
                <h3>Salary Adjustments</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Base Salary (PKR)</label>
                    <input 
                      type="text" 
                      value={formatCurrency(selectedFacultyData.salary)}
                      readOnly 
                      className="readonly-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Advance Payment (PKR)</label>
                    <input 
                      type="number" 
                      placeholder="Enter advance payment"
                      value={advancePayment}
                      onChange={(e) => setAdvancePayment(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Bonus Type</label>
                    <select 
                      value={bonusType}
                      onChange={(e) => setBonusType(e.target.value)}
                    >
                      <option value="amount">Flat Amount</option>
                      <option value="percentage">Percentage</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Bonus {bonusType === 'percentage' ? '(%)' : '(PKR)'}</label>
                    <input 
                      type="number" 
                      placeholder={bonusType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                      value={bonusValue}
                      onChange={(e) => setBonusValue(e.target.value)}
                      min="0"
                      step={bonusType === 'percentage' ? '0.01' : '0.01'}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section dual-voucher-container">
                <div className="voucher-slip teacher-slip">
                  <div className="slip-header">
                    <h3>MUSLIM PUBLIC HIGHER SECONDARY SCHOOL</h3>
                    <h4>TEACHER SALARY SLIP</h4>
                    <div className="slip-date">Date: {new Date().toLocaleDateString('en-GB')}</div>
                  </div>
                  
                  <div className="slip-details">
                    <div className="detail-row">
                      <span className="label">Employee Name:</span>
                      <span className="value">{selectedFacultyData.name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">CNIC:</span>
                      <span className="value">{selectedFacultyData.cnic}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Designation:</span>
                      <span className="value">{selectedFacultyData.role}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Salary Month:</span>
                      <span className="value">{new Date(currentMonth).toLocaleString('en-PK', { month: 'long', year: 'numeric' })}</span>
                    </div>
                    
                    <div className="salary-calculation">
                      <div className="calc-row">
                        <span>Basic Salary:</span>
                        <span>{formatCurrency(selectedFacultyData.salary)}</span>
                      </div>
                      {advancePayment && (
                        <div className="calc-row deduction">
                          <span>Advance Deduction:</span>
                          <span>({formatCurrency(parseFloat(advancePayment))})</span>
                        </div>
                      )}
                      {bonusValue && (
                        <div className="calc-row addition">
                          <span>Bonus ({bonusType === 'percentage' ? `${bonusValue}%` : 'Flat'}):</span>
                          <span>{formatCurrency(calculateBonus())}</span>
                        </div>
                      )}
                      <div className="calc-row total-row">
                        <span><strong>Net Salary:</strong></span>
                        <span><strong>{formatCurrency(calculateFinalSalary())}</strong></span>
                      </div>
                    </div>
                    
                    <div className="signature-area">
                      <div className="sign-box">
                        <div className="sign-line"></div>
                        <p>Employee Signature</p>
                      </div>
                    </div>
                    
                    <div className="slip-footer">
                      <small>This is a computer generated slip</small>
                    </div>
                  </div>
                </div>
                
                <div className="voucher-divider"></div>
                
                <div className="voucher-slip accounts-slip">
                  <div className="slip-header">
                    <h3>MUSLIM PUBLIC HIGHER SECONDARY SCHOOL</h3>
                    <h4>ACCOUNTS RECORD SLIP</h4>
                    <div className="slip-date">Date: {new Date().toLocaleDateString('en-GB')}</div>
                  </div>
                  
                  <div className="slip-details">
                    <div className="detail-row">
                      <span className="label">Employee Name:</span>
                      <span className="value">{selectedFacultyData.name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Father/Husband:</span>
                      <span className="value">{selectedFacultyData.fatherHusbandName}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">CNIC:</span>
                      <span className="value">{selectedFacultyData.cnic}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Phone:</span>
                      <span className="value">{selectedFacultyData.phone}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Designation:</span>
                      <span className="value">{selectedFacultyData.role}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Salary Month:</span>
                      <span className="value">{new Date(currentMonth).toLocaleString('en-PK', { month: 'long', year: 'numeric' })}</span>
                    </div>
                    
                    <div className="salary-calculation">
                      <div className="calc-row">
                        <span>Basic Salary:</span>
                        <span>{formatCurrency(selectedFacultyData.salary)}</span>
                      </div>
                      {advancePayment && (
                        <div className="calc-row deduction">
                          <span>Advance Deduction:</span>
                          <span>({formatCurrency(parseFloat(advancePayment))})</span>
                        </div>
                      )}
                      {bonusValue && (
                        <div className="calc-row addition">
                          <span>Bonus ({bonusType === 'percentage' ? `${bonusValue}%` : 'Flat'}):</span>
                          <span>{formatCurrency(calculateBonus())}</span>
                        </div>
                      )}
                      <div className="calc-row total-row">
                        <span><strong>Net Payable:</strong></span>
                        <span><strong>{formatCurrency(calculateFinalSalary())}</strong></span>
                      </div>
                    </div>
                    
                    <div className="signature-area accounts-signatures">
                      <div className="sign-box">
                        <div className="sign-line"></div>
                        <p>Accounts Officer</p>
                      </div>
                      <div className="sign-box">
                        <div className="sign-line"></div>
                        <p>Principal</p>
                      </div>
                    </div>
                    
                    <div className="slip-footer">
                      <small>Office Copy - File Record</small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <Link to="/voucher-management" className="btn-cancel">Back</Link>
                <button type="button" className="btn-submit" onClick={printVoucher}>Print Salary Slips</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Fee Management Component
const FeeManagement = () => {
  const [showTotalFeeAmount, setShowTotalFeeAmount] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)
  const [classFilter, setClassFilter] = useState('all')
  const [showDailyCollection, setShowDailyCollection] = useState(false)
  const [showCollectionReport, setShowCollectionReport] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [showClassSelectionModal, setShowClassSelectionModal] = useState(false)
  const [reportType, setReportType] = useState('all')
  const [selectedClasses, setSelectedClasses] = useState({})
  
  // Dummy student data for fee management with more detailed information
  const [classesData, setClassesData] = useState([
    {
      id: 1,
      className: 'Play Group',
      section: 'A',
      totalStudents: 15,
      totalFeeAmount: 75000,
      pendingAmount: 25000,
      collectedAmount: 50000,
      students: [
        {
          id: 1,
          name: 'Ahmed Ali',
          rollNo: 'PG-A-001',
          fatherName: 'Muhammad Ali',
          feeAmount: 5000,
          pendingAmount: 0,
          paidAmount: 5000,
          paidToday: true,
          paymentDate: '2026-01-26'
        },
        {
          id: 2,
          name: 'Fatima Khan',
          rollNo: 'PG-A-002',
          fatherName: 'Tariq Khan',
          feeAmount: 5000,
          pendingAmount: 5000,
          paidAmount: 0,
          paidToday: false,
          paymentDate: null
        },
        {
          id: 3,
          name: 'Usman Ahmed',
          rollNo: 'PG-A-003',
          fatherName: 'Ahmed Hussain',
          feeAmount: 5000,
          pendingAmount: 0,
          paidAmount: 5000,
          paidToday: false,
          paymentDate: '2026-01-20'
        },
        {
          id: 16,
          name: 'Zara Sheikh',
          rollNo: 'PG-A-004',
          fatherName: 'Sheikh Ahmad',
          feeAmount: 5000,
          pendingAmount: 0,
          paidAmount: 5000,
          paidToday: false,
          paymentDate: '2026-01-15'
        },
        {
          id: 17,
          name: 'Ali Raza',
          rollNo: 'PG-A-005',
          fatherName: 'Raza Khan',
          feeAmount: 5000,
          pendingAmount: 0,
          paidAmount: 5000,
          paidToday: false,
          paymentDate: '2026-01-10'
        }
      ]
    },
    {
      id: 2,
      className: 'Play Group',
      section: 'B',
      totalStudents: 10,
      totalFeeAmount: 50000,
      pendingAmount: 20000,
      collectedAmount: 30000,
      students: [
        {
          id: 4,
          name: 'Sara Ahmad',
          rollNo: 'PG-B-001',
          fatherName: 'Ahmad Hassan',
          feeAmount: 5000,
          pendingAmount: 5000,
          paidAmount: 0,
          paidToday: false,
          paymentDate: null
        },
        {
          id: 5,
          name: 'Hassan Ali',
          rollNo: 'PG-B-002',
          fatherName: 'Ali Raza',
          feeAmount: 5000,
          pendingAmount: 0,
          paidAmount: 5000,
          paidToday: false,
          paymentDate: '2026-01-12'
        },
        {
          id: 18,
          name: 'Amna Tariq',
          rollNo: 'PG-B-003',
          fatherName: 'Tariq Ali',
          feeAmount: 5000,
          pendingAmount: 0,
          paidAmount: 5000,
          paidToday: false,
          paymentDate: '2026-01-08'
        }
      ]
    },
    {
      id: 3,
      className: 'Nursery',
      section: 'A',
      totalStudents: 20,
      totalFeeAmount: 120000,
      pendingAmount: 36000,
      collectedAmount: 84000,
      students: [
        {
          id: 6,
          name: 'Zainab Sheikh',
          rollNo: 'NUR-A-001',
          fatherName: 'Sheikh Abdullah',
          feeAmount: 6000,
          pendingAmount: 0,
          paidAmount: 6000,
          paidToday: true,
          paymentDate: '2026-01-26'
        },
        {
          id: 7,
          name: 'Omar Malik',
          rollNo: 'NUR-A-002',
          fatherName: 'Malik Hussain',
          feeAmount: 6000,
          pendingAmount: 6000,
          paidAmount: 0,
          paidToday: false,
          paymentDate: null
        }
      ]
    },
    {
      id: 4,
      className: 'Class 1',
      section: 'A',
      totalStudents: 25,
      totalFeeAmount: 175000,
      pendingAmount: 49000,
      collectedAmount: 126000,
      students: [
        {
          id: 8,
          name: 'Aisha Tariq',
          rollNo: '1A-001',
          fatherName: 'Tariq Mahmood',
          feeAmount: 7000,
          pendingAmount: 0,
          paidAmount: 7000,
          paidToday: true,
          paymentDate: '2026-01-26'
        },
        {
          id: 9,
          name: 'Ali Hassan',
          rollNo: '1A-002',
          fatherName: 'Hassan Ahmed',
          feeAmount: 7000,
          pendingAmount: 7000,
          paidAmount: 0,
          paidToday: false,
          paymentDate: null
        }
      ]
    },
    {
      id: 5,
      className: 'Class 1',
      section: 'B',
      totalStudents: 20,
      totalFeeAmount: 140000,
      pendingAmount: 28000,
      collectedAmount: 112000,
      students: [
        {
          id: 10,
          name: 'Ibrahim Yusuf',
          rollNo: '1B-001',
          fatherName: 'Yusuf Ahmed',
          feeAmount: 7000,
          pendingAmount: 0,
          paidAmount: 7000,
          paidToday: true,
          paymentDate: '2026-01-26'
        },
        {
          id: 11,
          name: 'Maryam Khan',
          rollNo: '1B-002',
          fatherName: 'Khan Sahib',
          feeAmount: 7000,
          pendingAmount: 7000,
          paidAmount: 0,
          paidToday: false,
          paymentDate: null
        }
      ]
    },
    {
      id: 6,
      className: '1st Year',
      section: 'A',
      totalStudents: 30,
      totalFeeAmount: 360000,
      pendingAmount: 120000,
      collectedAmount: 240000,
      students: [
        {
          id: 12,
          name: 'Abdullah Ahmad',
          rollNo: '1Y-A-001',
          fatherName: 'Ahmad Ali',
          feeAmount: 12000,
          pendingAmount: 0,
          paidAmount: 12000,
          paidToday: true,
          paymentDate: '2026-01-26'
        },
        {
          id: 13,
          name: 'Ayesha Malik',
          rollNo: '1Y-A-002',
          fatherName: 'Malik Hassan',
          feeAmount: 12000,
          pendingAmount: 12000,
          paidAmount: 0,
          paidToday: false,
          paymentDate: null
        }
      ]
    },
    {
      id: 7,
      className: '2nd Year',
      section: 'A',
      totalStudents: 25,
      totalFeeAmount: 325000,
      pendingAmount: 91000,
      collectedAmount: 234000,
      students: [
        {
          id: 14,
          name: 'Muhammad Bilal',
          rollNo: '2Y-A-001',
          fatherName: 'Bilal Sheikh',
          feeAmount: 13000,
          pendingAmount: 0,
          paidAmount: 13000,
          paidToday: true,
          paymentDate: '2026-01-26'
        },
        {
          id: 15,
          name: 'Khadija Ahmed',
          rollNo: '2Y-A-002',
          fatherName: 'Ahmed Yusuf',
          feeAmount: 13000,
          pendingAmount: 13000,
          paidAmount: 0,
          paidToday: false,
          paymentDate: null
        }
      ]
    }
  ])

  const formatCurrency = (amount) => {
    return `PKR ${amount.toLocaleString('en-PK')}`
  }

  // Extended dummy student data for custom reports (50 students)
  const customStudentData = [
    // 9th Class Students
    { id: 1, name: 'Ahmad Ali Khan', class: '9th', section: 'A', feeAmount: 5000, feeStatus: 'Paid', paymentDate: '2026-01-26' },
    { id: 2, name: 'Fatima Sheikh', class: '9th', section: 'A', feeAmount: 5000, feeStatus: 'Pending', paymentDate: null },
    { id: 3, name: 'Muhammad Hassan', class: '9th', section: 'A', feeAmount: 5000, feeStatus: 'Paid', paymentDate: '2026-01-25' },
    { id: 4, name: 'Aisha Rahman', class: '9th', section: 'A', feeAmount: 5000, feeStatus: 'Paid', paymentDate: '2026-01-24' },
    { id: 5, name: 'Omar Malik', class: '9th', section: 'A', feeAmount: 5000, feeStatus: 'Pending', paymentDate: null },
    { id: 6, name: 'Zainab Ahmed', class: '9th', section: 'B', feeAmount: 5000, feeStatus: 'Paid', paymentDate: '2026-01-26' },
    { id: 7, name: 'Abdullah Siddiq', class: '9th', section: 'B', feeAmount: 5000, feeStatus: 'Paid', paymentDate: '2026-01-23' },
    { id: 8, name: 'Maryam Qureshi', class: '9th', section: 'B', feeAmount: 5000, feeStatus: 'Pending', paymentDate: null },
    { id: 9, name: 'Ibrahim Javed', class: '9th', section: 'B', feeAmount: 5000, feeStatus: 'Paid', paymentDate: '2026-01-22' },
    { id: 10, name: 'Hafsa Noor', class: '9th', section: 'B', feeAmount: 5000, feeStatus: 'Pending', paymentDate: null },
    { id: 11, name: 'Usman Tariq', class: '9th', section: 'C', feeAmount: 5000, feeStatus: 'Paid', paymentDate: '2026-01-26' },
    { id: 12, name: 'Khadija Iqbal', class: '9th', section: 'C', feeAmount: 5000, feeStatus: 'Paid', paymentDate: '2026-01-21' },
    { id: 13, name: 'Ali Raza', class: '9th', section: 'C', feeAmount: 5000, feeStatus: 'Pending', paymentDate: null },
    
    // 10th Class Students
    { id: 14, name: 'Sara Hussain', class: '10th', section: 'A', feeAmount: 5500, feeStatus: 'Paid', paymentDate: '2026-01-26' },
    { id: 15, name: 'Bilal Ahmad', class: '10th', section: 'A', feeAmount: 5500, feeStatus: 'Paid', paymentDate: '2026-01-25' },
    { id: 16, name: 'Amina Shah', class: '10th', section: 'A', feeAmount: 5500, feeStatus: 'Pending', paymentDate: null },
    { id: 17, name: 'Hamza Umar', class: '10th', section: 'A', feeAmount: 5500, feeStatus: 'Paid', paymentDate: '2026-01-24' },
    { id: 18, name: 'Ruqayyah Khan', class: '10th', section: 'A', feeAmount: 5500, feeStatus: 'Pending', paymentDate: null },
    { id: 19, name: 'Yasir Ali', class: '10th', section: 'B', feeAmount: 5500, feeStatus: 'Paid', paymentDate: '2026-01-26' },
    { id: 20, name: 'Sumayya Malik', class: '10th', section: 'B', feeAmount: 5500, feeStatus: 'Paid', paymentDate: '2026-01-23' },
    { id: 21, name: 'Shoaib Hassan', class: '10th', section: 'B', feeAmount: 5500, feeStatus: 'Pending', paymentDate: null },
    { id: 22, name: 'Layla Ahmed', class: '10th', section: 'B', feeAmount: 5500, feeStatus: 'Paid', paymentDate: '2026-01-22' },
    { id: 23, name: 'Tariq Rahman', class: '10th', section: 'B', feeAmount: 5500, feeStatus: 'Pending', paymentDate: null },
    { id: 24, name: 'Nadia Javed', class: '10th', section: 'C', feeAmount: 5500, feeStatus: 'Paid', paymentDate: '2026-01-26' },
    { id: 25, name: 'Faisal Noor', class: '10th', section: 'C', feeAmount: 5500, feeStatus: 'Paid', paymentDate: '2026-01-21' },
    { id: 26, name: 'Rabia Sheikh', class: '10th', section: 'C', feeAmount: 5500, feeStatus: 'Pending', paymentDate: null },
    
    // 11th Class Students
    { id: 27, name: 'Muneeb Siddiq', class: '11th', section: 'A', feeAmount: 6000, feeStatus: 'Paid', paymentDate: '2026-01-26' },
    { id: 28, name: 'Saira Iqbal', class: '11th', section: 'A', feeAmount: 6000, feeStatus: 'Paid', paymentDate: '2026-01-25' },
    { id: 29, name: 'Adnan Tariq', class: '11th', section: 'A', feeAmount: 6000, feeStatus: 'Pending', paymentDate: null },
    { id: 30, name: 'Mariam Hussain', class: '11th', section: 'A', feeAmount: 6000, feeStatus: 'Paid', paymentDate: '2026-01-24' },
    { id: 31, name: 'Junaid Ahmad', class: '11th', section: 'A', feeAmount: 6000, feeStatus: 'Pending', paymentDate: null },
    { id: 32, name: 'Ayesha Umar', class: '11th', section: 'B', feeAmount: 6000, feeStatus: 'Paid', paymentDate: '2026-01-26' },
    { id: 33, name: 'Kamran Ali', class: '11th', section: 'B', feeAmount: 6000, feeStatus: 'Paid', paymentDate: '2026-01-23' },
    { id: 34, name: 'Asma Shah', class: '11th', section: 'B', feeAmount: 6000, feeStatus: 'Pending', paymentDate: null },
    { id: 35, name: 'Talha Khan', class: '11th', section: 'B', feeAmount: 6000, feeStatus: 'Paid', paymentDate: '2026-01-22' },
    { id: 36, name: 'Hira Malik', class: '11th', section: 'B', feeAmount: 6000, feeStatus: 'Pending', paymentDate: null },
    { id: 37, name: 'Owais Rahman', class: '11th', section: 'C', feeAmount: 6000, feeStatus: 'Paid', paymentDate: '2026-01-26' },
    { id: 38, name: 'Samina Ahmed', class: '11th', section: 'C', feeAmount: 6000, feeStatus: 'Paid', paymentDate: '2026-01-21' },
    { id: 39, name: 'Waqas Hassan', class: '11th', section: 'C', feeAmount: 6000, feeStatus: 'Pending', paymentDate: null },
    
    // 12th Class Students  
    { id: 40, name: 'Iman Javed', class: '12th', section: 'A', feeAmount: 6500, feeStatus: 'Paid', paymentDate: '2026-01-26' },
    { id: 41, name: 'Raheel Noor', class: '12th', section: 'A', feeAmount: 6500, feeStatus: 'Paid', paymentDate: '2026-01-25' },
    { id: 42, name: 'Farah Sheikh', class: '12th', section: 'A', feeAmount: 6500, feeStatus: 'Pending', paymentDate: null },
    { id: 43, name: 'Saad Siddiq', class: '12th', section: 'A', feeAmount: 6500, feeStatus: 'Paid', paymentDate: '2026-01-24' },
    { id: 44, name: 'Lubna Iqbal', class: '12th', section: 'A', feeAmount: 6500, feeStatus: 'Pending', paymentDate: null },
    { id: 45, name: 'Danish Tariq', class: '12th', section: 'B', feeAmount: 6500, feeStatus: 'Paid', paymentDate: '2026-01-26' },
    { id: 46, name: 'Shazia Hussain', class: '12th', section: 'B', feeAmount: 6500, feeStatus: 'Paid', paymentDate: '2026-01-23' },
    { id: 47, name: 'Kashif Ahmad', class: '12th', section: 'B', feeAmount: 6500, feeStatus: 'Pending', paymentDate: null },
    { id: 48, name: 'Sabeen Umar', class: '12th', section: 'B', feeAmount: 6500, feeStatus: 'Paid', paymentDate: '2026-01-22' },
    { id: 49, name: 'Mohsin Ali', class: '12th', section: 'B', feeAmount: 6500, feeStatus: 'Pending', paymentDate: null },
    { id: 50, name: 'Nimra Shah', class: '12th', section: 'C', feeAmount: 6500, feeStatus: 'Paid', paymentDate: '2026-01-21' }
  ]

  // Handle class/section selection for Fee Management custom reports
  const handleFeeClassSelectionChange = (className, section, isSelected) => {
    setSelectedClasses(prev => {
      if (isSelected) {
        return [...prev, { class: className, section }]
      } else {
        return prev.filter(item => !(item.class === className && item.section === section))
      }
    })
  }

  // Generate custom report for Fee Management
  const generateFeeCustomReport = () => {
    let filteredData = customStudentData

    // Filter by selected classes and sections
    if (selectedClasses.length > 0) {
      filteredData = filteredData.filter(student => 
        selectedClasses.some(selection => 
          selection.class === student.class && selection.section === student.section
        )
      )
    }

    // Filter by report type (paid/defaulters)
    if (reportType === 'paid') {
      filteredData = filteredData.filter(student => {
        if (student.feeStatus === 'Paid') {
          const paymentDate = new Date(student.paymentDate)
          const start = new Date(startDate)
          const end = new Date(endDate)
          return paymentDate >= start && paymentDate <= end
        }
        return false
      })
    } else if (reportType === 'defaulters') {
      filteredData = filteredData.filter(student => student.feeStatus === 'Pending')
    }

    // Sort by class and section sequence
    filteredData.sort((a, b) => {
      const classOrder = { '9th': 1, '10th': 2, '11th': 3, '12th': 4 }
      const classComparison = classOrder[a.class] - classOrder[b.class]
      if (classComparison !== 0) return classComparison
      return a.section.localeCompare(b.section)
    })

    setShowCollectionReport('fee-custom')
    setShowClassSelectionModal(false)
  }

  const getTotalFeeAmount = () => {
    return classesData.reduce((total, classData) => total + classData.totalFeeAmount, 0)
  }

  const getTotalPendingAmount = () => {
    return classesData.reduce((total, classData) => total + classData.pendingAmount, 0)
  }

  const getTotalCollectedAmount = () => {
    return classesData.reduce((total, classData) => total + classData.collectedAmount, 0)
  }

  // Get students who paid within date range organized by class and section
  const getPaidStudentsInRange = (startDate, endDate) => {
    const paidStudents = []
    const classOrder = ['Play Group', 'Nursery', 'Prep', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', '1st Year', '2nd Year']
    
    classOrder.forEach(className => {
      const classSections = classesData.filter(c => c.className === className).sort((a, b) => a.section.localeCompare(b.section))
      
      classSections.forEach(classData => {
        const paidInRange = classData.students.filter(student => {
          if (!student.paymentDate) return false
          const paymentDate = new Date(student.paymentDate)
          const start = new Date(startDate)
          const end = new Date(endDate)
          return paymentDate >= start && paymentDate <= end
        })
        
        if (paidInRange.length > 0) {
          paidStudents.push({
            ...classData,
            students: paidInRange
          })
        }
      })
    })
    
    return paidStudents
  }

  // Get students who paid today organized by class and section
  const getTodayPaidStudents = () => {
    return getPaidStudentsInRange(new Date().toISOString().slice(0, 10), new Date().toISOString().slice(0, 10))
  }

  const generateReportByType = (type) => {
    setCurrentReportType(type)
    
    if (type === 'collection') {
      if (!startDate || !endDate) {
        const today = new Date().toISOString().split('T')[0]
        setStartDate(today)
        setEndDate(today)
      }
      setShowDailyCollection(true)
    } else if (type === 'defaulters') {
      const defaulterClasses = classesData.filter(classData => 
        classData.students.some(student => student.pendingAmount > 0)
      ).map(classData => ({
        ...classData,
        students: classData.students.filter(student => student.pendingAmount > 0)
      }))
      setShowTotalFeeAmount(true)
    } else if (type === 'custom') {
      setShowClassSelection(true)
    }
  }

  // Get filtered classes based on selection
  const getFilteredClassData = () => {
    if (reportType === 'custom' && selectedClasses.length > 0) {
      return classesData.filter(classData => 
        selectedClasses.some(selected => 
          selected.className === classData.className && 
          (selected.sections.includes('all') || selected.sections.includes(classData.section))
        )
      )
    } else if (reportType === 'classwise') {
      // Group by class, combine all sections
      const grouped = {}
      classesData.forEach(classData => {
        if (!grouped[classData.className]) {
          grouped[classData.className] = {
            ...classData,
            section: 'All Sections',
            students: [],
            totalStudents: 0,
            totalFeeAmount: 0,
            pendingAmount: 0,
            collectedAmount: 0
          }
        }
        grouped[classData.className].students.push(...classData.students)
        grouped[classData.className].totalStudents += classData.totalStudents
        grouped[classData.className].totalFeeAmount += classData.totalFeeAmount
        grouped[classData.className].pendingAmount += classData.pendingAmount
        grouped[classData.className].collectedAmount += classData.collectedAmount
      })
      return Object.values(grouped)
    }
    
    return classesData // sectionwise - default
  }

  // Get fee defaulters organized by class and section
  const getFeeDefaulters = () => {
    const defaulters = []
    const classOrder = ['Play Group', 'Nursery', 'Prep', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', '1st Year', '2nd Year']
    
    classOrder.forEach(className => {
      const classSections = classesData.filter(c => c.className === className).sort((a, b) => a.section.localeCompare(b.section))
      
      classSections.forEach(classData => {
        const defaulterStudents = classData.students.filter(student => student.pendingAmount > 0)
        if (defaulterStudents.length > 0) {
          defaulters.push({
            ...classData,
            students: defaulterStudents
          })
        }
      })
    })
    
    return defaulters
  }

  // Calculate total amount for collections in date range
  const getTotalCollectionInRange = (startDate, endDate) => {
    const paidInRange = getPaidStudentsInRange(startDate, endDate)
    return paidInRange.reduce((total, classData) => 
      total + classData.students.reduce((sum, student) => sum + student.paidAmount, 0), 0
    )
  }

  // Calculate total amount for today's collections
  const getTodayTotalCollection = () => {
    return getTotalCollectionInRange(new Date().toISOString().slice(0, 10), new Date().toISOString().slice(0, 10))
  }

  // Calculate total defaulter amount
  const getTotalDefaulterAmount = () => {
    const defaulters = getFeeDefaulters()
    return defaulters.reduce((total, classData) => 
      total + classData.students.reduce((sum, student) => sum + student.pendingAmount, 0), 0
    )
  }

  // Print function for reports
  const printReport = () => {
    window.print()
  }

  // Get unique classes
  const getUniqueClasses = () => {
    const uniqueClasses = {}
    classesData.forEach(classData => {
      if (!uniqueClasses[classData.className]) {
        uniqueClasses[classData.className] = []
      }
      uniqueClasses[classData.className].push(classData.section)
    })
    return uniqueClasses
  }

  // Handle class selection for custom reports
  const handleClassSelection = (className, section) => {
    setSelectedClasses(prev => {
      const existing = prev.find(item => item.className === className)
      if (existing) {
        if (section === 'all') {
          // Select all sections
          return prev.map(item => 
            item.className === className 
              ? { ...item, sections: ['all'] }
              : item
          )
        } else {
          // Toggle specific section
          const newSections = existing.sections.includes(section)
            ? existing.sections.filter(s => s !== section)
            : [...existing.sections.filter(s => s !== 'all'), section]
          
          if (newSections.length === 0) {
            return prev.filter(item => item.className !== className)
          }
          
          return prev.map(item => 
            item.className === className 
              ? { ...item, sections: newSections }
              : item
          )
        }
      } else {
        // Add new class
        return [...prev, {
          className,
          sections: section === 'all' ? ['all'] : [section]
        }]
      }
    })
  }

  // Check if class/section is selected
  const isClassSectionSelected = (className, section) => {
    const selected = selectedClasses.find(item => item.className === className)
    if (!selected) return false
    return selected.sections.includes('all') || selected.sections.includes(section)
  }

  const getFilteredClasses = () => {
    if (classFilter === 'all') {
      return classesData
    }
    return classesData.filter(classData => 
      classData.className.toLowerCase().includes(classFilter.toLowerCase())
    )
  }

  const handleClassClick = (classData) => {
    setSelectedClass(classData)
  }

  const printClassReport = () => {
    window.print()
  }

  const generatePDF = () => {
    // This would integrate with a PDF library in a real implementation
    alert('PDF generation will be implemented with a PDF library like jsPDF')
  }

  return (
    <div className="page-content">
      <h2>Fee Management</h2>
      
      <div className="welcome-message">
        <p>Manage student fees, track payments, and generate daily circulation lists for classes. Collect, save and print fee records efficiently.</p>
      </div>

      <div className="admission-actions">
        <button 
          className="action-btn primary"
          onClick={() => setShowTotalFeeAmount(!showTotalFeeAmount)}
        >
          <span className="btn-icon">💰</span>
          <span>Total Fee Amount</span>
        </button>

        <button 
          className="action-btn secondary"
          onClick={() => setShowDailyCollection(true)}
        >
          <span className="btn-icon">📋</span>
          <span>Daily Collection</span>
        </button>
      </div>

      {showTotalFeeAmount && (
        <>
          <div className="fee-summary-section">
            <h3>Total Fee Summary</h3>
            
            <div className="fee-summary-cards">
              <div className="fee-summary-card total">
                <div className="summary-icon">💰</div>
                <div className="summary-content">
                  <div className="summary-value">{formatCurrency(getTotalFeeAmount())}</div>
                  <div className="summary-label">Total Fee Amount</div>
                </div>
              </div>
              
              <div className="fee-summary-card collected">
                <div className="summary-icon">✅</div>
                <div className="summary-content">
                  <div className="summary-value">{formatCurrency(getTotalCollectedAmount())}</div>
                  <div className="summary-label">Collected Amount</div>
                </div>
              </div>
              
              <div className="fee-summary-card pending">
                <div className="summary-icon">⏳</div>
                <div className="summary-content">
                  <div className="summary-value">{formatCurrency(getTotalPendingAmount())}</div>
                  <div className="summary-label">Pending Amount</div>
                </div>
              </div>
            </div>

            <div className="fee-filter-section">
              <label>Filter Classes:</label>
              <input 
                type="text"
                placeholder="Search by class name..."
                value={classFilter === 'all' ? '' : classFilter}
                onChange={(e) => setClassFilter(e.target.value || 'all')}
                className="class-filter-input"
              />
            </div>
          </div>

          <div className="classes-fee-section">
            <h4>Class-wise Fee Breakdown</h4>
            
            <div className="classes-grid">
              {getFilteredClasses().map((classData) => (
                <div key={classData.id} className="class-fee-card">
                  <div className="class-fee-header">
                    <h5>{classData.className}</h5>
                    <span className="students-count">{classData.totalStudents} students</span>
                  </div>
                  
                  <div className="class-fee-details">
                    <div className="fee-detail-row">
                      <span>Total Fee:</span>
                      <span>{formatCurrency(classData.totalFeeAmount)}</span>
                    </div>
                    <div className="fee-detail-row collected">
                      <span>Collected:</span>
                      <span>{formatCurrency(classData.collectedAmount)}</span>
                    </div>
                    <div className="fee-detail-row pending">
                      <span>Pending:</span>
                      <span>{formatCurrency(classData.pendingAmount)}</span>
                    </div>
                  </div>
                  
                  <button 
                    className="class-view-btn"
                    onClick={() => handleClassClick(classData)}
                  >
                    View Class Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {selectedClass && (
        <div className="class-detail-modal">
          <div className="class-detail-content">
            <div className="class-detail-header">
              <h3>{selectedClass.className} - Fee Details</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setSelectedClass(null)}
              >
                ×
              </button>
            </div>

            <div className="class-detail-summary">
              <div className="detail-summary-card">
                <span>Total Students: {selectedClass.totalStudents}</span>
                <span>Total Fee: {formatCurrency(selectedClass.totalFeeAmount)}</span>
                <span>Pending: {formatCurrency(selectedClass.pendingAmount)}</span>
              </div>
            </div>

            {/* A4 Print Layout */}
            <div className="a4-print-layout">
              <div className="print-header">
                <h2>Muslim Public School & College</h2>
                <h3>Fee Collection Report - {selectedClass.className}</h3>
                <p>Generated on: {new Date().toLocaleDateString('en-PK')}</p>
              </div>

              <div className="students-fee-table">
                <table>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Name</th>
                      <th>Roll No</th>
                      <th>Father Name</th>
                      <th>Fee Amount</th>
                      <th>Paid Amount</th>
                      <th>Pending Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedClass.students.map((student, index) => (
                      <tr key={student.id}>
                        <td>{index + 1}</td>
                        <td>{student.name}</td>
                        <td>{student.rollNo}</td>
                        <td>{student.fatherName}</td>
                        <td>{formatCurrency(student.feeAmount)}</td>
                        <td className="paid-amount">{formatCurrency(student.paidAmount)}</td>
                        <td className="pending-amount">{formatCurrency(student.pendingAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="class-total-summary">
                <div className="total-row">
                  <strong>Total Pending Amount for {selectedClass.className}: {formatCurrency(selectedClass.pendingAmount)}</strong>
                </div>
                <div className="total-row">
                  <strong>Total Collected Amount: {formatCurrency(selectedClass.collectedAmount)}</strong>
                </div>
                <div className="total-row highlight">
                  <strong>Grand Total Fee Amount: {formatCurrency(selectedClass.totalFeeAmount)}</strong>
                </div>
              </div>

              <div className="print-footer">
                <div className="signature-section">
                  <div className="signature-box">
                    <div className="signature-line"></div>
                    <p>Class Teacher Signature</p>
                  </div>
                  <div className="signature-box">
                    <div className="signature-line"></div>
                    <p>Accountant Signature</p>
                  </div>
                  <div className="signature-box">
                    <div className="signature-line"></div>
                    <p>Principal Signature</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="class-detail-actions">
              <button className="btn-cancel" onClick={() => setSelectedClass(null)}>
                Close
              </button>
              <button className="btn-secondary" onClick={generatePDF}>
                Save as PDF
              </button>
              <button className="btn-submit" onClick={printClassReport}>
                Print Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Removed Reports Modal - now in separate Reports page */}
      {false && (
        <div className="class-detail-modal">
          <div className="daily-collection-modal">
            <div className="class-detail-header">
              <h3>Collection Reports</h3>
              <button 
                className="close-btn"
                onClick={() => setShowReportsModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="date-range-section">
              <h4>Select Date Range</h4>
              <div className="date-inputs">
                <div className="date-group">
                  <label>From Date:</label>
                  <input 
                    type="date" 
                    className="date-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="date-group">
                  <label>To Date:</label>
                  <input 
                    type="date" 
                    className="date-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="daily-collection-options">
              <button 
                className="collection-option-btn"
                onClick={() => generateReportByType('collection')}
              >
                <div className="option-icon" style={{background: '#10b981'}}>✓</div>
                <h4>Fee Collection Report</h4>
                <p>Students who paid in selected period</p>
              </button>
              
              <button 
                className="collection-option-btn"
                onClick={() => generateReportByType('defaulters')}
              >
                <div className="option-icon" style={{background: '#f59e0b'}}>✕</div>
                <h4>Fee Defaulters</h4>
                <p>Students with pending fees</p>
              </button>
              
              <button 
                className="collection-option-btn custom"
                onClick={() => generateReportByType('custom')}
              >
                <div className="option-icon" style={{background: '#8b5cf6'}}>📊</div>
                <h4>Custom Class Reports</h4>
                <p>Generate by class or section</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Collection Modal */}
      {showDailyCollection && (
        <div className="class-detail-modal">
          <div className="daily-collection-modal">
            <div className="class-detail-header">
              <h3>Collection Reports</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setShowDailyCollection(false)}
              >
                ×
              </button>
            </div>

            {/* Date Range Selection */}
            <div className="date-range-section">
              <h4>Select Date Range</h4>
              <div className="date-inputs">
                <div className="date-group">
                  <label>From Date:</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="date-input"
                  />
                </div>
                <div className="date-group">
                  <label>To Date:</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="date-input"
                  />
                </div>
              </div>
            </div>

            <div className="daily-collection-options">
              <button 
                className="collection-option-btn paid"
                onClick={() => setShowCollectionReport('paid')}
              >
                <span className="option-icon">✅</span>
                <span className="option-title">Fee Collection Report</span>
                <span className="option-subtitle">Students who paid in selected period</span>
              </button>

              <button 
                className="collection-option-btn defaulter"
                onClick={() => setShowCollectionReport('defaulter')}
              >
                <span className="option-icon">❌</span>
                <span className="option-title">Fee Defaulters</span>
                <span className="option-subtitle">Students with pending fees</span>
              </button>

              <button 
                className="collection-option-btn custom"
                onClick={() => setShowClassSelection(true)}
              >
                <span className="option-icon">📊</span>
                <span className="option-title">Custom Class Reports</span>
                <span className="option-subtitle">Generate by class or section</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class Selection Modal */}
      {showClassSelectionModal && (
        <div className="class-detail-modal">
          <div className="class-selection-modal">
            <div className="class-detail-header">
              <h3>Select Classes & Sections for Report</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setShowClassSelectionModal(false)}
              >
                ×
              </button>
            </div>

            <div className="class-selection-content">
              {/* Report Type Selection */}
              <div className="report-type-section">
                <h4>Report Type</h4>
                <div className="report-type-options">
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      value="sectionwise" 
                      checked={reportType === 'sectionwise'}
                      onChange={(e) => setReportType(e.target.value)}
                    />
                    <span>Section-wise Report</span>
                  </label>
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      value="classwise" 
                      checked={reportType === 'classwise'}
                      onChange={(e) => setReportType(e.target.value)}
                    />
                    <span>Class-wise Report (Combined Sections)</span>
                  </label>
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      value="custom" 
                      checked={reportType === 'custom'}
                      onChange={(e) => setReportType(e.target.value)}
                    />
                    <span>Custom Selection</span>
                  </label>
                </div>
              </div>

              {/* Custom Class Selection */}
              {reportType === 'custom' && (
                <div className="custom-selection-section">
                  <h4>Select Classes & Sections</h4>
                  <div className="class-selection-grid">
                    {Object.entries(getUniqueClasses()).map(([className, sections]) => (
                      <div key={className} className="class-selection-item">
                        <h5>{className}</h5>
                        <div className="section-checkboxes">
                          <label className="checkbox-option">
                            <input 
                              type="checkbox"
                              checked={isClassSectionSelected(className, 'all')}
                              onChange={() => handleClassSelection(className, 'all')}
                            />
                            <span>All Sections</span>
                          </label>
                          {sections.map(section => (
                            <label key={section} className="checkbox-option">
                              <input 
                                type="checkbox"
                                checked={isClassSectionSelected(className, section)}
                                onChange={() => handleClassSelection(className, section)}
                                disabled={isClassSectionSelected(className, 'all')}
                              />
                              <span>Section {section}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="class-selection-actions">
                <button className="btn-cancel" onClick={() => setShowClassSelectionModal(false)}>
                  Cancel
                </button>
                <button 
                  className="btn-submit" 
                  onClick={() => {
                    setShowClassSelectionModal(false)
                    setShowCollectionReport('custom')
                  }}
                >
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Collection Report */}
      {showCollectionReport === 'paid' && (
        <div className="class-detail-modal">
          <div className="collection-report-modal">
            <div className="class-detail-header">
              <h3>Daily Fee Collection Report - {new Date().toLocaleDateString('en-PK')}</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setShowCollectionReport('')}
              >
                ×
              </button>
            </div>

            <div className="collection-report-content">
              <div className="report-summary">
                <div className="summary-item">
                  <span>Date Range: {startDate} to {endDate}</span>
                </div>
                <div className="summary-item">
                  <span>Total Students Paid: {getPaidStudentsInRange(startDate, endDate).reduce((sum, c) => sum + c.students.length, 0)}</span>
                </div>
                <div className="summary-item">
                  <span>Total Amount Collected: {formatCurrency(getTotalCollectionInRange(startDate, endDate))}</span>
                </div>
              </div>

              <div className="excel-report-layout">
                <div className="report-header">
                  <h2>Muslim Public School & College</h2>
                  <h3>Fee Collection Report ({startDate} to {endDate})</h3>
                  <p>Generated on: {new Date().toLocaleDateString('en-PK')}</p>
                </div>

                <div className="report-content">
                  {getPaidStudentsInRange(startDate, endDate).map((classData, index) => (
                    <div key={index} className="class-section-report">
                      <div className="class-section-header">
                        <h4>{classData.className} - Section {classData.section}</h4>
                      </div>

                      <table className="excel-table">
                        <thead>
                          <tr>
                            <th>S.No</th>
                            <th>Name</th>
                            <th>Roll No</th>
                            <th>Father Name</th>
                            <th>Fee Amount</th>
                            <th>Paid Amount</th>
                            <th>Payment Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classData.students.map((student, studentIndex) => (
                            <tr key={student.id}>
                              <td>{studentIndex + 1}</td>
                              <td>{student.name}</td>
                              <td>{student.rollNo}</td>
                              <td>{student.fatherName}</td>
                              <td>{formatCurrency(student.feeAmount)}</td>
                              <td className="paid-amount">{formatCurrency(student.paidAmount)}</td>
                              <td>{student.paymentDate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="section-total">
                        <strong>
                          Section Total: {formatCurrency(classData.students.reduce((sum, s) => sum + s.paidAmount, 0))}
                        </strong>
                      </div>
                    </div>
                  ))}

                  <div className="grand-total">
                    <strong>Grand Total Collection ({startDate} to {endDate}): {formatCurrency(getTotalCollectionInRange(startDate, endDate))}</strong>
                  </div>
                </div>
              </div>

              <div className="report-actions">
                <button className="btn-cancel" onClick={() => setShowCollectionReport('')}>
                  Close
                </button>
                <button className="btn-submit" onClick={printReport}>
                  Print Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fee Defaulters Report */}
      {showCollectionReport === 'defaulter' && (
        <div className="class-detail-modal">
          <div className="collection-report-modal">
            <div className="class-detail-header">
              <h3>Fee Defaulters Report - {new Date().toLocaleDateString('en-PK')}</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setShowCollectionReport('')}
              >
                ×
              </button>
            </div>

            <div className="collection-report-content">
              <div className="report-summary">
                <div className="summary-item">
                  <span>Total Defaulter Students: {getFeeDefaulters().reduce((sum, c) => sum + c.students.length, 0)}</span>
                </div>
                <div className="summary-item">
                  <span>Total Pending Amount: {formatCurrency(getTotalDefaulterAmount())}</span>
                </div>
              </div>

              <div className="excel-report-layout">
                <div className="report-header">
                  <h2>Muslim Public School & College</h2>
                  <h3>Fee Defaulters Report</h3>
                  <p>Generated on: {new Date().toLocaleDateString('en-PK')}</p>
                </div>

                <div className="report-content">
                  {getFeeDefaulters().map((classData, index) => (
                    <div key={index} className="class-section-report">
                      <div className="class-section-header">
                        <h4>{classData.className} - Section {classData.section}</h4>
                      </div>

                      <table className="excel-table">
                        <thead>
                          <tr>
                            <th>S.No</th>
                            <th>Name</th>
                            <th>Roll No</th>
                            <th>Father Name</th>
                            <th>Fee Amount</th>
                            <th>Paid Amount</th>
                            <th>Pending Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classData.students.map((student, studentIndex) => (
                            <tr key={student.id}>
                              <td>{studentIndex + 1}</td>
                              <td>{student.name}</td>
                              <td>{student.rollNo}</td>
                              <td>{student.fatherName}</td>
                              <td>{formatCurrency(student.feeAmount)}</td>
                              <td className="paid-amount">{formatCurrency(student.paidAmount)}</td>
                              <td className="pending-amount">{formatCurrency(student.pendingAmount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="section-total defaulter-total">
                        <strong>
                          Section Pending: {formatCurrency(classData.students.reduce((sum, s) => sum + s.pendingAmount, 0))}
                        </strong>
                      </div>
                    </div>
                  ))}

                  <div className="grand-total defaulter-grand-total">
                    <strong>Total Pending Amount: {formatCurrency(getTotalDefaulterAmount())}</strong>
                  </div>
                </div>
              </div>

              <div className="report-actions">
                <button className="btn-cancel" onClick={() => setShowCollectionReport('')}>
                  Close
                </button>
                <button className="btn-submit" onClick={printReport}>
                  Print Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Class Report */}
      {showCollectionReport === 'custom' && (
        <div className="class-detail-modal">
          <div className="collection-report-modal">
            <div className="class-detail-header">
              <h3>Custom Class Report - {reportType.charAt(0).toUpperCase() + reportType.slice(1)}</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setShowCollectionReport('')}
              >
                ×
              </button>
            </div>

            <div className="collection-report-content">
              <div className="report-summary">
                <div className="summary-item">
                  <span>Report Type: {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</span>
                </div>
                <div className="summary-item">
                  <span>Date Range: {startDate} to {endDate}</span>
                </div>
                {reportType === 'custom' && (
                  <div className="summary-item">
                    <span>Selected Classes: {selectedClasses.length > 0 ? selectedClasses.length : 'All'}</span>
                  </div>
                )}
              </div>

              <div className="excel-report-layout">
                <div className="report-header">
                  <h2>Muslim Public School & College</h2>
                  <h3>{reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report ({startDate} to {endDate})</h3>
                  <p>Generated on: {new Date().toLocaleDateString('en-PK')}</p>
                </div>

                <div className="report-content">
                  {getFilteredClassData().map((classData, index) => (
                    <div key={index} className="class-section-report">
                      <div className="class-section-header">
                        <h4>{classData.className} - {classData.section}</h4>
                      </div>

                      <table className="excel-table">
                        <thead>
                          <tr>
                            <th>S.No</th>
                            <th>Name</th>
                            <th>Roll No</th>
                            <th>Father Name</th>
                            <th>Fee Amount</th>
                            <th>Paid Amount</th>
                            <th>Pending Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classData.students.map((student, studentIndex) => (
                            <tr key={student.id}>
                              <td>{studentIndex + 1}</td>
                              <td>{student.name}</td>
                              <td>{student.rollNo}</td>
                              <td>{student.fatherName}</td>
                              <td>{formatCurrency(student.feeAmount)}</td>
                              <td className="paid-amount">{formatCurrency(student.paidAmount)}</td>
                              <td className="pending-amount">{formatCurrency(student.pendingAmount)}</td>
                              <td>
                                <span className={`status-badge ${student.pendingAmount === 0 ? 'paid' : 'pending'}`}>
                                  {student.pendingAmount === 0 ? 'Paid' : 'Pending'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="section-total">
                        <div><strong>Students: {classData.students.length}</strong></div>
                        <div><strong>Total Fee: {formatCurrency(classData.students.reduce((sum, s) => sum + s.feeAmount, 0))}</strong></div>
                        <div><strong>Collected: {formatCurrency(classData.students.reduce((sum, s) => sum + s.paidAmount, 0))}</strong></div>
                        <div><strong>Pending: {formatCurrency(classData.students.reduce((sum, s) => sum + s.pendingAmount, 0))}</strong></div>
                      </div>
                    </div>
                  ))}

                  <div className="grand-total">
                    <strong>
                      Grand Total - Collected: {formatCurrency(getFilteredClassData().reduce((total, c) => total + c.students.reduce((sum, s) => sum + s.paidAmount, 0), 0))} | 
                      Pending: {formatCurrency(getFilteredClassData().reduce((total, c) => total + c.students.reduce((sum, s) => sum + s.pendingAmount, 0), 0))}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="report-actions">
                <button className="btn-cancel" onClick={() => setShowCollectionReport('')}>
                  Close
                </button>
                <button className="btn-submit" onClick={printReport}>
                  Print Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Class Reports */}
      {showCollectionReport === 'fee-custom' && (
        <div className="modal-overlay">
          <div className="class-detail-modal">
            <div className="modal-header">
              <h3>Custom {reportType === 'paid' ? 'Fee Collection' : 'Defaulters'} Report</h3>
              <div className="modal-header-actions">
                <button 
                  className="action-btn secondary" 
                  onClick={() => window.print()}
                >
                  🖨️ Print
                </button>
                <button 
                  className="close-btn" 
                  onClick={() => setShowCollectionReport('')}
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="modal-content">
              <div className="excel-table-container">
                <table className="excel-table">
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Student Name</th>
                      <th>Class</th>
                      <th>Section</th>
                      <th>Fee Status</th>
                      <th>Fee Amount</th>
                      {reportType === 'paid' && <th>Payment Date</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {customStudentData
                      .filter(student => {
                        // Filter by selected classes and sections
                        const isClassSelected = selectedClasses.length === 0 || selectedClasses.some(selection => 
                          selection.class === student.class && selection.section === student.section
                        )
                        
                        if (!isClassSelected) return false
                        
                        // Filter by report type
                        if (reportType === 'paid') {
                          if (student.feeStatus === 'Paid') {
                            const paymentDate = new Date(student.paymentDate)
                            const start = new Date(startDate)
                            const end = new Date(endDate)
                            return paymentDate >= start && paymentDate <= end
                          }
                          return false
                        } else if (reportType === 'defaulters') {
                          return student.feeStatus === 'Pending'
                        }
                        return false
                      })
                      .sort((a, b) => {
                        const classOrder = { '9th': 1, '10th': 2, '11th': 3, '12th': 4 }
                        const classComparison = classOrder[a.class] - classOrder[b.class]
                        if (classComparison !== 0) return classComparison
                        return a.section.localeCompare(b.section)
                      })
                      .map((student, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{student.name}</td>
                          <td>{student.class}</td>
                          <td>{student.section}</td>
                          <td>
                            <span className={`status-badge ${student.feeStatus.toLowerCase()}`}>
                              {student.feeStatus}
                            </span>
                          </td>
                          <td>₹{student.feeAmount}</td>
                          {reportType === 'paid' && (
                            <td>{student.paymentDate || 'N/A'}</td>
                          )}
                        </tr>
                      ))}
                  </tbody>
                  <tfoot>
                    <tr className="total-row">
                      <td colSpan="5"><strong>Total Amount:</strong></td>
                      <td><strong>₹{customStudentData
                        .filter(student => {
                          const isClassSelected = selectedClasses.length === 0 || selectedClasses.some(selection => 
                            selection.class === student.class && selection.section === student.section
                          )
                          
                          if (!isClassSelected) return false
                          
                          if (reportType === 'paid') {
                            if (student.feeStatus === 'Paid') {
                              const paymentDate = new Date(student.paymentDate)
                              const start = new Date(startDate)
                              const end = new Date(endDate)
                              return paymentDate >= start && paymentDate <= end
                            }
                            return false
                          } else if (reportType === 'defaulters') {
                            return student.feeStatus === 'Pending'
                          }
                          return false
                        })
                        .reduce((sum, student) => sum + student.feeAmount, 0)}</strong></td>
                      {reportType === 'paid' && <td></td>}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const VoucherManagement = () => {
  return (
    <div className="page-content">
      <h2>Voucher Management</h2>
      
      <div className="welcome-message">
        <p>Manage and generate vouchers for school, college, and faculty. Create salary slips and other institutional vouchers efficiently.</p>
      </div>
      
      <div className="voucher-actions">
        <Link to="/voucher-management/school" className="dashboard-btn blue">
          <span className="btn-icon">🏫</span>
          <span className="btn-title">School Vouchers</span>
          <span className="btn-subtitle">Generate fee vouchers</span>
        </Link>
        
        <Link to="/voucher-management/college" className="dashboard-btn blue">
          <span className="btn-icon">🎓</span>
          <span className="btn-title">College Vouchers</span>
          <span className="btn-subtitle">Generate fee vouchers</span>
        </Link>
        
        <Link to="/voucher-management/faculty" className="dashboard-btn blue">
          <span className="btn-icon">👨‍🏫</span>
          <span className="btn-title">Faculty Vouchers</span>
          <span className="btn-subtitle">Generate salary slips</span>
        </Link>
      </div>
    </div>
  )
}

const SchoolVoucher = () => {
  const [voucherMode, setVoucherMode] = useState('bulk') // 'bulk' or 'single'
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSections, setSelectedSections] = useState([])
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    rollNo: '',
    class: '',
    section: ''
  })
  const [feeAdjustments, setFeeAdjustments] = useState({
    boardFee: 0,
    additionalFee: 0,
    discount: 0
  })
  const [customFees, setCustomFees] = useState([
    { id: 1, title: '', amount: 0 }
  ])
  const [generatedVouchers, setGeneratedVouchers] = useState([])
  const [editingVoucher, setEditingVoucher] = useState(null)

  // Sample student data structure
  const schoolClasses = {
    'Class 6': ['A', 'B', 'C'],
    'Class 7': ['A', 'B', 'C'],
    'Class 8': ['A', 'B', 'C'],
    'Class 9': ['A', 'B'],
    'Class 10': ['A', 'B']
  }

  const sampleStudents = {
    'Class 6': {
      'A': [
        { name: 'Ahmed Ali', rollNo: '601', monthlyFee: 5000, pendingFee: 0, transport: 2000 },
        { name: 'Fatima Khan', rollNo: '602', monthlyFee: 5000, pendingFee: 5000, transport: 2000 },
        { name: 'Omar Hassan', rollNo: '603', monthlyFee: 5000, pendingFee: 10000, transport: 0 }
      ],
      'B': [
        { name: 'Aisha Ahmed', rollNo: '611', monthlyFee: 5000, pendingFee: 0, transport: 2000 },
        { name: 'Ibrahim Ali', rollNo: '612', monthlyFee: 5000, pendingFee: 5000, transport: 2000 }
      ]
    },
    'Class 7': {
      'A': [
        { name: 'Zainab Shah', rollNo: '701', monthlyFee: 5500, pendingFee: 0, transport: 2000 },
        { name: 'Hassan Malik', rollNo: '702', monthlyFee: 5500, pendingFee: 5500, transport: 2000 }
      ]
    }
  }

  const handleSectionChange = (section) => {
    setSelectedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const addCustomFee = () => {
    const newId = Math.max(...customFees.map(f => f.id), 0) + 1
    setCustomFees([...customFees, { id: newId, title: '', amount: 0 }])
  }

  const removeCustomFee = (id) => {
    setCustomFees(customFees.filter(fee => fee.id !== id))
  }

  const updateCustomFee = (id, field, value) => {
    setCustomFees(customFees.map(fee => 
      fee.id === id ? { ...fee, [field]: value } : fee
    ))
  }

  const calculateCustomFeeTotal = () => {
    return customFees.reduce((total, fee) => total + (fee.amount || 0), 0)
  }

  const generateBulkVouchers = () => {
    if (!selectedClass) return

    let vouchersBySection = []
    
    if (selectedSections.length === 0) {
      // Generate for all sections in order
      Object.keys(sampleStudents[selectedClass] || {}).sort().forEach(section => {
        const sectionStudents = (sampleStudents[selectedClass][section] || [])
          .sort((a, b) => parseInt(a.rollNo) - parseInt(b.rollNo))
        vouchersBySection.push(...sectionStudents.map(student => ({ ...student, currentSection: section })))
      })
    } else {
      // Generate for selected sections only, in order
      selectedSections.sort().forEach(section => {
        if (sampleStudents[selectedClass]?.[section]) {
          const sectionStudents = sampleStudents[selectedClass][section]
            .sort((a, b) => parseInt(a.rollNo) - parseInt(b.rollNo))
          vouchersBySection.push(...sectionStudents.map(student => ({ ...student, currentSection: section })))
        }
      })
    }

    const customFeeTotal = calculateCustomFeeTotal()

    const vouchers = vouchersBySection.map((student, index) => ({
      id: `school-${Date.now()}-${index}`,
      type: 'school',
      studentName: student.name,
      rollNo: student.rollNo,
      class: selectedClass,
      section: student.currentSection,
      monthlyFee: student.monthlyFee + feeAdjustments.additionalFee,
      pendingFee: student.pendingFee,
      transport: student.transport,
      boardFee: feeAdjustments.boardFee,
      discount: feeAdjustments.discount,
      customFees: customFees.filter(fee => fee.title && fee.amount > 0),
      totalDue: (student.monthlyFee + student.pendingFee + student.transport + feeAdjustments.boardFee + feeAdjustments.additionalFee + customFeeTotal) - feeAdjustments.discount,
      issueDate: new Date().toLocaleDateString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
    }))

    setGeneratedVouchers(vouchers)
  }

  const generateSingleVoucher = () => {
    if (!studentInfo.name || !studentInfo.rollNo || !studentInfo.class || !studentInfo.section) {
      alert('Please fill all student information fields')
      return
    }

    const customFeeTotal = calculateCustomFeeTotal()

    const voucher = {
      id: `school-single-${Date.now()}`,
      type: 'school',
      studentName: studentInfo.name,
      rollNo: studentInfo.rollNo,
      class: studentInfo.class,
      section: studentInfo.section,
      monthlyFee: 5000 + feeAdjustments.additionalFee,
      pendingFee: 0,
      transport: 2000,
      boardFee: feeAdjustments.boardFee,
      discount: feeAdjustments.discount,
      customFees: customFees.filter(fee => fee.title && fee.amount > 0),
      totalDue: (5000 + 2000 + feeAdjustments.boardFee + feeAdjustments.additionalFee + customFeeTotal) - feeAdjustments.discount,
      issueDate: new Date().toLocaleDateString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
    }

    setGeneratedVouchers([voucher])
  }

  const bulkEditFees = () => {
    setGeneratedVouchers(vouchers => 
      vouchers.map(voucher => ({
        ...voucher,
        monthlyFee: voucher.monthlyFee + feeAdjustments.additionalFee,
        boardFee: feeAdjustments.boardFee,
        discount: feeAdjustments.discount,
        totalDue: (voucher.monthlyFee + voucher.pendingFee + voucher.transport + feeAdjustments.boardFee + feeAdjustments.additionalFee) - feeAdjustments.discount
      }))
    )
  }

  const printVouchers = () => {
    window.print()
  }

  const navigate = useNavigate()
  const goBack = () => navigate(-1)

  return (
    <div className="page-content">
      <div className="breadcrumb-nav">
        <Link to="/voucher-management">Voucher Management</Link>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">School Vouchers</span>
      </div>
      
      <div className="form-header">
        <h2>School Fee Voucher Management</h2>
        <div className="header-actions">
          <button onClick={goBack} className="back-btn">← Go Back</button>
          <Link to="/voucher-management" className="back-btn secondary">Voucher Home</Link>
        </div>
      </div>

      <div className="voucher-form-container">
        <div className="voucher-mode-selector">
          <h3>Voucher Generation Mode</h3>
          <div className="mode-options">
            <button 
              className={`mode-btn ${voucherMode === 'bulk' ? 'active' : ''}`}
              onClick={() => setVoucherMode('bulk')}
            >
              Bulk Vouchers (Class/Section)
            </button>
            <button 
              className={`mode-btn ${voucherMode === 'single' ? 'active' : ''}`}
              onClick={() => setVoucherMode('single')}
            >
              Single Student Voucher
            </button>
          </div>
        </div>

        {voucherMode === 'bulk' && (
          <div className="bulk-voucher-form">
            <h3>Generate Bulk Vouchers</h3>
            
            <div className="form-group">
              <label>Select Class</label>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                <option value="">Choose Class</option>
                {Object.keys(schoolClasses).map(className => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </select>
            </div>

            {selectedClass && (
              <div className="form-group">
                <label>Select Sections (leave empty for all sections)</label>
                <div className="sections-grid">
                  {schoolClasses[selectedClass].map(section => (
                    <label key={section} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedSections.includes(section)}
                        onChange={() => handleSectionChange(section)}
                      />
                      Section {section}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button onClick={generateBulkVouchers} className="action-btn primary" style={{fontSize: '14px', padding: '12px 20px'}}>
              Generate Bulk Vouchers
            </button>
          </div>
        )}

        {voucherMode === 'single' && (
          <div className="single-voucher-form">
            <h3>Generate Single Student Voucher</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Student Name</label>
                <input
                  type="text"
                  value={studentInfo.name}
                  onChange={(e) => setStudentInfo({...studentInfo, name: e.target.value})}
                  placeholder="Enter student name"
                />
              </div>
              
              <div className="form-group">
                <label>Roll Number</label>
                <input
                  type="text"
                  value={studentInfo.rollNo}
                  onChange={(e) => setStudentInfo({...studentInfo, rollNo: e.target.value})}
                  placeholder="Enter roll number"
                />
              </div>
              
              <div className="form-group">
                <label>Class</label>
                <select
                  value={studentInfo.class}
                  onChange={(e) => setStudentInfo({...studentInfo, class: e.target.value})}
                >
                  <option value="">Choose Class</option>
                  {Object.keys(schoolClasses).map(className => (
                    <option key={className} value={className}>{className}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Section</label>
                <select
                  value={studentInfo.section}
                  onChange={(e) => setStudentInfo({...studentInfo, section: e.target.value})}
                >
                  <option value="">Choose Section</option>
                  {studentInfo.class && schoolClasses[studentInfo.class]?.map(section => (
                    <option key={section} value={section}>Section {section}</option>
                  ))}
                </select>
              </div>
            </div>

            <button onClick={generateSingleVoucher} className="action-btn primary">
              Generate Single Voucher
            </button>
          </div>
        )}

        <div className="fee-adjustments">
          <h3>Fee Adjustments (Apply to All Vouchers)</h3>
          <div className="adjustments-grid">
            <div className="form-group">
              <label>Board Fee</label>
              <input
                type="number"
                value={feeAdjustments.boardFee}
                onChange={(e) => setFeeAdjustments({...feeAdjustments, boardFee: Number(e.target.value)})}
                placeholder="0"
              />
            </div>
            
            <div className="form-group">
              <label>Additional Fee</label>
              <input
                type="number"
                value={feeAdjustments.additionalFee}
                onChange={(e) => setFeeAdjustments({...feeAdjustments, additionalFee: Number(e.target.value)})}
                placeholder="0"
              />
            </div>
            
            <div className="form-group">
              <label>Discount</label>
              <input
                type="number"
                value={feeAdjustments.discount}
                onChange={(e) => setFeeAdjustments({...feeAdjustments, discount: Number(e.target.value)})}
                placeholder="0"
              />
            </div>
          </div>

          <h4>Custom Fees</h4>
          <div className="custom-fees-section">
            {customFees.map(fee => (
              <div key={fee.id} className="custom-fee-row">
                <div className="form-group">
                  <label>Fee Title</label>
                  <input
                    type="text"
                    value={fee.title}
                    onChange={(e) => updateCustomFee(fee.id, 'title', e.target.value)}
                    placeholder="e.g., Exam Fee, Lab Fee"
                  />
                </div>
                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    value={fee.amount}
                    onChange={(e) => updateCustomFee(fee.id, 'amount', Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
                {customFees.length > 1 && (
                  <button 
                    onClick={() => removeCustomFee(fee.id)} 
                    className="remove-fee-btn"
                    type="button"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button onClick={addCustomFee} className="action-btn tertiary" style={{fontSize: '12px', padding: '8px 16px'}}>
              + Add Custom Fee
            </button>
          </div>
          
          {generatedVouchers.length > 0 && (
            <button onClick={bulkEditFees} className="action-btn secondary">
              Apply Adjustments to All Vouchers
            </button>
          )}
        </div>

        {generatedVouchers.length > 0 && (
          <div className="voucher-preview">
            <div className="voucher-header">
              <h3>Generated Vouchers ({generatedVouchers.length})</h3>
              <button onClick={printVouchers} className="action-btn primary print-btn">
                🖨️ Print All Vouchers
              </button>
            </div>
            
            <div className="vouchers-grid">
              {generatedVouchers.map(voucher => (
                <div key={voucher.id} className="voucher-card printable">
                  {/* First Copy - Student Copy */}
                  <div className="voucher-copy student-copy">
                    <div className="voucher-header-info">
                      <h4>MUSLIM PUBLIC HIGHER SECONDARY SCHOOL</h4>
                      <p>Student Copy</p>
                    </div>
                    <div className="voucher-details">
                      <div className="student-info">
                        <p><strong>Student Name:</strong> {voucher.studentName}</p>
                        <p><strong>Roll No:</strong> {voucher.rollNo}</p>
                        <p><strong>Class:</strong> {voucher.class}</p>
                        <p><strong>Section:</strong> {voucher.section}</p>
                      </div>
                      <div className="fee-breakdown">
                        <p><strong>Monthly Fee:</strong> Rs. {voucher.monthlyFee}</p>
                        <p><strong>Pending Fee:</strong> Rs. {voucher.pendingFee}</p>
                        <p><strong>Transport:</strong> Rs. {voucher.transport}</p>
                        {voucher.boardFee > 0 && <p><strong>Board Fee:</strong> Rs. {voucher.boardFee}</p>}
                        {voucher.customFees && voucher.customFees.map(fee => (
                          <p key={fee.id}><strong>{fee.title}:</strong> Rs. {fee.amount}</p>
                        ))}
                        {voucher.discount > 0 && <p><strong>Discount:</strong> -Rs. {voucher.discount}</p>}
                        <p className="total-due"><strong>Total Due:</strong> Rs. {voucher.totalDue}</p>
                      </div>
                      <div className="voucher-dates">
                        <p><strong>Issue Date:</strong> {voucher.issueDate}</p>
                        <p><strong>Due Date:</strong> {voucher.dueDate}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Second Copy - School Copy */}
                  <div className="voucher-copy school-copy">
                    <div className="voucher-header-info">
                      <h4>MUSLIM PUBLIC HIGHER SECONDARY SCHOOL</h4>
                      <p>School Copy</p>
                    </div>
                    <div className="voucher-details">
                      <div className="student-info">
                        <p><strong>Student Name:</strong> {voucher.studentName}</p>
                        <p><strong>Roll No:</strong> {voucher.rollNo}</p>
                        <p><strong>Class:</strong> {voucher.class}</p>
                        <p><strong>Section:</strong> {voucher.section}</p>
                      </div>
                      <div className="fee-breakdown">
                        <p><strong>Monthly Fee:</strong> Rs. {voucher.monthlyFee}</p>
                        <p><strong>Pending Fee:</strong> Rs. {voucher.pendingFee}</p>
                        <p><strong>Transport:</strong> Rs. {voucher.transport}</p>
                        {voucher.boardFee > 0 && <p><strong>Board Fee:</strong> Rs. {voucher.boardFee}</p>}
                        {voucher.customFees && voucher.customFees.map(fee => (
                          <p key={fee.id}><strong>{fee.title}:</strong> Rs. {fee.amount}</p>
                        ))}
                        {voucher.discount > 0 && <p><strong>Discount:</strong> -Rs. {voucher.discount}</p>}
                        <p className="total-due"><strong>Total Due:</strong> Rs. {voucher.totalDue}</p>
                      </div>
                      <div className="voucher-dates">
                        <p><strong>Issue Date:</strong> {voucher.issueDate}</p>
                        <p><strong>Due Date:</strong> {voucher.dueDate}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const CollegeVoucher = () => {
  const [voucherMode, setVoucherMode] = useState('bulk') // 'bulk' or 'single'
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSections, setSelectedSections] = useState([])
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    rollNo: '',
    class: '',
    section: ''
  })
  const [feeAdjustments, setFeeAdjustments] = useState({
    boardFee: 0,
    additionalFee: 0,
    discount: 0
  })
  const [customFees, setCustomFees] = useState([
    { id: 1, title: '', amount: 0 }
  ])
  const [generatedVouchers, setGeneratedVouchers] = useState([])
  const [editingVoucher, setEditingVoucher] = useState(null)

  // College classes and sections
  const collegeClasses = {
    '1st Year': ['A', 'B'],
    '2nd Year': ['A', 'B']
  }

  const sampleStudents = {
    '1st Year': {
      'A': [
        { name: 'Muhammad Ahmed', rollNo: '21-CS-101', monthlyFee: 8000, pendingFee: 0, transport: 3000 },
        { name: 'Fatima Ali', rollNo: '21-CS-102', monthlyFee: 8000, pendingFee: 8000, transport: 3000 },
        { name: 'Hassan Khan', rollNo: '21-CS-103', monthlyFee: 8000, pendingFee: 16000, transport: 0 }
      ],
      'B': [
        { name: 'Aisha Shah', rollNo: '21-CS-111', monthlyFee: 8000, pendingFee: 0, transport: 3000 },
        { name: 'Omar Malik', rollNo: '21-CS-112', monthlyFee: 8000, pendingFee: 8000, transport: 3000 }
      ]
    },
    '2nd Year': {
      'A': [
        { name: 'Ali Hassan', rollNo: '20-CS-101', monthlyFee: 9000, pendingFee: 0, transport: 3000 },
        { name: 'Maryam Ahmed', rollNo: '20-CS-102', monthlyFee: 9000, pendingFee: 9000, transport: 3000 }
      ]
    }
  }

  const handleSectionChange = (section) => {
    setSelectedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const generateBulkVouchers = () => {
    if (!selectedClass) return

    let studentsToProcess = []
    
    if (selectedSections.length === 0) {
      // Generate for all sections
      Object.keys(sampleStudents[selectedClass] || {}).forEach(section => {
        studentsToProcess.push(...(sampleStudents[selectedClass][section] || []))
      })
    } else {
      // Generate for selected sections only
      selectedSections.forEach(section => {
        if (sampleStudents[selectedClass]?.[section]) {
          studentsToProcess.push(...sampleStudents[selectedClass][section])
        }
      })
    }

    const vouchers = studentsToProcess.map((student, index) => ({
      id: `college-${Date.now()}-${index}`,
      type: 'college',
      studentName: student.name,
      rollNo: student.rollNo,
      class: selectedClass,
      section: selectedSections.length === 0 ? 'All' : selectedSections.join(', '),
      monthlyFee: student.monthlyFee + feeAdjustments.additionalFee,
      pendingFee: student.pendingFee,
      transport: student.transport,
      boardFee: feeAdjustments.boardFee,
      discount: feeAdjustments.discount,
      totalDue: (student.monthlyFee + student.pendingFee + student.transport + feeAdjustments.boardFee + feeAdjustments.additionalFee) - feeAdjustments.discount,
      issueDate: new Date().toLocaleDateString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
    }))

    setGeneratedVouchers(vouchers)
  }

  const generateSingleVoucher = () => {
    if (!studentInfo.name || !studentInfo.rollNo || !studentInfo.class || !studentInfo.section) {
      alert('Please fill all student information fields')
      return
    }

    const voucher = {
      id: `college-single-${Date.now()}`,
      type: 'college',
      studentName: studentInfo.name,
      rollNo: studentInfo.rollNo,
      class: studentInfo.class,
      section: studentInfo.section,
      monthlyFee: 8000 + feeAdjustments.additionalFee,
      pendingFee: 0,
      transport: 3000,
      boardFee: feeAdjustments.boardFee,
      discount: feeAdjustments.discount,
      totalDue: (8000 + 3000 + feeAdjustments.boardFee + feeAdjustments.additionalFee) - feeAdjustments.discount,
      issueDate: new Date().toLocaleDateString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
    }

    setGeneratedVouchers([voucher])
  }

  const bulkEditFees = () => {
    setGeneratedVouchers(vouchers => 
      vouchers.map(voucher => ({
        ...voucher,
        monthlyFee: voucher.monthlyFee + feeAdjustments.additionalFee,
        boardFee: feeAdjustments.boardFee,
        discount: feeAdjustments.discount,
        totalDue: (voucher.monthlyFee + voucher.pendingFee + voucher.transport + feeAdjustments.boardFee + feeAdjustments.additionalFee) - feeAdjustments.discount
      }))
    )
  }

  const printVouchers = () => {
    window.print()
  }

  const navigate = useNavigate()
  const goBack = () => navigate(-1)

  return (
    <div className="page-content">
      <div className="breadcrumb-nav">
        <Link to="/voucher-management">Voucher Management</Link>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">College Vouchers</span>
      </div>
      
      <div className="form-header">
        <h2>College Fee Voucher Management</h2>
        <div className="header-actions">
          <button onClick={goBack} className="back-btn">← Go Back</button>
          <Link to="/voucher-management" className="back-btn secondary">Voucher Home</Link>
        </div>
      </div>

      <div className="voucher-form-container">
        <div className="voucher-mode-selector">
          <h3>Voucher Generation Mode</h3>
          <div className="mode-options">
            <button 
              className={`mode-btn ${voucherMode === 'bulk' ? 'active' : ''}`}
              onClick={() => setVoucherMode('bulk')}
            >
              Bulk Vouchers (Class/Section)
            </button>
            <button 
              className={`mode-btn ${voucherMode === 'single' ? 'active' : ''}`}
              onClick={() => setVoucherMode('single')}
            >
              Single Student Voucher
            </button>
          </div>
        </div>

        {voucherMode === 'bulk' && (
          <div className="bulk-voucher-form">
            <h3>Generate Bulk Vouchers</h3>
            
            <div className="form-group">
              <label>Select Class</label>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                <option value="">Choose Class</option>
                {Object.keys(collegeClasses).map(className => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </select>
            </div>

            {selectedClass && (
              <div className="form-group">
                <label>Select Sections (leave empty for all sections)</label>
                <div className="sections-grid">
                  {collegeClasses[selectedClass].map(section => (
                    <label key={section} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedSections.includes(section)}
                        onChange={() => handleSectionChange(section)}
                      />
                      Section {section}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button onClick={generateBulkVouchers} className="action-btn primary">
              Generate Bulk Vouchers
            </button>
          </div>
        )}

        {voucherMode === 'single' && (
          <div className="single-voucher-form">
            <h3>Generate Single Student Voucher</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Student Name</label>
                <input
                  type="text"
                  value={studentInfo.name}
                  onChange={(e) => setStudentInfo({...studentInfo, name: e.target.value})}
                  placeholder="Enter student name"
                />
              </div>
              
              <div className="form-group">
                <label>Roll Number</label>
                <input
                  type="text"
                  value={studentInfo.rollNo}
                  onChange={(e) => setStudentInfo({...studentInfo, rollNo: e.target.value})}
                  placeholder="Enter roll number (e.g., 21-CS-101)"
                />
              </div>
              
              <div className="form-group">
                <label>Class</label>
                <select
                  value={studentInfo.class}
                  onChange={(e) => setStudentInfo({...studentInfo, class: e.target.value})}
                >
                  <option value="">Choose Class</option>
                  {Object.keys(collegeClasses).map(className => (
                    <option key={className} value={className}>{className}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Section</label>
                <select
                  value={studentInfo.section}
                  onChange={(e) => setStudentInfo({...studentInfo, section: e.target.value})}
                >
                  <option value="">Choose Section</option>
                  {studentInfo.class && collegeClasses[studentInfo.class]?.map(section => (
                    <option key={section} value={section}>Section {section}</option>
                  ))}
                </select>
              </div>
            </div>

            <button onClick={generateSingleVoucher} className="action-btn primary">
              Generate Single Voucher
            </button>
          </div>
        )}

        <div className="fee-adjustments">
          <h3>Fee Adjustments (Apply to All Vouchers)</h3>
          <div className="adjustments-grid">
            <div className="form-group">
              <label>Board Fee</label>
              <input
                type="number"
                value={feeAdjustments.boardFee}
                onChange={(e) => setFeeAdjustments({...feeAdjustments, boardFee: Number(e.target.value)})}
                placeholder="0"
              />
            </div>
            
            <div className="form-group">
              <label>Additional Fee</label>
              <input
                type="number"
                value={feeAdjustments.additionalFee}
                onChange={(e) => setFeeAdjustments({...feeAdjustments, additionalFee: Number(e.target.value)})}
                placeholder="0"
              />
            </div>
            
            <div className="form-group">
              <label>Discount</label>
              <input
                type="number"
                value={feeAdjustments.discount}
                onChange={(e) => setFeeAdjustments({...feeAdjustments, discount: Number(e.target.value)})}
                placeholder="0"
              />
            </div>
          </div>
          
          {generatedVouchers.length > 0 && (
            <button onClick={bulkEditFees} className="action-btn secondary">
              Apply Adjustments to All Vouchers
            </button>
          )}
        </div>

        {generatedVouchers.length > 0 && (
          <div className="voucher-preview">
            <div className="voucher-header">
              <h3>Generated Vouchers ({generatedVouchers.length})</h3>
              <button onClick={printVouchers} className="action-btn primary print-btn">
                🖨️ Print All Vouchers
              </button>
            </div>
            
            <div className="vouchers-grid">
              {generatedVouchers.map(voucher => (
                <div key={voucher.id} className="voucher-card printable">
                  {/* First Copy - Student Copy */}
                  <div className="voucher-copy student-copy">
                    <div className="voucher-header-info">
                      <h4>MUSLIM PUBLIC HIGHER SECONDARY SCHOOL</h4>
                      <h5>COLLEGE SECTION</h5>
                      <p>Student Copy</p>
                    </div>
                    <div className="voucher-details">
                      <div className="student-info">
                        <p><strong>Student Name:</strong> {voucher.studentName}</p>
                        <p><strong>Roll No:</strong> {voucher.rollNo}</p>
                        <p><strong>Class:</strong> {voucher.class}</p>
                        <p><strong>Section:</strong> {voucher.section}</p>
                      </div>
                      <div className="fee-breakdown">
                        <p><strong>Monthly Fee:</strong> Rs. {voucher.monthlyFee}</p>
                        <p><strong>Pending Fee:</strong> Rs. {voucher.pendingFee}</p>
                        <p><strong>Transport:</strong> Rs. {voucher.transport}</p>
                        {voucher.boardFee > 0 && <p><strong>Board Fee:</strong> Rs. {voucher.boardFee}</p>}
                        {voucher.discount > 0 && <p><strong>Discount:</strong> -Rs. {voucher.discount}</p>}
                        <p className="total-due"><strong>Total Due:</strong> Rs. {voucher.totalDue}</p>
                      </div>
                      <div className="voucher-dates">
                        <p><strong>Issue Date:</strong> {voucher.issueDate}</p>
                        <p><strong>Due Date:</strong> {voucher.dueDate}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Second Copy - School Copy */}
                  <div className="voucher-copy school-copy">
                    <div className="voucher-header-info">
                      <h4>MUSLIM PUBLIC HIGHER SECONDARY SCHOOL</h4>
                      <h5>COLLEGE SECTION</h5>
                      <p>School Copy</p>
                    </div>
                    <div className="voucher-details">
                      <div className="student-info">
                        <p><strong>Student Name:</strong> {voucher.studentName}</p>
                        <p><strong>Roll No:</strong> {voucher.rollNo}</p>
                        <p><strong>Class:</strong> {voucher.class}</p>
                        <p><strong>Section:</strong> {voucher.section}</p>
                      </div>
                      <div className="fee-breakdown">
                        <p><strong>Monthly Fee:</strong> Rs. {voucher.monthlyFee}</p>
                        <p><strong>Pending Fee:</strong> Rs. {voucher.pendingFee}</p>
                        <p><strong>Transport:</strong> Rs. {voucher.transport}</p>
                        {voucher.boardFee > 0 && <p><strong>Board Fee:</strong> Rs. {voucher.boardFee}</p>}
                        {voucher.discount > 0 && <p><strong>Discount:</strong> -Rs. {voucher.discount}</p>}
                        <p className="total-due"><strong>Total Due:</strong> Rs. {voucher.totalDue}</p>
                      </div>
                      <div className="voucher-dates">
                        <p><strong>Issue Date:</strong> {voucher.issueDate}</p>
                        <p><strong>Due Date:</strong> {voucher.dueDate}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const Analytics = () => {
  // State for date range filters
  const [trendFilter, setTrendFilter] = useState('1month')
  const [feeFilter, setFeeFilter] = useState('1month')
  
  // Dummy data for demonstration
  const [reportsData, setReportsData] = useState({
    todaySchoolAdmissions: 12,
    todayCollegeAdmissions: 5,
    todayAdmissionRevenue: 85000, // PKR
    totalFeeCollected: 2450000, // PKR
    admissionsTrendFull: [
      { week: 'W1', day: '2026-01-15', admissions: 8, revenue: 65000 },
      { week: 'W2', day: '2026-01-16', admissions: 12, revenue: 78000 },
      { week: 'W3', day: '2026-01-17', admissions: 15, revenue: 95000 },
      { week: 'W4', day: '2026-01-18', admissions: 18, revenue: 125000 },
      { week: 'W5', day: '2026-01-19', admissions: 22, revenue: 145000 },
      { week: 'W6', day: '2026-01-20', admissions: 25, revenue: 165000 },
      { week: 'W7', day: '2026-01-21', admissions: 20, revenue: 135000 },
      { week: 'W8', day: '2026-01-22', admissions: 28, revenue: 185000 },
      { week: 'W9', day: '2026-01-23', admissions: 24, revenue: 158000 },
      { week: 'W10', day: '2026-01-24', admissions: 19, revenue: 128000 },
      { week: 'Today', day: '2026-01-25', admissions: 17, revenue: 135000 }
    ],
    feeSubmissionData: {
      today: { submitted: 45, pending: 55 },
      '3days': { submitted: 62, pending: 38 },
      '1week': { submitted: 68, pending: 32 },
      '1month': { submitted: 75, pending: 25 }
    }
  })

  // Filter trend data based on selected period
  const getFilteredTrendData = () => {
    const data = reportsData.admissionsTrendFull
    switch(trendFilter) {
      case 'today':
        return data.slice(-1) // Last day only
      case '3days':
        return data.slice(-3) // Last 3 days
      case '1week':
        return data.slice(-7) // Last 7 days  
      case '1month':
        return data // All data (represents 1 month)
      default:
        return data
    }
  }

  // Get fee submission data based on selected period
  const getFeeSubmissionData = () => {
    return reportsData.feeSubmissionData[feeFilter]
  }

  // Get period label for display
  const getPeriodLabel = (period) => {
    switch(period) {
      case 'today': return 'Today'
      case '3days': return 'Last 3 Days'
      case '1week': return 'Last Week'  
      case '1month': return 'Last Month'
      default: return 'Last Month'
    }
  }

  const formatCurrency = (amount) => {
    return `PKR ${amount.toLocaleString('en-PK')}`
  }

  const formatPercentage = (value) => {
    return `${value}%`
  }

  const filteredTrendData = getFilteredTrendData()
  const feeSubmissionData = getFeeSubmissionData()

  return (
    <div className="page-content">
      <h2>Analytics</h2>
      
      <div className="welcome-message">
        <p>Monitor school performance, track student progress, and view financial data across school and college levels.</p>
      </div>
      
      {/* Daily Statistics Buttons */}
      <div className="reports-stats-row">
        <div className="stat-card school-admission">
          <div className="stat-icon">🏫</div>
          <div className="stat-content">
            <div className="stat-value">{reportsData.todaySchoolAdmissions}</div>
            <div className="stat-label">School Admissions Today</div>
          </div>
        </div>
        
        <div className="stat-card college-admission">
          <div className="stat-icon">🎓</div>
          <div className="stat-content">
            <div className="stat-value">{reportsData.todayCollegeAdmissions}</div>
            <div className="stat-label">College Admissions Today</div>
          </div>
        </div>
        
        <div className="stat-card admission-revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(reportsData.todayAdmissionRevenue)}</div>
            <div className="stat-label">Today's Admission Revenue</div>
          </div>
        </div>
        
        <div className="stat-card total-fee">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(reportsData.totalFeeCollected)}</div>
            <div className="stat-label">Total Fee Collected</div>
          </div>
        </div>
      </div>
      
      {/* Trend Graph Section */}
      <div className="reports-section">
        <div className="section-header" style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', padding: '15px', borderRadius: '8px', marginBottom: '20px'}}>
          <h3 style={{color: 'white', margin: '0 0 10px 0', fontSize: '20px', fontWeight: '600'}}>Admissions & Revenue Trends</h3>
          <div className="filter-dropdown">
            <label style={{color: 'white', marginRight: '10px', fontWeight: '500'}}>Time Period:</label>
            <select 
              value={trendFilter} 
              onChange={(e) => setTrendFilter(e.target.value)}
              className="period-select"
              style={{background: 'white', color: '#333', border: 'none', padding: '6px 10px', borderRadius: '4px', fontWeight: '500'}}
            >
              <option value="today">Today</option>
              <option value="3days">Last 3 Days</option>
              <option value="1week">Last Week</option>
              <option value="1month">Last Month</option>
            </select>
          </div>
        </div>
        
        <div className="trend-graph-container">
          <div className="graph-header">
            <div className="graph-legend">
              <div className="legend-item">
                <div className="legend-color admissions-line"></div>
                <span>Admissions</span>
              </div>
              <div className="legend-item">
                <div className="legend-color revenue-line"></div>
                <span>Revenue (PKR thousands)</span>
              </div>
            </div>
            <div className="graph-period">{getPeriodLabel(trendFilter)}</div>
          </div>
          
          <div className="dual-line-graph">
            <svg viewBox="0 0 900 350" className="graph-svg">
              {/* Background */}
              <rect width="900" height="350" fill="#ffffff" />
              
              {/* Grid lines - Vertical */}
              {Array.from({length: 10}, (_, i) => (
                <line 
                  key={`v-grid-${i}`}
                  x1={100 + i * 80} 
                  y1="50" 
                  x2={100 + i * 80} 
                  y2="280" 
                  stroke="#f1f5f9" 
                  strokeWidth="1"
                />
              ))}
              
              {/* Grid lines - Horizontal */}
              {Array.from({length: 6}, (_, i) => (
                <line 
                  key={`h-grid-${i}`}
                  x1="100" 
                  y1={50 + i * 46} 
                  x2="820" 
                  y2={50 + i * 46} 
                  stroke="#f1f5f9" 
                  strokeWidth="1"
                />
              ))}
              
              {/* Y-axis */}
              <line x1="100" y1="50" x2="100" y2="280" stroke="#e2e8f0" strokeWidth="2"/>
              
              {/* X-axis */}
              <line x1="100" y1="280" x2="820" y2="280" stroke="#e2e8f0" strokeWidth="2"/>
              
              {/* Y-axis labels for admissions (left side) */}
              {[0, 5, 10, 15, 20, 25, 30].map((value, index) => (
                <text
                  key={`y-label-admissions-${index}`}
                  x="85"
                  y={285 - (value * 7.7)}
                  textAnchor="end"
                  fontSize="11"
                  fill="#64748b"
                  fontWeight="500"
                >
                  {value}
                </text>
              ))}
              
              {/* Y-axis labels for revenue (right side) */}
              {[0, 50, 100, 150, 200].map((value, index) => (
                <text
                  key={`y-label-revenue-${index}`}
                  x="835"
                  y={285 - (value * 0.8)}
                  textAnchor="start"
                  fontSize="11"
                  fill="#64748b"
                  fontWeight="500"
                >
                  {value}k
                </text>
              ))}
              
              {/* Y-axis title - Admissions */}
              <text
                x="25"
                y="165"
                textAnchor="middle"
                fontSize="12"
                fill="#3b82f6"
                fontWeight="600"
                transform="rotate(-90 25 165)"
              >
                Admissions
              </text>
              
              {/* Y-axis title - Revenue */}
              <text
                x="875"
                y="165"
                textAnchor="middle"
                fontSize="12"
                fill="#10b981"
                fontWeight="600"
                transform="rotate(90 875 165)"
              >
                Revenue (PKR thousands)
              </text>
              
              {/* Admissions line with gradient */}
              <defs>
                <linearGradient id="admissionsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{stopColor: '#3b82f6', stopOpacity: 0.8}} />
                  <stop offset="100%" style={{stopColor: '#1d4ed8', stopOpacity: 1}} />
                </linearGradient>
                <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{stopColor: '#10b981', stopOpacity: 0.8}} />
                  <stop offset="100%" style={{stopColor: '#059669', stopOpacity: 1}} />
                </linearGradient>
              </defs>
              
              <polyline
                fill="none"
                stroke="url(#admissionsGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={filteredTrendData.map((point, index) => 
                  `${100 + index * (720 / Math.max(1, filteredTrendData.length - 1))},${280 - (point.admissions * 7.7)}`
                ).join(' ')}
              />
              
              {/* Revenue line */}
              <polyline
                fill="none"
                stroke="url(#revenueGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={filteredTrendData.map((point, index) => 
                  `${100 + index * (720 / Math.max(1, filteredTrendData.length - 1))},${280 - (point.revenue / 1000 * 0.8)}`
                ).join(' ')}
              />
              
              {/* Data points for admissions with enhanced styling */}
              {filteredTrendData.map((point, index) => (
                <g key={`admission-point-${index}`}>
                  <circle
                    cx={100 + index * (720 / Math.max(1, filteredTrendData.length - 1))}
                    cy={280 - (point.admissions * 7.7)}
                    r="6"
                    fill="#ffffff"
                    stroke="#3b82f6"
                    strokeWidth="3"
                  />
                  <circle
                    cx={100 + index * (720 / Math.max(1, filteredTrendData.length - 1))}
                    cy={280 - (point.admissions * 7.7)}
                    r="3"
                    fill="#3b82f6"
                  />
                  {/* Value label on hover area */}
                  <text
                    x={100 + index * (720 / Math.max(1, filteredTrendData.length - 1))}
                    y={280 - (point.admissions * 7.7) - 12}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#3b82f6"
                    fontWeight="600"
                    className="point-label"
                  >
                    {point.admissions}
                  </text>
                </g>
              ))}
              
              {/* Data points for revenue with enhanced styling */}
              {filteredTrendData.map((point, index) => (
                <g key={`revenue-point-${index}`}>
                  <circle
                    cx={100 + index * (720 / Math.max(1, filteredTrendData.length - 1))}
                    cy={280 - (point.revenue / 1000 * 0.8)}
                    r="6"
                    fill="#ffffff"
                    stroke="#10b981"
                    strokeWidth="3"
                  />
                  <circle
                    cx={100 + index * (720 / Math.max(1, filteredTrendData.length - 1))}
                    cy={280 - (point.revenue / 1000 * 0.8)}
                    r="3"
                    fill="#10b981"
                  />
                  {/* Value label */}
                  <text
                    x={100 + index * (720 / Math.max(1, filteredTrendData.length - 1))}
                    y={280 - (point.revenue / 1000 * 0.8) + 20}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#10b981"
                    fontWeight="600"
                    className="point-label"
                  >
                    {Math.round(point.revenue / 1000)}k
                  </text>
                </g>
              ))}
              
              {/* X-axis labels with better positioning */}
              {filteredTrendData.map((point, index) => (
                <text
                  key={`x-label-${index}`}
                  x={100 + index * (720 / Math.max(1, filteredTrendData.length - 1))}
                  y="300"
                  textAnchor="middle"
                  fontSize="12"
                  fill="#64748b"
                  fontWeight="500"
                >
                  {point.week}
                </text>
              ))}
              
              {/* X-axis title */}
              <text
                x="460"
                y="330"
                textAnchor="middle"
                fontSize="12"
                fill="#64748b"
                fontWeight="600"
              >
                Weeks
              </text>
            </svg>
          </div>
          
          <div className="graph-summary">
            <div className="summary-item">
              <span className="summary-label">Total Admissions:</span>
              <span className="summary-value">{filteredTrendData.reduce((sum, item) => sum + item.admissions, 0)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Revenue:</span>
              <span className="summary-value">{formatCurrency(filteredTrendData.reduce((sum, item) => sum + item.revenue, 0))}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Fee Collection Pie Chart */}
      <div className="reports-section">
        <div className="section-header" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '15px', borderRadius: '8px', marginBottom: '20px'}}>
          <h3 style={{color: 'white', margin: '0 0 10px 0', fontSize: '20px', fontWeight: '600'}}>Fee Collection Status</h3>
          <div className="filter-dropdown">
            <label style={{color: 'white', marginRight: '10px', fontWeight: '500'}}>Time Period:</label>
            <select 
              value={feeFilter} 
              onChange={(e) => setFeeFilter(e.target.value)}
              className="period-select"
              style={{background: 'white', color: '#333', border: 'none', padding: '6px 10px', borderRadius: '4px', fontWeight: '500'}}
            >
              <option value="today">Today</option>
              <option value="3days">Last 3 Days</option>
              <option value="1week">Last Week</option>
              <option value="1month">Last Month</option>
            </select>
          </div>
        </div>
        
        <div className="pie-chart-container">
          <div className="pie-chart">
            <svg viewBox="0 0 200 200" className="pie-svg">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="20"
              />
              
              {/* Submitted fees arc */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="20"
                strokeDasharray={`${feeSubmissionData.submitted * 5.02} 502`}
                strokeDashoffset="125.5"
                transform="rotate(-90 100 100)"
              />
              
              {/* Center text */}
              <text x="100" y="95" textAnchor="middle" fontSize="24" fontWeight="600" fill="#1e3a8a">
                {formatPercentage(feeSubmissionData.submitted)}
              </text>
              <text x="100" y="115" textAnchor="middle" fontSize="12" fill="#64748b">
                Collected
              </text>
            </svg>
          </div>
          
          <div className="pie-chart-legend">
            <div className="pie-legend-item">
              <div className="pie-legend-color submitted"></div>
              <div className="pie-legend-text">
                <span className="pie-legend-label">Fee Submitted</span>
                <span className="pie-legend-value">{formatPercentage(feeSubmissionData.submitted)}</span>
              </div>
            </div>
            
            <div className="pie-legend-item">
              <div className="pie-legend-color pending"></div>
              <div className="pie-legend-text">
                <span className="pie-legend-label">Fee Pending</span>
                <span className="pie-legend-value">{formatPercentage(feeSubmissionData.pending)}</span>
              </div>
            </div>
          </div>
          
          <div className="fee-details">
            <div className="fee-detail-item">
              <span className="fee-detail-label">Period:</span>
              <span className="fee-detail-value">{getPeriodLabel(feeFilter)}</span>
            </div>
            <div className="fee-detail-item">
              <span className="fee-detail-label">Amount Collected:</span>
              <span className="fee-detail-value">{formatCurrency(Math.round(reportsData.totalFeeCollected * (feeSubmissionData.submitted / 100)))}</span>
            </div>
            <div className="fee-detail-item">
              <span className="fee-detail-label">Amount Pending:</span>
              <span className="fee-detail-value">{formatCurrency(Math.round(reportsData.totalFeeCollected * (feeSubmissionData.pending / 100)))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Students Module Components
const Students = () => {
  return (
    <div className="page-content">
      <h2>Students Management</h2>
      
      <div className="welcome-message">
        <p>Manage school students by class and section. Select from school or college level, or add new classes as needed.</p>
      </div>
      
      <div className="students-main-actions">
        <Link to="/students/school" className="students-main-btn school-btn">
          <span className="btn-icon">🏫</span>
          <span className="btn-title">School Students</span>
          <span className="btn-subtitle">Manage students from Play Group to Class 10</span>
        </Link>
        
        <Link to="/students/college" className="students-main-btn college-btn">
          <span className="btn-icon">🎓</span>
          <span className="btn-title">College Students</span>
          <span className="btn-subtitle">Manage 1st Year and 2nd Year students</span>
        </Link>
        
        <Link to="/students/add-class" className="students-main-btn add-class-btn">
          <span className="btn-icon">➕</span>
          <span className="btn-title">Add Class</span>
          <span className="btn-subtitle">Create new class with sections</span>
        </Link>
      </div>
    </div>
  )
}

// School Students - Class Selection
const SchoolStudents = () => {
  const schoolClasses = [
    { name: 'Play Group', sections: ['A', 'B'] },
    { name: 'Nursery', sections: ['A', 'B', 'C'] },
    { name: 'Prep', sections: ['A', 'B', 'C'] },
    { name: 'Class 1', sections: ['A', 'B', 'C'] },
    { name: 'Class 2', sections: ['A', 'B', 'C'] },
    { name: 'Class 3', sections: ['A', 'B', 'C'] },
    { name: 'Class 4', sections: ['A', 'B', 'C'] },
    { name: 'Class 5', sections: ['A', 'B', 'C'] },
    { name: 'Class 6', sections: ['A', 'B', 'C'] },
    { name: 'Class 7', sections: ['A', 'B', 'C'] },
    { name: 'Class 8', sections: ['A', 'B', 'C'] },
    { name: 'Class 9', sections: ['A', 'B', 'C'] },
    { name: 'Class 10', sections: ['A', 'B', 'C'] }
  ]
  
  return (
    <div className="page-content">
      <div className="simple-header">
        <h2>School Students</h2>
        <Link to="/students" className="simple-back-btn">← Back</Link>
      </div>
      
      <div className="simple-classes-grid">
        {schoolClasses.map((classItem, index) => (
          <div key={index} className="simple-class-item">
            <h3 className="class-name">{classItem.name}</h3>
            <div className="simple-sections">
              <Link 
                to={`/students/list/${classItem.name}/all`} 
                className="simple-section-link all-section"
              >
                View All
              </Link>
              {classItem.sections.map((section) => (
                <Link 
                  key={section}
                  to={`/students/list/${classItem.name}/${section}`}
                  className="simple-section-link"
                >
                  {section}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// College Students - Class Selection
const CollegeStudents = () => {
  const collegeClasses = [
    { name: '1st Year', sections: ['A', 'B'] },
    { name: '2nd Year', sections: ['A', 'B'] }
  ]
  
  return (
    <div className="page-content">
      <div className="simple-header">
        <h2>College Students</h2>
        <Link to="/students" className="simple-back-btn">← Back</Link>
      </div>
      
      <div className="simple-classes-grid">
        {collegeClasses.map((classItem, index) => (
          <div key={index} className="simple-class-item">
            <h3 className="class-name">{classItem.name}</h3>
            <div className="simple-sections">
              <Link 
                to={`/students/list/${classItem.name}/all`} 
                className="simple-section-link all-section"
              >
                View All
              </Link>
              {classItem.sections.map((section) => (
                <Link 
                  key={section}
                  to={`/students/list/${classItem.name}/${section}`}
                  className="simple-section-link"
                >
                  {section}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Student List Component
const StudentsList = () => {
  const { className, section } = useParams()
  const [selectedSection, setSelectedSection] = useState(section || 'all')
  
  // Dummy data for students
  const dummyStudents = {
    'Nursery': {
      'A': [
        { rollNo: '001', name: 'Ahmad Ali', section: 'A' },
        { rollNo: '002', name: 'Fatima Khan', section: 'A' },
        { rollNo: '003', name: 'Hassan Sheikh', section: 'A' },
        { rollNo: '004', name: 'Mariam Ahmed', section: 'A' },
        { rollNo: '005', name: 'Omar Malik', section: 'A' }
      ],
      'B': [
        { rollNo: '006', name: 'Zara Iqbal', section: 'B' },
        { rollNo: '007', name: 'Bilal Raza', section: 'B' },
        { rollNo: '008', name: 'Aisha Batool', section: 'B' },
        { rollNo: '009', name: 'Saad Hussain', section: 'B' },
        { rollNo: '010', name: 'Hira Tariq', section: 'B' }
      ],
      'C': [
        { rollNo: '011', name: 'Abdullah Khan', section: 'C' },
        { rollNo: '012', name: 'Khadija Malik', section: 'C' },
        { rollNo: '013', name: 'Ibrahim Ali', section: 'C' },
        { rollNo: '014', name: 'Rumaisa Sheikh', section: 'C' }
      ]
    }
    // Add more dummy data for other classes as needed
  }
  
  const classStudents = dummyStudents[className] || {}
  
  const getFilteredStudents = () => {
    if (selectedSection === 'all') {
      // Return all students from all sections
      return Object.values(classStudents).flat()
    } else {
      return classStudents[selectedSection] || []
    }
  }
  
  const filteredStudents = getFilteredStudents()
  const availableSections = Object.keys(classStudents)
  
  return (
    <div className="page-content">
      <div className="form-header">
        <h2>{className} - Student List</h2>
        <Link to="/students/school" className="back-btn">← Back to Classes</Link>
      </div>
      
      <div className="student-list-controls">
        <div className="section-selector">
          <label>Section:</label>
          <select 
            value={selectedSection} 
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            <option value="all">All Sections</option>
            {availableSections.map(sec => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
        </div>
        
        <div className="student-actions">
          <button className="student-action-btn add-btn">
            <span>➕</span> Add Student
          </button>
          <button className="student-action-btn edit-btn">
            <span>✏️</span> Update Student
          </button>
          <button className="student-action-btn delete-btn">
            <span>❌</span> Delete Student
          </button>
        </div>
      </div>
      
      <div className="students-table">
        <table>
          <thead>
            <tr>
              <th>Roll No</th>
              <th>Student Name</th>
              <th>Section</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student, index) => (
                <tr key={index}>
                  <td>{student.rollNo}</td>
                  <td>{student.name}</td>
                  <td>{student.section}</td>
                  <td>
                    <button className="table-action-btn edit-btn">Edit</button>
                    <button className="table-action-btn delete-btn">Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                  No students found for {className} {selectedSection === 'all' ? '' : `Section ${selectedSection}`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Add Class Component
const AddClass = () => {
  const [formData, setFormData] = useState({
    classType: '',
    className: '',
    numberOfSections: '',
    sectionNames: [],
    students: []
  })
  
  const [showSectionInputs, setShowSectionInputs] = useState(false)
  const [showStudentInputs, setShowStudentInputs] = useState(false)
  
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (name === 'numberOfSections' && value) {
      const count = parseInt(value)
      const defaultSections = Array.from({ length: count }, (_, i) => 
        String.fromCharCode(65 + i) // A, B, C, etc.
      )
      setFormData(prev => ({ ...prev, sectionNames: defaultSections }))
      setShowSectionInputs(true)
    }
  }
  
  const handleSectionNameChange = (index, value) => {
    const updatedSections = [...formData.sectionNames]
    updatedSections[index] = value
    setFormData(prev => ({ ...prev, sectionNames: updatedSections }))
  }
  
  const addStudent = () => {
    setFormData(prev => ({
      ...prev,
      students: [...prev.students, { name: '', rollNo: '', section: '' }]
    }))
  }
  
  const handleStudentChange = (index, field, value) => {
    const updatedStudents = [...formData.students]
    updatedStudents[index] = { ...updatedStudents[index], [field]: value }
    setFormData(prev => ({ ...prev, students: updatedStudents }))
  }
  
  const removeStudent = (index) => {
    const updatedStudents = formData.students.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, students: updatedStudents }))
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    // Here you would save the class data
    console.log('New Class Data:', formData)
    alert('Class added successfully!')
    // Reset form
    setFormData({
      classType: '',
      className: '',
      numberOfSections: '',
      sectionNames: [],
      students: []
    })
    setShowSectionInputs(false)
    setShowStudentInputs(false)
  }
  
  return (
    <div className="page-content">
      <div className="form-header">
        <h2>Add New Class</h2>
        <Link to="/students" className="back-btn">← Back to Students</Link>
      </div>
      
      <div className="admission-form-container">
        <form className="admission-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Class Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Class Type *</label>
                <select 
                  name="classType"
                  value={formData.classType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="School">School</option>
                  <option value="College">College</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Class Name *</label>
                <input 
                  type="text"
                  name="className"
                  value={formData.className}
                  onChange={handleInputChange}
                  placeholder="Enter class name (e.g., Class 11, Prep)"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Number of Sections *</label>
                <select 
                  name="numberOfSections"
                  value={formData.numberOfSections}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Number</option>
                  <option value="1">1 Section</option>
                  <option value="2">2 Sections</option>
                  <option value="3">3 Sections</option>
                  <option value="4">4 Sections</option>
                  <option value="5">5 Sections</option>
                </select>
              </div>
            </div>
          </div>
          
          {showSectionInputs && (
            <div className="form-section">
              <h3>Section Names</h3>
              <div className="form-grid">
                {formData.sectionNames.map((section, index) => (
                  <div key={index} className="form-group">
                    <label>Section {index + 1}</label>
                    <input 
                      type="text"
                      value={section}
                      onChange={(e) => handleSectionNameChange(index, e.target.value)}
                      placeholder={`Section ${String.fromCharCode(65 + index)}`}
                    />
                  </div>
                ))}
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-submit"
                  onClick={() => setShowStudentInputs(true)}
                >
                  Continue to Add Students
                </button>
              </div>
            </div>
          )}
          
          {showStudentInputs && (
            <div className="form-section">
              <h3>Add Initial Students (Optional)</h3>
              
              {formData.students.map((student, index) => (
                <div key={index} className="student-form-row">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Student Name</label>
                      <input 
                        type="text"
                        value={student.name}
                        onChange={(e) => handleStudentChange(index, 'name', e.target.value)}
                        placeholder="Enter student name"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Roll Number</label>
                      <input 
                        type="text"
                        value={student.rollNo}
                        onChange={(e) => handleStudentChange(index, 'rollNo', e.target.value)}
                        placeholder="Enter roll number"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Section</label>
                      <select 
                        value={student.section}
                        onChange={(e) => handleStudentChange(index, 'section', e.target.value)}
                      >
                        <option value="">Select Section</option>
                        {formData.sectionNames.map((section) => (
                          <option key={section} value={section}>{section}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <button 
                        type="button" 
                        className="remove-student-btn"
                        onClick={() => removeStudent(index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={addStudent}>
                  Add Another Student
                </button>
              </div>
            </div>
          )}
          
          <div className="form-actions">
            <Link to="/students" className="btn-cancel">Cancel</Link>
            <button type="submit" className="btn-submit">Save Class</button>
          </div>
        </form>
      </div>
    </div>
  )
}
const UsersAccounts = () => {
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Ahmed Ali Khan",
      role: "Principal",
      access: ["Dashboard", "Admission", "Faculty Management", "Analytics", "Settings"],
      email: "ahmed.khan@mphs.edu",
      status: "Active"
    },
    {
      id: 2,
      name: "Fatima Sheikh",
      role: "Admin Assistant", 
      access: ["Dashboard", "Admission", "Voucher Management"],
      email: "fatima.sheikh@mphs.edu",
      status: "Active"
    },
    {
      id: 3,
      name: "Muhammad Hassan",
      role: "Accountant",
      access: ["Dashboard", "Voucher Management", "Analytics"],
      email: "hassan@mphs.edu",
      status: "Active"
    }
  ])
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    password: '',
    access: []
  })

  const accessOptions = [
    "Dashboard", "Admission", "Fee Management", "Faculty Management", 
    "Voucher Management", "Analytics", "Students", "Settings"
  ]

  const resetForm = () => {
    setFormData({ name: '', role: '', email: '', password: '', access: [] })
    setShowForm(false)
    setEditingUser(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (editingUser) {
      // Update existing user
      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? { ...user, ...formData }
          : user
      ))
    } else {
      // Create new user
      const newUser = {
        id: users.length + 1,
        ...formData,
        status: "Active"
      }
      setUsers([...users, newUser])
    }
    
    resetForm()
  }

  const handleEdit = (user) => {
    setFormData({
      name: user.name,
      role: user.role,
      email: user.email,
      password: '',
      access: [...user.access]
    })
    setEditingUser(user)
    setShowForm(true)
  }

  const handleAccessChange = (option) => {
    setFormData(prev => ({
      ...prev,
      access: prev.access.includes(option) 
        ? prev.access.filter(item => item !== option)
        : [...prev.access, option]
    }))
  }

  const handleNewUser = () => {
    resetForm()
    setShowForm(true)
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Users & Accounts Management</h2>
        <button 
          className="add-user-btn"
          onClick={showForm ? resetForm : handleNewUser}
        >
          {showForm ? 'Cancel' : '+ Add New User'}
        </button>
      </div>

      {showForm && (
        <div className="user-form-container">
          <div className="user-form">
            <div className="form-header">
              <h3>{editingUser ? 'Edit User' : 'Create New User'}</h3>
              <p className="form-subtitle">
                {editingUser ? 'Update user information and permissions' : 'Add a new team member with access controls'}
              </p>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="Principal">Principal</option>
                    <option value="Vice Principal">Vice Principal</option>
                    <option value="Admin Assistant">Admin Assistant</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Password {editingUser ? '(Leave blank to keep current)' : '*'}</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder={editingUser ? "Enter new password" : "Create password"}
                    required={!editingUser}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Access Permissions *</label>
                <p className="field-description">Select which modules this user can access</p>
                <div className="access-options">
                  {accessOptions.map(option => (
                    <label key={option} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.access.includes(option)}
                        onChange={() => handleAccessChange(option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
                <button type="button" className="cancel-btn" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="users-list">
        <div className="section-header">
          <h3>Current Users ({users.length})</h3>
          <p>Manage team members and their access permissions</p>
        </div>
        
        <div className="users-grid">
          {users.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-header">
                <div className="user-avatar">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div className="user-info">
                  <h4>{user.name}</h4>
                  <p className="user-role">{user.role}</p>
                  <p className="user-email">{user.email}</p>
                </div>
                <div className="user-actions">
                  <span className={`status ${user.status.toLowerCase()}`}>
                    {user.status}
                  </span>
                  <button 
                    className="edit-btn"
                    onClick={() => handleEdit(user)}
                    title="Edit User"
                  >
                    ✏️
                  </button>
                </div>
              </div>
              <div className="user-access">
                <h5>Access Permissions:</h5>
                <div className="access-tags">
                  {user.access.map(permission => (
                    <span key={permission} className="access-tag">
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
const Settings = () => <div className="page-content"><h2>Welcome to Settings</h2></div>

// Navigation items
const navigationItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/admission', label: 'Admission', icon: '📝' },
  { path: '/fee-management', label: 'Fee Management', icon: '💰' },
  { path: '/faculty-management', label: 'Faculty Management', icon: '👨‍🏫' },
  { path: '/voucher-management', label: 'Voucher Management', icon: '💼' },
  { path: '/analytics', label: 'Analytics', icon: '📊' },
  { path: '/students', label: 'Students', icon: '🎓' },
  { path: '/users-accounts', label: 'Users / Accounts', icon: '👥' },
  { path: '/settings', label: 'Settings', icon: '⚙️' }
]

function Sidebar() {
  const location = useLocation()
  
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">🏫</span>
          <span className="logo-text">MPHS</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {navigationItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="page-title">Muslim Public Higher Secondary School</h1>
        <div className="header-actions">
          <span className="user-info">Admin Panel</span>
        </div>
      </div>
    </header>
  )
}

function AppLayout() {
  const location = useLocation()
  
  // Debug: Log current path
  console.log('Current pathname:', location.pathname)
  
  // Don't show sidebar and header on login page
  if (location.pathname === '/') {
    return (
      <Routes>
        <Route path="/" element={<Login />} />
      </Routes>
    )
  }
  
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="content">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admission" element={<AdmissionHome />} />
            <Route path="/admission/new-form" element={<AdmissionForm />} />
            <Route path="/admission/list" element={<AdmissionList />} />
            <Route path="/admission/view-detail/:id" element={<StudentViewDetail />} />
            <Route path="/fee-management" element={<FeeManagement />} />
            <Route path="/faculty-management" element={<FacultyManagement />} />
            <Route path="/faculty-management/add-faculty" element={<AddFacultyForm />} />
            <Route path="/faculty-management/list" element={<FacultyList />} />
            <Route path="/faculty-management/edit/:id" element={<EditFacultyForm />} />
            <Route path="/voucher-management/faculty" element={<FacultyVoucher />} />
            <Route path="/voucher-management/school" element={<SchoolVoucher />} />
            <Route path="/voucher-management/college" element={<CollegeVoucher />} />
            <Route path="/voucher-management" element={<VoucherManagement />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/school" element={<SchoolStudents />} />
            <Route path="/students/college" element={<CollegeStudents />} />
            <Route path="/students/list/:className/:section" element={<StudentsList />} />
            <Route path="/students/add-class" element={<AddClass />} />
            <Route path="/users-accounts" element={<UsersAccounts />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  )
}

export default App
