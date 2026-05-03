// src/components/Navbar.jsx
// Top navigation bar shown on all pages

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>
        📋 Team Task Manager
      </div>

      {user ? (
        <div style={styles.links}>
          <Link to="/dashboard" style={styles.link}>Dashboard</Link>
          <Link to="/projects" style={styles.link}>Projects</Link>
          <span style={styles.username}>👤 {user.name} ({user.role})</span>
          <button onClick={handleLogout} style={styles.button}>Logout</button>
        </div>
      ) : (
        <div style={styles.links}>
          <Link to="/login" style={styles.link}>Login</Link>
          <Link to="/signup" style={styles.link}>Signup</Link>
        </div>
      )}
    </nav>
  );
};

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: '#1e293b',
    color: 'white',
  },
  brand: { fontSize: '18px', fontWeight: 'bold' },
  links: { display: 'flex', alignItems: 'center', gap: '16px' },
  link: { color: 'white', textDecoration: 'none' },
  username: { color: '#94a3b8', fontSize: '14px' },
  button: {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};

export default Navbar;