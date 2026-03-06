import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'

// ── helpers ────────────────────────────────────────────────────────────────────
const roleLabel = (role) => (role === 'ADMIN' ? 'Admin' : 'Accountant')
const accessLabel = (role) => (role === 'ADMIN' ? 'Full Access' : 'Limited Access')
const accessClass = (role) => (role === 'ADMIN' ? 'badge-success' : 'badge-warning')

const PW_RULES = [
  { id: 'len',   test: (v) => v.length >= 8,          label: 'At least 8 characters' },
  { id: 'upper', test: (v) => /[A-Z]/.test(v),        label: 'One uppercase letter (A–Z)' },
  { id: 'lower', test: (v) => /[a-z]/.test(v),        label: 'One lowercase letter (a–z)' },
  { id: 'digit', test: (v) => /[0-9]/.test(v),        label: 'One number (0–9)' },
]

const validatePassword = (pw) => PW_RULES.every(r => r.test(pw))

// ── Custom user-picker dropdown ────────────────────────────────────────────────
const UserPicker = ({ users, value, onChange, currentUserId, disabled }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = users.find(u => String(u.id) === String(value))

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: '8px',
          background: disabled ? '#f9fafb' : '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '14px', color: selected ? '#111827' : '#9ca3af',
        }}
      >
        {selected ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 600 }}>{selected.email}</span>
            <span style={{
              fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px',
              background: selected.role === 'ADMIN' ? '#fee2e2' : '#e0f2fe',
              color: selected.role === 'ADMIN' ? '#dc2626' : '#0369a1',
            }}>
              {roleLabel(selected.role)}
            </span>
            {selected.id === currentUserId && (
              <span style={{ fontSize: '11px', color: '#6b7280' }}>(You)</span>
            )}
          </span>
        ) : 'Select a user…'}
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink: 0, color: '#9ca3af' }}>
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
        </svg>
      </button>

      {/* dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100,
          background: '#fff', border: '1.5px solid #d1d5db', borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
        }}>
          {users.map(u => (
            <button
              key={u.id}
              type="button"
              onClick={() => { onChange(String(u.id)); setOpen(false) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', border: 'none', background: String(u.id) === String(value) ? '#eff6ff' : 'transparent',
                cursor: 'pointer', textAlign: 'left',
                borderBottom: '1px solid #f3f4f6',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = String(u.id) === String(value) ? '#eff6ff' : 'transparent'}
            >
              {/* avatar */}
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                background: u.role === 'ADMIN' ? '#dbeafe' : '#dcfce7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700,
                color: u.role === 'ADMIN' ? '#1d4ed8' : '#15803d',
              }}>
                {u.email[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.email}
                  {u.id === currentUserId && <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: '6px' }}>(You)</span>}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                  ID: {u.id} · Joined {new Date(u.created_at).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
                  background: u.role === 'ADMIN' ? '#fee2e2' : '#e0f2fe',
                  color: u.role === 'ADMIN' ? '#dc2626' : '#0369a1',
                }}>
                  {roleLabel(u.role)}
                </span>
                <span style={{
                  fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px',
                  background: u.role === 'ADMIN' ? '#dcfce7' : '#fef9c3',
                  color: u.role === 'ADMIN' ? '#15803d' : '#854d0e',
                }}>
                  {accessLabel(u.role)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const UserManagement = () => {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // ── create-user form ────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({ email: '', password: '', role: 'ACCOUNTANT' })
  const [modalError, setModalError] = useState(null)
  const [showPwRules, setShowPwRules] = useState(false)

  // ── password-reset form ─────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({
    targetUserId: '',
    adminCurrentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [pwError, setPwError] = useState(null)
  const [pwSuccess, setPwSuccess] = useState(null)
  const [pwSubmitting, setPwSubmitting] = useState(false)

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await authService.listUsers()
      setUsers(response.data || [])
      setPageError(null)
    } catch (err) {
      setPageError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  // ── create user ─────────────────────────────────────────────────────────────
  const openModal = () => {
    setFormData({ email: '', password: '', role: 'ACCOUNTANT' })
    setModalError(null)
    setShowPwRules(false)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData({ email: '', password: '', role: 'ACCOUNTANT' })
    setModalError(null)
    setShowPwRules(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    // client-side validation — error stays inside the modal
    if (!validatePassword(formData.password)) {
      setModalError('Password does not meet the requirements below.')
      setShowPwRules(true)
      return
    }

    setSubmitting(true)
    setModalError(null)
    try {
      await authService.register(formData.email, formData.password, formData.role)
      setSuccess(true)
      await loadUsers()
      closeModal()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setModalError(err.message || 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  // ── delete user ─────────────────────────────────────────────────────────────
  const handleDelete = async (userId, userEmail) => {
    if (!confirm(`Are you sure you want to delete user "${userEmail}"? This action cannot be undone.`)) return
    try {
      await authService.deleteUser(userId)
      await loadUsers()
      setPageError(null)
    } catch (err) {
      setPageError(err.message || 'Failed to delete user')
    }
  }

  // ── password reset ──────────────────────────────────────────────────────────
  const handlePwReset = async (e) => {
    e.preventDefault()
    if (pwSubmitting) return
    setPwError(null)
    setPwSuccess(null)

    if (!pwForm.targetUserId) return setPwError('Please select a user.')
    if (pwForm.newPassword !== pwForm.confirmPassword) return setPwError('New passwords do not match.')
    if (pwForm.newPassword.length < 6) return setPwError('New password must be at least 6 characters.')

    setPwSubmitting(true)
    try {
      await authService.adminResetPassword(pwForm.targetUserId, pwForm.adminCurrentPassword, pwForm.newPassword)
      setPwSuccess('Password reset successfully.')
      setPwForm({ targetUserId: '', adminCurrentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setPwSuccess(null), 4000)
    } catch (err) {
      setPwError(err.message || 'Failed to reset password.')
    } finally {
      setPwSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      {/* ── User Management header ── */}
      <div className="page-header">
        <div>
          <h2>User Management</h2>
          <p className="text-muted">Manage system users and roles</p>
        </div>
        <button onClick={openModal} className="btn-primary">+ Create New User</button>
      </div>

      {pageError && <div className="alert alert-error">{pageError}</div>}
      {success && <div className="alert alert-success">✅ User created successfully!</div>}

      {/* ── Users table ── */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Role</th>
              <th>Access Level</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>
                  <strong>{user.email}</strong>
                  {user.id === currentUser?.id && (
                    <span className="badge badge-primary" style={{ marginLeft: '8px' }}>You</span>
                  )}
                </td>
                <td>
                  <span className={`badge ${user.role === 'ADMIN' ? 'badge-danger' : 'badge-secondary'}`}>
                    {roleLabel(user.role)}
                  </span>
                </td>
                <td>
                  <span className={`badge ${accessClass(user.role)}`}>
                    {accessLabel(user.role)}
                  </span>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  {user.id !== currentUser?.id ? (
                    <button onClick={() => handleDelete(user.id, user.email)} className="btn-danger btn-sm">
                      Delete
                    </button>
                  ) : (
                    <span className="text-muted">Cannot delete self</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          Password Management
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginTop: '48px' }}>
        <div className="page-header" style={{ marginBottom: '20px' }}>
          <div>
            <h2>Password Management</h2>
            <p className="text-muted">Reset a password for yourself or any other user</p>
          </div>
        </div>

        <div className="table-container" style={{ padding: '28px 32px' }}>
          <form onSubmit={handlePwReset}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

              {/* LEFT — user picker + admin password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: '12px' }}>
                    Step 1 — Choose Account
                  </p>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    Select User *
                  </label>
                  <UserPicker
                    users={users}
                    value={pwForm.targetUserId}
                    onChange={(id) => setPwForm({ ...pwForm, targetUserId: id })}
                    currentUserId={currentUser?.id}
                    disabled={pwSubmitting}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    Your Current Password *
                  </label>
                  <input
                    type="password"
                    placeholder="Verify your identity"
                    value={pwForm.adminCurrentPassword}
                    onChange={(e) => setPwForm({ ...pwForm, adminCurrentPassword: e.target.value })}
                    disabled={pwSubmitting}
                    required
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '5px' }}>
                    &#128274; Required to confirm your identity
                  </p>
                </div>
              </div>

              {/* RIGHT — new password fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: '12px' }}>
                    Step 2 — Set New Password
                  </p>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    New Password *
                  </label>
                  <input
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    disabled={pwSubmitting}
                    required
                    minLength={6}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                    disabled={pwSubmitting}
                    required
                    minLength={6}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                  {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                    <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '5px' }}>Passwords do not match</p>
                  )}
                  {pwForm.confirmPassword && pwForm.newPassword === pwForm.confirmPassword && pwForm.confirmPassword.length > 0 && (
                    <p style={{ fontSize: '12px', color: '#16a34a', marginTop: '5px' }}>&#10003; Passwords match</p>
                  )}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
                  {pwError && (
                    <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>
                      &#9888; {pwError}
                    </div>
                  )}
                  {pwSuccess && (
                    <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#16a34a', fontSize: '13px', marginBottom: '12px' }}>
                      &#10003; {pwSuccess}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={pwSubmitting}
                    style={{ width: '100%', padding: '11px' }}
                  >
                    {pwSubmitting ? 'Resetting…' : '🔑 Reset Password'}
                  </button>
                </div>
              </div>

            </div>
          </form>
        </div>
      </div>

      {/* ── Create User Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New User</h3>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>

            {/* error lives inside the modal */}
            {modalError && (
              <div style={{ margin: '0 0 12px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px' }}>
                &#9888; {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  placeholder="user@school.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  placeholder="Min 8 chars · uppercase · lowercase · digit"
                  value={formData.password}
                  onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setModalError(null) }}
                  onFocus={() => setShowPwRules(true)}
                  disabled={submitting}
                  required
                />

                {/* password rules checklist — shown on focus or error */}
                {showPwRules && (
                  <div style={{ marginTop: '10px', padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Password Requirements
                    </p>
                    {PW_RULES.map(r => {
                      const ok = r.test(formData.password)
                      return (
                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '5px', color: ok ? '#16a34a' : '#94a3b8' }}>
                          <span style={{ fontSize: '15px', lineHeight: 1 }}>{ok ? '✓' : '○'}</span>
                          {r.label}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  disabled={submitting}
                  required
                >
                  <option value="ADMIN">Admin (Full Access)</option>
                  <option value="ACCOUNTANT">Accountant (Limited Access)</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-secondary" disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
