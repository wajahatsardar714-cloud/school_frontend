const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <div className="footer-logo">
            <h3>Muslim Public Higher Secondary School</h3>
            <p className="footer-tagline">Excellence in Education Since 1994</p>
          </div>
        </div>
        
        <div className="footer-section">
          <h4>Contact Information</h4>
          <div className="footer-contact">
            <div className="contact-item">
              <svg className="contact-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>Bahawalpur Road, Adda Laar</span>
            </div>
            <div className="contact-item">
              <svg className="contact-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span>0300-6246297</span>
            </div>
            {/* <div className="contact-item">
              <svg className="contact-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <span>info@muslimpublic.edu.pk</span>
            </div> */}
          </div>
        </div>
        
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul className="footer-links">
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/admission/new-form">Admissions</a></li>
            <li><a href="/students">Students</a></li>
            <li><a href="/faculty">Faculty</a></li>
          </ul>
        </div>
        
        {/* <div className="footer-section">
          <h4>Working Hours</h4>
          <div className="footer-hours">
            <p><strong>Monday - Friday:</strong> 8:00 AM - 2:00 PM</p>
            <p><strong>Saturday:</strong> 8:00 AM - 12:00 PM</p>
            <p><strong>Sunday:</strong> Closed</p>
          </div>
        </div> */}
      </div>
      
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>&copy; {new Date().getFullYear()} Muslim Public Higher Secondary School. All rights reserved.</p>
          <p className="footer-credits">Developed with ❤️ for Education</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
