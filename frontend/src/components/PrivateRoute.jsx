// src/components/PrivateRoute.jsx
// Wrapper that blocks unauthenticated users from protected pages

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  // If no user, redirect to login page
  return user ? children : <Navigate to="/login" />;
};

export default PrivateRoute;