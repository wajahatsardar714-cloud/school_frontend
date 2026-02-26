/**
 * API Health Check Utility
 * Tests API connectivity and basic endpoints
 */

import { API_BASE_URL } from '../config/api'
import { apiClient } from '../services/apiClient'

export const apiHealthCheck = {
  async testConnection() {
    try {
      // Test basic connectivity
      const response = await fetch(`${API_BASE_URL}/health`)
      const data = await response.json()
      
      return {
        success: true,
        message: 'API connection successful',
        data: data
      }
    } catch (error) {
      return {
        success: false,
        message: 'API connection failed',
        error: error.message
      }
    }
  },

  async testAuthentication() {
    try {
      // Test if authentication token is valid
      const response = await apiClient.get('/api/auth/profile')
      return {
        success: true,
        message: 'Authentication successful',
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        message: 'Authentication failed',
        error: error.response?.data?.message || error.message
      }
    }
  },

  async testClassesAPI() {
    try {
      const response = await apiClient.get('/api/classes')
      return {
        success: true,
        message: 'Classes API working',
        count: response.data?.data?.length || response.data?.length || 0,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        message: 'Classes API failed',
        error: error.response?.data?.message || error.message
      }
    }
  },

  async testSectionsAPI(classId = null) {
    try {
      const url = classId ? `/api/sections?class_id=${classId}` : '/api/sections'
      const response = await apiClient.get(url)
      return {
        success: true,
        message: 'Sections API working',
        count: response.data?.data?.length || response.data?.length || 0,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        message: 'Sections API failed',
        error: error.response?.data?.message || error.message
      }
    }
  },

  async runFullTest() {
    console.log('🔍 Starting API health check...')
    
    const results = {
      connection: await this.testConnection(),
      authentication: await this.testAuthentication(),
      classes: await this.testClassesAPI(),
      sections: await this.testSectionsAPI()
    }

    console.log('📋 API Health Check Results:', results)
    
    // Summary
    const allPassed = Object.values(results).every(r => r.success)
    console.log(allPassed ? '✅ All API tests passed' : '❌ Some API tests failed')
    
    return results
  }
}

export default apiHealthCheck