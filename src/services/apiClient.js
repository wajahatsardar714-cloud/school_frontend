import { API_BASE_URL, HTTP_STATUS } from '../config/api'

class APIError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.data = data
  }
}

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL
    this.tokenKey = 'auth_token'
    this.userKey = 'auth_user'
    this.onUnauthorized = null
    this.onForbidden = null
  }

  getToken() {
    return localStorage.getItem(this.tokenKey)
  }

  setToken(token) {
    if (token) {
      localStorage.setItem(this.tokenKey, token)
    } else {
      localStorage.removeItem(this.tokenKey)
    }
  }

  getUser() {
    const user = localStorage.getItem(this.userKey)
    return user ? JSON.parse(user) : null
  }

  setUser(user) {
    if (user) {
      localStorage.setItem(this.userKey, JSON.stringify(user))
    } else {
      localStorage.removeItem(this.userKey)
    }
  }

  clearAuth() {
    this.setToken(null)
    this.setUser(null)
  }

  setAuthHandlers(onUnauthorized, onForbidden) {
    this.onUnauthorized = onUnauthorized
    this.onForbidden = onForbidden
  }

  async request(endpoint, options = {}) {
    const { 
      method = 'GET', 
      body = null, 
      headers = {}, 
      requiresAuth = true,
      signal,
      responseType = 'json' // 'json' | 'blob' | 'text'
    } = options

    const url = `${this.baseURL}${endpoint}`
    const token = this.getToken()

    const requestHeaders = {
      ...headers,
    }
    
    // Only set Content-Type for non-blob requests with body
    if (responseType !== 'blob') {
      requestHeaders['Content-Type'] = 'application/json'
    }

    if (requiresAuth && token) {
      requestHeaders['Authorization'] = `Bearer ${token}`
    }

    const config = {
      method,
      headers: requestHeaders,
      signal,
    }

    if (body && method !== 'GET' && method !== 'HEAD') {
      config.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, config)
      
      if (response.status === HTTP_STATUS.UNAUTHORIZED) {
        // Only trigger auth handlers for requests that require authentication
        if (requiresAuth) {
          this.clearAuth()
          if (this.onUnauthorized) {
            this.onUnauthorized()
          }
        }
        throw new APIError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, null)
      }

      if (response.status === HTTP_STATUS.FORBIDDEN) {
        if (this.onForbidden) {
          this.onForbidden()
        }
        throw new APIError('Forbidden', HTTP_STATUS.FORBIDDEN, null)
      }

      const contentType = response.headers.get('content-type')
      let data = null

      // Handle blob response type
      if (responseType === 'blob') {
        if (!response.ok) {
          const errorText = await response.text()
          throw new APIError(errorText || `Request failed with status ${response.status}`, response.status, null)
        }
        return await response.blob()
      }

      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else if (response.status !== HTTP_STATUS.OK && response.status !== HTTP_STATUS.CREATED) {
        data = await response.text()
      }

      if (!response.ok) {
        const message = data?.message || data || `Request failed with status ${response.status}`
        throw new APIError(message, response.status, data)
      }

      return data
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error
      }
      
      if (error instanceof APIError) {
        throw error
      }

      throw new APIError(
        error.message || 'Network error occurred',
        0,
        null
      )
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' })
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body })
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body })
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' })
  }
}

export const apiClient = new APIClient()
export { APIError }
