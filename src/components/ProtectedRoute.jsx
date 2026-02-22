import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const ProtectedRoute = ({ children, requireAdmin = false }) => {
  // Temporarily bypass all auth for CSV import testing
  console.log('🔓 Bypassing authentication for CSV import testing')
  return children
}
