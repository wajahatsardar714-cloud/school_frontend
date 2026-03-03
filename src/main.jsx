import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './professional.css'
import './layout.css'
import './dashboard.css'
import './global-overrides.css'
import './screens-styling.css'
import './App.css'
import './print-voucher.css'
import './mobile-responsive.css'
import './mobile-enhancements-2026.css'
import './mobile-forms-2026.css'
import './dashboard-mobile-2026.css'
import './mobile-utilities-2026.css'
import App from './App.jsx'
import './salary.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
