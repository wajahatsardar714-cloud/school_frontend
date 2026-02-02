import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../config/api'

export const authService = {
  async login(email, password) {
    const response = await apiClient.post(
      API_ENDPOINTS.AUTH_LOGIN,
      { email, password },
      { requiresAuth: false }
    )
    
    if (response.success && response.data) {
      apiClient.setToken(response.data.token)
      apiClient.setUser(response.data.user)
    }
    
    return response
  },

  async register(email, password, role) {
    return await apiClient.post(API_ENDPOINTS.AUTH_REGISTER, {
      email,
      password,
      role,
    })
  },

  async getProfile() {
    return await apiClient.get(API_ENDPOINTS.AUTH_PROFILE)
  },

  async changePassword(currentPassword, newPassword) {
    return await apiClient.put(API_ENDPOINTS.AUTH_CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
    })
  },

  async listUsers() {
    return await apiClient.get(API_ENDPOINTS.AUTH_USERS)
  },

  async deleteUser(id) {
    return await apiClient.delete(API_ENDPOINTS.AUTH_DELETE_USER(id))
  },

  logout() {
    apiClient.clearAuth()
  },

  getCurrentUser() {
    return apiClient.getUser()
  },

  isAuthenticated() {
    return !!apiClient.getToken()
  },

  hasRole(role) {
    const user = apiClient.getUser()
    return user && user.role === role
  },

  isAdmin() {
    return this.hasRole('admin')
  },
}
