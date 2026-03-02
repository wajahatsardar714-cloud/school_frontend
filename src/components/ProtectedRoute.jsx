import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Key used to persist the deep-link URL that an unauthenticated visitor
 * tried to access.  Stored in sessionStorage so it survives a full-page
 * reload but is cleared when the tab is closed.
 */
export const RETURN_TO_KEY = 'returnTo'

export const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Still resolving the stored session – render nothing to avoid a flash
  if (loading) return null

  // Not logged in → save the attempted URL and redirect to login
  if (!user) {
    const returnTo = location.pathname + location.search + location.hash
    if (returnTo && returnTo !== '/' && returnTo !== '/login') {
      sessionStorage.setItem(RETURN_TO_KEY, returnTo)
    }
    return <Navigate to="/login" replace />
  }

  // Logged in but insufficient role
  if (requireAdmin && user.role?.toUpperCase() !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
