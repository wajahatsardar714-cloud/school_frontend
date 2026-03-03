import { useState } from 'react'
import { authService } from '../services/authService'
import { apiClient } from '../services/apiClient'

const LoginDebug = () => {
  const [results, setResults] = useState('')
  const [loading, setLoading] = useState(false)

  const addResult = (message) => {
    setResults(prev => prev + message + '\n')
  }

  const testHealthCheck = async () => {
    setLoading(true)
    setResults('')
    
    addResult('🏥 Testing Backend Health...')
    
    try {
      // Try health endpoint
      const healthResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/health`)
      addResult(`Health Status: ${healthResponse.status}`)
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.text()
        addResult(`✅ Backend is healthy: ${healthData}`)
      } else {
        addResult('❌ Health check failed, but server responded')
      }
    } catch (error) {
      addResult(`🚨 Health Check Error: ${error.message}`)
    }
    
    // Try root endpoint
    try {
      const rootResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/`)
      addResult(`Root endpoint status: ${rootResponse.status}`)
    } catch (error) {
      addResult(`Root endpoint error: ${error.message}`)
    }
    
    setLoading(false)
  }

  const testConnection = async () => {
    setLoading(true)
    setResults('')
    
    addResult('🔍 Starting Login Debug Test...')
    addResult(`API Base URL: ${import.meta.env.VITE_API_BASE_URL}`)
    
    try {
      // Test 1: Direct fetch
      addResult('\n📡 Testing Direct API Connection...')
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'test123'
        })
      })
      
      addResult(`Response Status: ${response.status}`)
      addResult(`Response OK: ${response.ok}`)
      
      if (response.ok) {
        const data = await response.json()
        addResult(`✅ API Response: ${JSON.stringify(data, null, 2)}`)
      } else {
        const errorText = await response.text()
        addResult(`❌ API Error: ${errorText}`)
      }
      
    } catch (error) {
      addResult(`🚨 Direct API Error: ${error.message}`)
    }
    
    try {
      // Test 2: AuthService
      addResult('\n🔐 Testing AuthService...')
      const result = await authService.login('test@example.com', 'test123')
      addResult(`✅ AuthService Success: ${JSON.stringify(result, null, 2)}`)
    } catch (error) {
      addResult(`❌ AuthService Error: ${error.message}`)
    }
    
    // Test 3: Check stored data
    addResult('\n💾 Checking Local Storage...')
    addResult(`Token: ${apiClient.getToken()}`)
    addResult(`User: ${JSON.stringify(apiClient.getUser(), null, 2)}`)
    
    setLoading(false)
  }

  const testWithRealCredentials = async () => {
    setLoading(true)
    setResults('')
    
    addResult('🔍 Testing with Admin Credentials...')
    
    try {
      const result = await authService.login('admin@school.com', 'admin123')
      addResult(`✅ Login Success: ${JSON.stringify(result, null, 2)}`)
    } catch (error) {
      addResult(`❌ Login Failed: ${error.message}`)
    }
    
    setLoading(false)
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: '20px', 
      right: '20px', 
      width: '400px', 
      background: 'white', 
      border: '1px solid #ccc', 
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      zIndex: 1000,
      fontSize: '12px'
    }}>
      <h3>🔧 Login Debug Panel</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={testHealthCheck} 
          disabled={loading}
          style={{ 
            padding: '8px 12px', 
            marginRight: '5px',
            marginBottom: '5px',
            background: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '12px'
          }}
        >
          Health Check
        </button>
        
        <button 
          onClick={testConnection} 
          disabled={loading}
          style={{ 
            padding: '8px 12px', 
            marginRight: '5px',
            marginBottom: '5px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '12px'
          }}
        >
          {loading ? 'Testing...' : 'Test API'}
        </button>
        
        <button 
          onClick={testWithRealCredentials} 
          disabled={loading}
          style={{ 
            padding: '8px 12px', 
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '12px'
          }}
        >
          Test Login
        </button>
      </div>
      
      <textarea 
        value={results}
        readOnly
        style={{ 
          width: '100%', 
          height: '300px', 
          fontFamily: 'monospace',
          fontSize: '11px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '8px'
        }}
        placeholder="Test results will appear here..."
      />
      
      <div style={{ marginTop: '10px', fontSize: '10px', color: '#666' }}>
        Environment: {import.meta.env.MODE}<br/>
        API URL: {import.meta.env.VITE_API_BASE_URL}
      </div>
    </div>
  )
}

export default LoginDebug