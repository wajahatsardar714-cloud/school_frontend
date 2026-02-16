import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { apiClient } from '../services/apiClient'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const initAuth = () => {
      const currentUser = authService.getCurrentUser()
      setUser(currentUser)
      setLoading(false)
    }

    initAuth()

    apiClient.setAuthHandlers(
      () => {
        setUser(null)
        navigate('/')
      },
      () => {
        console.error('Access forbidden')
      }
    )
  }, [navigate])

  const login = async (email, password) => {
    const response = await authService.login(email, password)
    if (response.success && response.data) {
      setUser(response.data.user)
      return response.data.user
    }
    throw new Error(response.message || 'Login failed')
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    navigate('/')
  }

  const isAuthenticated = () => {
    return !!user
  }

  const hasRole = (role) => {
    return user && user.role && user.role.toUpperCase() === role.toUpperCase()
  }

  const isAdmin = () => {
    return hasRole('admin')
  }

  const isAccountant = () => {
    return hasRole('accountant')
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole,
    isAdmin,
    isAccountant,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
