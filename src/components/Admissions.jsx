import { useState } from 'react'
import AdmissionForm from './AdmissionForm'
import AdmissionList from './AdmissionList'

const Admissions = () => {
  const [activeTab, setActiveTab] = useState('admission-form')

  return (
    <div className="admissions-container">
      <div className="admissions-header">
        <div className="admissions-tabs">
          <button 
            className={`tab-button ${activeTab === 'admission-form' ? 'active' : ''}`}
            onClick={() => setActiveTab('admission-form')}
          >
            📝 Admission Form
          </button>
          <button 
            className={`tab-button ${activeTab === 'admission-list' ? 'active' : ''}`}
            onClick={() => setActiveTab('admission-list')}
          >
            📋 Admission List
          </button>
        </div>
      </div>

      <div className="admissions-content">
        {activeTab === 'admission-form' && <AdmissionForm />}
        {activeTab === 'admission-list' && <AdmissionList />}
      </div>
    </div>
  )
}

export default Admissions