import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useCallback, lazy, Suspense } from 'react'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'
import './responsive.css'
import './mobile-responsive.css'

// Lazy load heavy components for better performance
const Admissions = lazy(() => import('./components/Admissions'))
const AdmissionForm = lazy(() => import('./components/AdmissionForm'))
const AdmissionList = lazy(() => import('./components/AdmissionList'))
const ClassManagement = lazy(() => import('./components/ClassManagement'))
const SectionManagement = lazy(() => import('./components/SectionManagement'))
const FeeStructureManagement = lazy(() => import('./components/FeeStructureManagement'))
const FacultyManagement = lazy(() => import('./components/FacultyManagement'))
const SalaryStructureManagement = lazy(() => import('./components/SalaryStructureManagement'))
const SalaryVoucherManagement = lazy(() => import('./components/SalaryVoucherManagement'))
const ExpenseManagement = lazy(() => import('./components/ExpenseManagement'))
const UserManagement = lazy(() => import('./components/UserManagement'))
const FeeVoucherManagement = lazy(() => import('./components/FeeVoucherManagement'))
const FeePaymentManagement = lazy(() => import('./components/FeePaymentManagement'))
const DiscountManagement = lazy(() => import('./components/DiscountManagement'))
const FeeDefaulters = lazy(() => import('./components/FeeDefaulters'))
const FeeStatistics = lazy(() => import('./components/FeeStatistics'))
const StudentFeeHistory = lazy(() => import('./components/StudentFeeHistory'))
const GuardianManagement = lazy(() => import('./components/GuardianManagement'))
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'))
const StudentDashboard = lazy(() => import('./components/students/StudentDashboard'))
const ClassStudentList = lazy(() => import('./components/students/ClassStudentList'))
const StudentDetail = lazy(() => import('./components/students/StudentDetail'))
const Profile = lazy(() => import('./components/Profile'))
const BulkStudentImport = lazy(() => import('./components/students/BulkStudentImport'))

// Loading fallback component
const PageLoader = () => (
  <div className="loading-container">
    <div className="spinner"></div>
    <span>Loading...</span>
  </div>
)

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const openSidebar = useCallback(() => setSidebarOpen(true), [])
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="main-content">
        <Header onMenuClick={openSidebar} />
        <main className="content">
          <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Admissions Page */}
              <Route path="/admissions" element={<Admissions />} />

              {/* Admission Routes */}
              <Route path="/admission/new-form" element={<AdmissionForm />} />
              <Route path="/admission/list" element={<AdmissionList />} />

              {/* New Students Routes */}
              <Route path="/students" element={<StudentDashboard />} />
              <Route path="/students/bulk-import" element={
                <ProtectedRoute requireAdmin={true}>
                  <BulkStudentImport />
                </ProtectedRoute>
              } />
              <Route path="/students/class/:classId" element={<ClassStudentList />} />
              <Route path="/students/:studentId" element={<StudentDetail />} />

              {/* Class Management Routes */}
              <Route path="/classes" element={
                <ProtectedRoute requireAdmin={true}>
                  <ClassManagement />
                </ProtectedRoute>
              } />
              <Route path="/classes/:classId/sections" element={
                <ProtectedRoute requireAdmin={true}>
                  <SectionManagement />
                </ProtectedRoute>
              } />
              <Route path="/classes/:classId/fee-structure" element={
                <ProtectedRoute requireAdmin={true}>
                  <FeeStructureManagement />
                </ProtectedRoute>
              } />

              {/* Faculty Routes */}
              <Route path="/faculty" element={
                <ProtectedRoute requireAdmin={true}>
                  <FacultyManagement />
                </ProtectedRoute>
              } />
              <Route path="/faculty/salary-structure" element={
                <ProtectedRoute requireAdmin={true}>
                  <SalaryStructureManagement />
                </ProtectedRoute>
              } />
              <Route path="/faculty/salary-vouchers" element={
                <ProtectedRoute requireAdmin={true}>
                  <SalaryVoucherManagement />
                </ProtectedRoute>
              } />

              {/* Fee Management Routes */}
              <Route path="/fees/vouchers" element={<FeeVoucherManagement />} />
              <Route path="/fees/payments" element={<FeePaymentManagement />} />
              <Route path="/fees/discounts" element={<DiscountManagement />} />
              <Route path="/fees/defaulters" element={<FeeDefaulters />} />
              <Route path="/fees/statistics" element={<FeeStatistics />} />
              <Route path="/fees/student-history" element={<StudentFeeHistory />} />

              {/* Guardian Management */}
              <Route path="/guardians" element={<GuardianManagement />} />

              {/* Analytics */}
              <Route path="/analytics" element={
                <ProtectedRoute requireAdmin={true}>
                  <AnalyticsDashboard />
                </ProtectedRoute>
              } />

              {/* Expense Routes */}
              <Route path="/expenses" element={<ExpenseManagement />} />

              {/* User Management Routes */}
              <Route path="/users" element={
                <ProtectedRoute requireAdmin={true}>
                  <UserManagement />
                </ProtectedRoute>
              } />

              <Route path="/profile" element={<Profile />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
      
      {/* Mobile Hamburger Button */}
      <button 
        className="mobile-hamburger"
        onClick={openSidebar}
        aria-label="Open menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </div>
  )
}

export default App
