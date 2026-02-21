import { useState } from 'react'
import { authService } from '../services/authService'
import { useFetch, useMutation } from '../hooks/useApi'
import './students/Students.css' // Reusing some styles

const Profile = () => {
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    const { data: profileResponse, loading: profileLoading, error: profileError } = useFetch(
        () => authService.getProfile(),
        []
    )

    const { execute: changePassword, loading: changingPassword } = useMutation(
        (data) => authService.changePassword(data.currentPassword, data.newPassword),
        {
            onSuccess: () => {
                alert('Password changed successfully!')
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
            }
        }
    )

    const handlePasswordSubmit = async (e) => {
        e.preventDefault()
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('New passwords do not match')
            return
        }
        try {
            await changePassword(passwordData)
        } catch (error) {
            alert(error.message || 'Failed to change password')
        }
    }

    if (profileLoading) return <div className="loading-container"><div className="spinner"></div></div>
    if (profileError) return <div className="alert alert-error">Error loading profile: {profileError.message}</div>

    const user = profileResponse?.data || {}

    return (
        <div className="students-container">
            <header className="students-header">
                <h2>User Profile</h2>
            </header>

            <div className="profile-content-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="profile-main-column">
                    <div className="profile-card">
                        <h4>👤 Account Information</h4>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Email Address</label>
                                <span>{user.email}</span>
                            </div>
                            <div className="info-item">
                                <label>Role</label>
                                <span className="badge-status badge-active">{user.role}</span>
                            </div>
                            <div className="info-item">
                                <label>User ID</label>
                                <span>{user.id}</span>
                            </div>
                            <div className="info-item">
                                <label>Member Since</label>
                                <span>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-card" style={{ marginTop: '1.5rem' }}>
                        <h4>🛡️ Security Settings</h4>
                        <p style={{ color: '#718096', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Update your password regularly to keep your account secure.
                        </p>

                        <form onSubmit={handlePasswordSubmit}>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label>Current Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label>New Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={changingPassword}
                                style={{ width: '100%' }}
                            >
                                {changingPassword ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="profile-sidebar">
                    <div className="profile-card">
                        <h4>💡 Quick Info</h4>
                        <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                            Your account type is <strong>{user.role}</strong>.
                            {user.role === 'ADMIN' ?
                                ' You have full access to management features including user creation, school settings, and student management.' :
                                ' You have access to class and student information relevant to your role.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Profile
