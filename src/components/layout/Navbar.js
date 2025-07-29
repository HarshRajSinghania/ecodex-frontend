import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import setAuthToken from '../../utils/setAuthToken';

const Navbar = () => {
  const { isAuthenticated, setUser, setIsAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const onLogout = () => {
    setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setIsMobileMenuOpen(false); // Close mobile menu on logout
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (event) => {
    if (event.key === 'Escape' && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  // Add keyboard event listener
  React.useEffect(() => {
    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const authLinks = (
    <ul>
      <li>
        <Link to="/dashboard" onClick={closeMobileMenu}>
          <i className="fas fa-tachometer-alt"></i>{' '}
          <span>Dashboard</span>
        </Link>
      </li>
      <li>
        <Link to="/camera" onClick={closeMobileMenu}>
          📸 <span>Capture</span>
        </Link>
      </li>
      <li>
        <Link to="/ecodex" onClick={closeMobileMenu}>
          📚 <span>EcoDEX</span>
        </Link>
      </li>
      <li>
        <Link to="/scientistchat" onClick={closeMobileMenu}>
          🧬 <span>Ask Scientist</span>
        </Link>
      </li>
      <li>
        <button
          onClick={onLogout}
          className="logout-btn"
          aria-label="Logout from EcoDEX"
        >
          <i className="fas fa-sign-out-alt"></i>{' '}
          <span>Logout</span>
        </button>
      </li>
    </ul>
  );

  const guestLinks = (
    <ul>
      <li>
        <Link to="/register" onClick={closeMobileMenu}>
          <i className="fas fa-user-plus"></i> <span>Join Adventure</span>
        </Link>
      </li>
      <li>
        <Link to="/login" onClick={closeMobileMenu}>
          <i className="fas fa-sign-in-alt"></i> <span>Login</span>
        </Link>
      </li>
    </ul>
  );

  return (
    <nav className="navbar">
      <h1>
        <Link to="/" onClick={closeMobileMenu}>
          🌿 EcoDEX 🦋
        </Link>
      </h1>
      
      {/* Mobile Menu Toggle Button */}
      <button
        className="navbar-toggle"
        onClick={toggleMobileMenu}
        aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isMobileMenuOpen}
      >
        {isMobileMenuOpen ? '✕' : '☰'}
      </button>

      {/* Navigation Menu */}
      <div className={`navbar-menu ${isMobileMenuOpen ? 'mobile-visible' : 'mobile-hidden'}`}>
        {isAuthenticated ? authLinks : guestLinks}
      </div>
    </nav>
  );
};

export default Navbar;