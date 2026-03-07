import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AdmissionFormNew from './AdmissionFormNew'
import AdmissionList from './AdmissionList'

const Admissions = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTabInternal] = useState(() => searchParams.get('tab') || 'admission-form')
  const setActiveTab = (tab) => {
    setActiveTabInternal(tab)
    setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('tab', tab); return next }, { replace: true })
  }

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
        {activeTab === 'admission-form' && <AdmissionFormNew />}
        {activeTab === 'admission-list' && <AdmissionList />}
      </div>
    </div>
  )
}

export default Admissions