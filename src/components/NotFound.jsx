import { useNavigate, useLocation, Link } from 'react-router-dom'

const NotFound = () => {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '2rem',
      gap: '1rem',
    }}>
      <div style={{ fontSize: '5rem', lineHeight: 1 }}>🔍</div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>404 – Page Not Found</h1>
      <p style={{ color: 'var(--text-muted, #6b7280)', maxWidth: 420, margin: 0 }}>
        The page <code style={{
          background: 'var(--bg-muted, #f3f4f6)',
          borderRadius: 4,
          padding: '2px 6px',
          fontFamily: 'monospace',
        }}>{location.pathname}</code> does not exist.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: 6,
            border: '1px solid var(--border-color, #d1d5db)',
            background: 'white',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          ← Go Back
        </button>
        <Link
          to="/dashboard"
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: 6,
            border: 'none',
            background: 'var(--primary-color, #2563eb)',
            color: 'white',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}

export default NotFound
