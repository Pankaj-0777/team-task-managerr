// src/pages/Login.jsx
// Login page — email + password form

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Update form state when user types
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await API.post('/auth/login', form);
      login(data.user, data.token); // Save to global state
      navigate('/dashboard');        // Redirect to dashboard
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome Back 👋</h2>
        <p style={styles.sub}>Login to your account</p>

        {error && <div style={styles.error}>{error}</div>}

        <input
          style={styles.input}
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />
        <input
          style={styles.input}
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />

        <button
          style={styles.button}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <p style={styles.footer}>
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex', justifyContent: 'center',
    alignItems: 'center', minHeight: '80vh',
  },
  card: {
    background: 'white', padding: '40px',
    borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    width: '100%', maxWidth: '400px', display: 'flex',
    flexDirection: 'column', gap: '12px',
  },
  title: { margin: 0, color: '#1e293b' },
  sub: { margin: 0, color: '#64748b' },
  error: {
    background: '#fee2e2', color: '#dc2626',
    padding: '10px', borderRadius: '6px', fontSize: '14px',
  },
  input: {
    padding: '10px 14px', border: '1px solid #e2e8f0',
    borderRadius: '8px', fontSize: '14px', outline: 'none',
  },
  button: {
    backgroundColor: '#3b82f6', color: 'white',
    border: 'none', padding: '12px',
    borderRadius: '8px', fontSize: '15px', cursor: 'pointer',
  },
  footer: { textAlign: 'center', color: '#64748b', fontSize: '14px' },
};

export default Login;