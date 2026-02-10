import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (requireAdmin && user.role !== 'admin') {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center' 
      }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
      </div>
    )
  }

  return children
}
