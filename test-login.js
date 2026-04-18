// Test script to debug login issues
import { authService } from './src/services/authService.js'
import { apiClient } from './src/services/apiClient.js'

// Test API connectivity
async function testAPI() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://school-backend-onou.onrender.com'
  console.log('🔍 Testing API Connection...')
  console.log('API Base URL:', apiBaseUrl)
  
  try {
    // Simple fetch test
    const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@school.com',
        password: 'admin123'
      })
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ API Response:', data)
    } else {
      const errorText = await response.text()
      console.log('❌ API Error:', errorText)
    }
    
  } catch (error) {
    console.error('🚨 Network Error:', error.message)
    console.error('Error details:', error)
  }
}

// Test using authService
async function testAuthService() {
  console.log('\n🔍 Testing AuthService...')
  
  try {
    const result = await authService.login('admin@school.com', 'admin123')
    console.log('✅ AuthService Result:', result)
  } catch (error) {
    console.error('❌ AuthService Error:', error.message)
    console.error('Error details:', error)
  }
}

// Run tests
console.log('=== Login Debug Test ===')
testAPI().then(() => {
  return testAuthService()
}).then(() => {
  console.log('\n=== Test Complete ===')
})