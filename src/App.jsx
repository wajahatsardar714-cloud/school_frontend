import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import AdmissionForm from './components/AdmissionForm'
import AdmissionList from './components/AdmissionList'
import ClassManagement from './components/ClassManagement'
import SectionManagement from './components/SectionManagement'
import FeeStructureManagement from './components/FeeStructureManagement'
import FacultyManagement from './components/FacultyManagement'
import SalaryStructureManagement from './components/SalaryStructureManagement'
import SalaryVoucherManagement from './components/SalaryVoucherManagement'
import ExpenseManagement from './components/ExpenseManagement'
import UserManagement from './components/UserManagement'
import FeeVoucherManagement from './components/FeeVoucherManagement'
import FeePaymentManagement from './components/FeePaymentManagement'
import DiscountManagement from './components/DiscountManagement'
import FeeDefaulters from './components/FeeDefaulters'
import FeeStatistics from './components/FeeStatistics'
import GuardianManagement from './components/GuardianManagement'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import './App.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
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
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="content">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Admission Routes */}
            <Route path="/admission/new-form" element={<AdmissionForm />} />
            <Route path="/admission/list" element={<AdmissionList />} />
            
            {/* Class Management Routes */}
            <Route path="/classes" element={<ClassManagement />} />
            <Route path="/classes/:classId/sections" element={<SectionManagement />} />
            <Route path="/classes/:classId/fee-structure" element={<FeeStructureManagement />} />
            
            {/* Faculty Routes */}
            <Route path="/faculty" element={<FacultyManagement />} />
            <Route path="/faculty/salary-structure" element={<SalaryStructureManagement />} />
            <Route path="/faculty/salary-vouchers" element={<SalaryVoucherManagement />} />
            
            {/* Fee Management Routes */}
            <Route path="/fees/vouchers" element={<FeeVoucherManagement />} />
            <Route path="/fees/payments" element={<FeePaymentManagement />} />
            <Route path="/fees/discounts" element={<DiscountManagement />} />
            <Route path="/fees/defaulters" element={<FeeDefaulters />} />
            <Route path="/fees/statistics" element={<FeeStatistics />} />
            
            {/* Guardian Management */}
            <Route path="/guardians" element={<GuardianManagement />} />
            
            {/* Analytics */}
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            
            {/* Expense Routes */}
            <Route path="/expenses" element={<ExpenseManagement />} />
            
            {/* User Management Routes */}
            <Route path="/users" element={<UserManagement />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
